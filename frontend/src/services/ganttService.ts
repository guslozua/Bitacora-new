import axios from "axios";
import { Task } from "gantt-task-react";

// Extendemos la interfaz Task para incluir nuestra propiedad isSubtask
interface ExtendedTask extends Task {
  isSubtask?: boolean;
}

// Interfaces para tipar los datos de la API
interface Proyecto {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface Tarea {
  id: number;
  titulo: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado: "pendiente" | "en progreso" | "completado";
  id_proyecto: number;
}

interface Subtarea {
  id: number;
  titulo: string;
  estado: "pendiente" | "en progreso" | "completado";
  id_tarea: number;
  fecha_inicio?: string;
  fecha_vencimiento?: string;
}

export const fetchGanttData = async (): Promise<ExtendedTask[]> => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("⚠️ No hay token disponible");
    return [];
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const [projectsRes, tasksRes, subtasksRes] = await Promise.all([
      axios.get("http://localhost:5000/api/projects", config),
      axios.get("http://localhost:5000/api/tasks", config),
      axios.get("http://localhost:5000/api/subtasks", config),
    ]);

    const projects: Proyecto[] = projectsRes.data.data;
    const tasks: Tarea[] = tasksRes.data.data;
    const subtasks: Subtarea[] = subtasksRes.data.data;

    console.log("Datos cargados - Proyectos:", projects.length, "Tareas:", tasks.length, "Subtareas:", subtasks.length);

    const allGanttTasks: ExtendedTask[] = [];

    projects.forEach((project: Proyecto) => {
      if (!project.fecha_inicio || !project.fecha_fin) return;

      const start = new Date(project.fecha_inicio);
      const end = new Date(project.fecha_fin);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

      allGanttTasks.push({
        id: `project-${project.id}`,
        name: project.nombre,
        start,
        end,
        type: "project",
        progress: 0,
        isDisabled: true,
        hideChildren: false,
        isSubtask: false,  // Explícitamente marcamos que no es subtarea
      });

      const projectTasks = tasks.filter((t: Tarea) => t.id_proyecto === project.id);

      projectTasks.forEach((task: Tarea) => {
        if (!task.fecha_inicio || !task.fecha_vencimiento) return;

        const tStart = new Date(task.fecha_inicio);
        const tEnd = new Date(task.fecha_vencimiento);
        if (isNaN(tStart.getTime()) || isNaN(tEnd.getTime())) return;

        allGanttTasks.push({
          id: `task-${task.id}`,
          name: task.titulo,
          start: tStart,
          end: tEnd,
          type: "task",
          progress:
            task.estado === "completado"
              ? 100
              : task.estado === "en progreso"
              ? 50
              : 0,
          project: `project-${project.id}`,
          isSubtask: false,  // Explícitamente marcamos que no es subtarea
        });

        const taskSubtasks = subtasks.filter((s: Subtarea) => s.id_tarea === task.id);

        taskSubtasks.forEach((sub: Subtarea) => {
          // Usar fechas de la subtarea si están disponibles, si no usar las de la tarea padre
          const subStart = sub.fecha_inicio ? new Date(sub.fecha_inicio) : tStart;
          const subEnd = sub.fecha_vencimiento ? new Date(sub.fecha_vencimiento) : tEnd;

          allGanttTasks.push({
            id: `subtask-${sub.id}`,
            name: sub.titulo,
            start: subStart,
            end: subEnd,
            type: "task",
            progress:
              sub.estado === "completado"
                ? 100
                : sub.estado === "en progreso"
                ? 50
                : 0,
            project: `project-${project.id}`,
            dependencies: [`task-${task.id}`],
            isSubtask: true,  // Marcamos explícitamente que es una subtarea
          });
        });
      });
    });

    const validTasks = allGanttTasks.filter(
      (t) =>
        t &&
        t.start instanceof Date &&
        !isNaN(t.start.getTime()) &&
        t.end instanceof Date &&
        !isNaN(t.end.getTime()) &&
        typeof t.name === "string"
    );

    console.log("Tareas procesadas para Gantt:", validTasks.length);
    return validTasks;
  } catch (error) {
    console.error("❌ Error al obtener datos del Gantt:", error);
    return [];
  }
};