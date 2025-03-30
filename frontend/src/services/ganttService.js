import axios from "axios";

export const fetchGanttData = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("⚠️ No hay token disponible");
    return [];
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`, // Usa el estándar JWT
    },
  };

  try {
    const [projectsRes, tasksRes, subtasksRes] = await Promise.all([
      axios.get("http://localhost:5000/api/projects", config),
      axios.get("http://localhost:5000/api/tasks", config),
      axios.get("http://localhost:5000/api/subtasks", config),
    ]);

    const projects = projectsRes.data.data;
    const tasks = tasksRes.data.data;
    const subtasks = subtasksRes.data.data;

    const allGanttTasks = [];

    projects.forEach((project) => {
      if (!project.fecha_inicio || !project.fecha_fin) return;

      const start = new Date(project.fecha_inicio);
      const end = new Date(project.fecha_fin);
      if (isNaN(start) || isNaN(end)) return;

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

      const projectTasks = tasks.filter((t) => t.id_proyecto === project.id);

      projectTasks.forEach((task) => {
        if (!task.fecha_inicio || !task.fecha_vencimiento) return;

        const tStart = new Date(task.fecha_inicio);
        const tEnd = new Date(task.fecha_vencimiento);
        if (isNaN(tStart) || isNaN(tEnd)) return;

        allGanttTasks.push({
          id: `task-${task.id}`,
          name: task.titulo,
          start: tStart,
          end: tEnd,
          type: "task",
          progress: task.estado === "completado" ? 100 : task.estado === "en progreso" ? 50 : 0,
          project: `project-${project.id}`,
        });

        const taskSubtasks = subtasks.filter((s) => s.id_tarea === task.id);

        taskSubtasks.forEach((sub) => {
          allGanttTasks.push({
            id: `subtask-${sub.id}`,
            name: sub.titulo,
            start: tStart,
            end: tEnd,
            type: "task",
            progress: sub.estado === "completado" ? 100 : sub.estado === "en progreso" ? 50 : 0,
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
        !isNaN(t.start) &&
        t.end instanceof Date &&
        !isNaN(t.end) &&
        typeof t.name === "string"
    );

    console.log("🧠 Tareas válidas para Gantt:", validTasks);
    return validTasks;
  } catch (error) {
    console.error("❌ Error al obtener datos del Gantt:", error);
    return [];
  }
};
