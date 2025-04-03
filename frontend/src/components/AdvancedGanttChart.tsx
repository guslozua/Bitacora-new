import React, { useState, useEffect } from 'react';
import { ViewMode, Gantt, Task } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import 'react-circular-progressbar/dist/styles.css';
import {
  ButtonGroup,
  Button,
  Spinner,
  Offcanvas,
  ProgressBar,
} from 'react-bootstrap';
import Select from 'react-select';
import { createRoot } from 'react-dom/client';

import { fetchGanttData } from '../services/ganttService';
import GanttDependencyLines from './GanttDependencyLines';
import ProgressCircle from './ProgressCircle';

const AdvancedGanttChart = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<ViewMode>(ViewMode.Week);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<string[]>([]);
  const [ganttHeight, setGanttHeight] = useState('600px');

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
        // Ensure each task has valid start and end dates
        const dataFiltrada = data.filter(
          (t: Task) => t && t.start && t.end && t.name
        ).map((task: Task) => ({
          ...task,
          // Ensure dates are Date objects
          start: task.start instanceof Date ? task.start : new Date(task.start),
          end: task.end instanceof Date ? task.end : new Date(task.end),
          // Ensure progress is a number between 0-100
          progress: typeof task.progress === 'number' ? task.progress : 0,
          // Ensure there's always an id
          id: task.id || `task-${Math.random().toString(36).substr(2, 9)}`
        }));
        
        setTasks(dataFiltrada);
      } catch (error) {
        console.error('Error al cargar datos del Gantt:', error);
        setTasks([]); // Set empty array to prevent undefined errors
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, []);

  useEffect(() => {
    // Only run this effect if tasks are loaded and not empty
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

  const handleViewChange = (mode: ViewMode) => setView(mode);

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setShowDetails(true);
  };

  const handleExpanderClick = (task: Task) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, hideChildren: !t.hideChildren } : t
      )
    );
  };

  // Debounce search to prevent rapid filtering while typing
  const [debouncedSearchText, setDebouncedSearchText] = useState(searchText);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300); // 300ms delay
    
    return () => clearTimeout(timer);
  }, [searchText]);

  // Create a safe filtered tasks array with validation
  const getFilteredTasks = (): Task[] => {
    // Ensure tasks is an array
    if (!Array.isArray(tasks)) return [];
    
    return tasks
      .filter((t) => {
        // First ensure the task exists and has necessary properties
        if (!t || !t.name || !t.start || !t.end) return false;
        
        // Then check if it matches the search text
        const coincideTexto = t.name.toLowerCase().includes(debouncedSearchText.toLowerCase());
        
        // Then check if it matches the estado filter
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

  // Only render Gantt if we have valid tasks with dates
  const hasTasks = filteredTasks.length > 0 && filteredTasks.every(task => 
    task && task.start instanceof Date && task.end instanceof Date);

  return (
    <div>
      {/* Filtros y controles alineados horizontalmente */}
      <div
        className="d-flex flex-row align-items-center gap-2 mb-3"
        style={{ flexWrap: 'nowrap', overflowX: 'auto' }}
      >
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
          <Button
            variant={view === ViewMode.Day ? 'primary' : 'outline-primary'}
            onClick={() => handleViewChange(ViewMode.Day)}
          >
            Día
          </Button>
          <Button
            variant={view === ViewMode.Week ? 'primary' : 'outline-primary'}
            onClick={() => handleViewChange(ViewMode.Week)}
          >
            Semana
          </Button>
          <Button
            variant={view === ViewMode.Month ? 'primary' : 'outline-primary'}
            onClick={() => handleViewChange(ViewMode.Month)}
          >
            Mes
          </Button>
        </ButtonGroup>
      </div>

      {/* Gantt */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : !hasTasks ? (
        <div className="text-center py-5">
          <p>No hay tareas disponibles o los datos no son válidos.</p>
        </div>
      ) : (
        <div
          style={{
            position: 'relative',
            height: ganttHeight,
            width: '100%',
            zIndex: 1,
          }}
        >
          <Gantt
            tasks={filteredTasks}
            viewMode={view}
            locale="es"
            listCellWidth="155px"
            barFill={60}
            onDateChange={(task, children) =>
              console.log('Tarea modificada:', task)
            }
            onProgressChange={(task, progress) =>
              console.log('Progreso actualizado:', task, progress)
            }
            onDoubleClick={openTaskDetails}
            onExpanderClick={handleExpanderClick}
          />
          <GanttDependencyLines
            dependencies={filteredTasks
              .map((t) =>
                Array.isArray(t.dependencies)
                  ? t.dependencies.map((dep) => ({
                      fromId: dep,
                      toId: t.id,
                    }))
                  : []
              )
              .flat()}
          />
        </div>
      )}

      {/* Panel de detalles */}
      <Offcanvas
        show={showDetails}
        onHide={() => setShowDetails(false)}
        placement="end"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Detalles de Tarea</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {selectedTask && (
            <>
              <h5>{selectedTask.name}</h5>
              <p>
                <strong>Inicio:</strong>{' '}
                {selectedTask.start instanceof Date 
                  ? selectedTask.start.toLocaleDateString()
                  : 'Fecha inválida'}
              </p>
              <p>
                <strong>Fin:</strong>{' '}
                {selectedTask.end instanceof Date 
                  ? selectedTask.end.toLocaleDateString()
                  : 'Fecha inválida'}
              </p>
              <p>
                <strong>Progreso:</strong> {selectedTask.progress || 0}%
              </p>
              <ProgressBar
                now={selectedTask.progress || 0}
                label={`${selectedTask.progress || 0}%`}
                className="mb-3"
              />
              <p>
                <strong>ID:</strong> {selectedTask.id}
              </p>
              {selectedTask.dependencies && (
                <p>
                  <strong>Depende de:</strong>{' '}
                  {Array.isArray(selectedTask.dependencies) 
                    ? selectedTask.dependencies.join(', ')
                    : 'Ninguna'}
                </p>
              )}
              <p>
                <strong>Tipo:</strong> {selectedTask.type || 'No especificado'}
              </p>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default AdvancedGanttChart;