import axios from "axios";
import { Task } from "gantt-task-react";

// Interfaces para usuarios asignados
interface UserResource {
  id: number;
  nombre: string;
  email: string;
  avatar?: string;
}

// Extendemos la interfaz Task para incluir nuestras propiedades personalizadas
interface ExtendedTask extends Task {
  isSubtask?: boolean;
  assignedUsers?: UserResource[];  // Añadimos esta propiedad
}

// Interfaces para tipar los datos de la API
interface Proyecto {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: string; // Añadimos estado para determinar el progreso
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

// Extraer el ID numérico sin prefijos
export const getNumericId = (id: string): string => {
  if (id.includes('project-')) {
    return id.split('project-')[1];
  } else if (id.includes('task-')) {
    return id.split('task-')[1];
  } else if (id.includes('subtask-')) {
    return id.split('subtask-')[1];
  }
  return id;
};

// Función para calcular el progreso basado en el estado
const calculateProgress = (estado?: string): number => {
  if (!estado) return 0;
  
  switch (estado.toLowerCase()) {
    case 'completado':
      return 100;
    case 'en progreso':
      return 50;
    case 'pendiente':
    default:
      return 0;
  }
};

export const fetchGanttData = async (): Promise<ExtendedTask[]> => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("⚠️ No hay token disponible");
    return [];
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-auth-token': token, // Incluimos ambos formatos para compatibilidad
    },
  };

  try {
    const [projectsRes, tasksRes, subtasksRes] = await Promise.all([
      axios.get("http://localhost:5000/api/projects", config),
      axios.get("http://localhost:5000/api/tasks", config),
      axios.get("http://localhost:5000/api/subtasks", config),
    ]);

    const projects: Proyecto[] = projectsRes.data.data || [];
    const tasks: Tarea[] = tasksRes.data.data || [];
    const subtasks: Subtarea[] = subtasksRes.data.data || [];

    console.log("Datos cargados - Proyectos:", projects.length, "Tareas:", tasks.length, "Subtareas:", subtasks.length);

    // Log para depuración - ver los estados de los proyectos
    console.log("Estados de proyectos:", projects.map(p => ({id: p.id, nombre: p.nombre, estado: p.estado})));

    const allGanttTasks: ExtendedTask[] = [];

    // Procesar proyectos
    for (const project of projects) {
      if (!project.fecha_inicio || !project.fecha_fin) continue;

      const start = new Date(project.fecha_inicio);
      const end = new Date(project.fecha_fin);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

      // Intentar obtener usuarios asignados al proyecto
      let projectUsers: UserResource[] = [];
      try {
        const usersRes = await axios.get(`http://localhost:5000/api/projects/${project.id}/users`, config);
        if (usersRes.data.success && usersRes.data.usuarios) {
          projectUsers = usersRes.data.usuarios;
        } else if (usersRes.data.data) {
          projectUsers = usersRes.data.data;
        } else if (Array.isArray(usersRes.data)) {
          projectUsers = usersRes.data;
        }
      } catch (error) {
        console.log(`No se pudieron obtener usuarios del proyecto ${project.id}`);
      }

      // Calcular el progreso basado en el estado del proyecto
      const projectProgress = calculateProgress(project.estado);
      console.log(`Proyecto ${project.id} - ${project.nombre} - Estado: ${project.estado} - Progreso: ${projectProgress}%`);

      allGanttTasks.push({
        id: `project-${project.id}`,
        name: project.nombre,
        start,
        end,
        type: "project",
        progress: projectProgress, // Usar el progreso calculado
        isDisabled: true,
        hideChildren: false,
        isSubtask: false,
        assignedUsers: projectUsers
      });

      const projectTasks = tasks.filter((t: Tarea) => t.id_proyecto === project.id);

      // Procesar tareas del proyecto
      for (const task of projectTasks) {
        if (!task.fecha_inicio || !task.fecha_vencimiento) continue;

        const tStart = new Date(task.fecha_inicio);
        const tEnd = new Date(task.fecha_vencimiento);
        if (isNaN(tStart.getTime()) || isNaN(tEnd.getTime())) continue;

        // Intentar obtener usuarios asignados a la tarea
        let taskUsers: UserResource[] = [];
        try {
          const usersRes = await axios.get(`http://localhost:5000/api/tasks/${task.id}/users`, config);
          if (usersRes.data.success && usersRes.data.usuarios) {
            taskUsers = usersRes.data.usuarios;
          } else if (usersRes.data.data) {
            taskUsers = usersRes.data.data;
          } else if (Array.isArray(usersRes.data)) {
            taskUsers = usersRes.data;
          }
        } catch (error) {
          console.log(`No se pudieron obtener usuarios de la tarea ${task.id}`);
        }

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
          isSubtask: false,
          assignedUsers: taskUsers
        });

        const taskSubtasks = subtasks.filter((s: Subtarea) => s.id_tarea === task.id);

        // Procesar subtareas
        for (const sub of taskSubtasks) {
          // Usar fechas de la subtarea si están disponibles, si no usar las de la tarea padre
          const subStart = sub.fecha_inicio ? new Date(sub.fecha_inicio) : tStart;
          const subEnd = sub.fecha_vencimiento ? new Date(sub.fecha_vencimiento) : tEnd;

          // IMPORTANTE: Usar la ruta directa a subtasks en lugar de la ruta anidada
          let subtaskUsers: UserResource[] = [];
          try {
            // MODIFICACIÓN: Usar la ruta directa a subtareas
            const usersRes = await axios.get(`http://localhost:5000/api/subtasks/${sub.id}/users`, config);
            if (usersRes.data.success && usersRes.data.usuarios) {
              subtaskUsers = usersRes.data.usuarios;
            } else if (usersRes.data.data) {
              subtaskUsers = usersRes.data.data;
            } else if (Array.isArray(usersRes.data)) {
              subtaskUsers = usersRes.data;
            }
          } catch (error) {
            console.log(`No se pudieron obtener usuarios de la subtarea ${sub.id}`);
          }

          allGanttTasks.push({
            id: `subtask-${sub.id}-parent-${task.id}`,
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
            project: `task-${task.id}`,
            dependencies: [`task-${task.id}`],
            isSubtask: true,
            assignedUsers: subtaskUsers
          });
        }
      }
    }

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

