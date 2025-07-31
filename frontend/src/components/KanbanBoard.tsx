// components/KanbanBoard.tsx - VERSIÓN FINAL CORREGIDA
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Spinner, Button, Form, Row, Col, Offcanvas, ProgressBar, Tab, Nav, Badge } from 'react-bootstrap';
import { API_BASE_URL } from '../services/apiConfig';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import UserAvatars from './UserAvatars';
import UserAssignment from './UserAssignment';
import KanbanLegend from './KanbanLegend';

// Fix para React 18 y react-beautiful-dnd
const useReactBeautifulDndFix = () => {
  useEffect(() => {
    window.addEventListener('error', (e) => {
      if (
        e.message === 'ResizeObserver loop limit exceeded' ||
        e.message.includes('Invariant failed: Cannot find droppable') ||
        e.message.includes('Unable to find draggable with id')
      ) {
        const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay-div');
        const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay');
        if (resizeObserverErr) resizeObserverErr.style.display = 'none';
        if (resizeObserverErrDiv) resizeObserverErrDiv.style.display = 'none';
      }
    });
  }, []);
};

// Interfaces
interface KanbanData {
  lanes: Lane[];
}

interface Lane {
  id: string;
  title: string;
  label: string;
  cards: Card[];
  style?: {
    width?: number;
    backgroundColor?: string;
    color?: string;
  };
}

interface Card {
  id: string;
  title: string;
  description: string;
  label: string;
  draggable: boolean;
  tags: Array<{ title: string; color: string }>;
  metadata: {
    type: 'project' | 'task' | 'subtask';
    entityId: string;
    startDate?: string;
    endDate?: string;
    progress?: number;
    parentId?: string;
    priority?: string;
  };
}

interface EntityMap {
  [key: string]: {
    tasks?: string[];
    subtasks?: string[];
    card?: Card;
  };
}

