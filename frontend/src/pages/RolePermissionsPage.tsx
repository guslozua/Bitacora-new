// src/pages/RolePermissionsPage.tsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Badge, ButtonGroup } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import LightFooter from '../components/LightFooter';
import { isAuthenticated } from '../services/authService';
import { fetchAllRoles, Role, assignPermissionsToRole } from '../services/roleService';
import { 
  fetchAllPermissions,
  getPermissionsByRole,
  Permission
} from '../services/permissionService';

const RolePermissionsPage: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
        getPermissionsByRole(Number(roleId))
      ]);

      // Encontrar el rol actual
      const currentRole = rolesData.find(r => r.id === Number(roleId));
      if (!currentRole) {
        throw new Error('Rol no encontrado');
      }

      setRole(currentRole);
      setAllPermissions(allPermissionsData || []);
      setRolePermissions(rolePermissionsData || []);
      
      // Establecer permisos seleccionados
      const currentPermissionIds = new Set(rolePermissionsData.map(p => p.id));
      setSelectedPermissions(currentPermissionIds);

    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/roles');
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

  const handleSelectAll = () => {
    const filteredPermissions = getFilteredPermissions();
    const newSelected = new Set(selectedPermissions);
    filteredPermissions.forEach(permission => {
      newSelected.add(permission.id);
    });
    setSelectedPermissions(newSelected);
  };

  const handleDeselectAll = () => {
    const filteredPermissions = getFilteredPermissions();
    const newSelected = new Set(selectedPermissions);
    filteredPermissions.forEach(permission => {
      newSelected.delete(permission.id);
    });
    setSelectedPermissions(newSelected);
  };

  const handleSavePermissions = async () => {
    if (!role) return;

    const result = await Swal.fire({
      title: 'Guardar permisos',
      html: `
        <p>¿Confirmas los cambios en los permisos del rol <strong>"${role.nombre}"</strong>?</p>
        <br>
        <div class="text-start">
          <p><strong>Permisos seleccionados:</strong> ${selectedPermissions.size}</p>
          <p><strong>Cambios:</strong> ${Math.abs(selectedPermissions.size - rolePermissions.length)}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      
      // Convertir Set a Array
      const permissionIds = Array.from(selectedPermissions);
      
      await assignPermissionsToRole(role.id, permissionIds);
      
      // Recargar datos para mostrar cambios
      await loadData();
      
      Swal.fire({
        icon: 'success',
        title: '¡Permisos actualizados!',
        text: 'Los permisos han sido asignados correctamente al rol',
        timer: 2000,
        showConfirmButton: false
      });
      
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error al actualizar los permisos'
      });
    } finally {
      setSaving(false);
    }
  };

  const getBadgeColor = (categoria: string) => {
    const colors = {
      'sistema': 'danger',
      'proyectos': 'primary',
      'tareas': 'success',
      'subtareas': 'info',
      'informes': 'warning',
      'usuarios': 'secondary',
      'configuracion': 'dark',
      'general': 'light'
    };
    return colors[categoria as keyof typeof colors] || 'secondary';
  };

  const getCategoryIcon = (categoria: string) => {
    const icons = {
      'sistema': 'bi-gear-fill',
      'proyectos': 'bi-kanban-fill', 
      'tareas': 'bi-check2-square',
      'subtareas': 'bi-list-task',
      'informes': 'bi-file-earmark-text',
      'usuarios': 'bi-people-fill',
      'configuracion': 'bi-sliders',
      'general': 'bi-collection'
    };
    return icons[categoria as keyof typeof icons] || 'bi-shield';
  };

  const getFilteredPermissions = () => {
    return allPermissions.filter(permission => {
      const matchesSearch = permission.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           permission.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || permission.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const groupPermissionsByCategory = (permissions: Permission[]) => {
    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.categoria]) {
        acc[permission.categoria] = [];
      }
      acc[permission.categoria].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
    
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  const getAvailableCategories = () => {
    const categories = new Set(allPermissions.map(p => p.categoria));
    return Array.from(categories).sort();
  };

  const hasChanges = () => {
    const currentIds = new Set(rolePermissions.map(p => p.id));
    return currentIds.size !== selectedPermissions.size || 
           !Array.from(currentIds).every(id => selectedPermissions.has(id));
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

  if (!role) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Rol no encontrado
        </Alert>
      </Container>
    );
  }

  const filteredPermissions = getFilteredPermissions();
  const groupedPermissions = groupPermissionsByCategory(filteredPermissions);
  const availableCategories = getAvailableCategories();

  return (
    <>
      <Container fluid className="py-4">
        <Row>
          <Col>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1">
                  <i className="bi bi-key-fill me-2 text-primary"></i>
                  Permisos del Rol: {role.nombre}
                </h2>
                <p className="text-muted mb-0">
                  Asigna o quita permisos específicos a este rol
                  {role.is_default === 1 && (
                    <Badge bg="warning" className="ms-2">
                      <i className="bi bi-star-fill me-1"></i>
                      Rol por defecto
                    </Badge>
                  )}
                </p>
              </div>
              <div>
                <Button 
                  variant="outline-secondary" 
                  className="me-2"
                  onClick={handleBack}
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Volver
                </Button>
                <Button 
                  variant="success"
                  onClick={handleSavePermissions}
                  disabled={saving || !hasChanges()}
                >
                  {saving ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-1" />
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
            </div>

            {error && (
              <Alert variant="danger" className="mb-4">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </Alert>
            )}

            {hasChanges() && (
              <Alert variant="info" className="mb-4">
                <i className="bi bi-info-circle me-2"></i>
                Tienes cambios sin guardar. No olvides hacer clic en "Guardar Cambios" cuando termines.
              </Alert>
            )}

            {/* Estadísticas */}
            <Row className="mb-4">
              <Col md={3}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <div className="text-primary mb-2">
                      <i className="bi bi-check-circle-fill" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h4 className="mb-1">{selectedPermissions.size}</h4>
                    <small className="text-muted">Seleccionados</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <div className="text-success mb-2">
                      <i className="bi bi-key-fill" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h4 className="mb-1">{allPermissions.length}</h4>
                    <small className="text-muted">Total Permisos</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <div className="text-info mb-2">
                      <i className="bi bi-collection" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h4 className="mb-1">{availableCategories.length}</h4>
                    <small className="text-muted">Categorías</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <div className="text-warning mb-2">
                      <i className="bi bi-pencil-square" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h4 className="mb-1">
                      {Math.abs(selectedPermissions.size - rolePermissions.length)}
                    </h4>
                    <small className="text-muted">Cambios</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Filtros */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-light border-0">
                <h5 className="mb-0">
                  <i className="bi bi-funnel me-2"></i>
                  Filtros y Búsqueda
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="align-items-end">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label><strong>Buscar permisos</strong></Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Buscar por nombre o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label><strong>Filtrar por categoría</strong></Form.Label>
                      <Form.Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="all">Todas las categorías</option>
                        {availableCategories.map(category => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <ButtonGroup className="w-100">
                      <Button
                        variant="outline-success"
                        onClick={handleSelectAll}
                        disabled={filteredPermissions.length === 0}
                      >
                        <i className="bi bi-check-all me-1"></i>
                        Seleccionar Filtrados
                      </Button>
                      <Button
                        variant="outline-danger"
                        onClick={handleDeselectAll}
                        disabled={filteredPermissions.length === 0}
                      >
                        <i className="bi bi-x-circle me-1"></i>
                        Deseleccionar Filtrados
                      </Button>
                    </ButtonGroup>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Lista de permisos */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light border-0">
                <h5 className="mb-0">
                  <i className="bi bi-list-check me-2"></i>
                  Permisos Disponibles
                  <Badge bg="secondary" className="ms-2">
                    {filteredPermissions.length} de {allPermissions.length}
                  </Badge>
                </h5>
              </Card.Header>
              <Card.Body>
                {filteredPermissions.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted mt-3">
                      {searchTerm || selectedCategory !== 'all' ? 
                        'No hay permisos que coincidan con los filtros' : 
                        'No hay permisos disponibles'
                      }
                    </p>
                  </div>
                ) : (
                  <div>
                    {groupedPermissions.map(([categoria, permissions]) => (
                      <div key={categoria} className="mb-4">
                        <h6 className="text-uppercase text-muted mb-3 border-bottom pb-2">
                          <i className={`${getCategoryIcon(categoria)} me-2`}></i>
                          {categoria}
                          <Badge bg={getBadgeColor(categoria)} className="ms-2">
                            {permissions.length}
                          </Badge>
                        </h6>
                        <Row>
                          {permissions.map((permission) => {
                            const isSelected = selectedPermissions.has(permission.id);
                            return (
                              <Col md={6} lg={4} key={permission.id} className="mb-3">
                                <Card 
                                  className={`h-100 cursor-pointer ${isSelected ? 'border-success bg-light' : 'border-light'}`}
                                  onClick={() => handlePermissionToggle(permission.id)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <Form.Check
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handlePermissionToggle(permission.id)}
                                        className="me-2"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <div className="flex-grow-1">
                                        <h6 className="mb-1">{permission.nombre}</h6>
                                        <p className="text-muted small mb-0">
                                          {permission.descripcion || 'Sin descripción'}
                                        </p>
                                      </div>
                                      {isSelected && (
                                        <i className="bi bi-check-circle-fill text-success"></i>
                                      )}
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                            );
                          })}
                        </Row>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <LightFooter />
    </>
  );
};

export default RolePermissionsPage;
