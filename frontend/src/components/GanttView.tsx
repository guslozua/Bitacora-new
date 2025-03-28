import React, { useEffect, useState } from 'react';
import { FrappeGantt, Task, ViewMode } from 'frappe-gantt-react';
import { Card, Button } from 'react-bootstrap';
import axios from 'axios';
import '../App.css';

interface Proyecto {
  id: number;
  nombre: string;
  description?: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface Tarea {
  id: number;
  titulo: string;
  descripcion?: string;
  estado: string;
  prioridad: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  id_proyecto: number;
}

interface Subtarea {
  id: number;
  titulo: string;
  estado: string;
  id_tarea: number;
}

interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
  custom_class: string;
  project?: string;
}

const GanttView = () => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [subtareas, setSubtareas] = useState<Subtarea[]>([]);
  const [soloActivos, setSoloActivos] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'x-auth-token': token };

        const [proyectosRes, tareasRes, subtareasRes] = await Promise.all([
          axios.get('http://localhost:5000/api/projects', { headers }),
          axios.get('http://localhost:5000/api/tasks', { headers }),
          axios.get('http://localhost:5000/api/subtasks', { headers }),
        ]);

        setProyectos(proyectosRes.data.data || []);
        setTareas(tareasRes.data.data || []);
        setSubtareas(subtareasRes.data.data || []);
      } catch (error) {
        console.error('Error al obtener datos:', error);
      }
    };

    fetchData();
  }, []);

  const createGanttTask = (task: Partial<GanttTask>): Task => {
    return Object.assign(Object.create({
      _dependencies: [],
      setDependencies: () => {},
    }), task);
  };

  const calculateTaskProgress = (estado: string): number => {
    switch (estado?.toLowerCase()) {
      case 'completado': return 100;
      case 'en progreso': return 50;
      case 'pendiente': return 25;
      default: return 0;
    }
  };

  const getFechaSegura = (fecha?: string): string => {
    if (!fecha) return new Date().toISOString().split('T')[0];
    return fecha.split('T')[0];
  };

  const mapToGantt = (): Task[] => {
    const proyectosFiltrados = soloActivos 
      ? proyectos.filter(p => p.estado?.toLowerCase() === 'activo') 
      : proyectos;

    const proyectosGantt: Task[] = proyectosFiltrados.map(proyecto => {
      const proyectoTareas = tareas.filter(t => t.id_proyecto === proyecto.id);
      const proyectoProgress = proyectoTareas.length > 0 
        ? proyectoTareas.reduce((acc, tarea) => acc + calculateTaskProgress(tarea.estado), 0) / proyectoTareas.length
        : 0;

      return createGanttTask({
        id: `proyecto-${proyecto.id}`,
        name: `📁 ${proyecto.nombre}`,
        start: getFechaSegura(proyecto.fecha_inicio),
        end: getFechaSegura(proyecto.fecha_fin),
        progress: proyectoProgress,
        dependencies: '',
        custom_class: 'gantt-proyecto',
      });
    });

    const tareasGantt: Task[] = tareas
      .filter(t => t.fecha_inicio && t.fecha_vencimiento && t.id_proyecto !== undefined)
      .map(t => {
        const tareaSubtareas = subtareas.filter(s => s.id_tarea === t.id);
        const tareaProgress = tareaSubtareas.length > 0
          ? tareaSubtareas.reduce((acc, s) => acc + calculateTaskProgress(s.estado), 0) / tareaSubtareas.length
          : calculateTaskProgress(t.estado);

        return createGanttTask({
          id: `tarea-${t.id}`,
          name: ` 📝 ${t.titulo}`,
          start: getFechaSegura(t.fecha_inicio),
          end: getFechaSegura(t.fecha_vencimiento),
          progress: tareaProgress,
          dependencies: `proyecto-${t.id_proyecto}`,
          custom_class: `gantt-tarea prioridad-${t.prioridad.toLowerCase()} estado-${t.estado.replace(' ', '_').toLowerCase()}`,
          project: `proyecto-${t.id_proyecto}`,
        });
      });

    const subtareasGantt: Task[] = subtareas
      .map(sub => {
        const tarea = tareas.find(t => t.id === sub.id_tarea);
        if (!tarea) return null;

        return createGanttTask({
          id: `subtarea-${sub.id}`,
          name: `  ↳ ${sub.titulo}`,
          start: getFechaSegura(tarea.fecha_inicio),
          end: getFechaSegura(tarea.fecha_vencimiento),
          progress: calculateTaskProgress(sub.estado),
          dependencies: `tarea-${tarea.id}`,
          custom_class: `gantt-subtarea estado-${sub.estado.replace(' ', '_').toLowerCase()}`,
          project: `tarea-${tarea.id}`,
        });
      })
      .filter((task): task is Task => task !== null);

    return [...proyectosGantt, ...tareasGantt, ...subtareasGantt];
  };

  const viewModes = [
    { mode: ViewMode.Day, label: 'Día' },
    { mode: ViewMode.Week, label: 'Semana' },
    { mode: ViewMode.Month, label: 'Mes' },
  ];

  return (
    <Card className="mt-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <span><i className="bi bi-bar-chart me-2"></i> Vista Gantt de Proyectos</span>
          <Button
            variant="outline-primary"
            size="sm"
            className="ms-2"
            onClick={() => setSoloActivos(!soloActivos)}
          >
            {soloActivos ? 'Ver Todos' : 'Solo Activos'}
          </Button>
        </div>
        <div>
          {viewModes.map(({ mode, label }) => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'primary' : 'outline-secondary'}
              size="sm"
              className="me-1"
              onClick={() => setViewMode(mode)}
            >
              {label}
            </Button>
          ))}
        </div>
      </Card.Header>
      <Card.Body style={{ overflowX: 'auto', height: '600px' }}>
        {mapToGantt().length === 0 ? (
          <p>No hay tareas con fechas válidas para mostrar.</p>
        ) : (
          <FrappeGantt
            tasks={mapToGantt()}
            viewMode={viewMode}
            onClick={(task: any) => console.log('Tarea clickeada:', task)}
          />
        )}
      </Card.Body>
    </Card>
  );
};

export default GanttView;