const KanbanBoard: React.FC = () => {
  useReactBeautifulDndFix();

  // Estados principales
  const [data, setData] = useState<KanbanData>({ lanes: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'project' | 'task' | 'subtask'>('all');
  const [isDroppableEnabled, setIsDroppableEnabled] = useState(false);

  // Mapas para relaciones
  const [projectMap, setProjectMap] = useState<EntityMap>({});
  const [taskMap, setTaskMap] = useState<EntityMap>({});

  // Estados para panel lateral
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [activeTab, setActiveTab] = useState('detalles');

  // Estados para formularios
  const [taskForm, setTaskForm] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    fecha_inicio: '',
    fecha_vencimiento: '',
  });

  const [subtaskForm, setSubtaskForm] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    fecha_inicio: '',
    fecha_vencimiento: '',
  });

  // Colores para elementos
  const cardColors = useMemo(() => ({
    project: {
      pending: '#bb8fce',
      inProgress: '#a569bd',
      completed: '#7d3c98'
    },
    task: {
      pending: '#abebc6',
      inProgress: '#82e0aa',
      completed: '#2ecc71'
    },
    subtask: {
      pending: '#f9e79f',
      inProgress: '#f7dc6f',
      completed: '#f1c40f'
    }
  }), []);

  // Funciones auxiliares
  const filterCards = useCallback((cards: Card[]): Card[] => {
    return cards.filter(card => {
      const textMatch = filterText === '' ||
        card.title.toLowerCase().includes(filterText.toLowerCase()) ||
        (card.description && card.description.toLowerCase().includes(filterText.toLowerCase()));

      const priorityMatch = filterPriority === null ||
        card.metadata.priority?.toLowerCase() === filterPriority.toLowerCase();

      const typeMatch = filterType === 'all' || card.metadata.type === filterType;

      return textMatch && priorityMatch && typeMatch;
    });
  }, [filterText, filterPriority, filterType]);

  const getPriorityColor = useCallback((prioridad?: string): string => {
    switch (prioridad?.toLowerCase()) {
      case 'alta': return '#e74c3c';
      case 'media': return '#f39c12';
      case 'baja': return '#3498db';
      default: return '#95a5a6';
    }
  }, []);

  const calculateProgress = useCallback((estado: string): number => {
    switch (estado.toLowerCase()) {
      case 'completado':
      case 'completada':
      case 'finalizado':
      case 'finalizada':
        return 100;
      case 'en progreso':
        return 50;
      default:
        return 0;
    }
  }, []);

  // Función para abrir detalles
  const openCardDetails = useCallback((card: Card) => {
    console.log('Tarjeta seleccionada desde Kanban:', card);
    setSelectedCard(card);
    setShowDetails(true);
    setActiveTab('detalles');
    
    setTaskForm({
      titulo: '',
      descripcion: '',
      prioridad: 'media',
      fecha_inicio: '',
      fecha_vencimiento: '',
    });
    
    setSubtaskForm({
      titulo: '',
      descripcion: '',
      prioridad: 'media',
      fecha_inicio: '',
      fecha_vencimiento: '',
    });
  }, []);

  // Manejar cambios en formularios
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, formType: 'task' | 'subtask') => {
    const { name, value } = e.target;
    if (formType === 'task') {
      setTaskForm((prev) => ({ ...prev, [name]: value }));
    } else {
      setSubtaskForm((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  // Validar fechas
  const validateDates = useCallback((start: Date, end: Date, parentStart: Date, parentEnd: Date) => {
    if (end < start) {
      alert('La fecha de vencimiento no puede ser anterior a la fecha de inicio.');
      return false;
    }
    if (start < parentStart || end > parentEnd) {
      alert('Las fechas deben estar dentro del rango del proyecto/tarea padre.');
      return false;
    }
    return true;
  }, []);

  // Crear tarea
  const handleCreateTask = useCallback(async () => {
    if (!selectedCard) return;

    const start = new Date(taskForm.fecha_inicio);
    const end = new Date(taskForm.fecha_vencimiento);
    const projectStart = selectedCard.metadata.startDate ? new Date(selectedCard.metadata.startDate) : new Date();
    const projectEnd = selectedCard.metadata.endDate ? new Date(selectedCard.metadata.endDate) : new Date();

    if (!validateDates(start, end, projectStart, projectEnd)) return;

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json',
        },
      };

      const newTask = {
        titulo: taskForm.titulo,
        descripcion: taskForm.descripcion,
        estado: 'pendiente',
        prioridad: taskForm.prioridad,
        fecha_inicio: taskForm.fecha_inicio,
        fecha_vencimiento: taskForm.fecha_vencimiento,
        id_proyecto: selectedCard.metadata.entityId,
      };

      const response = await axios.post(`${API_BASE_URL}/tasks`, newTask, config);
      
      // ✅ MANEJO MEJORADO CON REFRESH AUTOMÁTICO
      try {
        if (response.data.success) {
          alert(`✅ Tarea creada con éxito`);
          setTaskForm({ titulo: '', descripcion: '', prioridad: 'media', fecha_inicio: '', fecha_vencimiento: '' });
          setShowDetails(false);
          await fetchData();
          
          // ✅ REFRESH AUTOMÁTICO DESPUÉS DE CREAR TAREA
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          alert(`❌ No se pudo crear la tarea: ${response.data.message || 'Error desconocido'}`);
          // ⚠️ Refresh también en caso de error ya que la tarea se puede haber creado
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (responseError) {
        // Si hay error en el procesamiento de respuesta, también refresh
        console.warn('Error procesando respuesta, pero refrescando por si la tarea se creó');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error al crear tarea:', error);
      alert(`Error al crear la tarea: ${error.response?.data?.message || error.message}`);
      
      // ⚠️ REFRESH INCLUSO EN CASO DE ERROR (porque viste que se crean a pesar del error)
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [selectedCard, taskForm, validateDates]);

  // Crear subtarea
  const handleCreateSubtask = useCallback(async () => {
    if (!selectedCard) return;

    if (selectedCard.metadata.type === 'project' || selectedCard.metadata.type === 'subtask') {
      alert('Solo se pueden crear subtareas a partir de tareas regulares.');
      return;
    }

    const start = new Date(subtaskForm.fecha_inicio);
    const end = new Date(subtaskForm.fecha_vencimiento);
    const taskStart = selectedCard.metadata.startDate ? new Date(selectedCard.metadata.startDate) : new Date();
    const taskEnd = selectedCard.metadata.endDate ? new Date(selectedCard.metadata.endDate) : new Date();

    if (!validateDates(start, end, taskStart, taskEnd)) return;

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json',
        },
      };

      const newSubtask = {
        titulo: subtaskForm.titulo,
        descripcion: subtaskForm.descripcion,
        estado: 'pendiente',
        prioridad: subtaskForm.prioridad,
        fecha_inicio: subtaskForm.fecha_inicio,
        fecha_vencimiento: subtaskForm.fecha_vencimiento,
      };

      const response = await axios.post(`${API_BASE_URL}/tasks/${selectedCard.metadata.entityId}/subtasks`, newSubtask, config);
      
      // ✅ MANEJO MEJORADO CON REFRESH AUTOMÁTICO
      try {
        if (response.data.success) {
          alert(`✅ Subtarea creada con éxito`);
          setSubtaskForm({ titulo: '', descripcion: '', prioridad: 'media', fecha_inicio: '', fecha_vencimiento: '' });
          setShowDetails(false);
          await fetchData();
          
          // ✅ REFRESH AUTOMÁTICO DESPUÉS DE CREAR SUBTAREA
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          alert(`❌ No se pudo crear la subtarea: ${response.data.message || 'Error desconocido'}`);
          // ⚠️ Refresh también en caso de error ya que la subtarea se puede haber creado
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (responseError) {
        // Si hay error en el procesamiento de respuesta, también refresh
        console.warn('Error procesando respuesta, pero refrescando por si la subtarea se creó');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error al crear subtarea:', error);
      alert(`Error al crear la subtarea: ${error.response?.data?.message || error.message}`);
      
      // ⚠️ REFRESH INCLUSO EN CASO DE ERROR (porque puede haberse creado a pesar del error)
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [selectedCard, subtaskForm, validateDates]);

  // 📍 NUEVAS FUNCIONES DE ELIMINACIÓN
  
  // Eliminar proyecto con cascada
  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm(`¿Está seguro de que desea eliminar este proyecto?\n\n⚠️ ATENCIÓN: Esto también eliminará todas las tareas y subtareas asociadas.`)) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token || '',
            'Content-Type': 'application/json',
          },
        };

        // Eliminar proyecto (el backend debería manejar la cascada)
        const response = await axios.delete(`${API_BASE_URL}/projects/${projectId}`, config);
        
        if (response.data.success) {
          alert('✅ Proyecto eliminado correctamente');
          setShowDetails(false);
          await fetchData();
          
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          alert('❌ Error al eliminar el proyecto');
        }
      } catch (error: any) {
        console.error('Error al eliminar proyecto:', error);
        alert(`Error al eliminar el proyecto: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Eliminar tarea
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm(`¿Está seguro de que desea eliminar esta tarea?\n\n⚠️ ATENCIÓN: Esto también eliminará todas las subtareas asociadas.`)) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token || '',
            'Content-Type': 'application/json',
          },
        };

        const response = await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, config);
        
        if (response.data.success) {
          alert('✅ Tarea eliminada correctamente');
          setShowDetails(false);
          await fetchData();
          
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          alert('❌ Error al eliminar la tarea');
        }
      } catch (error: any) {
        console.error('Error al eliminar tarea:', error);
        alert(`Error al eliminar la tarea: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Eliminar subtarea
  const handleDeleteSubtask = async (subtaskId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta subtarea?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token || '',
            'Content-Type': 'application/json',
          },
        };

        const response = await axios.delete(`${API_BASE_URL}/subtasks/${subtaskId}`, config);
        
        if (response.data.success) {
          alert('✅ Subtarea eliminada correctamente');
          setShowDetails(false);
          await fetchData();
          
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          alert('❌ Error al eliminar la subtarea');
        }
      } catch (error: any) {
        console.error('Error al eliminar subtarea:', error);
        alert(`Error al eliminar la subtarea: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Cargar datos
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsDroppableEnabled(false);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token || '' } };

      const [projectsRes, tasksRes, subtasksRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/projects`, config),
        axios.get(`${API_BASE_URL}/tasks`, config),
        axios.get(`${API_BASE_URL}/subtasks`, config),
      ]);

      const projects = projectsRes.data?.data || [];
      const tasks = tasksRes.data?.data || [];
      const subtasks = subtasksRes.data?.data || [];

      const pendientes: Card[] = [];
      const enProgreso: Card[] = [];
      const completados: Card[] = [];
      const newProjectMap: EntityMap = {};
      const newTaskMap: EntityMap = {};

      // Procesar proyectos
      projects.forEach((project: any) => {
        const estado = project.estado?.toLowerCase() || 'pendiente';
        const card: Card = {
          id: `project-${project.id}`,
          title: project.nombre,
          description: project.descripcion || '',
          label: 'Proyecto',
          draggable: true,
          tags: [
            { title: 'Proyecto', color: '#8e44ad' },
            // 🆕 AGREGAR TAG DE PRIORIDAD PARA PROYECTOS
            { title: `Prioridad: ${project.prioridad || 'Media'}`, color: getPriorityColor(project.prioridad) }
          ],
          metadata: {
            type: 'project',
            entityId: project.id.toString(),
            startDate: project.fecha_inicio,
            endDate: project.fecha_fin,
            progress: calculateProgress(estado),
            priority: project.prioridad // 🆕 INCLUIR PRIORIDAD EN METADATA
          }
        };

        newProjectMap[`project-${project.id}`] = { tasks: [], card };

        if (estado === 'completado' || estado === 'finalizado') {
          completados.push(card);
        } else if (estado === 'en progreso') {
          enProgreso.push(card);
        } else {
          pendientes.push(card);
        }
      });

      // Procesar tareas
      tasks.forEach((task: any) => {
        const estado = task.estado?.toLowerCase() || 'pendiente';
        const card: Card = {
          id: `task-${task.id}`,
          title: task.titulo,
          description: task.descripcion || '',
          label: 'Tarea',
          draggable: true,
          tags: [
            { title: 'Tarea', color: '#27ae60' },
            { title: `Prioridad: ${task.prioridad || 'Normal'}`, color: getPriorityColor(task.prioridad) }
          ],
          metadata: {
            type: 'task',
            entityId: task.id.toString(),
            startDate: task.fecha_inicio,
            endDate: task.fecha_vencimiento,
            progress: calculateProgress(estado),
            parentId: task.id_proyecto?.toString(),
            priority: task.prioridad
          }
        };

        newTaskMap[`task-${task.id}`] = { subtasks: [], card };

        if (task.id_proyecto) {
          const projectKey = `project-${task.id_proyecto}`;
          if (newProjectMap[projectKey]) {
            if (!newProjectMap[projectKey].tasks) newProjectMap[projectKey].tasks = [];
            (newProjectMap[projectKey].tasks as string[]).push(`task-${task.id}`);
          }
        }

        // 📍 CORREGIDO: MOSTRAR TODAS LAS TAREAS (INCLUSO CON PADRE)
        // Eliminamos el filtro hasParent para que se muestren todas las tareas
        // const hasParent = task.id_proyecto && newProjectMap[`project-${task.id_proyecto}`];
        // if (!hasParent) { // VIEJO CÓDIGO QUE OCULTABA LAS TAREAS
        
        // ✅ AHORA MOSTRAMOS TODAS LAS TAREAS SIN IMPORTAR SI TIENEN PADRE O NO
        if (estado === 'completado' || estado === 'finalizado' || estado === 'completada' || estado === 'finalizada') {
          completados.push(card);
        } else if (estado === 'en progreso') {
          enProgreso.push(card);
        } else {
          pendientes.push(card);
        }
        // } // CERRAMOS EL VIEJO IF hasParent
      });

      // Procesar subtareas
      subtasks.forEach((subtask: any) => {
        const estado = subtask.estado?.toLowerCase() || 'pendiente';
        const card: Card = {
          id: `subtask-${subtask.id}`,
          title: subtask.titulo,
          description: subtask.descripcion || '',
          label: 'Subtarea',
          draggable: true,
          tags: [
            { title: 'Subtarea', color: '#f1c40f' },
            { title: `Prioridad: ${subtask.prioridad || 'Normal'}`, color: getPriorityColor(subtask.prioridad) }
          ],
          metadata: {
            type: 'subtask',
            entityId: subtask.id.toString(),
            startDate: subtask.fecha_inicio,
            endDate: subtask.fecha_vencimiento,
            progress: calculateProgress(estado),
            parentId: subtask.id_tarea?.toString(),
            priority: subtask.prioridad
          }
        };

        newTaskMap[`subtask-${subtask.id}`] = { card };

        if (subtask.id_tarea) {
          const taskKey = `task-${subtask.id_tarea}`;
          if (newTaskMap[taskKey]) {
            if (!newTaskMap[taskKey].subtasks) newTaskMap[taskKey].subtasks = [];
            (newTaskMap[taskKey].subtasks as string[]).push(`subtask-${subtask.id}`);
          }
        }

        // 📍 CORREGIDO: MOSTRAR TODAS LAS SUBTAREAS (INCLUSO CON PADRE)
        // Eliminamos el filtro hasParent para que se muestren todas las subtareas
        // const hasParent = subtask.id_tarea && newTaskMap[`task-${subtask.id_tarea}`];
        // if (!hasParent) { // VIEJO CÓDIGO QUE OCULTABA LAS SUBTAREAS
        
        // ✅ AHORA MOSTRAMOS TODAS LAS SUBTAREAS SIN IMPORTAR SI TIENEN PADRE O NO
        if (estado === 'completado' || estado === 'finalizado' || estado === 'completada' || estado === 'finalizada') {
          completados.push(card);
        } else if (estado === 'en progreso') {
          enProgreso.push(card);
        } else {
          pendientes.push(card);
        }
        // } // CERRAMOS EL VIEJO IF hasParent
      });

      setProjectMap(newProjectMap);
      setTaskMap(newTaskMap);

      const filteredPendientes = filterCards(pendientes);
      const filteredEnProgreso = filterCards(enProgreso);
      const filteredCompletados = filterCards(completados);

      const kanbanData: KanbanData = {
        lanes: [
          {
            id: 'pendiente',
            title: 'Pendiente',
            label: `${filteredPendientes.length}`,
            cards: filteredPendientes,
            style: { width: 280, backgroundColor: '#f8f9fa', color: '#212529' }
          },
          {
            id: 'en-progreso',
            title: 'En Progreso',
            label: `${filteredEnProgreso.length}`,
            cards: filteredEnProgreso,
            style: { width: 280, backgroundColor: '#e9f2fd', color: '#0d6efd' }
          },
          {
            id: 'completado',
            title: 'Completado',
            label: `${filteredCompletados.length}`,
            cards: filteredCompletados,
            style: { width: 280, backgroundColor: '#e8f6ef', color: '#198754' }
          }
        ]
      };

      setData(kanbanData);
    } catch (error) {
      console.error('Error al cargar datos para el Kanban:', error);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [filterCards, calculateProgress, getPriorityColor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Habilitar droppables
  useEffect(() => {
    if (!loading && data.lanes.length > 0) {
      const timer = setTimeout(() => {
        setIsDroppableEnabled(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, data.lanes]);

  // Actualizar estado de tarjeta
  const updateCardStatus = async (cardId: string, sourceLaneId: string, targetLaneId: string) => {
    try {
      if (sourceLaneId === targetLaneId) return;

      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token || '', 'Content-Type': 'application/json' } };

      const [type, id] = cardId.split('-');
      const numericId = id.includes('-parent-') ? id.split('-parent-')[0] : id;

      let apiUrl = '';
      let newStatus = '';

      switch (targetLaneId) {
        case 'pendiente': newStatus = 'pendiente'; break;
        case 'en-progreso': newStatus = 'en progreso'; break;
        case 'completado': newStatus = 'completado'; break;
        default: newStatus = 'pendiente';
      }

      if (type === 'project') {
        apiUrl = `${API_BASE_URL}/projects/${numericId}`;
      } else if (type === 'task') {
        apiUrl = `${API_BASE_URL}/tasks/${numericId}`;
      } else if (type === 'subtask') {
        apiUrl = `${API_BASE_URL}/subtasks/${numericId}`;
      }

      const response = await axios.put(apiUrl, { estado: newStatus }, config);
      if (response.data.success) {
        await fetchData();
      } else {
        setError(`Error al actualizar estado: ${response.data.message}`);
        fetchData();
      }
    } catch (error: any) {
      console.error('Error al mover tarjeta:', error);
      setError(`Error al mover tarjeta: ${error.message || 'Error desconocido'}`);
      fetchData();
    }
  };

  // Manejar arrastre
  const handleDragEnd = (result: any) => {
    const { source, destination, draggableId } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const newData = { ...data };
    const sourceLane = newData.lanes.find(lane => lane.id === source.droppableId);
    const destLane = newData.lanes.find(lane => lane.id === destination.droppableId);

    if (!sourceLane || !destLane) return;

    const cardIndex = sourceLane.cards.findIndex(card => card.id === draggableId);
    if (cardIndex < 0) return;

    const card = sourceLane.cards[cardIndex];
    sourceLane.cards.splice(cardIndex, 1);
    destLane.cards.splice(destination.index, 0, card);

    sourceLane.label = `${sourceLane.cards.length}`;
    destLane.label = `${destLane.cards.length}`;

    setData({ ...newData });
    updateCardStatus(draggableId, source.droppableId, destination.droppableId);
  };

  // Componentes internos
  const TaskWithSubtasks = React.memo(({ taskId, taskCard, taskMap, cardColors, getPriorityColor }: {
    taskId: string;
    taskCard: Card;
    taskMap: EntityMap;
    cardColors: any;
    getPriorityColor: (priority?: string) => string;
  }) => {
    const [expanded, setExpanded] = useState(false);
    const subtaskIds = taskMap[taskId]?.subtasks || [];
    const hasSubtasks = subtaskIds.length > 0;

    return (
      <div key={taskId} style={{
        backgroundColor: taskCard.metadata.progress === 100 ? cardColors.task.completed :
          taskCard.metadata.progress && taskCard.metadata.progress > 0 ? cardColors.task.inProgress : cardColors.task.pending,
        padding: '8px', borderRadius: '4px', marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
            {taskCard.title}
            {hasSubtasks && (
              <span style={{
                cursor: 'pointer', fontSize: '10px', padding: '1px 4px',
                backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '3px', marginLeft: '5px'
              }} onClick={() => setExpanded(!expanded)}>
                {expanded ? '▼' : '▶'} {subtaskIds.length} subtarea{subtaskIds.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {taskCard.metadata.priority && (
            <span style={{
              backgroundColor: getPriorityColor(taskCard.metadata.priority),
              color: 'white', padding: '1px 4px', borderRadius: '3px', fontSize: '9px'
            }}>
              {taskCard.metadata.priority}
            </span>
          )}
        </div>
        {expanded && hasSubtasks && (
          <div style={{ marginTop: '8px', paddingLeft: '10px', borderLeft: '2px solid rgba(0,0,0,0.1)' }}>
            {subtaskIds.map((subtaskId: string) => {
              const subtaskCard = taskMap[subtaskId]?.card;
              if (!subtaskCard) return null;
              return (
                <div key={subtaskId} style={{
                  backgroundColor: subtaskCard.metadata.progress === 100 ? cardColors.subtask.completed :
                    subtaskCard.metadata.progress && subtaskCard.metadata.progress > 0 ? cardColors.subtask.inProgress : cardColors.subtask.pending,
                  padding: '5px', borderRadius: '3px', marginBottom: '5px', fontSize: '11px',
                  display: 'flex', justifyContent: 'space-between'
                }}>
                  <div>{subtaskCard.title}</div>
                  {subtaskCard.metadata.priority && (
                    <span style={{
                      backgroundColor: getPriorityColor(subtaskCard.metadata.priority),
                      color: 'white', padding: '0px 3px', borderRadius: '2px', fontSize: '8px'
                    }}>
                      {subtaskCard.metadata.priority}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  });

  const SubtasksList = React.memo(({ subtaskIds, taskMap, cardColors, getPriorityColor }: {
    subtaskIds: string[];
    taskMap: EntityMap;
    cardColors: any;
    getPriorityColor: (priority?: string) => string;
  }) => {
    return (
      <div className="task-subtasks">
        {subtaskIds.map((subtaskId: string) => {
          const subtaskCard = taskMap[subtaskId]?.card;
          if (!subtaskCard) return null;
          return (
            <div key={subtaskId} style={{
              backgroundColor: subtaskCard.metadata.progress === 100 ? cardColors.subtask.completed :
                subtaskCard.metadata.progress && subtaskCard.metadata.progress > 0 ? cardColors.subtask.inProgress : cardColors.subtask.pending,
              padding: '6px', borderRadius: '3px', marginBottom: '5px', fontSize: '11px',
              display: 'flex', justifyContent: 'space-between'
            }}>
              <div>{subtaskCard.title}</div>
              {subtaskCard.metadata.priority && (
                <span style={{
                  backgroundColor: getPriorityColor(subtaskCard.metadata.priority),
                  color: 'white', padding: '0px 3px', borderRadius: '2px', fontSize: '8px'
                }}>
                  {subtaskCard.metadata.priority}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  });

  const CustomCard = React.memo(({ id, title, description, metadata, tags, index }: any) => {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = (metadata.type === 'project' && projectMap[id]?.tasks && (projectMap[id]?.tasks as string[])?.length > 0) ||
      (metadata.type === 'task' && taskMap[id]?.subtasks && (taskMap[id]?.subtasks as string[])?.length > 0);

    if ((metadata.type === 'task' && metadata.parentId && projectMap && (projectMap[`project-${metadata.parentId}`] as any)) ||
      (metadata.type === 'subtask' && metadata.parentId && taskMap && (taskMap[`task-${metadata.parentId}`] as any))) {
      return null;
    }

    const type = metadata.type as 'project' | 'task' | 'subtask';
    let backgroundColor: string;
    if (metadata.progress === 100) {
      backgroundColor = cardColors[type].completed;
    } else if (metadata.progress && metadata.progress > 0) {
      backgroundColor = cardColors[type].inProgress;
    } else {
      backgroundColor = cardColors[type].pending;
    }

    const textColor = type === 'project' ? 'white' : 'black';

    return (
      <Draggable draggableId={id} index={index} key={id}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style, backgroundColor, padding: '10px', borderRadius: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
              marginBottom: '10px', color: textColor
            }} data-task-id={id}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', flex: 1 }}>
                {title}
                <button onClick={(e) => {
                  e.stopPropagation();
                  openCardDetails({ id, title, description, metadata, tags, label: '', draggable: true });
                }} style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                  width: '24px', height: '24px', marginLeft: '8px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: textColor, fontSize: '12px'
                }} title="Ver detalles">
                  <i className="bi bi-info-circle"></i>
                </button>

                {hasChildren && (
                  <span style={{
                    cursor: 'pointer', fontSize: '12px', padding: '2px 6px',
                    backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '4px', marginLeft: '5px'
                  }} onClick={() => setExpanded(!expanded)}>
                    {expanded ? '▼' : '▶'} {
                      metadata.type === 'project' && projectMap[id]?.tasks ?
                        `${projectMap[id]?.tasks?.length} tareas` :
                        metadata.type === 'task' && taskMap[id]?.subtasks ?
                          `${taskMap[id]?.subtasks?.length} subtareas` : ''
                    }
                  </span>
                )}
              </div>
              <div>
                {tags.map((tag: any, index: number) => (
                  <span key={index} style={{
                    backgroundColor: tag.color, color: 'white', padding: '2px 6px',
                    borderRadius: '3px', fontSize: '10px', marginRight: '4px'
                  }}>
                    {tag.title}
                  </span>
                ))}
              </div>
            </div>

            {description && (
              <div style={{ fontSize: '12px', marginBottom: '5px' }}>
                {description.length > 100 ? `${description.substring(0, 100)}...` : description}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
              <div>
                {(metadata.startDate || metadata.endDate) && (
                  <div style={{ fontSize: '11px' }}>
                    {metadata.startDate && <span>Inicio: {new Date(metadata.startDate).toLocaleDateString()}</span>}
                    {metadata.startDate && metadata.endDate && <span> | </span>}
                    {metadata.endDate && <span>Fin: {new Date(metadata.endDate).toLocaleDateString()}</span>}
                  </div>
                )}
              </div>
              <UserAvatars itemId={metadata.entityId} itemType={metadata.type} maxDisplay={2} size="sm" />
            </div>

            {expanded && hasChildren && (
              <div style={{ marginTop: '10px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '10px' }}>
                {metadata.type === 'project' && projectMap[id]?.tasks && (
                  <div className="project-tasks">
                    {(projectMap[id]?.tasks || []).map((taskId: string) => {
                      const taskCardObj = taskMap[taskId]?.card;
                      if (!taskCardObj) return null;
                      return (
                        <TaskWithSubtasks key={taskId} taskId={taskId} taskCard={taskCardObj}
                          taskMap={taskMap} cardColors={cardColors} getPriorityColor={getPriorityColor} />
                      );
                    })}
                  </div>
                )}

                {metadata.type === 'task' && taskMap[id]?.subtasks && (
                  <SubtasksList subtaskIds={taskMap[id]?.subtasks || []} taskMap={taskMap}
                    cardColors={cardColors} getPriorityColor={getPriorityColor} />
                )}
              </div>
            )}
          </div>
        )}
      </Draggable>
    );
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando tablero Kanban...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <p>{error}</p>
        <Button variant="outline-primary" onClick={fetchData}>Intentar nuevamente</Button>
      </div>
    );
  }

  return (
    <div className="kanban-board-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Tablero Kanban</h5>
        <Button variant="outline-primary" size="sm" onClick={fetchData} className="d-flex align-items-center">
          <i className="bi bi-arrow-clockwise me-1"></i> Actualizar
        </Button>
      </div>

      <KanbanLegend />

      <div className="filter-controls mb-3">
        <Row>
          <Col md={4}>
            <Form.Control type="text" placeholder="Buscar..." value={filterText}
              onChange={e => setFilterText(e.target.value)} className="mb-2" />
          </Col>
          <Col md={3}>
            <Form.Select value={filterPriority || ''} onChange={e => setFilterPriority(e.target.value || null)} className="mb-2">
              <option value="">Todas las prioridades</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="mb-2">
              <option value="all">Todos los tipos</option>
              <option value="project">Proyectos</option>
              <option value="task">Tareas</option>
              <option value="subtask">Subtareas</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Button variant="outline-secondary" onClick={() => {
              setFilterText(''); setFilterPriority(null); setFilterType('all');
            }} className="w-100 mb-2">Limpiar</Button>
          </Col>
        </Row>
      </div>

      {/* Kanban Board */}
      {isDroppableEnabled ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div style={{
            height: 'auto', minHeight: '600px', overflowX: 'auto', paddingBottom: '20px'
          }} className="kanban-board-wrapper">
            <div style={{
              display: 'flex', flexDirection: 'row', gap: '16px', height: 'auto', minHeight: '600px', width: '100%'
            }}>
              {data.lanes.map((lane) => (
                <div key={lane.id} className="custom-lane" style={{
                  flex: '1 1 0', minWidth: '300px', backgroundColor: lane.style?.backgroundColor || '#f8f9fa',
                  borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  display: 'flex', flexDirection: 'column', height: 'auto', margin: '0'
                }}>
                  <div className="lane-header" style={{
                    padding: '10px 15px', borderBottom: '1px solid rgba(0,0,0,0.1)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    color: lane.style?.color || '#212529', fontWeight: 'bold'
                  }}>
                    <div>{lane.title}</div>
                    <div className="lane-count">{lane.label}</div>
                  </div>
                  <Droppable droppableId={lane.id} key={lane.id}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="lane-cards"
                        style={{ padding: '10px', height: 'auto', minHeight: '100px' }}>
                        {lane.cards.map((card, index) => (
                          <CustomCard key={card.id} id={card.id} title={card.title} description={card.description}
                            metadata={card.metadata} tags={card.tags} index={index} />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </div>
        </DragDropContext>
      ) : (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Preparando tablero...</p>
        </div>
      )}

      {/* Panel de detalles */}
      <Offcanvas show={showDetails} onHide={() => setShowDetails(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            {selectedCard?.metadata.type === 'project' ? 'Detalles del Proyecto' :
              selectedCard?.metadata.type === 'subtask' ? 'Detalles de Subtarea' : 'Detalles de Tarea'} - Kanban
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {selectedCard && (
            <>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5>{selectedCard.title}</h5>
                <Badge bg={Number(selectedCard.metadata.progress) === 100 ? 'success' :
                  Number(selectedCard.metadata.progress) > 0 ? 'primary' : 'secondary'}>
                  {Number(selectedCard.metadata.progress) === 100 ? 'Completado' :
                    Number(selectedCard.metadata.progress) > 0 ? 'En Progreso' : 'Pendiente'}
                </Badge>
              </div>

              <Nav variant="tabs" className="mb-3" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'detalles')}>
                <Nav.Item><Nav.Link eventKey="detalles">Detalles</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="usuarios">Usuarios</Nav.Link></Nav.Item>
              </Nav>

              <Tab.Content>
                <Tab.Pane active={activeTab === 'detalles'}>
                  <p><strong>Descripción:</strong> {selectedCard.description || 'Sin descripción'}</p>
                  {selectedCard.metadata.startDate && (
                    <p><strong>Inicio:</strong> {new Date(selectedCard.metadata.startDate).toLocaleDateString()}</p>
                  )}
                  {selectedCard.metadata.endDate && (
                    <p><strong>Fin:</strong> {new Date(selectedCard.metadata.endDate).toLocaleDateString()}</p>
                  )}
                  <p><strong>Progreso:</strong> {selectedCard.metadata.progress || 0}%</p>
                  <ProgressBar now={selectedCard.metadata.progress || 0} label={`${selectedCard.metadata.progress || 0}%`} className="mb-3" />
                  <p><strong>ID:</strong> {selectedCard.metadata.entityId}</p>
                  <p><strong>Tipo:</strong> {selectedCard.metadata.type}</p>

                  {/* 📍 BOTONES DE ACCIÓN PARA ELIMINACIÓN */}
                  <div className="d-flex gap-2 mb-4 mt-3">
                    {selectedCard.metadata.type === 'project' && (
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteProject(selectedCard.metadata.entityId)}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Eliminar Proyecto
                      </Button>
                    )}
                    
                    {selectedCard.metadata.type === 'task' && (
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteTask(selectedCard.metadata.entityId)}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Eliminar Tarea
                      </Button>
                    )}
                    
                    {selectedCard.metadata.type === 'subtask' && (
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteSubtask(selectedCard.metadata.entityId)}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Eliminar Subtarea
                      </Button>
                    )}
                  </div>

                  {/* Formulario para agregar tareas si es un proyecto */}
                  {selectedCard.metadata.type === 'project' && (
                    <>
                      <h6 className="mt-4">Agregar Tarea</h6>
                      <Form>
                        <Form.Group className="mb-2">
                          <Form.Label>Título</Form.Label>
                          <Form.Control type="text" name="titulo" value={taskForm.titulo} onChange={(e) => handleInputChange(e, 'task')} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>Descripción</Form.Label>
                          <Form.Control as="textarea" name="descripcion" rows={2} value={taskForm.descripcion} onChange={(e) => handleInputChange(e, 'task')} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>Prioridad</Form.Label>
                          <Form.Select name="prioridad" value={taskForm.prioridad} onChange={(e) => handleInputChange(e, 'task')}>
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                          </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>Fecha de Inicio</Form.Label>
                          <Form.Control type="date" name="fecha_inicio" value={taskForm.fecha_inicio} onChange={(e) => handleInputChange(e, 'task')} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Fecha de Vencimiento</Form.Label>
                          <Form.Control type="date" name="fecha_vencimiento" value={taskForm.fecha_vencimiento} onChange={(e) => handleInputChange(e, 'task')} />
                        </Form.Group>
                        <Button variant="success" onClick={handleCreateTask}>Crear Tarea</Button>
                      </Form>
                    </>
                  )}

                  {/* Formulario para agregar subtareas si es una tarea regular */}
                  {selectedCard.metadata.type === 'task' && (
                    <>
                      <h6 className="mt-4">Agregar Subtarea</h6>
                      <Form>
                        <Form.Group className="mb-2">
                          <Form.Label>Título</Form.Label>
                          <Form.Control type="text" name="titulo" value={subtaskForm.titulo} onChange={(e) => handleInputChange(e, 'subtask')} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>Descripción</Form.Label>
                          <Form.Control as="textarea" name="descripcion" rows={2} value={subtaskForm.descripcion} onChange={(e) => handleInputChange(e, 'subtask')} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>Prioridad</Form.Label>
                          <Form.Select name="prioridad" value={subtaskForm.prioridad} onChange={(e) => handleInputChange(e, 'subtask')}>
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                          </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                          <Form.Label>Fecha de Inicio</Form.Label>
                          <Form.Control type="date" name="fecha_inicio" value={subtaskForm.fecha_inicio} onChange={(e) => handleInputChange(e, 'subtask')} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Fecha de Vencimiento</Form.Label>
                          <Form.Control type="date" name="fecha_vencimiento" value={subtaskForm.fecha_vencimiento} onChange={(e) => handleInputChange(e, 'subtask')} />
                        </Form.Group>
                        <Button variant="success" onClick={handleCreateSubtask}>Crear Subtarea</Button>
                      </Form>
                    </>
                  )}
                </Tab.Pane>

                <Tab.Pane active={activeTab === 'usuarios'}>
                  <UserAssignment itemId={selectedCard.metadata.entityId}
                    itemType={selectedCard.metadata.type as 'project' | 'task' | 'subtask'} onUsersUpdated={fetchData} />
                </Tab.Pane>
              </Tab.Content>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default KanbanBoard;