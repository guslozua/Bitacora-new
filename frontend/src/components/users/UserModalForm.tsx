// src/components/users/UserModalForm.tsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, Spinner, Modal } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { fetchUserById, createUser, updateUser, UserFormData } from '../../services/userService';
import { fetchAllRoles, Role } from '../../services/roleService';

interface UserModalFormProps {
  show: boolean;
  onHide: () => void;
  userId?: string | null;
  onSuccess: () => void;
}

const UserModalForm: React.FC<UserModalFormProps> = ({ show, onHide, userId, onSuccess }) => {
  const isEditMode = !!userId;
  
  const [formData, setFormData] = useState<UserFormData>({
    nombre: '',
    email: '',
    password: '',
    estado: 'activo',
    roles: []
  });
  
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (show) {
      resetForm();
      loadData();
    }
  }, [show, userId]);
  
  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      password: '',
      estado: 'activo',
      roles: []
    });
    setError(null);
  };
  
  // Cargar datos existentes si estamos en modo edición
  const loadData = async () => {
    if (!show) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Cargar roles disponibles
      try {
        const rolesData = await fetchAllRoles();
        console.log('Roles cargados en UserModalForm:', rolesData);
        setAvailableRoles(rolesData || []);
      } catch (rolesErr) {
        console.error('Error al cargar roles:', rolesErr);
        setError('Error al cargar los roles disponibles');
        setAvailableRoles([]);
      }
      
      // Si estamos en modo edición, cargar datos del usuario
      if (isEditMode && userId) {
        try {
          const userData = await fetchUserById(userId);
          
          if (userData.success && userData.data) {
            setFormData({
              nombre: userData.data.nombre,
              email: userData.data.email,
              password: '', // No mostrar la contraseña actual
              estado: userData.data.estado || 'activo',
              roles: userData.data.roles || []
            });
          } else {
            setError('Error al cargar los datos del usuario');
          }
        } catch (userErr: any) {
          console.error('Error al cargar usuario:', userErr);
          setError(userErr.message || 'Error al cargar los datos del usuario');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Manejar cambios en los roles (checkboxes)
  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    if (checked) {
      // Agregar rol
      setFormData({
        ...formData,
        roles: [...(formData.roles || []), value]
      });
    } else {
      // Quitar rol
      setFormData({
        ...formData,
        roles: (formData.roles || []).filter(role => role !== value)
      });
    }
  };
  
  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setSaving(true);
    
    try {
      // Construir datos para enviar
      const dataToSend: UserFormData = {
        nombre: formData.nombre,
        email: formData.email,
        estado: formData.estado,
        roles: formData.roles
      };
      
      // Solo incluir contraseña si se ha proporcionado una nueva
      if (formData.password) {
        dataToSend.password = formData.password;
      }
      
      let response;
      
      if (isEditMode && userId) {
        // Actualizar usuario existente
        response = await updateUser(userId, dataToSend);
      } else {
        // Crear nuevo usuario
        response = await createUser(dataToSend);
      }
      
      if (response.success) {
        // Mostrar mensaje de éxito con SweetAlert2
        Swal.fire({
          icon: 'success',
          title: isEditMode ? 'Usuario actualizado' : 'Usuario creado',
          text: isEditMode ? 'El usuario ha sido actualizado correctamente.' : 'El usuario ha sido creado correctamente.',
          showConfirmButton: false,
          timer: 1500
        });
        
        // Cerrar modal y notificar éxito
        onHide();
        onSuccess();
      } else {
        throw new Error('Error al guardar los datos');
      }
    } catch (err: any) {
      // Mostrar mensaje de error con SweetAlert2
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || err.message || 'Error al guardar los datos'
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      backdrop="static"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" />
            <p className="mt-2">Cargando datos...</p>
          </div>
        ) : (
          <>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre</Form.Label>
                    <Form.Control
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      placeholder="Nombre del usuario"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Correo electrónico"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>{isEditMode ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!isEditMode}
                      placeholder="Contraseña segura"
                      autoComplete="new-password"
                    />
                    {isEditMode && (
                      <Form.Text className="text-muted">
                        Deja este campo en blanco si no deseas cambiar la contraseña.
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Estado</Form.Label>
                    <Form.Select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="bloqueado">Bloqueado</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-4">
                <Form.Label>Roles</Form.Label>
                {availableRoles.length === 0 ? (
                  <Alert variant="warning">
                    No hay roles disponibles. Verifica la conexión con el servidor.
                  </Alert>
                ) : (
                  <div className="border rounded p-3">
                    <Row>
                      {availableRoles.map(role => (
                        <Col md={4} key={role.id}>
                          <Form.Check
                            type="checkbox"
                            label={role.nombre}
                            value={role.nombre}
                            checked={(formData.roles || []).includes(role.nombre)}
                            onChange={handleRoleChange}
                            className="mb-2"
                          />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </Form.Group>
            </Form>
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={(e) => handleSubmit(e as any)} 
          disabled={saving || loading}
        >
          {saving ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Guardando...
            </>
          ) : (
            isEditMode ? 'Actualizar Usuario' : 'Crear Usuario'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserModalForm;