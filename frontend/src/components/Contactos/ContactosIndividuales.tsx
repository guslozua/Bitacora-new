// =============================================
// COMPONENTE: ContactosIndividuales.tsx - CON SWEETALERT2
// =============================================

import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Form, InputGroup, Button, Badge, Modal, Alert, Table } from 'react-bootstrap';
import { Integrante, Equipo } from '../../types/contactos';
import ContactosService from '../../services/ContactosService';
import { ROLES_DISPONIBLES } from '../../pages/ContactosPage';
import Swal from 'sweetalert2';

interface ContactosIndividualesProps {
  integrantes: Integrante[];
  equipos: Equipo[];
  onReload: () => void;
}

const ContactosIndividuales: React.FC<ContactosIndividualesProps> = ({
  integrantes,
  equipos,
  onReload
}) => {
  // Estados para modales
  const [showContactoModal, setShowContactoModal] = useState(false);
  const [selectedContacto, setSelectedContacto] = useState<Integrante | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState('');
  const [filtroEquipo, setFiltroEquipo] = useState('');

  // Estados para formulario
  const [contactoForm, setContactoForm] = useState({
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

  // Filtrar contactos
  const contactosFiltrados = useMemo(() => {
    return integrantes.filter(contacto => {
      const matchesSearch = !searchTerm || 
        `${contacto.nombre} ${contacto.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contacto.rol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contacto.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRol = !filtroRol || contacto.rol === filtroRol;
      const matchesDisponibilidad = !filtroDisponibilidad || contacto.disponibilidad === filtroDisponibilidad;
      
      // TODO: Implementar filtro por equipo cuando tengamos la relación
      const matchesEquipo = !filtroEquipo || true;

      return matchesSearch && matchesRol && matchesDisponibilidad && matchesEquipo;
    });
  }, [integrantes, searchTerm, filtroRol, filtroDisponibilidad, filtroEquipo]);

  const handleContacto = (tipo: 'telefono' | 'whatsapp' | 'email', valor?: string) => {
    if (!valor) return;
    
    switch (tipo) {
      case 'telefono':
        ContactosService.abrirLlamada(valor);
        break;
      case 'whatsapp':
        ContactosService.abrirWhatsApp(valor, 'Hola, me comunico por un tema técnico.');
        break;
      case 'email':
        window.open(`mailto:${valor}`, '_self');
        break;
    }
  };

  // ✅ CREAR/EDITAR CONTACTO CON SWEETALERT
  const handleOpenContactoModal = (contacto?: Integrante) => {
    if (contacto) {
      setSelectedContacto(contacto);
      setContactoForm({
        nombre: contacto.nombre,
        apellido: contacto.apellido,
        rol: contacto.rol || '',
        telefono_personal: contacto.telefono_personal || '',
        email: contacto.email || '',
        whatsapp: contacto.whatsapp || '',
        disponibilidad: contacto.disponibilidad,
        es_coordinador: contacto.es_coordinador,
        notas: contacto.notas || ''
      });
    } else {
      setSelectedContacto(null);
      setContactoForm({
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
    setShowContactoModal(true);
    setError(null);
  };

  const handleSaveContacto = async () => {
    if (!contactoForm.nombre.trim() || !contactoForm.apellido.trim()) {
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
      if (selectedContacto) {
        await ContactosService.updateIntegrante(selectedContacto.id, contactoForm);
        Swal.fire({
          title: '¡Éxito!',
          text: 'Contacto actualizado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await ContactosService.createIntegrante(contactoForm);
        Swal.fire({
          title: '¡Éxito!',
          text: 'Contacto creado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
      
      setShowContactoModal(false);
      onReload();
    } catch (err: any) {
      console.error('Error al guardar contacto:', err);
      Swal.fire({
        title: 'Error',
        text: 'Error al guardar el contacto',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ ELIMINAR CONTACTO CON SWEETALERT
  const handleDeleteContacto = (contacto: Integrante) => {
    Swal.fire({
      title: '¿Estás seguro?',
      html: `¿Deseas eliminar el contacto <strong>"${contacto.nombre} ${contacto.apellido}"</strong>?<br><br>
             <small class="text-muted">Esta acción eliminará permanentemente el contacto y lo removerá de todos los equipos asignados.</small>`,
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
          await ContactosService.deleteIntegrante(contacto.id);
          
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El contacto ha sido eliminado correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          
          onReload();
        } catch (err: any) {
          console.error('Error al eliminar contacto:', err);
          Swal.fire({
            title: 'Error',
            text: 'Error al eliminar el contacto',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        } finally {
          setLoading(false);
        }
      }
    });
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
                  placeholder="Buscar contactos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
              >
                <option value="">Todos los roles</option>
                {ROLES_DISPONIBLES.map(rol => (
                  <option key={rol} value={rol}>{rol}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filtroDisponibilidad}
                onChange={(e) => setFiltroDisponibilidad(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="disponible">Disponibles</option>
                <option value="ocupado">Ocupados</option>
                <option value="inactivo">Inactivos</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filtroEquipo}
                onChange={(e) => setFiltroEquipo(e.target.value)}
              >
                <option value="">Todos los equipos</option>
                {equipos.map(equipo => (
                  <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3} className="text-end">
              <Button 
                variant="success"
                onClick={() => handleOpenContactoModal()}
              >
                <i className="bi bi-person-plus me-1"></i>
                Nuevo Contacto
              </Button>
            </Col>
          </Row>
          
          <div className="text-center">
            <span className="text-muted">
              {contactosFiltrados.length} {contactosFiltrados.length === 1 ? 'contacto encontrado' : 'contactos encontrados'}
            </span>
          </div>
        </Card.Body>
      </Card>

      {/* Tabla de Contactos */}
      <Card>
        <Card.Header className="bg-success text-white">
          <h5 className="mb-0">
            <i className="bi bi-person-lines-fill me-2"></i>
            Directorio de Contactos
          </h5>
        </Card.Header>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr className="table-light">
                <th>Nombre</th>
                <th>Rol</th>
                <th>Contacto</th>
                <th>Disponibilidad</th>
                <th>Equipos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contactosFiltrados.map(contacto => (
                <tr key={contacto.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <span 
                        className="badge rounded-pill me-2"
                        style={{ 
                          backgroundColor: ContactosService.getColorByDisponibilidad(contacto.disponibilidad),
                          width: '10px',
                          height: '10px'
                        }}
                      ></span>
                      <div>
                        <strong>{contacto.nombre} {contacto.apellido}</strong>
                        {contacto.es_coordinador && (
                          <Badge bg="warning" text="dark" className="ms-2" style={{ fontSize: '0.7rem' }}>
                            Coordinador
                          </Badge>
                        )}
                        {contacto.notas && (
                          <div className="text-muted small">{contacto.notas}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {contacto.rol ? (
                      <Badge bg="secondary">{contacto.rol}</Badge>
                    ) : (
                      <span className="text-muted">Sin rol</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      {contacto.telefono_personal && (
                        <small>
                          📞 {ContactosService.formatearTelefono(contacto.telefono_personal)}
                        </small>
                      )}
                      {contacto.email && (
                        <small>
                          📧 {contacto.email}
                        </small>
                      )}
                      {contacto.whatsapp && (
                        <small>
                          💬 {ContactosService.formatearTelefono(contacto.whatsapp)}
                        </small>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge 
                      bg={
                        contacto.disponibilidad === 'disponible' ? 'success' : 
                        contacto.disponibilidad === 'ocupado' ? 'warning' : 'secondary'
                      }
                    >
                      {contacto.disponibilidad}
                    </Badge>
                  </td>
                  <td>
                    {contacto.equipos_nombres ? (
                      <div>
                        {contacto.equipos_nombres.split(', ').map((equipo, index) => (
                          <Badge key={index} bg="info" className="me-1 mb-1" style={{ fontSize: '0.7rem' }}>
                            {equipo}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted small">Sin equipo</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      {/* Botones de contacto */}
                      {contacto.telefono_personal && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleContacto('telefono', contacto.telefono_personal)}
                          title="Llamar"
                        >
                          <i className="bi bi-telephone"></i>
                        </Button>
                      )}
                      {contacto.whatsapp && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleContacto('whatsapp', contacto.whatsapp)}
                          title="WhatsApp"
                        >
                          <i className="bi bi-whatsapp"></i>
                        </Button>
                      )}
                      {contacto.email && (
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleContacto('email', contacto.email)}
                          title="Email"
                        >
                          <i className="bi bi-envelope"></i>
                        </Button>
                      )}
                      
                      {/* Botones de acción */}
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleOpenContactoModal(contacto)}
                        title="Editar"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteContacto(contacto)}
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
          
          {contactosFiltrados.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-person-x fs-1 text-muted mb-3"></i>
              <p className="text-muted">No se encontraron contactos que coincidan con los filtros</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ✅ MODAL CREAR/EDITAR CONTACTO */}
      <Modal show={showContactoModal} onHide={() => setShowContactoModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedContacto ? 'Editar Contacto' : 'Nuevo Contacto'}
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
                    value={contactoForm.nombre}
                    onChange={(e) => setContactoForm({ ...contactoForm, nombre: e.target.value })}
                    placeholder="Juan"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido *</Form.Label>
                  <Form.Control
                    type="text"
                    value={contactoForm.apellido}
                    onChange={(e) => setContactoForm({ ...contactoForm, apellido: e.target.value })}
                    placeholder="Pérez"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Rol/Cargo</Form.Label>
              <Form.Select
                value={contactoForm.rol}
                onChange={(e) => setContactoForm({ ...contactoForm, rol: e.target.value })}
              >
                <option value="">-- Seleccione un rol --</option>
                {ROLES_DISPONIBLES.map(rol => (
                  <option key={rol} value={rol}>{rol}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Selecciona el rol principal de esta persona
              </Form.Text>
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono Personal</Form.Label>
                  <Form.Control
                    type="tel"
                    value={contactoForm.telefono_personal}
                    onChange={(e) => setContactoForm({ ...contactoForm, telefono_personal: e.target.value })}
                    placeholder="+54 381 123-4567"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>WhatsApp</Form.Label>
                  <Form.Control
                    type="tel"
                    value={contactoForm.whatsapp}
                    onChange={(e) => setContactoForm({ ...contactoForm, whatsapp: e.target.value })}
                    placeholder="+54 381 123-4567"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={contactoForm.email}
                onChange={(e) => setContactoForm({ ...contactoForm, email: e.target.value })}
                placeholder="juan.perez@empresa.com"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Disponibilidad</Form.Label>
                  <Form.Select
                    value={contactoForm.disponibilidad}
                    onChange={(e) => setContactoForm({ ...contactoForm, disponibilidad: e.target.value as any })}
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
                    label="Es coordinador/líder"
                    checked={contactoForm.es_coordinador}
                    onChange={(e) => setContactoForm({ ...contactoForm, es_coordinador: e.target.checked })}
                    className="mt-4"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Notas</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={contactoForm.notas}
                onChange={(e) => setContactoForm({ ...contactoForm, notas: e.target.value })}
                placeholder="Información adicional, especialidades, horarios especiales, etc."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowContactoModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveContacto} disabled={loading}>
            {loading ? 'Guardando...' : (selectedContacto ? 'Actualizar' : 'Crear')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ContactosIndividuales;