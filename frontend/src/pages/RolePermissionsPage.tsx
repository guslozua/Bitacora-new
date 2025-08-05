// src/pages/RolePermissionsPage.tsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import LightFooter from '../components/LightFooter';
import { isAuthenticated } from '../services/authService';
import { 
  Role, 
  Permission,
  fetchAllPermissions, 
  getRolePermissions, 
  assignPermissionsToRole,
  fetchAllRoles,
  groupPermissionsByCategory,
  formatCategoryName
} from '../services/roleService';

const RolePermissionsPage: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (roleId) {
      loadData();
    }
  }, [navigate, roleId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos en paralelo
      const [rolesData, allPermissionsData, rolePermissionsData] = await Promise.all([
        fetchAllRoles(),
        fetchAllPermissions(),
        getRolePermissions(Number(roleId))
      ]);

      // Encontrar el rol actual
      const currentRole = rolesData.find(r => r.id === Number(roleId));
      if (!currentRole) {
        throw new Error('Rol no encontrado');
      }

      setRole(currentRole);
      setAllPermissions(allPermissionsData);
      setRolePermissions(rolePermissionsData);
      
      // Inicializar permisos seleccionados
      const selectedIds = new Set(rolePermissionsData.map(p => p.id));
      setSelectedPermissions(selectedIds);

    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: number) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSelectAll = (permissions: Permission[]) => {
    const newSelected = new Set(selectedPermissions);
    permissions.forEach(p => newSelected.add(p.id));
    setSelectedPermissions(newSelected);
  };

  const handleDeselectAll = (permissions: Permission[]) => {
    const newSelected = new Set(selectedPermissions);
    permissions.forEach(p => newSelected.delete(p.id));
    setSelectedPermissions(newSelected);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const permissionIds = Array.from(selectedPermissions);
      await assignPermissionsToRole(Number(roleId), permissionIds);

      Swal.fire({
        icon: 'success',
        title: '¡Permisos actualizados!',
        text: 'Los permisos del rol han sido actualizados correctamente',
        timer: 2000,
        showConfirmButton: false
      });

      // Recargar permisos del rol
      const updatedRolePermissions = await getRolePermissions(Number(roleId));
      setRolePermissions(updatedRolePermissions);

    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error al actualizar permisos'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/roles');
  };

  const getChangesCount = () => {
    const currentPermissionIds = new Set(rolePermissions.map(p => p.id));
    const added = Array.from(selectedPermissions).filter(id => !currentPermissionIds.has(id));
    const removed = Array.from(currentPermissionIds).filter(id => !selectedPermissions.has(id));
    return added.length + removed.length;
  };

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

  if (error || !role) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error || 'Rol no encontrado'}
        </Alert>
        <Button variant="secondary" onClick={handleBack}>
          <i className="bi bi-arrow-left me-1"></i>
          Volver a Roles
        </Button>
      </Container>
    );
  }

  const groupedPermissions = groupPermissionsByCategory(allPermissions);
  const changesCount = getChangesCount();

  return (
    <>
      <Container fluid className="py-4">
        <Row>
          <Col>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1">
                  <i className="bi bi-key me-2 text-warning"></i>
                  Permisos del Rol
                </h2>
                <p className="text-muted mb-0">
                  Gestiona los permisos para el rol <strong>"{role.nombre}"</strong>
                </p>
              </div>
              <div>
                <Button 
                  variant="outline-secondary" 
                  className="me-2"
                  onClick={handleBack}
                  disabled={saving}
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Volver
                </Button>
                {changesCount > 0 && (
                  <Button 
                    variant="success"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-1"></i>
                        Guardar Cambios ({changesCount})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Información del rol */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <Row>
                  <Col md={8}>
                    <h5 className="mb-2">
                      <i className="bi bi-shield-check text-primary me-2"></i>
                      {role.nombre}
                      {role.is_default === 1 && (
                        <Badge bg="warning" className="ms-2">
                          <i className="bi bi-star-fill me-1"></i>
                          Por defecto
                        </Badge>
                      )}
                    </h5>
                    <p className="text-muted mb-0">
                      {role.descripcion || 'Sin descripción'}
                    </p>
                  </Col>
                  <Col md={4} className="text-end">
                    <div className="text-muted small">
                      <div>Permisos actuales: <strong>{rolePermissions.length}</strong></div>
                      <div>Permisos seleccionados: <strong>{selectedPermissions.size}</strong></div>
                      {changesCount > 0 && (
                        <div className="text-warning">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          {changesCount} cambio(s) pendiente(s)
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Permisos por categoría */}
            <Row>
              {Object.entries(groupedPermissions).map(([category, permissions]) => {
                const categorySelected = permissions.filter(p => selectedPermissions.has(p.id)).length;
                const allSelected = categorySelected === permissions.length;
                const someSelected = categorySelected > 0 && categorySelected < permissions.length;

                return (
                  <Col md={6} lg={4} key={category} className="mb-4">
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Header className="bg-light border-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">
                            <i className="bi bi-folder me-2"></i>
                            {formatCategoryName(category)}
                          </h6>
                          <div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              onClick={() => handleSelectAll(permissions)}
                              disabled={allSelected}
                            >
                              Todos
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleDeselectAll(permissions)}
                              disabled={categorySelected === 0}
                            >
                              Ninguno
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Badge 
                            bg={allSelected ? 'success' : someSelected ? 'warning' : 'secondary'}
                            className="small"
                          >
                            {categorySelected} de {permissions.length} seleccionados
                          </Badge>
                        </div>
                      </Card.Header>
                      <Card.Body className="p-3">
                        {permissions.map((permission) => (
                          <Form.Check
                            key={permission.id}
                            type="checkbox"
                            id={`permission-${permission.id}`}
                            label={
                              <div>
                                <div className="fw-medium">{permission.nombre}</div>
                                {permission.descripcion && (
                                  <small className="text-muted">
                                    {permission.descripcion}
                                  </small>
                                )}
                              </div>
                            }
                            checked={selectedPermissions.has(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                            className="mb-2"
                          />
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            {/* Resumen de cambios */}
            {changesCount > 0 && (
              <Card className="border-warning bg-warning bg-opacity-10 mt-4">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-warning mb-1">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Cambios Pendientes
                      </h6>
                      <p className="mb-0 small text-muted">
                        Tienes {changesCount} cambio(s) sin guardar. Haz clic en "Guardar Cambios" para aplicarlos.
                      </p>
                    </div>
                    <Button 
                      variant="warning"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-1"></i>
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
      <LightFooter />
    </>
  );
};

export default RolePermissionsPage;