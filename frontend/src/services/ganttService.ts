import axios from "axios";
import { Task } from "gantt-task-react";

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
}

export const fetchGanttData = async (): Promise<Task[]> => {
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

    const allGanttTasks: Task[] = [];

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
        });

        const taskSubtasks = subtasks.filter((s: Subtarea) => s.id_tarea === task.id);

        taskSubtasks.forEach((sub: Subtarea) => {
          allGanttTasks.push({
            id: `subtask-${sub.id}`,
            name: sub.titulo,
            start: tStart,
            end: tEnd,
            type: "task",
            progress:
              sub.estado === "completado"
                ? 100
                : sub.estado === "en progreso"
                ? 50
                : 0,
            project: `project-${project.id}`,
            dependencies: [`task-${task.id}`],
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

    return validTasks;
  } catch (error) {
    console.error("❌ Error al obtener datos del Gantt:", error);
    return [];
  }
};
