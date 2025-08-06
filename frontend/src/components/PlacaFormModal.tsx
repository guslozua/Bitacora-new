import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiConfig';
import Swal from 'sweetalert2';

// 🔐 IMPORTS PARA EL SISTEMA DE PERMISOS
import PermissionGate from './PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import { PLACA_PERMISSIONS, USER_PERMISSIONS } from '../utils/permissions';

interface Placa {
  id?: number;
  numero_placa: string;
  titulo: string;
  descripcion: string;
  impacto: 'bajo' | 'medio' | 'alto' | null;
  clase: 'Incidente' | 'Comunicado' | 'Mantenimiento';
  sistema: string;
  fecha_inicio: string;
  fecha_cierre?: string | null;
  cerrado_por?: string | null;
  causa_resolutiva?: string | null;
}

interface PlacaFormModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  placa?: Placa | null;
}

const PlacaFormModal: React.FC<PlacaFormModalProps> = ({ show, onHide, onSave, placa = null }) => {
  // 🔐 HOOK PARA VERIFICAR PERMISOS
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  
  // 🔐 VERIFICAR ACCESO AL MODAL
  const isEditMode = !!placa?.id;
  const canAccessModal = isEditMode 
    ? hasPermission(PLACA_PERMISSIONS.EDIT_PLACA)
    : hasPermission(PLACA_PERMISSIONS.CREATE_PLACA);

  // Función para obtener la fecha y hora actual en formato ISO local
  const getCurrentLocalISOString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const defaultPlaca: Placa = {
    numero_placa: '',
    titulo: '',
    descripcion: '',
    impacto: 'bajo',  // Por defecto será medio para incidentes
    clase: 'Incidente',
    sistema: 'No aplica',
    fecha_inicio: getCurrentLocalISOString(),
    fecha_cierre: '',
    cerrado_por: '',
    causa_resolutiva: ''
  };

  const [formData, setFormData] = useState<Placa>(placa || defaultPlaca);
  const [loading, setLoading] = useState(false);
  const [minFechaCierre, setMinFechaCierre] = useState(formData.fecha_inicio || '');

  // Lista de usuarios para el campo "Cerrado por"
  const usuariosCierre = [
    'Brian Ledezma',
    'Sabrina Bustos',
    'Jaime Ocampo',
    'Gustavo Lozua',
    'Pablo Palomanes',
    'Guillermo Jacob',
    'Diego D´Agostino',
    'Carlos Beltrame Pertersen',
    'Luciano Centurion',
    'Gaston Mingarelli'
  ];

  // Lista de sistemas disponibles
  const sistemasDisponibles = [
    'Citrix', 'Doble Factor', 'Eflow', 'Enlace', 'EQA', 
    'Form. Responsys', 'Form. Web', 'Genesys Administrator', 
    'Genesys Chat y Mail', 'Genesys Pic', 'GI2', 'Idaptive', 
    'Infraestructura Terceros', 'IVR', 'Pulse', 'Red', 
    'Red Corporativa (Teco)', 'Social+', 'Speech Miner/ GIR', 
    'Tuid', 'TuidCloud', 'TuidFedCloud', 'Virtual Access', 'No aplica'
  ];

  useEffect(() => {
    if (show) {
      if (placa) {
        setFormData(placa);
        setMinFechaCierre(placa.fecha_inicio);
      } else {
        const currentLocalDateTime = getCurrentLocalISOString();
        const newDefaultPlaca = {
          ...defaultPlaca,
          fecha_inicio: currentLocalDateTime
        };
        setFormData(newDefaultPlaca);
        setMinFechaCierre(currentLocalDateTime);
      }
    }
  }, [show, placa]);

  // Manejar cambios en la fecha de inicio para validar la fecha de cierre
  const handleFechaInicioChange = (value: string) => {
    setMinFechaCierre(value);
    
    // Si hay fecha de cierre, verificar que siga siendo válida
    if (formData.fecha_cierre) {
      const fechaInicio = new Date(value);
      const fechaCierre = new Date(formData.fecha_cierre);
      
      // Si la fecha/hora de cierre es menor o igual a la nueva fecha/hora de inicio, resetearla
      if (fechaCierre.getTime() <= fechaInicio.getTime()) {
        setFormData(prev => ({
          ...prev,
          fecha_inicio: value,
          fecha_cierre: ''
        }));
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, fecha_inicio: value }));
  };

  // Manejar cambio en la clase de placa
  const handleClaseChange = (value: string) => {
    // Si no es incidente, establecer impacto a null
    if (value !== 'Incidente') {
      setFormData(prev => ({
        ...prev,
        clase: value as 'Comunicado' | 'Mantenimiento' | 'Incidente',
        impacto: null
      }));
    } else {
      // Si es incidente, establecer impacto a medio por defecto
      setFormData(prev => ({
        ...prev,
        clase: value as 'Incidente',
        impacto: 'medio'
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'fecha_inicio') {
      handleFechaInicioChange(value);
    } else if (name === 'clase') {
      handleClaseChange(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.numero_placa) return 'El número de placa es obligatorio';
    if (!formData.titulo) return 'El título es obligatorio';
    if (formData.clase === 'Incidente' && !formData.impacto) return 'El impacto es obligatorio para incidentes';
    if (!formData.clase) return 'La clase es obligatoria';
    if (!formData.sistema) return 'El sistema es obligatorio';
    if (!formData.fecha_inicio) return 'La fecha de inicio es obligatoria';
    
    // Validar que la fecha y hora de cierre sea posterior a la fecha y hora de inicio
    if (formData.fecha_cierre) {
      const fechaInicio = new Date(formData.fecha_inicio);
      const fechaCierre = new Date(formData.fecha_cierre);
      
      // Comparar los timestamps (que incluyen fecha Y hora)
      if (fechaCierre.getTime() <= fechaInicio.getTime()) {
        return 'La fecha y hora de cierre debe ser posterior a la fecha y hora de inicio';
      }
    }
    
    // Si hay fecha de cierre, debe haber causa resolutiva y cerrado por
    if (formData.fecha_cierre && !formData.cerrado_por) {
      return 'Si hay fecha de cierre, debe indicar quién cerró la placa';
    }
    if (formData.fecha_cierre && !formData.causa_resolutiva) {
      return 'Si hay fecha de cierre, debe indicar la causa resolutiva';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: validationError,
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    
    // Mostrar confirmación antes de guardar
    const result = await Swal.fire({
      title: placa?.id ? '¿Actualizar placa?' : '¿Guardar nueva placa?',
      text: `Confirme para ${placa?.id ? 'actualizar' : 'guardar'} la placa ${formData.numero_placa}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: placa?.id ? 'Actualizar' : 'Guardar',
      cancelButtonText: 'Cancelar'
    });
    
    if (!result.isConfirmed) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Si no es incidente, asegúrate de que impacto sea null
      const dataToSend = { 
        ...formData,
        impacto: formData.clase === 'Incidente' ? formData.impacto : null
      };
      
      if (placa?.id) {
        // Actualizar placa existente
        await axios.put(`${API_BASE_URL}/placas/${placa.id}`, dataToSend);
        
        Swal.fire({
          icon: 'success',
          title: 'Placa actualizada',
          text: 'La placa se ha actualizado correctamente',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        // Crear nueva placa
        await axios.post(`${API_BASE_URL}/placas`, dataToSend);
        Swal.fire({
          icon: 'success',
          title: 'Placa creada',
          text: 'La placa se ha creado correctamente',
          timer: 1500,
          showConfirmButton: false
        });
      }
      
      // Esperar un poco para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        onSave();
        onHide();
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al guardar la placa';
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha para input datetime-local
  const formatDateForInput = (isoDate: string | null | undefined) => {
    if (!isoDate) return '';
    return isoDate.slice(0, 16); // Formato YYYY-MM-DDTHH:MM
  };

  // Manejar cierre del modal con confirmación si hay cambios
  const handleModalClose = () => {
    if (JSON.stringify(formData) !== JSON.stringify(placa || defaultPlaca)) {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Los cambios no guardados se perderán',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'No, continuar editando'
      }).then((result) => {
        if (result.isConfirmed) {
          onHide();
        }
      });
    } else {
      onHide();
    }
  };

  // 🔐 SI NO HAY PERMISOS DE ACCESO, MOSTRAR MODAL DE ACCESO DENEGADO
  if (!permissionsLoading && !canAccessModal) {
    return (
      <Modal 
        show={show} 
        onHide={onHide} 
        backdrop="static" 
        size="sm" 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-shield-x text-danger me-2"></i>
            Acceso Denegado
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <i className="bi bi-file-earmark-x fs-1 text-muted mb-3 d-block"></i>
          <h5 className="text-muted">Sin permisos para {isEditMode ? 'editar' : 'crear'} placas</h5>
          <p className="text-muted">No tienes los permisos necesarios para {isEditMode ? 'editar esta' : 'crear una nueva'} placa.</p>
          <p className="small text-muted">Contacta al administrador si necesitas acceso a esta funcionalidad.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal 
      show={show} 
      onHide={handleModalClose} 
      backdrop="static" 
      size="lg" 
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {placa?.id ? 'Editar Placa' : 'Nueva Placa'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Group controlId="numero_placa">
                <Form.Label>Número de Placa</Form.Label>
                <Form.Control
                  type="text"
                  name="numero_placa"
                  value={formData.numero_placa}
                  onChange={handleChange}
                  placeholder="Ej: PLACA-2025-001"
                  required
                />
              </Form.Group>
            </div>
            
            {/* Clase de placa */}
            <div className="col-md-6">
              <Form.Group controlId="clase">
                <Form.Label>Clase</Form.Label>
                <Form.Select
                  name="clase"
                  value={formData.clase}
                  onChange={handleChange}
                  required
                >
                  <option value="Incidente">Incidente</option>
                  <option value="Comunicado">Comunicado</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                </Form.Select>
              </Form.Group>
            </div>
            
            {/* Nivel de impacto (solo para incidentes) */}
            <div className="col-md-6">
              <Form.Group controlId="impacto">
                <Form.Label>
                  Nivel de Impacto 
                  {formData.clase !== 'Incidente' && 
                    <span className="text-muted"> (Solo para Incidentes)</span>
                  }
                </Form.Label>
                <Form.Select
                  name="impacto"
                  value={formData.impacto || ''}
                  onChange={handleChange}
                  disabled={formData.clase !== 'Incidente'}
                  required={formData.clase === 'Incidente'}
                  className={formData.clase !== 'Incidente' ? 'bg-light text-muted' : ''}
                >
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </Form.Select>
                {formData.clase !== 'Incidente' && (
                  <Form.Text className="text-muted">
                    El nivel de impacto solo aplica para Incidentes
                  </Form.Text>
                )}
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group controlId="sistema">
                <Form.Label>Sistema Afectado</Form.Label>
                
                {/* 🔐 LISTA DE SISTEMAS - Control granular */}
                <PermissionGate 
                  permission={PLACA_PERMISSIONS.MANAGE_PLACA_SYSTEMS}
                  fallback={
                    <>
                      <Form.Select
                        name="sistema"
                        value={formData.sistema}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- Seleccione Sistema --</option>
                        {/* Lista limitada para usuarios sin permisos especiales */}
                        <option value="No aplica">No aplica</option>
                        <option value="Red">Red</option>
                        <option value="IVR">IVR</option>
                        <option value="Pulse">Pulse</option>
                        <option value="Virtual Access">Virtual Access</option>
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Lista limitada - Para más sistemas contacte al administrador
                      </Form.Text>
                    </>
                  }
                >
                  <Form.Select
                    name="sistema"
                    value={formData.sistema}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Seleccione Sistema --</option>
                    {sistemasDisponibles.map(sistema => (
                      <option key={sistema} value={sistema}>{sistema}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-success">
                    <i className="bi bi-check-circle me-1"></i>
                    Acceso completo a todos los sistemas
                  </Form.Text>
                </PermissionGate>
              </Form.Group>
            </div>
            
            <div className="col-12">
              <Form.Group controlId="titulo">
                <Form.Label>Título</Form.Label>
                <Form.Control
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Título descriptivo de la placa"
                  required
                />
              </Form.Group>
            </div>
            
            <div className="col-12">
              <Form.Group controlId="descripcion">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción detallada de la placa o novedad"
                />
              </Form.Group>
            </div>
            
            <div className="col-md-6">
              <Form.Group controlId="fecha_inicio">
                <Form.Label>Fecha y Hora de Inicio</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="fecha_inicio"
                  value={formatDateForInput(formData.fecha_inicio)}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            
            {/* 🔐 CAMPOS DE CIERRE - Solo con permiso especial */}
            <PermissionGate 
              permission={PLACA_PERMISSIONS.CLOSE_PLACA}
              fallback={
                <>
                  <div className="col-md-6">
                    <Form.Group controlId="fecha_cierre_readonly">
                      <Form.Label>Fecha y Hora de Cierre</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.fecha_cierre ? new Date(formData.fecha_cierre).toLocaleString('es-AR') : 'Sin cerrar'}
                        disabled
                        className="bg-light"
                      />
                      <Form.Text className="text-muted">
                        No tienes permisos para cerrar placas
                      </Form.Text>
                    </Form.Group>
                  </div>
                  
                  <div className="col-md-6">
                    <Form.Group controlId="cerrado_por_readonly">
                      <Form.Label>Cerrado por</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.cerrado_por || 'No cerrado'}
                        disabled
                        className="bg-light"
                      />
                      <Form.Text className="text-muted">
                        Solo lectura - Sin permisos de cierre
                      </Form.Text>
                    </Form.Group>
                  </div>
                  
                  <div className="col-12">
                    <Form.Group controlId="causa_resolutiva_readonly">
                      <Form.Label>Causa o Acción Resolutiva</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={formData.causa_resolutiva || 'Sin definir'}
                        disabled
                        className="bg-light"
                      />
                      <Form.Text className="text-muted">
                        Solo lectura - Sin permisos de cierre
                      </Form.Text>
                    </Form.Group>
                  </div>
                </>
              }
            >
              <div className="col-md-6">
                <Form.Group controlId="fecha_cierre">
                  <Form.Label>Fecha y Hora de Cierre (opcional)</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="fecha_cierre"
                    value={formatDateForInput(formData.fecha_cierre)}
                    onChange={handleChange}
                    min={minFechaCierre}
                  />
                  <Form.Text className="text-muted">
                    Dejar en blanco si aún no se ha resuelto. Debe ser posterior a la fecha y hora de inicio.
                  </Form.Text>
                </Form.Group>
              </div>
              
              <div className="col-md-6">
                <Form.Group controlId="cerrado_por">
                  <Form.Label>Cerrado por (si aplica)</Form.Label>
                  <PermissionGate 
                    permission={USER_PERMISSIONS.VIEW_USERS}
                    fallback={
                      <Form.Control
                        type="text"
                        value={formData.cerrado_por || ''}
                        placeholder="Usuario que cerró la placa"
                        name="cerrado_por"
                        onChange={handleChange}
                      />
                    }
                  >
                    <Form.Select
                      name="cerrado_por"
                      value={formData.cerrado_por || ''}
                      onChange={handleChange}
                    >
                      <option value="">-- Seleccione Usuario --</option>
                      {usuariosCierre.map(usuario => (
                        <option key={usuario} value={usuario}>{usuario}</option>
                      ))}
                    </Form.Select>
                  </PermissionGate>
                </Form.Group>
              </div>
              
              <div className="col-12">
                <Form.Group controlId="causa_resolutiva">
                  <Form.Label>Causa o Acción Resolutiva (si aplica)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="causa_resolutiva"
                    value={formData.causa_resolutiva || ''}
                    onChange={handleChange}
                    placeholder="Descripción de la solución implementada"
                  />
                </Form.Group>
              </div>
            </PermissionGate>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Cancelar
          </Button>
          
          {/* 🔐 BOTÓN GUARDAR/ACTUALIZAR - Con permisos */}
          <PermissionGate 
            permission={isEditMode ? PLACA_PERMISSIONS.EDIT_PLACA : PLACA_PERMISSIONS.CREATE_PLACA}
            fallback={
              <Button variant="outline-secondary" disabled>
                <i className="bi bi-lock me-2"></i>
                Sin permisos para {isEditMode ? 'actualizar' : 'guardar'}
              </Button>
            }
          >
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading || permissionsLoading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {isEditMode ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                <>
                  <i className={`bi ${isEditMode ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                  {isEditMode ? 'Actualizar' : 'Guardar'}
                </>
              )}
            </Button>
          </PermissionGate>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PlacaFormModal;