// src/components/users/UserForm.tsx
// 🔐 COMPONENTE CON CONTROL DE PERMISOS APLICADO
// - Gestionar roles: SYSTEM_PERMISSIONS.MANAGE_ROLES
// - Editar estado: SYSTEM_PERMISSIONS.EDIT_USER
// - Crear usuario: SYSTEM_PERMISSIONS.CREATE_USER
// - Campos sensibles: Acceso granular por permiso

import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { fetchUserById, createUser, updateUser, UserFormData } from '../../services/userService';
import { fetchAllRoles, Role } from '../../services/roleService';

// 🔐 NUEVOS IMPORTS PARA EL SISTEMA DE PERMISOS
import PermissionGate from '../PermissionGate';
import { usePermissions } from '../../hooks/usePermissions';
import { SYSTEM_PERMISSIONS } from '../../utils/permissions';

const UserForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // 🔐 HOOK PARA VERIFICAR PERMISOS
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  
  const [formData, setFormData] = useState<UserFormData>({
    nombre: '',
    email: '',
    password: '',
    estado: 'activo',
    roles: []
  });
  
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar datos existentes si estamos en modo edición
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar roles disponibles
        try {
          const rolesData = await fetchAllRoles();
          console.log('Roles cargados en UserForm:', rolesData);
          setAvailableRoles(rolesData || []);
        } catch (rolesErr) {
          console.error('Error al cargar roles:', rolesErr);
          setError('Error al cargar los roles disponibles');
          setAvailableRoles([]);
        }
        
        // Si estamos en modo edición, cargar datos del usuario
        if (isEditMode && id) {
          try {
            const userData = await fetchUserById(id);
            
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
    
    fetchData();
  }, [id, isEditMode]);
  
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
      
      if (isEditMode && id) {
        // Actualizar usuario existente
        response = await updateUser(id, dataToSend);
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
        
        // Redirigir después de un breve momento
        setTimeout(() => {
          navigate('/admin/users');
        }, 1500);
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
  
  // Cancelar y volver a la lista
  const handleCancel = () => {
    navigate('/admin/users');
  };
  
  // 🔐 MOSTRAR LOADING SI ESTÁ CARGANDO DATOS O PERMISOS
  if (loading || permissionsLoading) {
    return <div className="text-center p-5"><Spinner animation="border" /></div>;
  }
  
  // 🔐 VERIFICACIÓN DE PERMISOS PARA ACCESO AL FORMULARIO
  const canAccessForm = isEditMode 
    ? hasPermission(SYSTEM_PERMISSIONS.EDIT_USER) 
    : hasPermission(SYSTEM_PERMISSIONS.CREATE_USER);
  
  if (!canAccessForm) {
    return (
      <div className="container py-4">
        <Card className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">Acceso Denegado</h5>
          </Card.Header>
          <Card.Body className="text-center py-5">
            <i className="bi bi-shield-exclamation fs-1 text-warning mb-3 d-block"></i>
            <h6 className="mb-3">No tienes permisos para {isEditMode ? 'editar usuarios' : 'crear usuarios'}</h6>
            <p className="text-muted mb-4">
              Para acceder a esta funcionalidad, necesitas el permiso <code>{isEditMode ? 'editar_usuario' : 'crear_usuario'}</code>.
            </p>
            <Button variant="outline-primary" onClick={handleCancel}>
              <i className="bi bi-arrow-left me-2"></i>
              Volver a la Lista
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-4">
      <Card className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">{isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h5>
        </Card.Header>
        <Card.Body>
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
                {/* 🔐 CAMPO ESTADO - Solo con permiso de editar usuario */}
                <PermissionGate 
                  permission={SYSTEM_PERMISSIONS.EDIT_USER}
                  fallback={
                    <Form.Group className="mb-3">
                      <Form.Label>Estado</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.estado}
                        disabled
                        className="bg-light"
                      />
                      <Form.Text className="text-muted">
                        No tienes permisos para cambiar el estado del usuario
                      </Form.Text>
                    </Form.Group>
                  }
                >
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
                </PermissionGate>
              </Col>
            </Row>
            
            {/* 🔐 SECCIÓN DE ROLES - Solo con permiso de gestionar roles */}
            <PermissionGate 
              permission={SYSTEM_PERMISSIONS.MANAGE_ROLES}
              fallback={
                <Form.Group className="mb-4">
                  <Form.Label>Roles Asignados</Form.Label>
                  <div className="border rounded p-3 bg-light">
                    {(formData.roles || []).length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {(formData.roles || []).map((role, index) => (
                          <span key={index} className="badge bg-primary">{role}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">Sin roles asignados</span>
                    )}
                    <Form.Text className="text-muted d-block mt-2">
                      No tienes permisos para gestionar roles de usuario
                    </Form.Text>
                  </div>
                </Form.Group>
              }
            >
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
            </PermissionGate>
            
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                Cancelar
              </Button>
              
              {/* 🔐 BOTÓN GUARDAR - Solo con permiso correspondiente */}
              <PermissionGate 
                permission={isEditMode ? SYSTEM_PERMISSIONS.EDIT_USER : SYSTEM_PERMISSIONS.CREATE_USER}
                fallback={
                  <Button variant="outline-secondary" disabled>
                    <i className="bi bi-lock me-2"></i>
                    Sin permisos para {isEditMode ? 'editar' : 'crear'}
                  </Button>
                }
              >
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Guardando...
                    </>
                  ) : (
                    isEditMode ? 'Actualizar Usuario' : 'Crear Usuario'
                  )}
                </Button>
              </PermissionGate>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UserForm;