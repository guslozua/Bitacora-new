// components/KanbanBoard.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Spinner, Button, Form, Row, Col } from 'react-bootstrap';
import UserAvatars from './UserAvatars';
import KanbanLegend from './KanbanLegend';

// Interfaces para los datos
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
  label: string; // Tipo (project, task, subtask)
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

// Estructura para mantener las relaciones
interface EntityMap {
  [key: string]: {
    tasks?: string[];
    subtasks?: string[];
    card?: Card;
  };
}

const KanbanBoard: React.FC = () => {
  const [data, setData] = useState<KanbanData>({ lanes: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'project' | 'task' | 'subtask'>('all');
  
  // Mapas para mantener relaciones
  const [projectMap, setProjectMap] = useState<EntityMap>({});
  const [taskMap, setTaskMap] = useState<EntityMap>({});
  
  // Colores para los diferentes tipos de elementos
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

  // Función para filtrar tarjetas
  const filterCards = useCallback((cards: Card[]): Card[] => {
    return cards.filter(card => {
      // Filtro por texto
      const textMatch = filterText === '' || 
        card.title.toLowerCase().includes(filterText.toLowerCase()) ||
        (card.description && card.description.toLowerCase().includes(filterText.toLowerCase()));

      // Filtro por prioridad
      const priorityMatch = filterPriority === null || 
        card.metadata.priority?.toLowerCase() === filterPriority.toLowerCase();

      // Filtro por tipo
      const typeMatch = filterType === 'all' || 
        card.metadata.type === filterType;

      return textMatch && priorityMatch && typeMatch;
    });
  }, [filterText, filterPriority, filterType]);

  // Obtener color según prioridad
  const getPriorityColor = useCallback((prioridad?: string): string => {
    switch (prioridad?.toLowerCase()) {
      case 'alta':
        return '#e74c3c';
      case 'media':
        return '#f39c12';
      case 'baja':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  }, []);

  // Calcular porcentaje de progreso basado en estado
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token || '' },
      };

      // Obtener proyectos, tareas y subtareas en paralelo
      const [projectsRes, tasksRes, subtasksRes] = await Promise.all([
        axios.get('http://localhost:5000/api/projects', config),
        axios.get('http://localhost:5000/api/tasks', config),
        axios.get('http://localhost:5000/api/subtasks', config),
      ]);

      const projects = projectsRes.data?.data || [];
      const tasks = tasksRes.data?.data || [];
      const subtasks = subtasksRes.data?.data || [];

      console.log('Datos cargados:', { 
        projects: projects.length, 
        tasks: tasks.length, 
        subtasks: subtasks.length 
      });

      // Organizar los datos por estado para las columnas del Kanban
      const pendientes: Card[] = [];
      const enProgreso: Card[] = [];
      const completados: Card[] = [];

      // Inicializar mapas para relaciones
      const newProjectMap: EntityMap = {};
      const newTaskMap: EntityMap = {};

      // Paso 1: Procesar proyectos primero
      projects.forEach((project: any) => {
        const estado = project.estado?.toLowerCase() || 'pendiente';
        
        const card: Card = {
          id: `project-${project.id}`,
          title: project.nombre,
          description: project.descripcion || '',
          label: 'Proyecto',
          draggable: true,
          tags: [{ title: 'Proyecto', color: '#8e44ad' }],
          metadata: {
            type: 'project',
            entityId: project.id.toString(),
            startDate: project.fecha_inicio,
            endDate: project.fecha_fin,
            progress: calculateProgress(estado)
          }
        };

        // Guardar en el mapa con un array vacío de tareas
        newProjectMap[`project-${project.id}`] = {
          tasks: [],
          card: card
        };

        // Asignar a la columna correcta
        if (estado === 'completado' || estado === 'finalizado') {
          completados.push(card);
        } else if (estado === 'en progreso') {
          enProgreso.push(card);
        } else { // pendiente, activo, etc.
          pendientes.push(card);
        }
      });
      
      // Paso 2: Procesar tareas
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

        // Guardar en el mapa con un array vacío de subtareas
        newTaskMap[`task-${task.id}`] = {
          subtasks: [],
          card: card
        };
        
        // Asociar con el proyecto padre si existe
        if (task.id_proyecto) {
          const projectKey = `project-${task.id_proyecto}`;
          if (newProjectMap[projectKey]) {
            // Asegurarse de que tasks existe como array
            if (!newProjectMap[projectKey].tasks) {
              newProjectMap[projectKey].tasks = [];
            }
            // Usar aserción para evitar error de compilación
            (newProjectMap[projectKey].tasks as string[]).push(`task-${task.id}`);
          }
        }
        
        // Asignar a la columna correcta solo si no tiene proyecto padre
        const hasParent = task.id_proyecto && newProjectMap[`project-${task.id_proyecto}`];
        
        if (!hasParent) {
          if (estado === 'completado' || estado === 'finalizado' || estado === 'completada' || estado === 'finalizada') {
            completados.push(card);
          } else if (estado === 'en progreso') {
            enProgreso.push(card);
          } else {
            pendientes.push(card);
          }
        }
      });
      
      // Paso 3: Procesar subtareas
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
        
        // Guardar en el mapa
        newTaskMap[`subtask-${subtask.id}`] = {
          card: card
        };
        
        // Asociar con la tarea padre si existe
        if (subtask.id_tarea) {
          const taskKey = `task-${subtask.id_tarea}`;
          if (newTaskMap[taskKey]) {
            // Asegurarse de que subtasks existe como array
            if (!newTaskMap[taskKey].subtasks) {
              newTaskMap[taskKey].subtasks = [];
            }
            // Usar aserción para evitar error de compilación
            (newTaskMap[taskKey].subtasks as string[]).push(`subtask-${subtask.id}`);
          }
        }
        
        // Asignar a la columna correcta solo si no tiene tarea padre
        const hasParent = subtask.id_tarea && newTaskMap[`task-${subtask.id_tarea}`];
        
        if (!hasParent) {
          if (estado === 'completado' || estado === 'finalizado' || estado === 'completada' || estado === 'finalizada') {
            completados.push(card);
          } else if (estado === 'en progreso') {
            enProgreso.push(card);
          } else {
            pendientes.push(card);
          }
        }
      });

      // Log para depuración
      console.log('ProjectMap:', Object.keys(newProjectMap).length, 'proyectos');
      console.log('TaskMap:', Object.keys(newTaskMap).length, 'tareas y subtareas');
      
      // Verificar las subtareas en la primera tarea (si existe)
      const firstTaskKey = Object.keys(newTaskMap).find(key => key.startsWith('task-'));
      if (firstTaskKey) {
        console.log(
          'Subtareas en la primera tarea:',
          newTaskMap[firstTaskKey].subtasks?.length || 0,
          newTaskMap[firstTaskKey].subtasks
        );
      }
      
      // Actualizar los mapas de estado
      setProjectMap(newProjectMap);
      setTaskMap(newTaskMap);

      // Aplicar filtros al crear el objeto KanbanData
      const filteredPendientes = filterCards(pendientes);
      const filteredEnProgreso = filterCards(enProgreso);
      const filteredCompletados = filterCards(completados);

      // Crear los carriles del tablero Kanban
      const kanbanData: KanbanData = {
        lanes: [
          {
            id: 'pendiente',
            title: 'Pendiente',
            label: `${filteredPendientes.length}`,
            cards: filteredPendientes,
            style: { 
              width: 280,
              backgroundColor: '#f8f9fa',
              color: '#212529'
            }
          },
          {
            id: 'en-progreso',
            title: 'En Progreso',
            label: `${filteredEnProgreso.length}`,
            cards: filteredEnProgreso,
            style: { 
              width: 280,
              backgroundColor: '#e9f2fd',
              color: '#0d6efd'
            }
          },
          {
            id: 'completado',
            title: 'Completado',
            label: `${filteredCompletados.length}`,
            cards: filteredCompletados,
            style: { 
              width: 280,
              backgroundColor: '#e8f6ef',
              color: '#198754'
            }
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

  // Manejar movimiento de tarjetas entre carriles (cambio de estado)
  const updateCardStatus = async (cardId: string, sourceLaneId: string, targetLaneId: string) => {
    try {
      // Si es la misma columna, no hacer nada
      if (sourceLaneId === targetLaneId) return;

      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json',
        },
      };

      // Extraer tipo e ID de la entidad
      const [type, id] = cardId.split('-');
      
      // En caso de subtareas, extraer solo el ID numérico (sin el parent)
      const numericId = id.includes('-parent-') ? id.split('-parent-')[0] : id;
      
      let apiUrl = '';
      let newStatus = '';

      // Mapear el ID del carril a un estado
      switch (targetLaneId) {
        case 'pendiente':
          newStatus = 'pendiente';
          break;
        case 'en-progreso':
          newStatus = 'en progreso';
          break;
        case 'completado':
          newStatus = 'completado';
          break;
        default:
          newStatus = 'pendiente';
      }

      // Determinar la URL de la API según el tipo
      if (type === 'project') {
        apiUrl = `http://localhost:5000/api/projects/${numericId}`;
      } else if (type === 'task') {
        apiUrl = `http://localhost:5000/api/tasks/${numericId}`;
      } else if (type === 'subtask') {
        apiUrl = `http://localhost:5000/api/subtasks/${numericId}`;
      }

      // Mostrar indicador de carga
      setLoading(true);

      // Enviar solicitud a la API
      const response = await axios.put(
        apiUrl, 
        { estado: newStatus }, 
        config
      );

      if (response.data.success) {
        console.log(`Estado actualizado para ${type} ${numericId} a ${newStatus}`);
        
        // Recargar todos los datos para asegurar consistencia
        await fetchData();
      } else {
        console.error('Error al actualizar estado:', response.data.message);
        setError(`Error al actualizar estado: ${response.data.message}`);
        fetchData();
      }
    } catch (error: any) {
      console.error('Error al mover tarjeta:', error);
      setError(`Error al mover tarjeta: ${error.message || 'Error desconocido'}`);
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  // Componente para renderizar tareas con subtareas
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
      <div 
        key={taskId}
        style={{ 
          backgroundColor: taskCard.metadata.progress === 100 
            ? cardColors.task.completed 
            : taskCard.metadata.progress && taskCard.metadata.progress > 0 
              ? cardColors.task.inProgress 
              : cardColors.task.pending,
          padding: '8px',
          borderRadius: '4px',
          marginBottom: '8px'
        }}
      >
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center'
          }}>
            {taskCard.title}
            {hasSubtasks && (
              <span 
                style={{
                  cursor: 'pointer',
                  fontSize: '10px',
                  padding: '1px 4px',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderRadius: '3px',
                  marginLeft: '5px'
                }}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? '▼' : '▶'} {subtaskIds.length} subtarea{subtaskIds.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {taskCard.metadata.priority && (
            <span style={{ 
              backgroundColor: getPriorityColor(taskCard.metadata.priority),
              color: 'white',
              padding: '1px 4px',
              borderRadius: '3px',
              fontSize: '9px'
            }}>
              {taskCard.metadata.priority}
            </span>
          )}
        </div>
        
        {expanded && hasSubtasks && (
          <div style={{ 
            marginTop: '8px',
            paddingLeft: '10px',
            borderLeft: '2px solid rgba(0,0,0,0.1)'
          }}>
            {subtaskIds.map((subtaskId: string) => {
              const subtaskCard = taskMap[subtaskId]?.card;
              if (!subtaskCard) return null;
              
              return (
                <div 
                  key={subtaskId}
                  style={{ 
                    backgroundColor: subtaskCard.metadata.progress === 100 
                      ? cardColors.subtask.completed 
                      : subtaskCard.metadata.progress && subtaskCard.metadata.progress > 0 
                        ? cardColors.subtask.inProgress 
                        : cardColors.subtask.pending,
                    padding: '5px',
                    borderRadius: '3px',
                    marginBottom: '5px',
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>{subtaskCard.title}</div>
                  {subtaskCard.metadata.priority && (
                    <span style={{ 
                      backgroundColor: getPriorityColor(subtaskCard.metadata.priority),
                      color: 'white',
                      padding: '0px 3px',
                      borderRadius: '2px',
                      fontSize: '8px'
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

  // Componente para lista de subtareas
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
            <div 
              key={subtaskId}
              style={{ 
                backgroundColor: subtaskCard.metadata.progress === 100 
                  ? cardColors.subtask.completed 
                  : subtaskCard.metadata.progress && subtaskCard.metadata.progress > 0 
                    ? cardColors.subtask.inProgress 
                    : cardColors.subtask.pending,
                padding: '6px',
                borderRadius: '3px',
                marginBottom: '5px',
                fontSize: '11px',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <div>{subtaskCard.title}</div>
              {subtaskCard.metadata.priority && (
                <span style={{ 
                  backgroundColor: getPriorityColor(subtaskCard.metadata.priority),
                  color: 'white',
                  padding: '0px 3px',
                  borderRadius: '2px',
                  fontSize: '8px'
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

  // Componente personalizado para las tarjetas del Kanban
  const CustomCard = React.memo(({ id, title, description, metadata, tags }: any) => {
    const [expanded, setExpanded] = useState(false);
    
    // Determinar si tiene hijos
    const hasChildren = 
      (metadata.type === 'project' && projectMap[id]?.tasks && (projectMap[id]?.tasks as string[])?.length > 0) || 
      (metadata.type === 'task' && taskMap[id]?.subtasks && (taskMap[id]?.subtasks as string[])?.length > 0);
    
    // Si es una tarjeta anidada (tarea o subtarea con padre), no mostrarla en el nivel principal
    if (
      (metadata.type === 'task' && metadata.parentId && 
       projectMap && (projectMap[`project-${metadata.parentId}`] as any)) ||
      (metadata.type === 'subtask' && metadata.parentId && 
       taskMap && (taskMap[`task-${metadata.parentId}`] as any))
    ) {
      return null;
    }
    
    // Determinar estilo basado en tipo y progreso
    const type = metadata.type as 'project' | 'task' | 'subtask';
    let backgroundColor;
    
    if (metadata.progress === 100) {
      backgroundColor = cardColors[type].completed;
    } else if (metadata.progress && metadata.progress > 0) {
      backgroundColor = cardColors[type].inProgress;
    } else {
      backgroundColor = cardColors[type].pending;
    }

    // Color del texto basado en el fondo (blanco para fondos oscuros)
    const textColor = type === 'project' ? 'white' : 'black';
    
    return (
      <div 
        style={{ 
          backgroundColor,
          padding: '10px',
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          marginBottom: '10px',
          color: textColor
        }} 
        data-task-id={id}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '5px'
        }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: '5px',
            display: 'flex',
            alignItems: 'center' 
          }}>
            {title}
            {hasChildren && (
              <span 
                style={{
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px 6px',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  marginLeft: '5px'
                }}
                onClick={() => setExpanded(!expanded)}
              >
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
              <span 
                key={index}
                style={{ 
                  backgroundColor: tag.color,
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  marginRight: '4px'
                }}
              >
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
          <UserAvatars 
            itemId={metadata.entityId} 
            itemType={metadata.type} 
            maxDisplay={2} 
            size="sm" 
          />
        </div>
        
        {expanded && hasChildren && (
          <div style={{ 
            marginTop: '10px',
            borderTop: '1px solid rgba(0,0,0,0.1)',
            paddingTop: '10px'
          }}>
            {metadata.type === 'project' && projectMap[id]?.tasks && (
              <div className="project-tasks">
                {(projectMap[id]?.tasks || []).map((taskId: string) => {
                  const taskCardObj = taskMap[taskId]?.card;
                  if (!taskCardObj) return null;
                  
                  return (
                    <TaskWithSubtasks 
                      key={taskId}
                      taskId={taskId}
                      taskCard={taskCardObj}
                      taskMap={taskMap}
                      cardColors={cardColors}
                      getPriorityColor={getPriorityColor}
                    />
                  );
                })}
              </div>
            )}
            
            {metadata.type === 'task' && taskMap[id]?.subtasks && (
              <SubtasksList 
                subtaskIds={taskMap[id]?.subtasks || []}
                taskMap={taskMap}
                cardColors={cardColors}
                getPriorityColor={getPriorityColor}
              />
            )}
          </div>
        )}
      </div>
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
        <Button variant="outline-primary" onClick={fetchData}>
          Intentar nuevamente
        </Button>
      </div>
    );
  }
  
  // Función auxiliar para filtrado (mantenemos esta parte si se usa en otro lugar)
  const safeFilter = (obj: Record<string, any> | undefined, predicate: (key: string) => boolean): number => {
    if (!obj) return 0;
    return Object.keys(obj).filter(key => key && predicate(key)).length;
  };
  
  return (
    <div className="kanban-board-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Tablero Kanban</h5>
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={fetchData}
          className="d-flex align-items-center"
        >
          <i className="bi bi-arrow-clockwise me-1"></i> Actualizar
        </Button>
      </div>
      
      <KanbanLegend />
      {/* Se ha eliminado el componente debugInfo */}
      
      <div className="filter-controls mb-3">
        <Row>
          <Col md={4}>
            <Form.Control
              type="text"
              placeholder="Buscar..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="mb-2"
            />
          </Col>
          <Col md={3}>
            <Form.Select 
              value={filterPriority || ''}
              onChange={e => setFilterPriority(e.target.value || null)}
              className="mb-2"
            >
              <option value="">Todas las prioridades</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="mb-2"
            >
              <option value="all">Todos los tipos</option>
              <option value="project">Proyectos</option>
              <option value="task">Tareas</option>
              <option value="subtask">Subtareas</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Button 
              variant="outline-secondary" 
              onClick={() => {
                setFilterText('');
                setFilterPriority(null);
                setFilterType('all');
              }}
              className="w-100 mb-2"
            >
              Limpiar
            </Button>
          </Col>
        </Row>
      </div>
      
      <div 
        style={{ 
          height: 'auto',
          minHeight: '600px', 
          overflowX: 'auto',
          paddingBottom: '20px' 
        }}
        className="kanban-board-wrapper"
      >
        <div 
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '16px',
            height: 'auto',
            minHeight: '600px',
            width: '100%'
          }}
        >
          {data.lanes.map((lane) => (
            <div 
              key={lane.id} 
              className="custom-lane"
              style={{
                flex: '1 1 0', // Distribución equitativa del espacio
                minWidth: '300px', // Ancho mínimo para cada columna
                backgroundColor: lane.style?.backgroundColor || '#f8f9fa',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                height: 'auto',
                margin: '0'
              }}
            >
              <div 
                className="lane-header"
                style={{
                  padding: '10px 15px',
                  borderBottom: '1px solid rgba(0,0,0,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: lane.style?.color || '#212529',
                  fontWeight: 'bold'
                }}
              >
                <div>{lane.title}</div>
                <div className="lane-count">{lane.label}</div>
              </div>
              <div 
                className="lane-cards"
                style={{
                  padding: '10px',
                  height: 'auto'
                }}
              >
                {lane.cards.map((card) => (
                  <CustomCard 
                    key={card.id} 
                    id={card.id} 
                    title={card.title} 
                    description={card.description} 
                    metadata={card.metadata} 
                    tags={card.tags} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;