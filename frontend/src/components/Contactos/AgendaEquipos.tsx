// =============================================
// COMPONENTE MEJORADO: AgendaEquipos.tsx - VERSIÓN CORREGIDA
// =============================================

import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Form, InputGroup, Button, Badge, Modal, Alert, Table } from 'react-bootstrap';
import { Equipo, Integrante, Sistema } from '../../types/contactos';
import ContactosService from '../../services/ContactosService';
import { ROLES_DISPONIBLES } from '../../pages/ContactosPage';
import Swal from 'sweetalert2';

interface AgendaEquiposProps {
  equipos: Equipo[];
  integrantes: Integrante[];
  sistemas: Sistema[];
  searchTerm: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filtroDisponibilidad: string;
  onFiltroDisponibilidadChange: (value: string) => void;
  filtroEquipo: string;
  onFiltroEquipoChange: (value: string) => void;
  onReload: () => void;
}

const AgendaEquipos: React.FC<AgendaEquiposProps> = ({
  equipos,
  integrantes,
  sistemas,
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
  const [showAsignacionModal, setShowAsignacionModal] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para expandir integrantes
  const [expandedIntegrantes, setExpandedIntegrantes] = useState<{[key: number]: boolean}>({});

  // ✅ EFECTO PARA CERRAR DROPDOWNS AL HACER CLICK FUERA
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdowns = document.querySelectorAll('.dropdown-menu.show');
      dropdowns.forEach(dropdown => {
        const dropdownParent = dropdown.closest('.dropdown');
        if (dropdownParent && !dropdownParent.contains(event.target as Node)) {
          dropdown.classList.remove('show');
        }
      });
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Estados para formularios
  const [equipoForm, setEquipoForm] = useState({
    nombre: '',
    descripcion: '',
    telefono_guardia: '',
    email_grupo: '',
    color: '#007bff'
  });

  // Estados para asignaciones
  const [integrantesSeleccionados, setIntegrantesSeleccionados] = useState<number[]>([]);
  const [sistemasSeleccionados, setSistemasSeleccionados] = useState<number[]>([]);

  // ✅ FUNCIÓN PARA LIMPIAR DATOS DEL BACKEND
  const limpiarIntegrante = (integrante: any) => {
    return {
      ...integrante,
      nombre: (integrante.nombre || '').toString().trim(),
      apellido: (integrante.apellido || '').toString().trim(),
      es_coordinador: Boolean(integrante.es_coordinador === true || integrante.es_coordinador === 1),
      rol: integrante.rol ? integrante.rol.toString().trim() : null,
      telefono_personal: integrante.telefono_personal ? integrante.telefono_personal.toString().trim() : null,
      whatsapp: integrante.whatsapp ? integrante.whatsapp.toString().trim() : null
    };
  };

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

  // ✅ FUNCIÓN PARA ORDENAR INTEGRANTES (CORREGIDA)
  const ordenarIntegrantes = (integrantes: Integrante[]) => {
    return [...integrantes].map(limpiarIntegrante).sort((a, b) => {
      // Coordinadores primero - Verificación explícita de booleanos
      const aEsCoord = a.es_coordinador === true;
      const bEsCoord = b.es_coordinador === true;
      
      if (aEsCoord && !bEsCoord) return -1;
      if (!aEsCoord && bEsCoord) return 1;
      
      // Luego por disponibilidad (disponibles primero)
      const disponibilidadOrder: { [key: string]: number } = { 
        'disponible': 0, 
        'ocupado': 1, 
        'inactivo': 2 
      };
      const orderA = disponibilidadOrder[a.disponibilidad] ?? 3;
      const orderB = disponibilidadOrder[b.disponibilidad] ?? 3;
      
      if (orderA !== orderB) return orderA - orderB;
      
      // Finalmente por nombre (limpio)
      const nombreA = `${a.nombre} ${a.apellido}`.trim();
      const nombreB = `${b.nombre} ${b.apellido}`.trim();
      
      return nombreA.localeCompare(nombreB);
    });
  };

  // Función para alternar la expansión de integrantes
  const toggleExpandIntegrantes = (equipoId: number) => {
    setExpandedIntegrantes(prev => ({
      ...prev,
      [equipoId]: !prev[equipoId]
    }));
  };

  const handleContacto = (tipo: 'telefono' | 'whatsapp', numero?: string) => {
    if (tipo === 'telefono') {
      ContactosService.abrirLlamada(numero);
    } else {
      ContactosService.abrirWhatsApp(numero, 'Hola, me comunico por un incidente técnico.');
    }
  };

  // ✅ CREAR/EDITAR EQUIPO
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

  // ✅ ASIGNAR INTEGRANTES Y SISTEMAS
  const handleOpenAsignacionModal = (equipo: Equipo) => {
    setSelectedEquipo(equipo);
    
    // Pre-seleccionar integrantes actuales
    const integrantesActuales = equipo.integrantes?.map(i => i.id) || [];
    setIntegrantesSeleccionados(integrantesActuales);
    
    // Pre-seleccionar sistemas actuales
    const sistemasActuales = equipo.sistemas?.map(s => s.id) || [];
    setSistemasSeleccionados(sistemasActuales);
    
    setShowAsignacionModal(true);
    setError(null);
  };

  const handleSaveAsignaciones = async () => {
    if (!selectedEquipo) return;

    setLoading(true);
    try {
      await ContactosService.asignarIntegrantes(selectedEquipo.id, integrantesSeleccionados);
      await ContactosService.asignarSistemas(selectedEquipo.id, sistemasSeleccionados);
      
      setShowAsignacionModal(false);
      
      Swal.fire({
        title: '¡Éxito!',
        text: 'Asignaciones guardadas correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      onReload();
    } catch (err: any) {
      console.error('Error al asignar:', err);
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

  // ✅ ELIMINAR EQUIPO CON SWEETALERT
  const handleDeleteEquipo = (equipo: Equipo) => {
    Swal.fire({
      title: '¿Estás seguro?',
      html: `¿Deseas eliminar el equipo <strong>"${equipo.nombre}"</strong>?<br><br>
             <small class="text-muted">Esta acción eliminará permanentemente el equipo y todas sus asignaciones.</small>`,
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
          await ContactosService.deleteEquipo(equipo.id);
          
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El equipo ha sido eliminado correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          
          onReload();
        } catch (err: any) {
          console.error('Error al eliminar equipo:', err);
          Swal.fire({
            title: 'Error',
            text: 'Error al eliminar el equipo',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleToggleIntegrante = (integranteId: number) => {
    setIntegrantesSeleccionados(prev => 
      prev.includes(integranteId) 
        ? prev.filter(id => id !== integranteId)
        : [...prev, integranteId]
    );
  };

  const handleToggleSistema = (sistemaId: number) => {
    setSistemasSeleccionados(prev => 
      prev.includes(sistemaId) 
        ? prev.filter(id => id !== sistemaId)
        : [...prev, sistemaId]
    );
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
                  placeholder="Buscar equipos, integrantes o sistemas..."
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
                onClick={() => handleOpenEquipoModal()}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Nuevo Equipo
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

      {/* Grid de Equipos - ✅ COMPACTAS CON EXPANSIÓN CORREGIDA Y ALTURA UNIFORME */}
      <Row>
        {equiposFiltrados.map(equipo => {
          const integrantesOrdenados = equipo.integrantes ? ordenarIntegrantes(equipo.integrantes) : [];
          const expandido = expandedIntegrantes[equipo.id];

          return (
            <Col lg={4} md={6} key={equipo.id} className="mb-4 d-flex">
              <Card className="shadow-sm hover-effect w-100 d-flex flex-column" style={{ borderLeft: `4px solid ${equipo.color}` }}>
                {/* ✅ HEADER CON ALTURA FIJA */}
                <Card.Header 
                  style={{ 
                    backgroundColor: equipo.color, 
                    color: 'white',
                    minHeight: '140px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="flex-grow-1">
                      <h5 className="mb-2 text-truncate" title={equipo.nombre}>{equipo.nombre}</h5>
                      {/* ✅ DESCRIPCIÓN CON ALTURA AUMENTADA PARA MOSTRAR MÁS TEXTO */}
                      <div 
                        className="opacity-75 small"
                        style={{ 
                          height: '48px', 
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: '1.4'
                        }}
                        title={equipo.descripcion}
                      >
                        {equipo.descripcion || 'Sin descripción'}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                      <Badge bg="light" text="dark" className="small">
                        {equipo.integrantes_disponibles}/{equipo.total_integrantes}
                      </Badge>
                      <div className="dropdown">
                        <Button
                          variant="outline-light"
                          size="sm"
                          id={`dropdown-${equipo.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const dropdownElement = e.currentTarget.nextElementSibling;
                            if (dropdownElement) {
                              dropdownElement.classList.toggle('show');
                            }
                          }}
                          title="Opciones"
                        >
                          <i className="bi bi-three-dots-vertical"></i>
                        </Button>
                        <ul className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                          <li>
                            <button 
                              className="dropdown-item"
                              onClick={() => handleOpenEquipoModal(equipo)}
                            >
                              <i className="bi bi-pencil me-2"></i>
                              Editar
                            </button>
                          </li>
                          <li>
                            <button 
                              className="dropdown-item"
                              onClick={() => handleOpenAsignacionModal(equipo)}
                            >
                              <i className="bi bi-person-plus me-2"></i>
                              Asignar
                            </button>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button 
                              className="dropdown-item text-danger"
                              onClick={() => handleDeleteEquipo(equipo)}
                            >
                              <i className="bi bi-trash me-2"></i>
                              Eliminar
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* ✅ SISTEMAS CON TOOLTIP INFORMATIVO */}
                  <div className="mt-auto">
                    {equipo.sistemas && equipo.sistemas.length > 0 ? (
                      <div 
                        style={{ minHeight: '28px' }}
                        title={`Sistemas asignados: ${equipo.sistemas.map(s => s.nombre).join(', ')}`}
                      >
                        {equipo.sistemas.slice(0, 3).map(sistema => (
                          <Badge 
                            key={sistema.id} 
                            bg="light" 
                            text="dark" 
                            className="me-1 mb-1" 
                            style={{ fontSize: '0.7rem', cursor: 'help' }}
                            title={sistema.descripcion ? `${sistema.nombre}: ${sistema.descripcion}` : sistema.nombre}
                          >
                            {sistema.nombre.length > 12 ? `${sistema.nombre.slice(0, 12)}...` : sistema.nombre}
                          </Badge>
                        ))}
                        {equipo.sistemas.length > 3 && (
                          <Badge 
                            bg="light" 
                            text="dark" 
                            className="me-1 mb-1" 
                            style={{ fontSize: '0.7rem', cursor: 'help' }}
                            title={`Sistemas adicionales: ${equipo.sistemas.slice(3).map(s => s.nombre).join(', ')}`}
                          >
                            +{equipo.sistemas.length - 3} más
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div style={{ minHeight: '28px' }}>
                        <Badge 
                          bg="light" 
                          text="muted" 
                          className="opacity-50" 
                          style={{ fontSize: '0.7rem' }}
                          title="Este equipo no tiene sistemas asignados"
                        >
                          Sin sistemas
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card.Header>
                
                {/* ✅ BODY CON FLEX-GROW PARA OCUPAR ESPACIO DISPONIBLE */}
                <Card.Body className="pb-2 d-flex flex-column flex-grow-1">
                  {/* Información de contacto del equipo - COMPACTA */}
                  <div className="flex-grow-1">
                    {equipo.telefono_guardia && (
                      <>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-telephone me-2 text-primary"></i>
                            <strong className="small">Guardia:</strong>
                          </div>
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
                        <div className="mb-2">
                          <small className="text-muted">
                            {ContactosService.formatearTelefono(equipo.telefono_guardia)}
                          </small>
                        </div>
                      </>
                    )}

                    {equipo.email_grupo && (
                      <div className="mb-2">
                        <div className="d-flex align-items-start">
                          <i className="bi bi-envelope me-2 text-info flex-shrink-0 mt-1"></i>
                          <div className="flex-grow-1 min-width-0">
                            <strong className="small">Email:</strong>
                            <div className="text-muted text-truncate small" title={equipo.email_grupo}>
                              {equipo.email_grupo}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ✅ CONTADOR DE INTEGRANTES SIEMPRE AL FINAL CON TOOLTIP */}
                  <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                    <span 
                      className="text-muted small"
                      title={integrantesOrdenados.length > 0 ? 
                        `Integrantes: ${integrantesOrdenados.map(i => `${i.nombre} ${i.apellido}${i.es_coordinador ? ' (Coordinador)' : ''}`).join(', ')}` : 
                        'No hay integrantes asignados'
                      }
                    >
                      <strong>Integrantes ({integrantesOrdenados.length}):</strong>
                    </span>
                    {integrantesOrdenados.length > 0 && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => toggleExpandIntegrantes(equipo.id)}
                        title={expandido ? "Ocultar integrantes" : "Ver integrantes"}
                      >
                        <i className={`bi ${expandido ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                      </Button>
                    )}
                  </div>
                </Card.Body>

                {/* ✅ Lista de integrantes - EXPANDIBLE CORREGIDA */}
                {expandido && integrantesOrdenados.length > 0 && (
                  <Card.Body className="pt-0 border-top">
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {integrantesOrdenados.map(integrante => (
                        <div key={integrante.id} className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" 
                             style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                          <div className="flex-grow-1 min-width-0">
                            <div className="d-flex align-items-center">
                              <span 
                                className="badge rounded-pill me-2"
                                style={{ 
                                  backgroundColor: ContactosService.getColorByDisponibilidad(integrante.disponibilidad),
                                  width: '8px',
                                  height: '8px'
                                }}
                              ></span>
                              {/* ✅ CORRECCIÓN: Solo mostrar nombre limpio */}
                              <strong className="text-truncate" title={`${integrante.nombre} ${integrante.apellido}`}>
                                {integrante.nombre} {integrante.apellido}
                              </strong>
                              {/* ✅ CORRECCIÓN: Verificación explícita del coordinador */}
                              {integrante.es_coordinador === true && (
                                <Badge bg="warning" text="dark" className="ms-2 flex-shrink-0" style={{ fontSize: '0.7rem' }}>
                                  <i className="bi bi-star-fill me-1"></i>
                                  Coord.
                                </Badge>
                              )}
                            </div>
                            {integrante.rol && (
                              <small className="text-muted text-truncate d-block" title={integrante.rol}>
                                {integrante.rol}
                              </small>
                            )}
                            {integrante.telefono_personal && (
                              <small className="text-muted d-block">
                                {ContactosService.formatearTelefono(integrante.telefono_personal)}
                              </small>
                            )}
                          </div>
                          
                          <div className="flex-shrink-0">
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
                                onClick={() => handleContacto('telefono', integrante.telefono_personal)}
                                title="Llamar"
                              >
                                <i className="bi bi-telephone"></i>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                )}

                {/* ✅ Mensaje cuando no hay integrantes - ALTURA FIJA */}
                {integrantesOrdenados.length === 0 && !expandido && (
                  <Card.Body className="pt-0 text-center" style={{ minHeight: '80px' }}>
                    <i className="bi bi-person-plus text-muted fs-5"></i>
                    <p className="text-muted mb-2 small">Sin integrantes asignados</p>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleOpenAsignacionModal(equipo)}
                    >
                      Asignar Integrantes
                    </Button>
                  </Card.Body>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {equiposFiltrados.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-search fs-1 text-muted mb-3"></i>
          <p className="text-muted">No se encontraron equipos que coincidan con los filtros aplicados</p>
        </div>
      )}

      {/* ✅ MODAL CREAR/EDITAR EQUIPO */}
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
                    placeholder="Ej: Equipo de Desarrollo Frontend"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Color de Identificación</Form.Label>
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
                placeholder="Describe las responsabilidades del equipo..."
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
                  <Form.Text className="text-muted">
                    Número principal para emergencias
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email del Grupo</Form.Label>
                  <Form.Control
                    type="email"
                    value={equipoForm.email_grupo}
                    onChange={(e) => setEquipoForm({ ...equipoForm, email_grupo: e.target.value })}
                    placeholder="equipo.desarrollo@empresa.com"
                  />
                  <Form.Text className="text-muted">
                    Lista de distribución del equipo
                  </Form.Text>
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

      {/* ✅ MODAL ASIGNAR INTEGRANTES Y SISTEMAS */}
      <Modal show={showAsignacionModal} onHide={() => setShowAsignacionModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            Asignar Integrantes y Sistemas - {selectedEquipo?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {error && (
            <Alert variant="danger">{error}</Alert>
          )}
          
          <Row>
            {/* Columna de Integrantes */}
            <Col md={6}>
              <Card className="h-100">
                <Card.Header className="bg-primary text-white">
                  <h6 className="mb-0">
                    <i className="bi bi-people me-2"></i>
                    Integrantes Disponibles
                  </h6>
                </Card.Header>
                <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {integrantes.length > 0 ? (
                    integrantes.map(integrante => {
                      const integranteLimpio = limpiarIntegrante(integrante);
                      return (
                        <Form.Check
                          key={integranteLimpio.id}
                          type="checkbox"
                          id={`integrante-${integranteLimpio.id}`}
                          className="mb-2 p-2 border rounded"
                          checked={integrantesSeleccionados.includes(integranteLimpio.id)}
                          onChange={() => handleToggleIntegrante(integranteLimpio.id)}
                          label={
                            <div>
                              <strong>{integranteLimpio.nombre} {integranteLimpio.apellido}</strong>
                              {integranteLimpio.es_coordinador === true && (
                                <Badge bg="warning" text="dark" className="ms-2" style={{ fontSize: '0.7rem' }}>
                                  Coordinador
                                </Badge>
                              )}
                              {integranteLimpio.rol && (
                                <div className="text-muted small">{integranteLimpio.rol}</div>
                              )}
                              <div className="d-flex align-items-center mt-1">
                                <span 
                                  className="badge rounded-pill me-2"
                                  style={{ 
                                    backgroundColor: ContactosService.getColorByDisponibilidad(integranteLimpio.disponibilidad),
                                    width: '8px',
                                    height: '8px'
                                  }}
                                ></span>
                                <small className="text-muted">{integranteLimpio.disponibilidad}</small>
                              </div>
                            </div>
                          }
                        />
                      );
                    })
                  ) : (
                    <p className="text-muted text-center">
                      No hay integrantes disponibles
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Columna de Sistemas */}
            <Col md={6}>
              <Card className="h-100">
                <Card.Header className="bg-info text-white">
                  <h6 className="mb-0">
                    <i className="bi bi-diagram-3 me-2"></i>
                    Sistemas Monitoreados
                  </h6>
                </Card.Header>
                <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {sistemas.length > 0 ? (
                    sistemas.map(sistema => (
                      <Form.Check
                        key={sistema.id}
                        type="checkbox"
                        id={`sistema-${sistema.id}`}
                        className="mb-2 p-2 border rounded"
                        checked={sistemasSeleccionados.includes(sistema.id)}
                        onChange={() => handleToggleSistema(sistema.id)}
                        label={
                          <div>
                            <strong>{sistema.nombre}</strong>
                            {sistema.categoria && (
                              <Badge bg="secondary" className="ms-2 small">
                                {sistema.categoria}
                              </Badge>
                            )}
                            <Badge 
                              bg={sistema.criticidad === 'alta' ? 'danger' : sistema.criticidad === 'media' ? 'warning' : 'success'} 
                              className="ms-1 small"
                            >
                              {sistema.criticidad.toUpperCase()}
                            </Badge>
                            {sistema.descripcion && (
                              <div className="text-muted small mt-1">{sistema.descripcion}</div>
                            )}
                          </div>
                        }
                      />
                    ))
                  ) : (
                    <p className="text-muted text-center">
                      No hay sistemas disponibles
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Alert variant="info" className="mt-3">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Selecciona los integrantes y sistemas</strong> que formarán parte de este equipo. 
            Puedes modificar estas asignaciones en cualquier momento.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <div className="me-auto">
            <small className="text-muted">
              {integrantesSeleccionados.length} integrantes y {sistemasSeleccionados.length} sistemas seleccionados
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

      <style>{`
        .hover-effect {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-effect:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        /* Dropdown manual styles */
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          z-index: 1000;
          display: none;
          min-width: 140px;
          padding: 0.5rem 0;
          margin: 0.125rem 0 0;
          font-size: 0.875rem;
          color: #212529;
          text-align: left;
          list-style: none;
          background-color: #fff;
          background-clip: padding-box;
          border: 1px solid rgba(0,0,0,.15);
          border-radius: 0.375rem;
          box-shadow: 0 0.5rem 1rem rgba(0,0,0,.175);
        }
        
        .dropdown-menu.show {
          display: block;
        }
        
        .dropdown-item {
          display: block;
          width: 100%;
          padding: 0.25rem 1rem;
          clear: both;
          font-weight: 400;
          color: #212529;
          text-align: inherit;
          text-decoration: none;
          white-space: nowrap;
          background-color: transparent;
          border: 0;
        }
        
        .dropdown-item:hover,
        .dropdown-item:focus {
          color: #1e2125;
          background-color: #e9ecef;
        }
        
        .dropdown-divider {
          height: 0;
          margin: 0.5rem 0;
          overflow: hidden;
          border-top: 1px solid rgba(0,0,0,.15);
        }
        
        /* Fix para texto largo que se desborda */
        .min-width-0 {
          min-width: 0;
        }
        
        .text-truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        /* Cerrar dropdown al hacer click afuera */
        .dropdown {
          position: relative;
        }
      `}</style>
    </>
  );
};

export default AgendaEquipos;