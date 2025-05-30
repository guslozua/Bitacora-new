// =============================================
// SISTEMAS MONITOREADOS COMPLETO - CON SWEETALERT2
// components/Contactos/SistemasMonitoreados.tsx
// =============================================

import React, { useState, useMemo } from 'react';
import { Card, Table, Badge, Button, Modal, Form, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { Sistema, Equipo } from '../../types/contactos';
import ContactosService from '../../services/ContactosService';
import { CATEGORIAS_SISTEMAS } from '../../pages/ContactosPage';
import Swal from 'sweetalert2';

interface SistemasMonitorreadosProps {
  sistemas: Sistema[];
  equipos: Equipo[];
  onReload: () => void;
}

const SistemasMonitoreados: React.FC<SistemasMonitorreadosProps> = ({ sistemas, equipos, onReload }) => {
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showAsignacionModal, setShowAsignacionModal] = useState(false);
  const [selectedSistema, setSelectedSistema] = useState<Sistema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroCriticidad, setFiltroCriticidad] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Estados para formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    criticidad: 'media' as 'alta' | 'media' | 'baja',
    categoria: '',
    estado: 'operativo' as 'operativo' | 'mantenimiento' | 'inactivo',
    url_monitoreo: '',
    documentacion_url: ''
  });

  // Estados para asignación de equipos
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<number[]>([]);

  // Filtrar sistemas
  const sistemasFiltrados = useMemo(() => {
    return sistemas.filter(sistema => {
      const matchesSearch = !searchTerm || 
        sistema.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sistema.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategoria = !filtroCategoria || sistema.categoria === filtroCategoria;
      const matchesCriticidad = !filtroCriticidad || sistema.criticidad === filtroCriticidad;
      const matchesEstado = !filtroEstado || sistema.estado === filtroEstado;

      return matchesSearch && matchesCategoria && matchesCriticidad && matchesEstado;
    });
  }, [sistemas, searchTerm, filtroCategoria, filtroCriticidad, filtroEstado]);

  const handleNew = () => {
    setSelectedSistema(null);
    setFormData({
      nombre: '',
      descripcion: '',
      criticidad: 'media',
      categoria: '',
      estado: 'operativo',
      url_monitoreo: '',
      documentacion_url: ''
    });
    setShowModal(true);
    setError(null);
  };

  const handleEdit = (sistema: Sistema) => {
    setSelectedSistema(sistema);
    setFormData({
      nombre: sistema.nombre,
      descripcion: sistema.descripcion || '',
      criticidad: sistema.criticidad,
      categoria: sistema.categoria || '',
      estado: sistema.estado,
      url_monitoreo: sistema.url_monitoreo || '',
      documentacion_url: sistema.documentacion_url || ''
    });
    setShowModal(true);
    setError(null);
  };

  // ✅ GUARDAR CON SWEETALERT
  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'El nombre del sistema es obligatorio',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (selectedSistema) {
        await ContactosService.updateSistema(selectedSistema.id, formData);
        Swal.fire({
          title: '¡Éxito!',
          text: 'Sistema actualizado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await ContactosService.createSistema(formData);
        Swal.fire({
          title: '¡Éxito!',
          text: 'Sistema creado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
      
      setShowModal(false);
      onReload();
    } catch (err: any) {
      console.error('Error al guardar sistema:', err);
      Swal.fire({
        title: 'Error',
        text: 'Error al guardar el sistema',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setLoading(false);
    }
  };

  // Asignar equipos a sistema
  const handleOpenAsignacionModal = (sistema: Sistema) => {
    setSelectedSistema(sistema);
    setEquiposSeleccionados([]);
    setShowAsignacionModal(true);
    setError(null);
  };

  // ✅ GUARDAR ASIGNACIONES CON SWEETALERT
  const handleSaveAsignaciones = async () => {
    if (!selectedSistema) return;

    setLoading(true);
    try {
      await ContactosService.asignarEquiposASistema(selectedSistema.id, equiposSeleccionados);
      
      setShowAsignacionModal(false);
      
      Swal.fire({
        title: '¡Éxito!',
        text: 'Equipos asignados correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      onReload();
    } catch (err: any) {
      console.error('Error al asignar equipos:', err);
      Swal.fire({
        title: 'Error',
        text: 'Error al guardar las asignaciones',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEquipo = (equipoId: number) => {
    setEquiposSeleccionados(prev => 
      prev.includes(equipoId) 
        ? prev.filter(id => id !== equipoId)
        : [...prev, equipoId]
    );
  };

  // ✅ ELIMINAR SISTEMA CON SWEETALERT
  const handleDeleteSistema = (sistema: Sistema) => {
    Swal.fire({
      title: '¿Estás seguro?',
      html: `¿Deseas eliminar el sistema <strong>"${sistema.nombre}"</strong>?<br><br>
             <small class="text-muted">Esta acción eliminará permanentemente el sistema, removerá todas las asignaciones de equipos y eliminará los flujos de escalamiento configurados.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      focusCancel: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          await ContactosService.deleteSistema(sistema.id);
          
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El sistema ha sido eliminado correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          
          onReload();
        } catch (err: any) {
          console.error('Error al eliminar sistema:', err);
          Swal.fire({
            title: 'Error',
            text: 'Error al eliminar el sistema',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const getCriticidadColor = (criticidad: string) => {
    switch (criticidad) {
      case 'alta': return 'danger';
      case 'media': return 'warning';
      case 'baja': return 'success';
      default: return 'secondary';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'operativo': return 'success';
      case 'mantenimiento': return 'warning';
      case 'inactivo': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <>
      {/* Filtros y búsqueda */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="mb-3">
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar sistemas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {CATEGORIAS_SISTEMAS.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filtroCriticidad}
                onChange={(e) => setFiltroCriticidad(e.target.value)}
              >
                <option value="">Todas las criticidades</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="operativo">Operativo</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="inactivo">Inactivo</option>
              </Form.Select>
            </Col>
            <Col md={3} className="text-end">
              <Button variant="info" onClick={handleNew}>
                <i className="bi bi-plus-circle me-1"></i>
                Nuevo Sistema
              </Button>
            </Col>
          </Row>
          
          <div className="text-center">
            <span className="text-muted">
              {sistemasFiltrados.length} {sistemasFiltrados.length === 1 ? 'sistema encontrado' : 'sistemas encontrados'}
            </span>
          </div>
        </Card.Body>
      </Card>

      {/* Tabla de Sistemas */}
      <Card>
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0">
            <i className="bi bi-diagram-3 me-2"></i>
            Sistemas Monitoreados
          </h5>
        </Card.Header>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr className="table-light">
                <th>Sistema</th>
                <th>Categoría</th>
                <th>Criticidad</th>
                <th>Estado</th>
                <th>Equipos Responsables</th>
                <th>Enlaces</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sistemasFiltrados.map(sistema => (
                <tr key={sistema.id} className={sistema.criticidad === 'alta' ? 'table-danger' : ''}>
                  <td>
                    <div>
                      <strong>{sistema.nombre}</strong>
                      {sistema.descripcion && (
                        <div className="text-muted small">{sistema.descripcion}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    {sistema.categoria ? (
                      <Badge bg="primary" style={{ fontSize: '0.8rem' }}>
                        {sistema.categoria}
                      </Badge>
                    ) : (
                      <span className="text-muted">Sin categoría</span>
                    )}
                  </td>
                  <td>
                    <Badge bg={getCriticidadColor(sistema.criticidad)}>
                      {sistema.criticidad.toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={getEstadoColor(sistema.estado)}>
                      {sistema.estado}
                    </Badge>
                  </td>
                  <td>
                    <div>
                      {sistema.equipos_responsables ? (
                        sistema.equipos_responsables.split(', ').map((equipo, index) => (
                          <Badge key={index} bg="secondary" className="me-1 mb-1" style={{ fontSize: '0.7rem' }}>
                            {equipo}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted small">Sin asignar</span>
                      )}
                      <div className="mt-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenAsignacionModal(sistema)}
                          title="Asignar equipos"
                        >
                          <i className="bi bi-people"></i>
                        </Button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      {sistema.url_monitoreo && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => window.open(sistema.url_monitoreo, '_blank')}
                          title="Monitoreo"
                        >
                          <i className="bi bi-eye me-1"></i>
                          Monitor
                        </Button>
                      )}
                      {sistema.documentacion_url && (
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => window.open(sistema.documentacion_url, '_blank')}
                          title="Documentación"
                        >
                          <i className="bi bi-file-text me-1"></i>
                          Docs
                        </Button>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleEdit(sistema)}
                        title="Editar"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteSistema(sistema)}
                        title="Eliminar"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {sistemasFiltrados.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-diagram-3 fs-1 text-muted mb-3"></i>
              <p className="text-muted">No se encontraron sistemas que coincidan con los filtros</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal Crear/Editar Sistema */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedSistema ? 'Editar Sistema' : 'Nuevo Sistema'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger">{error}</Alert>
          )}
          
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Sistema *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Sistema de Gestión de Usuarios"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Criticidad</Form.Label>
                  <Form.Select
                    value={formData.criticidad}
                    onChange={(e) => setFormData({ ...formData, criticidad: e.target.value as any })}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción detallada del sistema y su función..."
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Categoría</Form.Label>
                  <Form.Select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  >
                    <option value="">-- Seleccione una categoría --</option>
                    {CATEGORIAS_SISTEMAS.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Tipo de sistema o tecnología principal
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                  >
                    <option value="operativo">Operativo</option>
                    <option value="mantenimiento">En Mantenimiento</option>
                    <option value="inactivo">Inactivo</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>URL de Monitoreo</Form.Label>
              <Form.Control
                type="url"
                value={formData.url_monitoreo}
                onChange={(e) => setFormData({ ...formData, url_monitoreo: e.target.value })}
                placeholder="https://monitor.empresa.com/sistema"
              />
              <Form.Text className="text-muted">
                Dashboard o herramienta de monitoreo
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>URL de Documentación</Form.Label>
              <Form.Control
                type="url"
                value={formData.documentacion_url}
                onChange={(e) => setFormData({ ...formData, documentacion_url: e.target.value })}
                placeholder="https://docs.empresa.com/sistema"
              />
              <Form.Text className="text-muted">
                Documentación técnica o manual de usuario
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : (selectedSistema ? 'Actualizar' : 'Crear')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Asignar Equipos */}
      <Modal show={showAsignacionModal} onHide={() => setShowAsignacionModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Asignar Equipos Responsables - {selectedSistema?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {error && (
            <Alert variant="danger">{error}</Alert>
          )}
          
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            Selecciona los equipos que serán responsables de este sistema
          </Alert>
          
          <div className="row">
            {equipos.map(equipo => (
              <div key={equipo.id} className="col-md-6 mb-3">
                <Form.Check
                  type="checkbox"
                  id={`equipo-${equipo.id}`}
                  className="p-3 border rounded"
                  checked={equiposSeleccionados.includes(equipo.id)}
                  onChange={() => handleToggleEquipo(equipo.id)}
                  label={
                    <div>
                      <div className="d-flex align-items-center">
                        <span 
                          className="badge rounded-pill me-2"
                          style={{ backgroundColor: equipo.color, width: '10px', height: '10px' }}
                        ></span>
                        <strong>{equipo.nombre}</strong>
                      </div>
                      {equipo.descripcion && (
                        <div className="text-muted small mt-1">{equipo.descripcion}</div>
                      )}
                      <div className="mt-1">
                        <Badge bg="secondary" className="me-1">
                          {equipo.total_integrantes} integrantes
                        </Badge>
                        <Badge bg="success">
                          {equipo.integrantes_disponibles} disponibles
                        </Badge>
                      </div>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
          
          {equipos.length === 0 && (
            <p className="text-muted text-center">
              No hay equipos disponibles para asignar
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="me-auto">
            <small className="text-muted">
              {equiposSeleccionados.length} equipos seleccionados
            </small>
          </div>
          <Button variant="secondary" onClick={() => setShowAsignacionModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveAsignaciones} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Asignaciones'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SistemasMonitoreados;