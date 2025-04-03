import React, { useEffect, useState } from "react";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { fetchGanttData } from "../services/ganttService";
import { ButtonGroup, Button, Form, Row, Col } from "react-bootstrap";

// Componente personalizado para el encabezado de la lista de tareas (vacío)
const EmptyListHeader = () => <div style={{ display: "none" }}></div>;

const GanttChart = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const [columnWidth, setColumnWidth] = useState<number>(80);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      try {
        const data = await fetchGanttData();

        const clean = data.filter(
          (t) =>
            t &&
            typeof t.name === "string" &&
            t.start instanceof Date &&
            !isNaN(t.start.getTime()) &&
            t.end instanceof Date &&
            !isNaN(t.end.getTime())
        );

        setTasks(clean);
      } catch (error) {
        console.error("Error al cargar datos del Gantt:", error);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, []);

  const groupedByProject = tasks.reduce((acc: any, task: Task) => {
    const projectId = task.project ?? task.id;
    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push(task);
    return acc;
  }, {});

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);

    switch (mode) {
      case ViewMode.Hour:
        setColumnWidth(50);
        break;
      case ViewMode.Day:
        setColumnWidth(60);
        break;
      case ViewMode.Week:
        setColumnWidth(80);
        break;
      case ViewMode.Month:
        setColumnWidth(150);
        break;
      case ViewMode.Year:
        setColumnWidth(320);
        break;
      default:
        setColumnWidth(80);
    }
  };

  const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const zoomLevel = parseInt(event.target.value);
    setColumnWidth(zoomLevel);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <style>{`
        .gantt-task-info-wrapper {
          display: none !important;
        }
        .gantt-task-list-wrapper {
          min-width: 0 !important;
          width: 0 !important;
          border-right: none !important;
        }
        .gantt-chart-wrapper {
          margin-left: 0 !important;
        }
        .btn-view-mode.active {
          background-color: #0d6efd;
          color: white;
        }
      `}</style>

      <h2 className="mb-3">📊 Tablero Proyectos</h2>
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando datos del diagrama Gantt...</p>
        </div>
      ) : tasks.length > 0 ? (
        <>
          {/* Controles de vista y zoom */}
          <Row className="mb-3 align-items-center">
            <Col md={7}>
              <div className="d-flex align-items-center">
                <label className="me-2 fw-bold">Vista:</label>
                <ButtonGroup className="me-4">
                  <Button
                    variant="outline-primary"
                    className={`btn-view-mode ${viewMode === ViewMode.Day ? "active" : ""}`}
                    onClick={() => handleViewModeChange(ViewMode.Day)}
                  >
                    Día
                  </Button>
                  <Button
                    variant="outline-primary"
                    className={`btn-view-mode ${viewMode === ViewMode.Week ? "active" : ""}`}
                    onClick={() => handleViewModeChange(ViewMode.Week)}
                  >
                    Semana
                  </Button>
                  <Button
                    variant="outline-primary"
                    className={`btn-view-mode ${viewMode === ViewMode.Month ? "active" : ""}`}
                    onClick={() => handleViewModeChange(ViewMode.Month)}
                  >
                    Mes
                  </Button>
                  <Button
                    variant="outline-primary"
                    className={`btn-view-mode ${viewMode === ViewMode.Year ? "active" : ""}`}
                    onClick={() => handleViewModeChange(ViewMode.Year)}
                  >
                    Año
                  </Button>
                </ButtonGroup>
              </div>
            </Col>
            <Col md={5}>
              <div className="d-flex align-items-center">
                <label className="me-2 fw-bold" htmlFor="zoomRange">Zoom:</label>
                <Form.Range
                  id="zoomRange"
                  min={30}
                  max={200}
                  step={10}
                  value={columnWidth}
                  onChange={handleZoomChange}
                  className="me-2"
                  style={{ flex: 1 }}
                />
                <span className="badge bg-secondary">{columnWidth}px</span>
              </div>
            </Col>
          </Row>

          {/* GANTT */}
          <div style={{ overflowX: "auto" }}>
            <Gantt
              tasks={tasks}
              viewMode={viewMode}
              listCellWidth="0"
              columnWidth={columnWidth}
              locale="es"
              ganttHeight={300}
              TaskListHeader={EmptyListHeader}
              todayColor="rgba(13, 110, 253, 0.15)"
              barFill={75}
              barCornerRadius={3}
            />
          </div>

          {/* TABLA */}
          <h4 className="mt-4 mb-2">📁 Detalle de tareas y subtareas</h4>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Progreso</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedByProject).map(([projectId, items]: any) => {
                const project = items.find((t: Task) => t.type === "project");
                const otherTasks = items.filter((t: Task) => t.type !== "project");
                const isExpanded = expandedProjects[projectId];

                return (
                  <React.Fragment key={projectId}>
                    <tr
                      style={{ backgroundColor: "#f5f5f5", cursor: "pointer" }}
                      onClick={() => toggleProject(projectId)}
                    >
                      <td colSpan={4}>
                        {isExpanded ? "▼" : "▶"} <strong>{project?.name || "Proyecto sin nombre"}</strong>
                      </td>
                    </tr>
                    {isExpanded &&
                      otherTasks.map((t: Task) => (
                        <tr key={t.id}>
                          <td style={{ paddingLeft: "2rem" }}>
                            {t.id.toString().startsWith("subtask") ? "↳ " : "- "}
                            {t.name}
                          </td>
                          <td>{formatDate(t.start)}</td>
                          <td>{formatDate(t.end)}</td>
                          <td>{t.progress ?? 0}%</td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </>
      ) : (
        <p>No hay tareas disponibles para mostrar.</p>
      )}
    </div>
  );
};

export default GanttChart;
