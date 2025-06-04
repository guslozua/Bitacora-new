import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Button,
  Row,
  Col,
  Badge,
  Alert,
  Spinner
} from 'react-bootstrap';
import hitoService from '../../services/hitoService';
import type { 
  HitoCompleto, 
  HitoFormData, 
  Usuario, 
  Proyecto,
  HitoRol,
  HitoFormProps
} from '../../types/hitos.types';

const HitoForm: React.FC<HitoFormProps> = ({ show, onHide, onSave, hito }) => {
  const initialFormState: HitoFormData = {
    nombre: '',
    descripcion: '',
    impacto: '',
    fecha_inicio: null,
    fecha_fin: null,
    id_proyecto_origen: null,
    usuarios: []
  };

  const [formData, setFormData] = useState<HitoFormData>(initialFormState);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (show) {
      setLoadingData(true);
      setApiError(null);
      
      Promise.all([
        fetchUsuarios(),
        fetchProyectos()
      ]).then(() => {
        if (hito) {
          // Editar hito existente
          setFormData({
            nombre: hito.nombre || '',
            descripcion: hito.descripcion || '',
            impacto: hito.impacto || '',
            fecha_inicio: hito.fecha_inicio ? hito.fecha_inicio.split('T')[0] : null,
            fecha_fin: hito.fecha_fin ? hito.fecha_fin.split('T')[0] : null,
            id_proyecto_origen: hito.id_proyecto_origen || null,
            usuarios: hito.usuarios?.map(u => ({
              id_usuario: u.id_usuario,
              rol: u.rol as HitoRol
            })) || []
          });
          setSelectedUsers(hito.usuarios?.map(u => u.id_usuario) || []);
        } else {
          // Nuevo hito
          setFormData(initialFormState);
          setSelectedUsers([]);
        }
        setErrors({});
      }).catch(error => {
        console.error('Error al cargar datos:', error);
        setApiError('Error al cargar los datos necesarios para el formulario');
      }).finally(() => {
        setLoadingData(false);
      });
    }
  }, [show, hito]);

  // Obtener usuarios del sistema usando el servicio
  const fetchUsuarios = async (): Promise<void> => {
    try {
      const data = await hitoService.getUsers();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      setUsuarios([]);
      setApiError('Error al cargar la lista de usuarios');
    }
  };

  // Obtener proyectos del sistema usando el servicio
  const fetchProyectos = async (): Promise<void> => {
    try {
      const data = await hitoService.getProjects();
      setProyectos(data);
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
      setProyectos([]);
      setApiError('Error al cargar la lista de proyectos');
    }
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    
    let processedValue: any = value;
    
    // Procesar valores especiales
    if (name === 'id_proyecto_origen') {
      processedValue = value ? parseInt(value) : null;
    } else if (name === 'fecha_inicio' || name === 'fecha_fin') {
      processedValue = value || null;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Manejar selección de usuarios
  const handleUserSelection = (userId: number): void => {
    const user = usuarios.find(u => u.id === userId);
    if (!user) return;

    if (selectedUsers.includes(userId)) {
      // Remover usuario
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
      setFormData(prev => ({
        ...prev,
        usuarios: prev.usuarios?.filter(u => u.id_usuario !== userId) || []
      }));
    } else {
      // Agregar usuario
      setSelectedUsers([...selectedUsers, userId]);
      setFormData(prev => ({
        ...prev,
        usuarios: [
          ...(prev.usuarios || []),
          {
            id_usuario: userId,
            rol: 'colaborador' as HitoRol
          }
        ]
      }));
    }
  };

  // Cambiar rol de usuario
  const handleUserRoleChange = (userId: number, newRole: string): void => {
    setFormData(prev => ({
      ...prev,
      usuarios: prev.usuarios?.map(u => 
        u.id_usuario === userId ? { ...u, rol: newRole as HitoRol } : u
      ) || []
    }));
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    if (formData.fecha_inicio && formData.fecha_fin && 
        new Date(formData.fecha_inicio) > new Date(formData.fecha_fin)) {
      newErrors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      await onSave(formData);
      handleClose();
    } catch (error) {
      console.error('Error al guardar hito:', error);
      setApiError('Error al guardar el hito. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    setFormData(initialFormState);
    setSelectedUsers([]);
    setErrors({});
    setApiError(null);
    onHide();
  };

  // Mostrar spinner mientras se cargan los datos
  if (loadingData) {
    return (
      <Modal show={show} onHide={handleClose} size="lg" centered>
        <Modal.Body className="text-center p-5">
          <Spinner animation="border" role="status" variant="primary" />
          <p className="mt-3 mb-0">Cargando datos del formulario...</p>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {hito ? 'Editar Hito' : 'Crear Nuevo Hito'}
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Error de API */}
          {apiError && (
            <Alert variant="danger" dismissible onClose={() => setApiError(null)}>
              {apiError}
            </Alert>
          )}

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre del Hito *</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  isInvalid={!!errors.nombre}
                  required
                  disabled={loading}
                  placeholder="Ingrese el nombre del hito"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.nombre}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha de Inicio</Form.Label>
                <Form.Control
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio || ''}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha de Fin</Form.Label>
                <Form.Control
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin || ''}
                  onChange={handleChange}
                  isInvalid={!!errors.fecha_fin}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.fecha_fin}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="descripcion"
                  value={formData.descripcion || ''}
                  onChange={handleChange}
                  placeholder="Describe el hito..."
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Impacto</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="impacto"
                  value={formData.impacto || ''}
                  onChange={handleChange}
                  placeholder="Describe el impacto del hito..."
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Proyecto Origen</Form.Label>
                <Form.Select
                  name="id_proyecto_origen"
                  value={formData.id_proyecto_origen || ''}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Ninguno (Hito Manual)</option>
                  {proyectos.map((proyecto) => (
                    <option key={proyecto.id} value={proyecto.id}>
                      {proyecto.nombre}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Seleccione un proyecto si este hito se deriva de un proyecto existente
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Usuarios Asignados</Form.Label>
                <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {usuarios.length === 0 ? (
                    <p className="text-muted mb-0">No hay usuarios disponibles</p>
                  ) : (
                    usuarios.map((usuario) => (
                      <div key={usuario.id} className="d-flex align-items-center mb-2">
                        <Form.Check
                          type="checkbox"
                          id={`user-${usuario.id}`}
                          checked={selectedUsers.includes(usuario.id)}
                          onChange={() => handleUserSelection(usuario.id)}
                          className="me-2"
                          disabled={loading}
                        />
                        <div className="flex-grow-1">
                          <label htmlFor={`user-${usuario.id}`} className="mb-0" style={{ cursor: 'pointer' }}>
                            {usuario.nombre} ({usuario.email})
                          </label>
                        </div>
                        {selectedUsers.includes(usuario.id) && (
                          <Form.Select
                            size="sm"
                            style={{ width: '120px' }}
                            value={formData.usuarios?.find(u => u.id_usuario === usuario.id)?.rol || 'colaborador'}
                            onChange={(e) => handleUserRoleChange(usuario.id, e.target.value)}
                            disabled={loading}
                          >
                            <option value="colaborador">Colaborador</option>
                            <option value="responsable">Responsable</option>
                            <option value="supervisor">Supervisor</option>
                          </Form.Select>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <Form.Text className="text-muted">
                  Seleccione los usuarios que participaron en este hito
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* Mostrar usuarios seleccionados */}
          {formData.usuarios && formData.usuarios.length > 0 && (
            <Row>
              <Col md={12}>
                <h6>Usuarios Seleccionados:</h6>
                <div className="mb-3">
                  {formData.usuarios.map((usuario) => {
                    const usuarioCompleto = usuarios.find(u => u.id === usuario.id_usuario);
                    return (
                      <Badge 
                        key={usuario.id_usuario} 
                        bg="primary" 
                        className="me-2 mb-1"
                      >
                        {usuarioCompleto?.nombre || 'Usuario'} ({usuario.rol})
                      </Badge>
                    );
                  })}
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={loading || loadingData}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                {hito ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              hito ? 'Actualizar' : 'Crear'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default HitoForm;