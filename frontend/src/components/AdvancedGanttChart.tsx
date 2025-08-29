import React, { useState, useEffect, useCallback } from 'react';
import { ViewMode, Gantt, Task } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import 'react-circular-progressbar/dist/styles.css';
import { ButtonGroup, Button, Spinner, Offcanvas, ProgressBar, Form, Tab, Nav, Badge } from 'react-bootstrap';
import Select from 'react-select';
import { createRoot } from 'react-dom/client';
import { fetchGanttData, updateElementProgress } from '../services/ganttService';
import GanttDependencyLines from './GanttDependencyLines';
import ProgressCircle from './ProgressCircle';
import UserAssignment from './UserAssignment';
import UserAvatars from './UserAvatars';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiConfig';

// Define los tipos para los estilos personalizados
interface TaskStyles {
  backgroundColor: string;
  progressColor: string;
  backgroundSelectedColor: string;
  progressSelectedColor: string;
}

// Define las estructuras de colores
interface ColorSet {
  PENDING: TaskStyles;
  COMPLETED: TaskStyles;
}

interface ColorScheme {
  PROJECT: ColorSet;
  TASK: ColorSet;
  SUBTASK: ColorSet;
}

// Definimos colores por tipo y estado
const COLORS: ColorScheme = {
  PROJECT: {
    PENDING: {
      backgroundColor: '#bb8fce',
      progressColor: '#8e44ad',
      backgroundSelectedColor: '#a569bd',
      progressSelectedColor: '#7d3c98'
    },
    COMPLETED: {
      backgroundColor: '#7d3c98',
      progressColor: '#6c3483',
      backgroundSelectedColor: '#6c3483',
      progressSelectedColor: '#5b2c6f'
    }
  },
  TASK: {
    PENDING: {
      backgroundColor: '#abebc6',
      progressColor: '#58d68d',
      backgroundSelectedColor: '#82e0aa',
      progressSelectedColor: '#27ae60'
    },
    COMPLETED: {
      backgroundColor: '#2ecc71',
      progressColor: '#27ae60',
      backgroundSelectedColor: '#27ae60',
      progressSelectedColor: '#229954'
    }
  },
  SUBTASK: {
    PENDING: {
      backgroundColor: '#f9e79f',
      progressColor: '#f4d03f',
      backgroundSelectedColor: '#f7dc6f',
      progressSelectedColor: '#f1c40f'
    },
    COMPLETED: {
      backgroundColor: '#f1c40f',
      progressColor: '#d4ac0d',
      backgroundSelectedColor: '#d4ac0d',
      progressSelectedColor: '#b7950b'
    }
  }
};