// Función para actualizar el progreso de un elemento
export const updateElementProgress = async (
  itemId: string, 
  progress: number
): Promise<boolean> => {
  try {
    const token = localStorage.getItem("token");
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-auth-token': token,
        'Content-Type': 'application/json',
      },
    };
    
    const numericId = getNumericId(itemId);
    let endpoint = '';
    
    if (itemId.includes('project-')) {
      endpoint = `http://localhost:5000/api/projects/${numericId}/progress`;
    } else if (itemId.includes('subtask-')) {
      // Para subtareas, extraer el ID de la tarea padre
      const parts = itemId.split('-parent-');
      if (parts.length > 1) {
        const taskId = parts[1];
        const subtaskId = getNumericId(parts[0]);
        endpoint = `http://localhost:5000/api/tasks/${taskId}/subtasks/${subtaskId}/progress`;
      } else {
        throw new Error('ID de subtarea inválido');
      }
    } else {
      endpoint = `http://localhost:5000/api/tasks/${numericId}/progress`;
    }
    
    // Convertir el progreso al formato que espera tu API
    const estado = progress === 100 
                    ? "completado" 
                    : progress > 0 
                    ? "en progreso" 
                    : "pendiente";
                     
    console.log(`Actualizando progreso de ${itemId} (${numericId}) a ${progress}% (estado: ${estado})`);
    console.log(`Endpoint: ${endpoint}`);
    
    const response = await axios.put(endpoint, { 
      estado,
      porcentaje: progress 
    }, config);
    
    console.log(`Respuesta de actualización:`, response.data);
    
    return response.data.success;
  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    return false;
  }
};