// =============================================
// COMPONENTE: components/Contactos/AgendaContactos.tsx - CON SWEETALERT2
// =============================================

import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Form, InputGroup, Button, Badge, Modal, Alert } from 'react-bootstrap';
import { Equipo, Integrante } from '../../types/contactos';
import ContactosService from '../../services/ContactosService';
import Swal from 'sweetalert2';

interface AgendaContactosProps {
  equipos: Equipo[];
  searchTerm: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filtroDisponibilidad: string;
  onFiltroDisponibilidadChange: (value: string) => void;
  filtroEquipo: string;
  onFiltroEquipoChange: (value: string) => void;
  onReload: () => void;
}

const AgendaContactos: React.FC<AgendaContactosProps> = ({
  equipos,
  searchTerm,
  onSearch,
  filtroDisponibilidad,
  onFiltroDisponibilidadChange,
  filtroEquipo,
  onFiltroEquipoChange,
  onReload
}) => {
  // Estados para modales
  const [showEquipoModal, setShowEquipoModal] = useState(false);
  const [showIntegranteModal, setShowIntegranteModal] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [selectedIntegrante, setSelectedIntegrante] = useState<Integrante | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para formularios
  const [equipoForm, setEquipoForm] = useState({
    nombre: '',
    descripcion: '',
    telefono_guardia: '',
    email_grupo: '',
    color: '#007bff'
  });

  const [integranteForm, setIntegranteForm] = useState({
    nombre: '',
    apellido: '',
    rol: '',
    telefono_personal: '',
    email: '',
    whatsapp: '',
    disponibilidad: 'disponible' as 'disponible' | 'ocupado' | 'inactivo',
    es_coordinador: false,
    notas: ''
  });

  // Filtrar equipos según criterios de búsqueda
  const equiposFiltrados = useMemo(() => {
    return equipos.filter(equipo => {
      const matchesSearch = !searchTerm || 
        equipo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipo.integrantes?.some(integrante => 
          `${integrante.nombre} ${integrante.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          integrante.rol?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        equipo.sistemas?.some(sistema => 
          sistema.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesEquipo = !filtroEquipo || equipo.id.toString() === filtroEquipo;
      const matchesDisponibilidad = !filtroDisponibilidad || 
        equipo.integrantes?.some(integrante => 
          integrante.disponibilidad === filtroDisponibilidad
        );

      return matchesSearch && matchesEquipo && matchesDisponibilidad;
    });
  }, [equipos, searchTerm, filtroEquipo, filtroDisponibilidad]);

  const handleContacto = (tipo: 'telefono' | 'whatsapp', numero?: string) => {
    if (tipo === 'telefono') {
      ContactosService.abrirLlamada(numero);
    } else {
      ContactosService.abrirWhatsApp(numero, 'Hola, me comunico por un incidente técnico.');
    }
  };

  // ✅ CREAR/EDITAR EQUIPO CON SWEETALERT
  const handleOpenEquipoModal = (equipo?: Equipo) => {
    if (equipo) {
      setSelectedEquipo(equipo);
      setEquipoForm({
        nombre: equipo.nombre,
        descripcion: equipo.descripcion || '',
        telefono_guardia: equipo.telefono_guardia || '',
        email_grupo: equipo.email_grupo || '',
        color: equipo.color
      });
    } else {
      setSelectedEquipo(null);
      setEquipoForm({
        nombre: '',
        descripcion: '',
        telefono_guardia: '',
        email_grupo: '',
        color: '#007bff'
      });
    }
    setShowEquipoModal(true);
    setError(null);
  };

  const handleSaveEquipo = async () => {
    if (!equipoForm.nombre.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'El nombre del equipo es obligatorio',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    setLoading(true);
    try {
      if (selectedEquipo) {
        await ContactosService.updateEquipo(selectedEquipo.id, equipoForm);
        Swal.fire({
          title: '¡Éxito!',
          text: 'Equipo actualizado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await ContactosService.createEquipo(equipoForm);
        Swal.fire({
          title: '¡Éxito!',
          text: 'Equipo creado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
      
      setShowEquipoModal(false);
      onReload();
    } catch (err: any) {
      console.error('Error al guardar equipo:', err);
      Swal.fire({
        title: 'Error',
        text: 'Error al guardar el equipo',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ CREAR/EDITAR INTEGRANTE CON SWEETALERT
  const handleOpenIntegranteModal = (integrante?: Integrante) => {
    if (integrante) {
      setSelectedIntegrante(integrante);
      setIntegranteForm({
        nombre: integrante.nombre,
        apellido: integrante.apellido,
        rol: integrante.rol || '',
        telefono_personal: integrante.telefono_personal || '',
        email: integrante.email || '',
        whatsapp: integrante.whatsapp || '',
        disponibilidad: integrante.disponibilidad,
        es_coordinador: integrante.es_coordinador,
        notas: integrante.notas || ''
      });
    } else {
      setSelectedIntegrante(null);
      setIntegranteForm({
        nombre: '',
        apellido: '',
        rol: '',
        telefono_personal: '',
        email: '',
        whatsapp: '',
        disponibilidad: 'disponible',
        es_coordinador: false,
        notas: ''
      });
    }
    setShowIntegranteModal(true);
    setError(null);
  };

  const handleSaveIntegrante = async () => {
    if (!integranteForm.nombre.trim() || !integranteForm.apellido.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'Nombre y apellido son obligatorios',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    setLoading(true);
    try {
      if (selectedIntegrante) {
        await ContactosService.updateIntegrante(selectedIntegrante.id, integranteForm);
        Swal.fire({
          title: '¡Éxito!',
          text: 'Integrante actualizado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await ContactosService.createIntegrante(integranteForm);
        Swal.fire({
          title: '¡Éxito!',
          text: 'Integrante creado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
      
      setShowIntegranteModal(false);
      onReload();
    } catch (err: any) {
      console.error('Error al guardar integrante:', err);
      Swal.fire({
        title: 'Error',
        text: 'Error al guardar el integrante',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Filtros y búsqueda */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por nombre, equipo o sistema..."
                  value={searchTerm}
                  onChange={onSearch}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filtroEquipo}
                onChange={(e) => onFiltroEquipoChange(e.target.value)}
              >
                <option value="">Todos los equipos</option>
                {equipos.map(equipo => (
                  <option key={equipo.id} value={equipo.id}>
                    {equipo.nombre}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filtroDisponibilidad}
                onChange={(e) => onFiltroDisponibilidadChange(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="disponible">Disponibles</option>
                <option value="ocupado">Ocupados</option>
                <option value="inactivo">Inactivos</option>
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <Button 
                variant="primary" 
                className="me-2"
                onClick={() => handleOpenEquipoModal()}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Nuevo Equipo
              </Button>
              <Button 
                variant="success"
                onClick={() => handleOpenIntegranteModal()}
              >
                <i className="bi bi-person-plus me-1"></i>
                Nuevo Integrante
              </Button>
            </Col>
          </Row>
          
          <div className="text-center">
            <span className="text-muted">
              {equiposFiltrados.length} {equiposFiltrados.length === 1 ? 'equipo encontrado' : 'equipos encontrados'}
            </span>
          </div>
        </Card.Body>
      </Card>

      {/* Grid de Equipos */}
      <Row>
        {equiposFiltrados.map(equipo => (
          <Col lg={4} md={6} key={equipo.id} className="mb-4">
            <Card className="h-100 shadow-sm hover-effect" style={{ borderLeft: `4px solid ${equipo.color}` }}>
              <Card.Header style={{ backgroundColor: equipo.color, color: 'white' }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <h5 className="mb-1">{equipo.nombre}</h5>
                    <p className="mb-0 opacity-75">{equipo.descripcion}</p>
                  </div>
                  <div className="d-flex flex-column align-items-end">
                    <Badge bg="light" text="dark" className="mb-1">
                      {equipo.integrantes_disponibles}/{equipo.total_integrantes} activos
                    </Badge>
                    <Button
                      variant="outline-light"
                      size="sm"
                      onClick={() => handleOpenEquipoModal(equipo)}
                      title="Editar equipo"
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                  </div>
                </div>
                
                {/* Sistemas asociados */}
                {equipo.sistemas && equipo.sistemas.length > 0 && (
                  <div className="mt-2">
                    {equipo.sistemas.slice(0, 3).map(sistema => (
                      <Badge key={sistema.id} bg="light" text="dark" className="me-1 mb-1">
                        {sistema.nombre}
                      </Badge>
                    ))}
                    {equipo.sistemas.length > 3 && (
                      <Badge bg="light" text="dark" className="me-1 mb-1">
                        +{equipo.sistemas.length - 3} más
                      </Badge>
                    )}
                  </div>
                )}
              </Card.Header>
              
              <Card.Body>
                {/* Información de contacto del equipo */}
                {(equipo.telefono_guardia || equipo.email_grupo) && (
                  <div className="mb-3 p-2 bg-light rounded">
                    {equipo.telefono_guardia && (
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong>📞 Guardia:</strong>
                        <div>
                          <Button 
                            variant="outline-success" 
                            size="sm" 
                            className="me-1"
                            onClick={() => handleContacto('whatsapp', equipo.telefono_guardia)}
                            title="WhatsApp"
                          >
                            <i className="bi bi-whatsapp"></i>
                          </Button>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleContacto('telefono', equipo.telefono_guardia)}
                            title="Llamar"
                          >
                            <i className="bi bi-telephone"></i>
                          </Button>
                        </div>
                      </div>
                    )}
                    {equipo.telefono_guardia && (
                      <small className="text-muted d-block">
                        {ContactosService.formatearTelefono(equipo.telefono_guardia)}
                      </small>
                    )}
                    {equipo.email_grupo && (
                      <div className="mt-1">
                        <strong>📧 Email:</strong> 
                        <small className="text-muted ms-1">{equipo.email_grupo}</small>
                      </div>
                    )}
                  </div>
                )}

                {/* Lista de integrantes */}
                {equipo.integrantes && equipo.integrantes.length > 0 && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">Integrantes:</h6>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleOpenIntegranteModal()}
                        title="Agregar integrante"
                      >
                        <i className="bi bi-person-plus"></i>
                      </Button>
                    </div>
                    {equipo.integrantes.map(integrante => (
                      <div key={integrante.id} className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" 
                           style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center">
                            <span 
                              className="badge rounded-pill me-2"
                              style={{ 
                                backgroundColor: ContactosService.getColorByDisponibilidad(integrante.disponibilidad),
                                width: '8px',
                                height: '8px'
                              }}
                            ></span>
                            <strong>{integrante.nombre} {integrante.apellido}</strong>
                            {integrante.es_coordinador && (
                              <Badge bg="warning" text="dark" className="ms-2" style={{ fontSize: '0.7rem' }}>
                                Coordinador
                              </Badge>
                            )}
                          </div>
                          {integrante.rol && (
                            <small className="text-muted">{integrante.rol}</small>
                          )}
                          {integrante.telefono_personal && (
                            <small className="text-muted d-block">
                              {ContactosService.formatearTelefono(integrante.telefono_personal)}
                            </small>
                          )}
                        </div>
                        
                        <div>
                          {integrante.whatsapp && (
                            <Button 
                              variant="outline-success" 
                              size="sm" 
                              className="me-1"
                              onClick={() => handleContacto('whatsapp', integrante.whatsapp)}
                              title="WhatsApp"
                            >
                              <i className="bi bi-whatsapp"></i>
                            </Button>
                          )}
                          {integrante.telefono_personal && (
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="me-1"
                              onClick={() => handleContacto('telefono', integrante.telefono_personal)}
                              title="Llamar"
                            >
                              <i className="bi bi-telephone"></i>
                            </Button>
                          )}
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleOpenIntegranteModal(integrante)}
                            title="Editar integrante"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {equiposFiltrados.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-search fs-1 text-muted mb-3"></i>
          <p className="text-muted">No se encontraron equipos que coincidan con los filtros aplicados</p>
        </div>
      )}

      {/* Modal para crear/editar equipo */}
      <Modal show={showEquipoModal} onHide={() => setShowEquipoModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedEquipo ? 'Editar Equipo' : 'Nuevo Equipo'}
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
                  <Form.Label>Nombre del Equipo *</Form.Label>
                  <Form.Control
                    type="text"
                    value={equipoForm.nombre}
                    onChange={(e) => setEquipoForm({ ...equipoForm, nombre: e.target.value })}
                    placeholder="Ej: Equipo de Desarrollo"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <Form.Control
                    type="color"
                    value={equipoForm.color}
                    onChange={(e) => setEquipoForm({ ...equipoForm, color: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={equipoForm.descripcion}
                onChange={(e) => setEquipoForm({ ...equipoForm, descripcion: e.target.value })}
                placeholder="Descripción del equipo..."
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono de Guardia</Form.Label>
                  <Form.Control
                    type="tel"
                    value={equipoForm.telefono_guardia}
                    onChange={(e) => setEquipoForm({ ...equipoForm, telefono_guardia: e.target.value })}
                    placeholder="+54 381 123-4567"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email del Grupo</Form.Label>
                  <Form.Control
                    type="email"
                    value={equipoForm.email_grupo}
                    onChange={(e) => setEquipoForm({ ...equipoForm, email_grupo: e.target.value })}
                    placeholder="equipo@empresa.com"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEquipoModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveEquipo} disabled={loading}>
            {loading ? 'Guardando...' : (selectedEquipo ? 'Actualizar' : 'Crear')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para crear/editar integrante */}
      <Modal show={showIntegranteModal} onHide={() => setShowIntegranteModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedIntegrante ? 'Editar Integrante' : 'Nuevo Integrante'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger">{error}</Alert>
          )}
          
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    value={integranteForm.nombre}
                    onChange={(e) => setIntegranteForm({ ...integranteForm, nombre: e.target.value })}
                    placeholder="Juan"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido *</Form.Label>
                  <Form.Control
                    type="text"
                    value={integranteForm.apellido}
                    onChange={(e) => setIntegranteForm({ ...integranteForm, apellido: e.target.value })}
                    placeholder="Pérez"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Rol/Cargo</Form.Label>
              <Form.Control
                type="text"
                value={integranteForm.rol}
                onChange={(e) => setIntegranteForm({ ...integranteForm, rol: e.target.value })}
                placeholder="Desarrollador Senior, Coordinador, etc."
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono Personal</Form.Label>
                  <Form.Control
                    type="tel"
                    value={integranteForm.telefono_personal}
                    onChange={(e) => setIntegranteForm({ ...integranteForm, telefono_personal: e.target.value })}
                    placeholder="+54 381 123-4567"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>WhatsApp</Form.Label>
                  <Form.Control
                    type="tel"
                    value={integranteForm.whatsapp}
                    onChange={(e) => setIntegranteForm({ ...integranteForm, whatsapp: e.target.value })}
                    placeholder="+54 381 123-4567"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={integranteForm.email}
                onChange={(e) => setIntegranteForm({ ...integranteForm, email: e.target.value })}
                placeholder="juan.perez@empresa.com"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Disponibilidad</Form.Label>
                  <Form.Select
                    value={integranteForm.disponibilidad}
                    onChange={(e) => setIntegranteForm({ ...integranteForm, disponibilidad: e.target.value as any })}
                  >
                    <option value="disponible">Disponible</option>
                    <option value="ocupado">Ocupado</option>
                    <option value="inactivo">Inactivo</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Es coordinador del equipo"
                    checked={integranteForm.es_coordinador}
                    onChange={(e) => setIntegranteForm({ ...integranteForm, es_coordinador: e.target.checked })}
                    className="mt-4"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Notas</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={integranteForm.notas}
                onChange={(e) => setIntegranteForm({ ...integranteForm, notas: e.target.value })}
                placeholder="Información adicional..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowIntegranteModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveIntegrante} disabled={loading}>
            {loading ? 'Guardando...' : (selectedIntegrante ? 'Actualizar' : 'Crear')}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .hover-effect {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-effect:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
      `}</style>
    </>
  );
};

export default AgendaContactos;