// Componente de leyenda de colores
const ColorLegend = () => {
  const legendItems = [
    { label: 'Proyectos pendientes', color: COLORS.PROJECT.PENDING.backgroundColor },
    { label: 'Proyectos completados', color: COLORS.PROJECT.COMPLETED.backgroundColor },
    { label: 'Tareas pendientes', color: COLORS.TASK.PENDING.backgroundColor },
    { label: 'Tareas completadas', color: COLORS.TASK.COMPLETED.backgroundColor },
    { label: 'Subtareas pendientes', color: COLORS.SUBTASK.PENDING.backgroundColor },
    { label: 'Subtareas completadas', color: COLORS.SUBTASK.COMPLETED.backgroundColor }
  ];

  return (
    <div className="mb-3 mt-2 p-2 border rounded bg-light">
      <h6 className="mb-2">Leyenda de colores</h6>
      <div className="d-flex flex-wrap gap-3">
        {legendItems.map((item, index) => (
          <div key={index} className="d-flex align-items-center">
            <div
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: item.color,
                marginRight: '6px',
                border: '1px solid rgba(0,0,0,0.2)',
                borderRadius: '3px'
              }}
            ></div>
            <small>{item.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

// Definir interfaz para props del tooltip
interface TooltipContentProps {
  task: Task;
  fontSize: string;
  fontFamily: string;
}

// Componente personalizado para el tooltip
const TooltipContent: React.FC<TooltipContentProps> = ({ task, fontSize, fontFamily }) => {
  return (
    <div
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '6px 10px',
        borderRadius: '4px',
        fontSize: fontSize || '12px',
        fontFamily: fontFamily || 'Arial, sans-serif',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      <div>{task.name}</div>
      <div>Progreso: {task.progress}%</div>
      <div>
        {task.start.toLocaleDateString()} - {task.end.toLocaleDateString()}
      </div>
    </div>
  );
};

// Extendemos la interfaz Task para incluir un campo personalizado
interface ExtendedTask extends Task {
  isSubtask?: boolean;
  styles?: {
    backgroundColor?: string;
    backgroundSelectedColor?: string;
    progressColor?: string;
    progressSelectedColor?: string;
  };
}

const AdvancedGanttChart = () => {
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [view, setView] = useState<ViewMode>(ViewMode.Week);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<ExtendedTask | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<string[]>([]);
  const [ganttHeight, setGanttHeight] = useState('600px');
  const [activeTab, setActiveTab] = useState('detalles');
  const [showTaskList, setShowTaskList] = useState<boolean>(true);
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

  // Estado adicional para controlar la apertura del panel
  const [lastActionTime, setLastActionTime] = useState<number>(0);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const token = localStorage.getItem('token');

  const opcionesEstado = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en progreso', label: 'En Progreso' },
    { value: 'completado', label: 'Completado' },
  ];

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      try {
        const data = await fetchGanttData();
        const processedTasks = data
          .filter((t: ExtendedTask) => t && t.start && t.end && t.name)
          .map((task: ExtendedTask) => {
            // Procesar fechas y valores por defecto
            const processedTask = {
              ...task,
              start: task.start instanceof Date ? task.start : new Date(task.start),
              end: task.end instanceof Date ? task.end : new Date(task.end),
              progress: typeof task.progress === 'number' ? task.progress : 0,
              id: task.id || `task-${Math.random().toString(36).substr(2, 9)}`,
              isSubtask: task.isSubtask || false,
              hideChildren: task.type === 'project' ? true : task.hideChildren
            };

            // Asignar estilos según tipo y progreso
            let taskStyles: TaskStyles;

            if (task.id.toString().startsWith('project-') || task.type === 'project') {
              // Utilizar Number() para evitar problemas con tipos literales
              taskStyles = Number(task.progress) === 100
                ? COLORS.PROJECT.COMPLETED
                : COLORS.PROJECT.PENDING;
            } else if (task.id.toString().startsWith('subtask-') || task.isSubtask) {
              taskStyles = Number(task.progress) === 100
                ? COLORS.SUBTASK.COMPLETED
                : COLORS.SUBTASK.PENDING;
            } else {
              taskStyles = Number(task.progress) === 100
                ? COLORS.TASK.COMPLETED
                : COLORS.TASK.PENDING;
            }

            // Añadir estilos a la tarea
            return {
              ...processedTask,
              styles: {
                backgroundColor: taskStyles.backgroundColor,
                progressColor: taskStyles.progressColor,
                backgroundSelectedColor: taskStyles.backgroundSelectedColor,
                progressSelectedColor: taskStyles.progressSelectedColor
              }
            };
          });

        console.log('Datos procesados con estilos aplicados:', processedTasks);
        setTasks(processedTasks);
      } catch (error) {
        console.error('Error al cargar datos del Gantt:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, []);

  useEffect(() => {
    const updateGanttHeight = () => {
      const header = document.getElementById('main-header');
      const footer = document.getElementById('main-footer');
      const headerHeight = header?.offsetHeight || 0;
      const footerHeight = footer?.offsetHeight || 0;
      const availableHeight = window.innerHeight - headerHeight - footerHeight;
      setGanttHeight(`${availableHeight}px`);
    };

    updateGanttHeight();
    window.addEventListener('resize', updateGanttHeight);
    return () => window.removeEventListener('resize', updateGanttHeight);
  }, []);

  // Cuando se selecciona una tarea, inicializar formularios
  useEffect(() => {
    if (selectedTask) {
      const startDate = selectedTask.start instanceof Date
        ? selectedTask.start.toISOString().split('T')[0]
        : '';
      const endDate = selectedTask.end instanceof Date
        ? selectedTask.end.toISOString().split('T')[0]
        : '';

      setTaskForm(prev => ({
        ...prev,
        fecha_inicio: startDate,
        fecha_vencimiento: endDate
      }));

      setSubtaskForm(prev => ({
        ...prev,
        fecha_inicio: startDate,
        fecha_vencimiento: endDate
      }));
    }
  }, [selectedTask]);

  // Función para inyectar información adicional en las filas de la tabla
  const enhanceTaskListItems = () => {
    if (!showTaskList) return;
    setTimeout(() => {
      const rows = document.querySelectorAll('.task-list .task-list-item');
      rows.forEach((row) => {
        const taskNameEl = row.querySelector('.task-list-name');
        if (taskNameEl && !taskNameEl.getAttribute('data-enhanced')) {
          const taskName = taskNameEl.textContent?.trim();
          const task = tasks.find((t) => t.name === taskName);
          if (task) {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'space-between';
            wrapper.style.width = '100%';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = taskName ?? '';

            // Contenedor para el círculo de progreso
            const progressContainer = document.createElement('div');
            progressContainer.style.display = 'flex';
            progressContainer.style.alignItems = 'center';

            // Crear el contenedor para avatares de usuarios
            const userAvatarsContainer = document.createElement('div');
            userAvatarsContainer.className = 'ms-2 me-2';
            userAvatarsContainer.style.minWidth = '90px';

            // Elemento para el círculo de progreso
            const circle = document.createElement('div');
            const root = document.createElement('div');
            circle.style.width = '40px';
            circle.style.height = '40px';
            circle.appendChild(root);

            // Crear root para los avatares de usuario
            const avatarsRoot = document.createElement('div');
            userAvatarsContainer.appendChild(avatarsRoot);

            wrapper.appendChild(nameSpan);
            progressContainer.appendChild(userAvatarsContainer);
            progressContainer.appendChild(circle);
            wrapper.appendChild(progressContainer);

            taskNameEl.innerHTML = '';
            taskNameEl.appendChild(wrapper);
            taskNameEl.setAttribute('data-enhanced', 'true');

            // Renderizar el círculo de progreso
            createRoot(root).render(
              <ProgressCircle value={task.progress || 0} size={40} />
            );

            // Renderizar los avatares de usuarios asignados
            const itemType = task.type === 'project' ? 'project' : (task.isSubtask ? 'subtask' : 'task');

            createRoot(avatarsRoot).render(
              <UserAvatars
                itemId={task.id.toString()}
                itemType={itemType}
                maxDisplay={2}
                size="sm"
              />
            );
          }
        }
      });
    }, 100);
  };

  // Aplicar mejoras a la lista de tareas cuando cambian las tareas o la vista
  useEffect(() => {
    if (tasks.length > 0) {
      enhanceTaskListItems();
    }
  }, [tasks, view, showTaskList]);

  const handleViewChange = (mode: ViewMode) => setView(mode);

  const openTaskDetails = (task: ExtendedTask) => {
    const now = Date.now();
    
    // Evitar abrir el mismo task múltiples veces seguidas
    if (selectedTask && selectedTask.id === task.id && showDetails) {
      console.log('Evitando apertura duplicada del panel para:', task.id);
      return;
    }
    
    // Debouncing: evitar acciones muy rápidas consecutivas
    if (now - lastActionTime < 300) { // 300ms de debounce
      console.log('Acción muy rápida, evitando apertura para:', task.id);
      return;
    }
    
    // No abrir si estamos en proceso de cerrar
    if (isClosing) {
      console.log('Panel cerrando, evitando reapertura para:', task.id);
      return;
    }
    
    setLastActionTime(now);
    
    console.log('Tarea seleccionada:', {
      id: task.id,
      type: task.type,
      isSubtask: task.isSubtask,
      name: task.name,
      progress: task.progress
    });

    setSelectedTask(task);
    setShowDetails(true);
    setActiveTab('detalles'); // Restaurar a la pestaña de detalles por defecto

    // Limpiar formularios al abrir un nuevo detalle
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
  };



  const handleExpanderClick = (task: ExtendedTask) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, hideChildren: !t.hideChildren } : t
      )
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, formType: 'task' | 'subtask') => {
    const { name, value } = e.target;
    if (formType === 'task') {
      setTaskForm((prev) => ({ ...prev, [name]: value }));
    } else {
      setSubtaskForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 📍 NUEVAS FUNCIONES DE ELIMINACIÓN PARA GANTT
  
  // Eliminar proyecto con cascada
  const handleDeleteProjectGantt = async (projectId: string) => {
    if (window.confirm(`¿Está seguro de que desea eliminar este proyecto?\n\n⚠️ ATENCIÓN: Esto también eliminará todas las tareas y subtareas asociadas.`)) {
      try {
        const config = {
          headers: {
            'x-auth-token': token || '',
            'Content-Type': 'application/json',
          },
        };

        // Extraer ID numérico del proyecto
        const numericId = projectId.toString().includes('project-') 
          ? projectId.toString().split('project-')[1] 
          : projectId;

        const response = await axios.delete(`${API_BASE_URL}/projects/${numericId}`, config);
        
        if (response.data.success) {
          alert('✅ Proyecto eliminado correctamente');
          setShowDetails(false);
          await refreshGanttData();
          
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
  const handleDeleteTaskGantt = async (taskId: string) => {
    if (window.confirm(`¿Está seguro de que desea eliminar esta tarea?\n\n⚠️ ATENCIÓN: Esto también eliminará todas las subtareas asociadas.`)) {
      try {
        const config = {
          headers: {
            'x-auth-token': token || '',
            'Content-Type': 'application/json',
          },
        };

        // Extraer ID numérico de la tarea
        const numericId = taskId.toString().includes('task-') 
          ? taskId.toString().split('task-')[1] 
          : taskId;

        const response = await axios.delete(`${API_BASE_URL}/tasks/${numericId}`, config);
        
        if (response.data.success) {
          alert('✅ Tarea eliminada correctamente');
          setShowDetails(false);
          await refreshGanttData();
          
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
  const handleDeleteSubtaskGantt = async (subtaskId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta subtarea?')) {
      try {
        const config = {
          headers: {
            'x-auth-token': token || '',
            'Content-Type': 'application/json',
          },
        };

        // Extraer ID numérico de la subtarea
        const numericId = subtaskId.toString().includes('subtask-') 
          ? subtaskId.toString().split('subtask-')[1] 
          : subtaskId;

        const response = await axios.delete(`${API_BASE_URL}/subtasks/${numericId}`, config);
        
        if (response.data.success) {
          alert('✅ Subtarea eliminada correctamente');
          setShowDetails(false);
          await refreshGanttData();
          
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

  // Función para validar fechas dentro del rango de la tarea/proyecto padre
  const validateDates = (start: Date, end: Date, parentStart: Date, parentEnd: Date) => {
    if (end < start) {
      alert('La fecha de vencimiento no puede ser anterior a la fecha de inicio.');
      return false;
    }
    if (start < parentStart || end > parentEnd) {
      alert('Las fechas deben estar dentro del rango del proyecto/tarea padre.');
      return false;
    }
    return true;
  };

  const handleCreateTask = async () => {
    if (!selectedTask) return;

    const start = new Date(taskForm.fecha_inicio);
    const end = new Date(taskForm.fecha_vencimiento);
    const projectStart = new Date(selectedTask.start);
    const projectEnd = new Date(selectedTask.end);

    if (!validateDates(start, end, projectStart, projectEnd)) return;

    try {
      const config = {
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json',
        },
      };

      // Extraer solo la parte numérica del ID del proyecto
      const projectId = selectedTask.id.toString().includes('project-')
        ? selectedTask.id.toString().split('project-')[1]
        : selectedTask.id;

      const newTask = {
        titulo: taskForm.titulo,
        descripcion: taskForm.descripcion,
        estado: 'pendiente',
        prioridad: taskForm.prioridad,
        fecha_inicio: taskForm.fecha_inicio,
        fecha_vencimiento: taskForm.fecha_vencimiento,
        id_proyecto: projectId, // Usar solo el ID numérico
      };

      const response = await axios.post(`${API_BASE_URL}/tasks`, newTask, config);
      
      // ✅ MANEJO MEJORADO CON REFRESH AUTOMÁTICO
      try {
        if (response.data.success) {
          alert(`✅ Tarea creada con éxito con ID: ${response.data.id}`);
          setTaskForm({ titulo: '', descripcion: '', prioridad: 'media', fecha_inicio: '', fecha_vencimiento: '' });
          setShowDetails(false);
          
          // Actualizar datos en lugar de recargar la página
          refreshGanttData();
          
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
      console.error('Error al crear tarea:', error.response?.data || error.message);
      alert(`Error al crear la tarea: ${error.response?.data?.message || error.message}`);
      
      // ⚠️ REFRESH INCLUSO EN CASO DE ERROR (porque puede haberse creado a pesar del error)
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  const handleCreateSubtask = async () => {
    if (!selectedTask) return;

    // Para las subtareas usamos el ID de la tarea (no es un proyecto ni una subtarea)
    if (selectedTask.type === 'project' || selectedTask.isSubtask === true) {
      alert('Solo se pueden crear subtareas a partir de tareas regulares.');
      return;
    }

    const start = new Date(subtaskForm.fecha_inicio);
    const end = new Date(subtaskForm.fecha_vencimiento);
    const taskStart = new Date(selectedTask.start);
    const taskEnd = new Date(selectedTask.end);

    if (!validateDates(start, end, taskStart, taskEnd)) return;

    try {
      const config = {
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json',
        },
      };

      // Extraer el ID de la tarea, eliminando cualquier prefijo
      const taskId = selectedTask.id.toString().includes('task-')
        ? selectedTask.id.toString().split('task-')[1]
        : selectedTask.id;

      const newSubtask = {
        titulo: subtaskForm.titulo,
        descripcion: subtaskForm.descripcion,
        estado: 'pendiente',
        prioridad: subtaskForm.prioridad,
        fecha_inicio: subtaskForm.fecha_inicio,
        fecha_vencimiento: subtaskForm.fecha_vencimiento,
      };

      const response = await axios.post(`${API_BASE_URL}/tasks/${taskId}/subtasks`, newSubtask, config);
      
      // ✅ MANEJO MEJORADO CON REFRESH AUTOMÁTICO
      try {
        if (response.data.success) {
          alert(`✅ Subtarea creada con éxito con ID: ${response.data.id}`);
          setSubtaskForm({ titulo: '', descripcion: '', prioridad: 'media', fecha_inicio: '', fecha_vencimiento: '' });
          setShowDetails(false);
          
          // Actualizar datos en lugar de recargar la página
          refreshGanttData();
          
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
      console.error('Error al crear subtarea:', error.response?.data || error.message);
      alert(`Error al crear la subtarea: ${error.response?.data?.message || error.message}`);
      
      // ⚠️ REFRESH INCLUSO EN CASO DE ERROR (porque puede haberse creado a pesar del error)
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  // Función para marcar como completado
  const handleMarkAsCompleted = async () => {
    if (!selectedTask) return;

    try {
      console.log("Marcando como completado:", selectedTask.id);

      // Usar la función de servicio para actualizar el progreso a 100%
      const success = await updateElementProgress(selectedTask.id.toString(), 100);

      if (success) {
        alert('✅ Elemento marcado como completado exitosamente');

        // Actualizar el estado local antes de cerrar el panel
        setTasks(prev => prev.map(task => {
          if (task.id === selectedTask.id) {
            // Actualizar el progreso y los estilos según el tipo
            let updatedStyles: TaskStyles;

            if (task.id.toString().startsWith('project-') || task.type === 'project') {
              updatedStyles = COLORS.PROJECT.COMPLETED;
            } else if (task.id.toString().startsWith('subtask-') || task.isSubtask) {
              updatedStyles = COLORS.SUBTASK.COMPLETED;
            } else {
              updatedStyles = COLORS.TASK.COMPLETED;
            }

            return {
              ...task,
              progress: 100,
              styles: {
                backgroundColor: updatedStyles.backgroundColor,
                progressColor: updatedStyles.progressColor,
                backgroundSelectedColor: updatedStyles.backgroundSelectedColor,
                progressSelectedColor: updatedStyles.progressSelectedColor
              }
            };
          }
          return task;
        }));

        // Actualizar el elemento seleccionado para reflejar el cambio en el panel
        if (selectedTask) {
          let updatedStyles: TaskStyles;

          if (selectedTask.type === 'project') {
            updatedStyles = COLORS.PROJECT.COMPLETED;
          } else if (selectedTask.isSubtask) {
            updatedStyles = COLORS.SUBTASK.COMPLETED;
          } else {
            updatedStyles = COLORS.TASK.COMPLETED;
          }

          setSelectedTask({
            ...selectedTask,
            progress: 100,
            styles: {
              backgroundColor: updatedStyles.backgroundColor,
              progressColor: updatedStyles.progressColor,
              backgroundSelectedColor: updatedStyles.backgroundSelectedColor,
              progressSelectedColor: updatedStyles.progressSelectedColor
            }
          });
        }

        // Actualizar datos del Gantt
        refreshGanttData();
      } else {
        alert('❌ No se pudo completar el elemento. Por favor, intente nuevamente.');
      }
    } catch (error: any) {
      console.error('Error al marcar como completado:', error.response?.data || error.message);
      alert(`Error al marcar como completado: ${error.response?.data?.message || error.message}`);
    }
  };

  // Función para refrescar los datos del Gantt
  const refreshGanttData = async () => {
    setLoading(true);
    try {
      const data = await fetchGanttData();
      const processedTasks = data
        .filter((t: ExtendedTask) => t && t.start && t.end && t.name)
        .map((task: ExtendedTask) => {
          // Conservar estado de colapso
          const existingTask = tasks.find(t => t.id === task.id);
          const hideChildren = existingTask ? existingTask.hideChildren : (task.type === 'project' ? true : false);

          // Procesar fechas y valores por defecto
          const processedTask = {
            ...task,
            start: task.start instanceof Date ? task.start : new Date(task.start),
            end: task.end instanceof Date ? task.end : new Date(task.end),
            progress: typeof task.progress === 'number' ? task.progress : 0,
            id: task.id || `task-${Math.random().toString(36).substr(2, 9)}`,
            isSubtask: task.isSubtask || false,
            hideChildren
          };

          // Asignar estilos según tipo y progreso
          let taskStyles: TaskStyles;

          if (task.id.toString().startsWith('project-') || task.type === 'project') {
            taskStyles = Number(task.progress) === 100
              ? COLORS.PROJECT.COMPLETED
              : COLORS.PROJECT.PENDING;
          } else if (task.id.toString().startsWith('subtask-') || task.isSubtask) {
            taskStyles = Number(task.progress) === 100
              ? COLORS.SUBTASK.COMPLETED
              : COLORS.SUBTASK.PENDING;
          } else {
            taskStyles = Number(task.progress) === 100
              ? COLORS.TASK.COMPLETED
              : COLORS.TASK.PENDING;
          }

          // Añadir estilos a la tarea
          return {
            ...processedTask,
            styles: {
              backgroundColor: taskStyles.backgroundColor,
              progressColor: taskStyles.progressColor,
              backgroundSelectedColor: taskStyles.backgroundSelectedColor,
              progressSelectedColor: taskStyles.progressSelectedColor
            }
          };
        });

      console.log('Datos actualizados del Gantt:', processedTasks);
      setTasks(processedTasks);
    } catch (error) {
      console.error('Error al actualizar datos del Gantt:', error);
    } finally {
      setLoading(false);
    }
  };

  const [debouncedSearchText, setDebouncedSearchText] = useState(searchText);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const getFilteredTasks = (): ExtendedTask[] => {
    if (!Array.isArray(tasks)) return [];

    return tasks.filter((t) => {
      if (!t || !t.name || !t.start || !t.end) return false;
      const coincideTexto = t.name.toLowerCase().includes(debouncedSearchText.toLowerCase());

      let coincideEstado = true;
      if (estadoFiltro.length > 0) {
        const progreso = typeof t.progress === 'number' ? t.progress : 0;
        coincideEstado = (
          (estadoFiltro.includes('pendiente') && progreso === 0) ||
          (estadoFiltro.includes('en progreso') && progreso > 0 && progreso < 100) ||
          (estadoFiltro.includes('completado') && progreso === 100)
        );
      }

      return coincideTexto && coincideEstado;
    });
  };

  const filteredTasks = getFilteredTasks();
  const hasTasks = filteredTasks.length > 0 && filteredTasks.every(task => task && task.start instanceof Date && task.end instanceof Date);

  // Determina si la tarea seleccionada es una tarea regular (no un proyecto ni una subtarea)
  const isRegularTaskSelected = selectedTask &&
    selectedTask.type === 'task' &&
    selectedTask.isSubtask !== true;

  // Determina si el elemento seleccionado está completado al 100%
  const isItemCompleted = selectedTask && Number(selectedTask.progress) === 100;

  // Determina el tipo de elemento seleccionado para la asignación de usuarios
  const getSelectedItemType = (): 'project' | 'task' | 'subtask' => {
    if (!selectedTask) return 'task';
    if (selectedTask.type === 'project') return 'project';
    if (selectedTask.isSubtask) return 'subtask';
    return 'task';
  };

  return (
    <div>
      {/* Contenedor de filtros */}
      {/* Modificar esta parte donde están los controles de filtro */}
      <div className="filter-controls mb-3">
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar tarea..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '200px' }}
            />
            <div style={{ width: '220px', minWidth: '220px' }}>
              <Select
                isMulti
                options={opcionesEstado}
                classNamePrefix="select"
                placeholder="Filtrar por estado..."
                onChange={(selected) => setEstadoFiltro(selected.map(opt => opt.value))}
                value={opcionesEstado.filter(opt => estadoFiltro.includes(opt.value))}
                menuPosition="fixed"
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: base => ({ ...base, zIndex: 9999 })
                }}
              />
            </div>
            <ButtonGroup>
              <Button variant={view === ViewMode.Day ? 'primary' : 'outline-primary'} onClick={() => handleViewChange(ViewMode.Day)}>Día</Button>
              <Button variant={view === ViewMode.Week ? 'primary' : 'outline-primary'} onClick={() => handleViewChange(ViewMode.Week)}>Semana</Button>
              <Button variant={view === ViewMode.Month ? 'primary' : 'outline-primary'} onClick={() => handleViewChange(ViewMode.Month)}>Mes</Button>
            </ButtonGroup>
            <Button
              variant="outline-success"
              onClick={refreshGanttData}
            >
              <i className="bi bi-arrow-clockwise"></i> Actualizar
            </Button>
          </div>
          {/* Toggle movido a la derecha */}
          <Form.Check
            type="switch"
            id="task-list-toggle"
            label="Mostrar tabla"
            checked={showTaskList}
            onChange={(e) => setShowTaskList(e.target.checked)}
          />
        </div>
      </div>

      {/* Leyenda de colores */}
      {!loading && hasTasks && <ColorLegend />}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : !hasTasks ? (
        <div className="text-center py-5">
          <p>No hay tareas disponibles o los datos no son válidos.</p>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', zIndex: 1, overflowX: 'auto', overflowY: 'visible' }}>
          <Gantt
            tasks={filteredTasks}
            viewMode={view}
            locale="es"
            listCellWidth={showTaskList ? "155px" : ""}
            barFill={60}
            onDateChange={(task, children) => console.log('Tarea modificada:', task)}
            onProgressChange={(task, progress) => {
              console.log('Progreso actualizado:', task.id, progress);

              // Actualizar estado local inmediatamente para mejor UX
              setTasks(prev =>
                prev.map(t => {
                  if (t.id === task.id) {
                    let newStyles: TaskStyles;
                    // Asegúrate de que progress sea un número
                    const progressNum = typeof progress === 'number' ? progress : 0;

                    if (t.id.toString().startsWith('project-') || t.type === 'project') {
                      newStyles = Number(progressNum) === 100 ? COLORS.PROJECT.COMPLETED : COLORS.PROJECT.PENDING;
                    } else if (t.id.toString().startsWith('subtask-') || t.isSubtask) {
                      newStyles = Number(progressNum) === 100 ? COLORS.SUBTASK.COMPLETED : COLORS.SUBTASK.PENDING;
                    } else {
                      newStyles = Number(progressNum) === 100 ? COLORS.TASK.COMPLETED : COLORS.TASK.PENDING;
                    }
                    return {
                      ...t,
                      progress: progressNum,
                      styles: {
                        backgroundColor: newStyles.backgroundColor,
                        progressColor: newStyles.progressColor,
                        backgroundSelectedColor: newStyles.backgroundSelectedColor,
                        progressSelectedColor: newStyles.progressSelectedColor
                      }
                    };
                  }
                  return t;
                })
              );


              // Si la tarea seleccionada es la que se actualizó, actualizar también el panel de detalles
              if (selectedTask && selectedTask.id === task.id) {
                // Determinar estilos para la tarea seleccionada
                let newStyles: TaskStyles;
                const progressNum = typeof progress === 'number' ? progress : 0;

                if (selectedTask.type === 'project') {
                  newStyles = Number(progressNum) === 100
                    ? COLORS.PROJECT.COMPLETED
                    : COLORS.PROJECT.PENDING;
                } else if (selectedTask.isSubtask) {
                  newStyles = Number(progressNum) === 100
                    ? COLORS.SUBTASK.COMPLETED
                    : COLORS.SUBTASK.PENDING;
                } else {
                  newStyles = Number(progressNum) === 100
                    ? COLORS.TASK.COMPLETED
                    : COLORS.TASK.PENDING;
                }

                setSelectedTask({
                  ...selectedTask,
                  progress: progressNum,
                  styles: {
                    backgroundColor: newStyles.backgroundColor,
                    progressColor: newStyles.progressColor,
                    backgroundSelectedColor: newStyles.backgroundSelectedColor,
                    progressSelectedColor: newStyles.progressSelectedColor
                  }
                });
              }

              // También actualizar en el backend
              const progressNum = typeof progress === 'number' ? progress : 0;
              updateElementProgress(task.id.toString(), progressNum)
                .then(success => {
                  if (!success) {
                    console.error('Error al actualizar progreso en el servidor');
                  }
                })
                .catch(error => {
                  console.error('Error al actualizar progreso:', error);
                });
            }}
            onDoubleClick={openTaskDetails}
            onExpanderClick={handleExpanderClick}
            TooltipContent={TooltipContent}
            // Opciones de estilo globales
            rowHeight={50}
            headerHeight={50}
            barCornerRadius={4}
            todayColor="rgba(252, 248, 227, 0.5)"
            projectProgressColor="#8e44ad"
            projectProgressSelectedColor="#6c3483"
            projectBackgroundColor="#bb8fce"
            projectBackgroundSelectedColor="#a569bd"
          />
          <GanttDependencyLines dependencies={filteredTasks.flatMap((t) =>
            Array.isArray(t.dependencies) ? t.dependencies.map((dep) => ({ fromId: dep, toId: t.id })) : []
          )} />
        </div>
      )}

      <Offcanvas show={showDetails} onHide={() => {
        setIsClosing(true);
        setShowDetails(false);
        // Reset isClosing después de un breve delay
        setTimeout(() => {
          setIsClosing(false);
        }, 500);
      }} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            {selectedTask?.type === 'project' ? 'Detalles del Proyecto' :
              selectedTask?.isSubtask === true ? 'Detalles de Subtarea' :
                'Detalles de Tarea'}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {selectedTask && (
            <>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5>{selectedTask.name}</h5>
                <Badge
                  bg={
                    Number(selectedTask.progress) === 100 ? 'success' :
                      Number(selectedTask.progress) > 0 ? 'primary' : 'secondary'
                  }
                >
                  {Number(selectedTask.progress) === 100 ? 'Completado' :
                    Number(selectedTask.progress) > 0 ? 'En Progreso' : 'Pendiente'}
                </Badge>
              </div>

              <Nav variant="tabs" className="mb-3" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'detalles')}>
                <Nav.Item>
                  <Nav.Link eventKey="detalles">Detalles</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="usuarios">
                    Usuarios
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content>
                <Tab.Pane active={activeTab === 'detalles'}>
                  <p><strong>Inicio:</strong> {selectedTask.start instanceof Date ? selectedTask.start.toLocaleDateString() : 'Fecha inválida'}</p>
                  <p><strong>Fin:</strong> {selectedTask.end instanceof Date ? selectedTask.end.toLocaleDateString() : 'Fecha inválida'}</p>
                  <p><strong>Progreso:</strong> {selectedTask.progress || 0}%</p>
                  <ProgressBar now={selectedTask.progress || 0} label={`${selectedTask.progress || 0}%`} className="mb-3" />
                  <p><strong>ID:</strong> {selectedTask.id}</p>
                  {selectedTask.dependencies && (
                    <p><strong>Depende de:</strong> {Array.isArray(selectedTask.dependencies) ? selectedTask.dependencies.join(', ') : 'Ninguna'}</p>
                  )}
                  <p><strong>Tipo:</strong> {selectedTask.isSubtask === true ? 'Subtarea' : selectedTask.type || 'No especificado'}</p>

                  {/* 📍 BOTONES DE ACCIÓN PARA ELIMINACIÓN EN GANTT */}
                  <div className="d-flex gap-2 mb-4 mt-3">
                    {selectedTask.type === 'project' && (
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteProjectGantt(selectedTask.id.toString())}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Eliminar Proyecto
                      </Button>
                    )}
                    
                    {selectedTask.type === 'task' && selectedTask.isSubtask !== true && (
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteTaskGantt(selectedTask.id.toString())}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Eliminar Tarea
                      </Button>
                    )}
                    
                    {selectedTask.isSubtask === true && (
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteSubtaskGantt(selectedTask.id.toString())}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Eliminar Subtarea
                      </Button>
                    )}
                  </div>

                  {/* Botón para marcar como completado */}
                  {!isItemCompleted && (
                    <div className="mb-4 mt-2">
                      <Button variant="success" onClick={handleMarkAsCompleted}>
                        Marcar como Completado
                      </Button>
                    </div>
                  )}

                  {/* Formulario para agregar tareas si seleccionamos un proyecto */}
                  {selectedTask.type === 'project' && (
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
                          <Form.Control
                            type="date"
                            name="fecha_inicio"
                            value={taskForm.fecha_inicio}
                            onChange={(e) => handleInputChange(e, 'task')}
                            min={selectedTask.start instanceof Date ? selectedTask.start.toISOString().split('T')[0] : ''}
                            max={selectedTask.end instanceof Date ? selectedTask.end.toISOString().split('T')[0] : ''}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Fecha de Vencimiento</Form.Label>
                          <Form.Control
                            type="date"
                            name="fecha_vencimiento"
                            value={taskForm.fecha_vencimiento}
                            onChange={(e) => handleInputChange(e, 'task')}
                            min={selectedTask.start instanceof Date ? selectedTask.start.toISOString().split('T')[0] : ''}
                            max={selectedTask.end instanceof Date ? selectedTask.end.toISOString().split('T')[0] : ''}
                          />
                        </Form.Group>
                        <Button variant="success" onClick={handleCreateTask}>Crear Tarea</Button>
                      </Form>
                    </>
                  )}

                  {/* Formulario para agregar subtareas si seleccionamos una tarea regular */}
                  {isRegularTaskSelected && (
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
                          <Form.Control
                            type="date"
                            name="fecha_inicio"
                            value={subtaskForm.fecha_inicio}
                            onChange={(e) => handleInputChange(e, 'subtask')}
                            min={selectedTask.start instanceof Date ? selectedTask.start.toISOString().split('T')[0] : ''}
                            max={selectedTask.end instanceof Date ? selectedTask.end.toISOString().split('T')[0] : ''}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Fecha de Vencimiento</Form.Label>
                          <Form.Control
                            type="date"
                            name="fecha_vencimiento"
                            value={subtaskForm.fecha_vencimiento}
                            onChange={(e) => handleInputChange(e, 'subtask')}
                            min={selectedTask.start instanceof Date ? selectedTask.start.toISOString().split('T')[0] : ''}
                            max={selectedTask.end instanceof Date ? selectedTask.end.toISOString().split('T')[0] : ''}
                          />
                        </Form.Group>
                        <Button variant="success" onClick={handleCreateSubtask}>Crear Subtarea</Button>
                      </Form>
                    </>
                  )}
                </Tab.Pane>
                <Tab.Pane active={activeTab === 'usuarios'}>
                  <UserAssignment
                    itemId={selectedTask.id}
                    itemType={getSelectedItemType()}
                    onUsersUpdated={refreshGanttData}
                  />
                </Tab.Pane>
              </Tab.Content>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default AdvancedGanttChart;