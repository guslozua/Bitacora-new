import React, { useState, useEffect } from 'react';
import { ViewMode, Gantt, Task } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import 'react-circular-progressbar/dist/styles.css';
import { ButtonGroup, Button, Spinner, Offcanvas, ProgressBar, Form } from 'react-bootstrap';
import Select from 'react-select';
import { createRoot } from 'react-dom/client';
import { fetchGanttData } from '../services/ganttService';
import GanttDependencyLines from './GanttDependencyLines';
import ProgressCircle from './ProgressCircle';
import axios from 'axios';

// Extendemos la interfaz Task para incluir un campo personalizado
interface ExtendedTask extends Task {
  isSubtask?: boolean; // Usamos un campo booleano en lugar de un valor de tipo
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
        const dataFiltrada = data.filter(
          (t: ExtendedTask) => t && t.start && t.end && t.name
        ).map((task: ExtendedTask) => ({
          ...task,
          start: task.start instanceof Date ? task.start : new Date(task.start),
          end: task.end instanceof Date ? task.end : new Date(task.end),
          progress: typeof task.progress === 'number' ? task.progress : 0,
          id: task.id || `task-${Math.random().toString(36).substr(2, 9)}`,
          // Aseguramos que el campo isSubtask esté definido
          isSubtask: task.isSubtask || false
        }));

        console.log('Datos filtrados y procesados:', dataFiltrada);
        setTasks(dataFiltrada);
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
    if (tasks.length === 0) return;

    const bars = document.querySelectorAll('.bar-wrapper');
    bars.forEach((bar: any) => {
      const label = bar.querySelector('.bar-label');
      if (label && label.innerText) {
        const taskName = label.innerText;
        const match = tasks.find((t) => t.name === taskName);
        if (match) {
          bar.setAttribute('data-task-id', match.id);
        }
      }
    });

