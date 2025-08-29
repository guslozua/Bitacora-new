// src/components/IntegralUserManagement/RolesManager.tsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  fetchAllRoles, 
  createRole, 
  updateRole, 
  deleteRole, 
  getUsersByRole,
  Role 
} from '../../services/roleService';
import { 
  fetchAllPermissions,
  getPermissionsByRole,
  assignPermissionToRole,
  removePermissionFromRole
} from '../../services/permissionService';

interface User {
  id: number;
  nombre: string;
  email: string;
}

const RolesManager: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Estados para el modal de crear/editar rol
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    nombre: '',
    descripcion: '',
    is_default: false,
    estado: 'activo' // Agregar campo estado
  });

  // Estados para el modal de usuarios del rol
  const [showUsersModal, setShowUsersModal] = useState<boolean>(false);
  const [selectedRoleUsers, setSelectedRoleUsers] = useState<User[]>([]);
  const [selectedRoleName, setSelectedRoleName] = useState<string>('');

  // Estados para el modal de permisos
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const rolesData = await fetchAllRoles();
      setRoles(rolesData || []);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleForm({
      nombre: '',
      descripcion: '',
      is_default: false,
      estado: 'activo'
    });
    setShowRoleModal(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      nombre: role.nombre,
      descripcion: role.descripcion || '',
      is_default: role.is_default === 1,
      estado: role.estado || 'activo' // Usar estado del rol o 'activo' por defecto
    });
    setShowRoleModal(true);
  };

  const handleDeleteRole = async (role: Role) => {
    const result = await Swal.fire({
      title: '¿Eliminar rol?',
      html: `
        <p>¿Estás seguro de que quieres eliminar el rol <strong>"${role.nombre}"</strong>?</p>
        <br>
        <p style="color: #dc3545; font-size: 14px;">
          ⚠️ Esta acción no se puede deshacer y eliminará todos los permisos asociados.
        </p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await deleteRole(role.id);
      
      // Recargar la lista de roles primero
      await loadRoles();
      
      // Luego mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Rol eliminado!',
        text: 'El rol ha sido eliminado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error al eliminar el rol'
      });
    }
  };

  const handleSaveRole = async () => {
    if (!roleForm.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre del rol es requerido'
      });
      return;
    }

    try {
      const roleData = {
        nombre: roleForm.nombre.trim(),
        descripcion: roleForm.descripcion.trim(),
        is_default: roleForm.is_default ? 1 : 0,
        estado: roleForm.estado
      };

      if (editingRole) {
        await updateRole(editingRole.id, roleData);
      } else {
        await createRole(roleData);
      }

      // Cerrar modal antes de mostrar el mensaje
      setShowRoleModal(false);
      
      // Recargar la lista de roles
      await loadRoles();
      
      // Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: editingRole ? '¡Rol actualizado!' : '¡Rol creado!',
        text: editingRole ? 'El rol ha sido actualizado correctamente' : 'El rol ha sido creado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
      
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error al guardar el rol'
      });
    }
  };

  const handleViewUsers = async (role: Role) => {
    try {
      const usersData = await getUsersByRole(role.id);
      setSelectedRoleUsers(usersData || []);
      setSelectedRoleName(role.nombre);
      setShowUsersModal(true);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error al cargar usuarios del rol'
      });
    }
  };

  const handleManagePermissions = async (role: Role) => {
    try {
      setPermissionsLoading(true);
      setSelectedRole(role);
      
      // Cargar todos los permisos y los permisos del rol en paralelo
      const [allPermsData, rolePermsData] = await Promise.all([
        fetchAllPermissions(),
        getPermissionsByRole(role.id)
      ]);
      
      setAllPermissions(allPermsData || []);
      setRolePermissions(rolePermsData || []);
      setShowPermissionsModal(true);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error al cargar permisos del rol'
      });
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Verificar si un permiso está asignado al rol
  const isPermissionAssigned = (permissionId: number): boolean => {
    return rolePermissions.some(rp => rp.id === permissionId);
  };

  // Asignar/quitar permiso
  const handleTogglePermission = async (permission: any) => {
    if (!selectedRole) return;
    
    try {
      const isAssigned = isPermissionAssigned(permission.id);
      
      if (isAssigned) {
        await removePermissionFromRole(selectedRole.id, permission.id);
        setRolePermissions(prev => prev.filter(rp => rp.id !== permission.id));
      } else {
        await assignPermissionToRole(selectedRole.id, permission.id);
        setRolePermissions(prev => [...prev, permission]);
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error al actualizar permisos'
      });
    }
  };

  // Agrupar permisos por categoría
  const groupPermissionsByCategory = (permissions: any[]) => {
    return permissions.reduce((groups: any, permission: any) => {
      const category = permission.categoria || 'general';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
      return groups;
    }, {});
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando roles...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-warning mb-2">
                <i className="bi bi-shield-check" style={{ fontSize: '2rem' }}></i>
              </div>
              <h4 className="mb-1">{roles.length}</h4>
              <small className="text-muted">Total de Roles</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-success mb-2">
                <i className="bi bi-star-fill" style={{ fontSize: '2rem' }}></i>
              </div>
              <h4 className="mb-1">{roles.filter(r => r.is_default === 1).length}</h4>
              <small className="text-muted">Rol por Defecto</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-info mb-2">
                <i className="bi bi-people-fill" style={{ fontSize: '2rem' }}></i>
              </div>
              <h4 className="mb-1">-</h4>
              <small className="text-muted">Usuarios Asignados</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Sección de gestión */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">
          <i className="bi bi-list-ul me-2 text-warning"></i>
          Lista de Roles
        </h6>
        <Button 
          variant="warning"
          size="sm"
          onClick={handleCreateRole}
        >
          <i className="bi bi-plus-lg me-1"></i>
          Nuevo Rol
        </Button>
      </div>

      {/* Tabla de roles */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {roles.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-shield-x text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="text-muted mt-3">No hay roles registrados</p>
              <Button variant="warning" onClick={handleCreateRole}>
                Crear primer rol
              </Button>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Rol</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Fecha Creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-shield-check text-warning me-2"></i>
                        <strong>{role.nombre}</strong>
                        {role.is_default === 1 && (
                          <Badge bg="warning" className="ms-2">
                            <i className="bi bi-star-fill me-1"></i>
                            Por defecto
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-muted">
                        {role.descripcion || 'Sin descripción'}
                      </span>
                    </td>
                    <td>
                      <Badge bg={role.estado === 'activo' ? 'success' : 'secondary'}>
                        <i className={`bi ${role.estado === 'activo' ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                        {role.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(role.fecha_creacion).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleViewUsers(role)}
                          title="Ver usuarios"
                        >
                          <i className="bi bi-people"></i>
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => handleManagePermissions(role)}
                          title="Gestionar permisos"
                        >
                          <i className="bi bi-key"></i>
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                          title="Editar rol"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        {role.is_default !== 1 && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteRole(role)}
                            title="Eliminar rol"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar rol */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-shield-plus me-2"></i>
            {editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong>Nombre del Rol</strong>
                    <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: Editor, Moderador, etc."
                    value={roleForm.nombre}
                    onChange={(e) => setRoleForm({...roleForm, nombre: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong>Estado</strong>
                  </Form.Label>
                  <Form.Select
                    value={roleForm.estado}
                    onChange={(e) => setRoleForm({...roleForm, estado: e.target.value})}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Descripción</strong>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Describe las responsabilidades y alcance de este rol..."
                value={roleForm.descripcion}
                onChange={(e) => setRoleForm({...roleForm, descripcion: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Configuración</strong>
              </Form.Label>
              <Form.Check
                type="checkbox"
                label="Rol por defecto para nuevos usuarios"
                checked={roleForm.is_default}
                onChange={(e) => setRoleForm({...roleForm, is_default: e.target.checked})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancelar
          </Button>
          <Button variant="warning" onClick={handleSaveRole}>
            <i className="bi bi-check-lg me-1"></i>
            {editingRole ? 'Actualizar' : 'Crear'} Rol
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para gestionar permisos del rol */}
      <Modal show={showPermissionsModal} onHide={() => setShowPermissionsModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-key me-2"></i>
            Permisos del Rol: {selectedRole?.nombre}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {permissionsLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Cargando permisos...</p>
            </div>
          ) : (
            <div>
              <div className="mb-3">
                <Badge bg="info" className="me-2">
                  Total de permisos: {allPermissions.length}
                </Badge>
                <Badge bg="success">
                  Asignados: {rolePermissions.length}
                </Badge>
              </div>
              
              {Object.entries(groupPermissionsByCategory(allPermissions)).map(([category, permissions]: [string, any]) => (
                <Card key={category} className="mb-3">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <i className="bi bi-tag me-2"></i>
                      {category.toUpperCase()}
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {permissions.map((permission: any) => {
                        const isAssigned = isPermissionAssigned(permission.id);
                        return (
                          <Col md={6} lg={4} key={permission.id} className="mb-2">
                            <div 
                              className={`border rounded p-2 cursor-pointer ${
                                isAssigned ? 'border-success bg-success bg-opacity-10' : 'border-light'
                              }`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleTogglePermission(permission)}
                            >
                              <div className="d-flex align-items-center justify-content-between">
                                <div className="flex-grow-1">
                                  <div className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>
                                    {permission.nombre}
                                  </div>
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    {permission.descripcion || 'Sin descripción'}
                                  </div>
                                </div>
                                <div className="ms-2">
                                  <i className={`bi ${
                                    isAssigned ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'
                                  }`}></i>
                                </div>
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPermissionsModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para ver usuarios del rol */}
      <Modal show={showUsersModal} onHide={() => setShowUsersModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-people me-2"></i>
            Usuarios con rol "{selectedRoleName}"
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRoleUsers.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-person-x text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="text-muted mt-3">No hay usuarios con este rol</p>
            </div>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {selectedRoleUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-person-circle text-primary me-2"></i>
                        {user.nombre}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                      >
                        Ver detalles
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUsersModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RolesManager;