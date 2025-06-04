import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Modal,
  Form,
  Badge,
  Collapse,
  Spinner,
  Alert
} from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import hitoService from '../../services/hitoService';
import HitoForm from './HitoForm';
import type { 
  HitoCompleto, 
  HitoFilters, 
  HitoFormData,
  HitoRowProps,
  ApiResponse
} from '../../types/hitos.types';

// Componente para mostrar una fila expandible
const HitoRow: React.FC<HitoRowProps> = ({ hito, onEdit, onDelete, onExportPDF }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr>
        <td>
          <Button
            variant="link"
            size="sm"
            onClick={() => setOpen(!open)}
            className="p-0"
          >
            <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
          </Button>
        </td>
        <td>{hito.nombre}</td>
        <td className="text-center">
          {hito.fecha_inicio ? format(new Date(hito.fecha_inicio), 'dd/MM/yyyy', { locale: es }) : '-'}
        </td>
        <td className="text-center">
          {hito.fecha_fin ? format(new Date(hito.fecha_fin), 'dd/MM/yyyy', { locale: es }) : '-'}
        </td>
        <td className="text-center">
          {hito.proyecto_origen_nombre || 'Hito manual'}
        </td>
        <td className="text-end">
          <Button
            variant="outline-primary"
            size="sm"
            className="me-1"
            onClick={() => onExportPDF(hito.id)}
            title="Exportar a PDF"
          >
            <i className="bi bi-file-earmark-pdf"></i>
          </Button>
          <Button
            variant="outline-warning"
            size="sm"
            className="me-1"
            onClick={() => onEdit(hito)}
            title="Editar"
          >
            <i className="bi bi-pencil"></i>
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onDelete(hito)}
            title="Eliminar"
          >
            <i className="bi bi-trash"></i>
          </Button>
        </td>
      </tr>
      <tr>
        <td colSpan={6} className="p-0">
          <Collapse in={open}>
            <div className="p-3 bg-light border-top">
              <h6>Detalles del Hito</h6>
              
              <Row>
                <Col md={6}>
                  <strong>Descripción:</strong>
                  <p>{hito.descripcion || 'Sin descripción'}</p>
                </Col>
                <Col md={6}>
                  <strong>Impacto:</strong>
                  <p>{hito.impacto || 'No especificado'}</p>
                </Col>
              </Row>

              {hito.usuarios && hito.usuarios.length > 0 && (
                <div className="mb-3">
                  <strong>Usuarios involucrados:</strong>
                  <div className="mt-2">
                    {hito.usuarios.map((usuario) => (
                      <Badge 
                        key={`${hito.id}-${usuario.id_usuario}`}
                        bg="primary" 
                        className="me-2 mb-1"
                      >
                        {usuario.nombre} ({usuario.rol})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {hito.tareas && hito.tareas.length > 0 && (
                <div>
                  <strong>Tareas relacionadas:</strong>
                  <Table striped bordered hover size="sm" className="mt-2">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hito.tareas.map((tarea) => (
                        <tr key={tarea.id}>
                          <td>{tarea.nombre_tarea}</td>
                          <td>{tarea.descripcion || '-'}</td>
                          <td>
                            {tarea.fecha_inicio 
                              ? format(new Date(tarea.fecha_inicio), 'dd/MM/yyyy', { locale: es }) 
                              : '-'}
                          </td>
                          <td>
                            {tarea.fecha_fin 
                              ? format(new Date(tarea.fecha_fin), 'dd/MM/yyyy', { locale: es }) 
                              : '-'}
                          </td>
                          <td>
                            <Badge 
                              bg={tarea.estado === 'completada' ? 'success' : 'secondary'}
                            >
                              {tarea.estado}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </Collapse>
        </td>
      </tr>
    </>
  );
};

// Componente principal para la lista de hitos
const HitosList: React.FC = () => {
  const [hitos, setHitos] = useState<HitoCompleto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [currentHito, setCurrentHito] = useState<HitoCompleto | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [hitoToDelete, setHitoToDelete] = useState<HitoCompleto | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger' | 'warning' | 'info', text: string } | null>(null);
  
  const [filters, setFilters] = useState<HitoFilters>({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    idProyectoOrigen: ''
  });

  // Cargar hitos al montar el componente
  useEffect(() => {
    fetchHitos();
  }, []);

  // Función para cargar hitos con filtros opcionales
  const fetchHitos = async (filterParams: HitoFilters = {}) => {
    setLoading(true);
    try {
      console.log('🔍 Iniciando carga de hitos...');
      const response: ApiResponse<HitoCompleto[]> = await hitoService.getHitos(filterParams);
      console.log('✅ Respuesta recibida:', response);
      
      if (response && response.data) {
        // Obtener detalles completos para cada hito
        const hitosConDetalles = await Promise.all(
          response.data.map(async (hito: HitoCompleto) => {
            try {
              const detalles = await hitoService.getHitoById(hito.id);
              return detalles.data;
            } catch (error) {
              console.warn(`⚠️ No se pudieron cargar detalles para hito ${hito.id}:`, error);
              return hito; // Devolver el hito básico si no se pueden cargar los detalles
            }
          })
        );
        
        setHitos(hitosConDetalles);
        console.log('✅ Hitos cargados:', hitosConDetalles.length);
      } else {
        console.warn('⚠️ Respuesta sin datos válidos:', response);
        setHitos([]);
      }
    } catch (error: any) {
      console.error('❌ Error al cargar hitos:', error);
      let errorMessage = 'Error al cargar los hitos';
      
      if (error.response?.status === 404) {
        errorMessage = 'Endpoint de hitos no encontrado. Verifique que el backend esté configurado correctamente.';
      } else if (error.response?.status === 401) {
        errorMessage = 'No autorizado. Verifique su sesión.';
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorMessage = 'No se puede conectar con el servidor. Verifique que esté ejecutándose.';
      }
      
      setMessage({ type: 'danger', text: errorMessage });
      setHitos([]);
    } finally {
      setLoading(false);
    }
  };

  // Abrir formulario para crear nuevo hito
  const handleOpenCreateForm = (): void => {
    setCurrentHito(null);
    setShowForm(true);
  };

  // Abrir formulario para editar hito
  const handleOpenEditForm = (hito: HitoCompleto): void => {
    setCurrentHito(hito);
    setShowForm(true);
  };

  // Cerrar formulario
  const handleCloseForm = (): void => {
    setShowForm(false);
    setCurrentHito(null);
  };

  // Guardar hito (crear o actualizar)
  const handleSaveHito = async (hitoData: HitoFormData): Promise<void> => {
    try {
      if (currentHito) {
        // Actualizar hito existente
        await hitoService.updateHito(currentHito.id, hitoData);
        setMessage({ type: 'success', text: 'Hito actualizado correctamente' });
      } else {
        // Crear nuevo hito
        await hitoService.createHito(hitoData);
        setMessage({ type: 'success', text: 'Hito creado correctamente' });
      }
      
      // Recargar hitos
      await fetchHitos(filters);
      handleCloseForm();
    } catch (error: any) {
      console.error('Error al guardar hito:', error);
      setMessage({ 
        type: 'danger', 
        text: `Error al ${currentHito ? 'actualizar' : 'crear'} el hito: ${error.response?.data?.message || error.message}` 
      });
    }
  };

  // Abrir modal de confirmación para eliminar hito
  const handleOpenDeleteModal = (hito: HitoCompleto): void => {
    setHitoToDelete(hito);
    setShowDeleteModal(true);
  };

  // Cerrar modal de confirmación para eliminar hito
  const handleCloseDeleteModal = (): void => {
    setShowDeleteModal(false);
    setHitoToDelete(null);
  };

  // Eliminar hito
  const handleDeleteHito = async (): Promise<void> => {
    if (!hitoToDelete) return;
    
    try {
      await hitoService.deleteHito(hitoToDelete.id);
      setMessage({ type: 'success', text: 'Hito eliminado correctamente' });
      
      // Recargar hitos
      await fetchHitos(filters);
      handleCloseDeleteModal();
    } catch (error: any) {
      console.error('Error al eliminar hito:', error);
      setMessage({ 
        type: 'danger', 
        text: `Error al eliminar el hito: ${error.response?.data?.message || error.message}` 
      });
    }
  };

  // Exportar hito a PDF
  const handleExportPDF = async (hitoId: number): Promise<void> => {
    try {
      await hitoService.exportHitoToPDF(hitoId);
      setMessage({ type: 'success', text: 'PDF generado correctamente' });
    } catch (error: any) {
      console.error('Error al exportar a PDF:', error);
      setMessage({ 
        type: 'danger', 
        text: `Error al exportar el hito a PDF: ${error.response?.data?.message || error.message}` 
      });
    }
  };

  // Manejar cambio en filtros
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Aplicar filtros
  const handleApplyFilters = async (): Promise<void> => {
    await fetchHitos(filters);
  };

  // Limpiar filtros
  const handleClearFilters = async (): Promise<void> => {
    const emptyFilters: HitoFilters = {
      nombre: '',
      fechaInicio: '',
      fechaFin: '',
      idProyectoOrigen: ''
    };
    setFilters(emptyFilters);
    await fetchHitos({});
  };

  // Auto-dismiss message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Button 
                variant="outline-secondary"
                className="me-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="bi bi-funnel me-1"></i>
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </Button>
              <Button 
                variant="primary"
                onClick={handleOpenCreateForm}
              >
                <i className="bi bi-plus-lg me-1"></i>
                Nuevo Hito
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Mensajes de estado */}
      {message && (
        <Alert 
          variant={message.type} 
          dismissible 
          onClose={() => setMessage(null)}
          className="mb-3"
        >
          {message.text}
        </Alert>
      )}

      {/* Filtros */}
      <Collapse in={showFilters}>
        <Card className="mb-3">
          <Card.Body>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-2">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={filters.nombre || ''}
                    onChange={handleFilterChange}
                    placeholder="Buscar por nombre"
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Fecha Inicio</Form.Label>
                  <Form.Control
                    type="date"
                    name="fechaInicio"
                    value={filters.fechaInicio || ''}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Fecha Fin</Form.Label>
                  <Form.Control
                    type="date"
                    name="fechaFin"
                    value={filters.fechaFin || ''}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-2">
                  <Form.Label>ID Proyecto Origen</Form.Label>
                  <Form.Control
                    type="number"
                    name="idProyectoOrigen"
                    value={filters.idProyectoOrigen || ''}
                    onChange={handleFilterChange}
                    placeholder="ID del proyecto"
                  />
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <div className="d-grid gap-1 w-100">
                  <Button 
                    variant="primary" 
                    onClick={handleApplyFilters}
                    disabled={loading}
                  >
                    Filtrar
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleClearFilters}
                    disabled={loading}
                  >
                    Limpiar
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Collapse>

      {/* Tabla de hitos */}
      <Card>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center p-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
              <p className="mt-2">Cargando hitos...</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th style={{ width: '50px' }}></th>
                  <th>Nombre</th>
                  <th className="text-center">Fecha Inicio</th>
                  <th className="text-center">Fecha Fin</th>
                  <th className="text-center">Proyecto Origen</th>
                  <th className="text-end" style={{ width: '150px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {hitos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      No se encontraron hitos
                    </td>
                  </tr>
                ) : (
                  hitos.map((hito) => (
                    <HitoRow 
                      key={hito.id} 
                      hito={hito} 
                      onEdit={handleOpenEditForm}
                      onDelete={handleOpenDeleteModal}
                      onExportPDF={handleExportPDF}
                    />
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal para formulario de hito */}
      <HitoForm 
        show={showForm} 
        onHide={handleCloseForm} 
        onSave={handleSaveHito}
        hito={currentHito}
      />

      {/* Modal de confirmación para eliminar hito */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Está seguro de que desea eliminar el hito "{hitoToDelete?.nombre}"? 
          Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteHito}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default HitosList;