    const rows = document.querySelectorAll('.task-list .task-list-item');
    rows.forEach((row) => {
      const taskNameEl = row.querySelector('.task-list-name');
      if (taskNameEl) {
        const taskName = taskNameEl.textContent?.trim();
        const task = tasks.find((t) => t.name === taskName);
        if (task) {
          const wrapper = document.createElement('div');
          wrapper.style.display = 'flex';
          wrapper.style.alignItems = 'center';
          wrapper.style.justifyContent = 'space-between';

          const nameSpan = document.createElement('span');
          nameSpan.textContent = taskName ?? '';

          const circle = document.createElement('div');
          const root = document.createElement('div');
          circle.style.width = '40px';
          circle.style.height = '40px';
          circle.appendChild(root);

          wrapper.appendChild(nameSpan);
          wrapper.appendChild(circle);

          taskNameEl.innerHTML = '';
          taskNameEl.appendChild(wrapper);

          createRoot(root).render(
            <ProgressCircle value={task.progress || 0} size={40} />
          );
        }
      }
    });
  }, [tasks, view]);

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

  useEffect(() => {
    // Si se selecciona una tarea o un proyecto, inicializar los formularios con sus fechas
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

  const handleViewChange = (mode: ViewMode) => setView(mode);

  const openTaskDetails = (task: ExtendedTask) => {
    console.log('Tarea seleccionada:', {
      id: task.id,
      type: task.type,
      isSubtask: task.isSubtask,
      name: task.name
    });
    
    setSelectedTask(task);
    setShowDetails(true);
    
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
      
      console.log("ID de proyecto original:", selectedTask.id);
      console.log("ID de proyecto enviado al API:", projectId);
      
      const newTask = {
        titulo: taskForm.titulo,
        descripcion: taskForm.descripcion,
        estado: 'pendiente',
        prioridad: taskForm.prioridad,
        fecha_inicio: taskForm.fecha_inicio,
        fecha_vencimiento: taskForm.fecha_vencimiento,
        id_proyecto: projectId, // Usar solo el ID numérico
      };

      const response = await axios.post('http://localhost:5000/api/tasks', newTask, config);
      if (response.data.success) {
        alert(`✅ Tarea creada con éxito con ID: ${response.data.id}`);
        setTaskForm({ titulo: '', descripcion: '', prioridad: 'media', fecha_inicio: '', fecha_vencimiento: '' });
        setShowDetails(false);
        
        // Actualizar datos en lugar de recargar la página
        const getData = async () => {
          setLoading(true);
          try {
            const data = await fetchGanttData();
            const dataFiltrada = data.filter(
              (t: ExtendedTask) => t && t.start && t.end && t.name
            ).map((task: ExtendedTask) => ({
              ...task,
              start: task.start instanceof Date ? task.start : new Date(task.start),
              end: task.end instanceof Date ? task.end : new Date(task.end),
              progress: typeof task.progress === 'number' ? task.progress : 0,
              id: task.id || `task-${Math.random().toString(36).substr(2, 9)}`,
              isSubtask: task.isSubtask || false
            }));

            setTasks(dataFiltrada);
          } catch (error) {
            console.error('Error al actualizar datos del Gantt:', error);
          } finally {
            setLoading(false);
          }
        };
        getData();
      } else {
        alert(`❌ No se pudo crear la tarea: ${response.data.message || 'Error desconocido'}`);
      }
    } catch (error: any) {
      console.error('Error al crear tarea:', error.response?.data || error.message);
      alert(`Error al crear la tarea: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleCreateSubtask = async () => {
    if (!selectedTask) return;

    console.log("Datos de tarea seleccionada para crear subtarea:", {
      id: selectedTask.id,
      type: selectedTask.type,
      isSubtask: selectedTask.isSubtask,
      name: selectedTask.name
    });

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
      
      console.log("ID de tarea original:", selectedTask.id);
      console.log("ID de tarea enviado al API:", taskId);
      
      const newSubtask = {
        titulo: subtaskForm.titulo,
        descripcion: subtaskForm.descripcion,
        estado: 'pendiente',
        prioridad: subtaskForm.prioridad,
        fecha_inicio: subtaskForm.fecha_inicio,
        fecha_vencimiento: subtaskForm.fecha_vencimiento,
      };

      const response = await axios.post(`http://localhost:5000/api/tasks/${taskId}/subtasks`, newSubtask, config);
      if (response.data.success) {
        alert(`✅ Subtarea creada con éxito con ID: ${response.data.id}`);
        setSubtaskForm({ titulo: '', descripcion: '', prioridad: 'media', fecha_inicio: '', fecha_vencimiento: '' });
        setShowDetails(false);
        
        // Actualizar datos en lugar de recargar la página
        const getData = async () => {
          setLoading(true);
          try {
            const data = await fetchGanttData();
            const dataFiltrada = data.filter(
              (t: ExtendedTask) => t && t.start && t.end && t.name
            ).map((task: ExtendedTask) => ({
              ...task,
              start: task.start instanceof Date ? task.start : new Date(task.start),
              end: task.end instanceof Date ? task.end : new Date(task.end),
              progress: typeof task.progress === 'number' ? task.progress : 0,
              id: task.id || `task-${Math.random().toString(36).substr(2, 9)}`,
              isSubtask: task.isSubtask || false
            }));

            setTasks(dataFiltrada);
          } catch (error) {
            console.error('Error al actualizar datos del Gantt:', error);
          } finally {
            setLoading(false);
          }
        };
        getData();
      } else {
        alert(`❌ No se pudo crear la subtarea: ${response.data.message || 'Error desconocido'}`);
      }
    } catch (error: any) {
      console.error('Error al crear subtarea:', error.response?.data || error.message);
      alert(`Error al crear la subtarea: ${error.response?.data?.message || error.message}`);
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

  return (
    <div>
      <div className="d-flex flex-row align-items-center gap-2 mb-3" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Buscar tarea..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: '200px', flexShrink: 0 }}
        />
        <div style={{ width: '220px', flexShrink: 0 }}>
          <Select
            isMulti
            options={opcionesEstado}
            classNamePrefix="select"
            placeholder="Filtrar por estado..."
            onChange={(selected) => setEstadoFiltro(selected.map(opt => opt.value))}
            value={opcionesEstado.filter(opt => estadoFiltro.includes(opt.value))}
          />
        </div>
        <ButtonGroup style={{ flexShrink: 0 }}>
          <Button variant={view === ViewMode.Day ? 'primary' : 'outline-primary'} onClick={() => handleViewChange(ViewMode.Day)}>Día</Button>
          <Button variant={view === ViewMode.Week ? 'primary' : 'outline-primary'} onClick={() => handleViewChange(ViewMode.Week)}>Semana</Button>
          <Button variant={view === ViewMode.Month ? 'primary' : 'outline-primary'} onClick={() => handleViewChange(ViewMode.Month)}>Mes</Button>
        </ButtonGroup>
      </div>

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
            listCellWidth="155px"
            barFill={60}
            onDateChange={(task, children) => console.log('Tarea modificada:', task)}
            onProgressChange={(task, progress) => console.log('Progreso actualizado:', task, progress)}
            onDoubleClick={openTaskDetails}
            onExpanderClick={handleExpanderClick}
          />
          <GanttDependencyLines dependencies={filteredTasks.flatMap((t) => Array.isArray(t.dependencies) ? t.dependencies.map((dep) => ({ fromId: dep, toId: t.id })) : [])} />
        </div>
      )}

      <Offcanvas show={showDetails} onHide={() => setShowDetails(false)} placement="end">
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
              <h5>{selectedTask.name}</h5>
              <p><strong>Inicio:</strong> {selectedTask.start instanceof Date ? selectedTask.start.toLocaleDateString() : 'Fecha inválida'}</p>
              <p><strong>Fin:</strong> {selectedTask.end instanceof Date ? selectedTask.end.toLocaleDateString() : 'Fecha inválida'}</p>
              <p><strong>Progreso:</strong> {selectedTask.progress || 0}%</p>
              <ProgressBar now={selectedTask.progress || 0} label={`${selectedTask.progress || 0}%`} className="mb-3" />
              <p><strong>ID:</strong> {selectedTask.id}</p>
              {selectedTask.dependencies && (
                <p><strong>Depende de:</strong> {Array.isArray(selectedTask.dependencies) ? selectedTask.dependencies.join(', ') : 'Ninguna'}</p>
              )}
              <p><strong>Tipo:</strong> {selectedTask.isSubtask === true ? 'Subtarea' : selectedTask.type || 'No especificado'}</p>

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
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default AdvancedGanttChart;