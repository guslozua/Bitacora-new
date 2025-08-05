// src/pages/RolePermissionMatrixPage.tsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import LightFooter from '../components/LightFooter';
import { isAuthenticated } from '../services/authService';
import { 
  getRolePermissionMatrix,
  assignPermissionToRole,
  removePermissionFromRole,
  Permission
} from '../services/permissionService';
import { Role } from '../services/roleService';

interface MatrixData {
  roles: Role[];
  permissions: Permission[];
  matrix: {
    role: Role;
    permissions: Permission[];
  }[];
}

const RolePermissionMatrixPage: React.FC = () => {
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null); // roleId-permissionId
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadMatrix();
  }, [navigate]);

  const loadMatrix = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getRolePermissionMatrix();
      setMatrixData(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la matriz de permisos');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin');
  };

  const hasPermission = (roleId: number, permissionId: number): boolean => {
    if (!matrixData) return false;
    
    const roleMatrix = matrixData.matrix.find(m => m.role.id === roleId);
    if (!roleMatrix) return false;
    
    return roleMatrix.permissions.some(p => p.id === permissionId);
  };

  const togglePermission = async (roleId: number, permissionId: number) => {
    if (!matrixData) return;
    
    const updateKey = `${roleId}-${permissionId}`;
    setUpdating(updateKey);
    
    try {
      const hasCurrentPermission = hasPermission(roleId, permissionId);
      
      if (hasCurrentPermission) {
        await removePermissionFromRole(roleId, permissionId);
      } else {
        await assignPermissionToRole(roleId, permissionId);
      }
      
      // Recargar matriz
      await loadMatrix();
      
      // Mostrar mensaje de éxito
      const role = matrixData.roles.find(r => r.id === roleId);
      const permission = matrixData.permissions.find(p => p.id === permissionId);
      
      Swal.fire({
        icon: 'success',
        title: hasCurrentPermission ? 'Permiso removido' : 'Permiso asignado',
        text: `${hasCurrentPermission ? 'Removido' : 'Asignado'} "${permission?.nombre}" ${hasCurrentPermission ? 'de' : 'a'} "${role?.nombre}"`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error al actualizar el permiso'
      });
    } finally {
      setUpdating(null);
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

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando matriz...</span>
        </Spinner>
      </Container>
    );
  }

  if (!matrixData) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          No se pudo cargar la matriz de permisos
        </Alert>
      </Container>
    );
  }

  const groupedPermissions = groupPermissionsByCategory(matrixData.permissions);

  return (
    <>
      <Container fluid className="py-4">
        <Row>
          <Col>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1">
                  <i className="bi bi-grid-3x3-gap-fill me-2 text-primary"></i>
                  Matriz de Roles vs Permisos
                </h2>
                <p className="text-muted mb-0">
                  Vista completa de todos los permisos asignados a cada rol
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
                  variant="outline-primary"
                  onClick={loadMatrix}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Actualizar
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="danger" className="mb-4">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </Alert>
            )}

            {/* Estadísticas */}
            <Row className="mb-4">
              <Col md={3}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <div className="text-primary mb-2">
                      <i className="bi bi-shield-check" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h4 className="mb-1">{matrixData.roles.length}</h4>
                    <small className="text-muted">Roles</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <div className="text-success mb-2">
                      <i className="bi bi-key-fill" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h4 className="mb-1">{matrixData.permissions.length}</h4>
                    <small className="text-muted">Permisos</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <div className="text-info mb-2">
                      <i className="bi bi-link-45deg" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h4 className="mb-1">
                      {matrixData.matrix.reduce((total, roleMatrix) => total + roleMatrix.permissions.length, 0)}
                    </h4>
                    <small className="text-muted">Asignaciones</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <div className="text-warning mb-2">
                      <i className="bi bi-collection" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h4 className="mb-1">{groupedPermissions.length}</h4>
                    <small className="text-muted">Categorías</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Matriz */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light border-0">
                <h5 className="mb-0">
                  <i className="bi bi-grid-3x3-gap-fill me-2"></i>
                  Matriz Interactiva
                </h5>
                <small className="text-muted">
                  Haz clic en las casillas para asignar/quitar permisos
                </small>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table className="mb-0 table-fixed">
                    <thead className="bg-light sticky-top">
                      <tr>
                        <th style={{ minWidth: '200px', position: 'sticky', left: 0, zIndex: 10 }} className="bg-light">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-key-fill me-2"></i>
                            Permisos / Roles
                          </div>
                        </th>
                        {matrixData.roles.map((role) => (
                          <th key={role.id} className="text-center" style={{ minWidth: '120px' }}>
                            <div className="d-flex flex-column align-items-center">
                              <strong>{role.nombre}</strong>
                              {role.is_default === 1 && (
                                <Badge bg="warning" className="ms-1" style={{ fontSize: '0.7rem' }}>
                                  <i className="bi bi-star-fill"></i>
                                </Badge>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {groupedPermissions.map(([categoria, permissions]) => (
                        <React.Fragment key={categoria}>
                          {/* Header de categoría */}
                          <tr className="table-secondary">
                            <td colSpan={matrixData.roles.length + 1} className="py-2">
                              <strong className="text-uppercase">
                                <i className="bi bi-collection me-2"></i>
                                {categoria}
                                <Badge bg={getBadgeColor(categoria)} className="ms-2">
                                  {permissions.length}
                                </Badge>
                              </strong>
                            </td>
                          </tr>
                          
                          {/* Permisos de la categoría */}
                          {permissions.map((permission) => (
                            <tr key={permission.id}>
                              <td style={{ position: 'sticky', left: 0, zIndex: 5 }} className="bg-white">
                                <div>
                                  <strong>{permission.nombre}</strong>
                                  {permission.descripcion && (
                                    <small className="d-block text-muted">
                                      {permission.descripcion}
                                    </small>
                                  )}
                                </div>
                              </td>
                              {matrixData.roles.map((role) => {
                                const hasPerms = hasPermission(role.id, permission.id);
                                const updateKey = `${role.id}-${permission.id}`;
                                const isUpdating = updating === updateKey;
                                
                                return (
                                  <td key={role.id} className="text-center align-middle">
                                    <Button
                                      variant={hasPerms ? 'success' : 'outline-secondary'}
                                      size="sm"
                                      onClick={() => togglePermission(role.id, permission.id)}
                                      disabled={isUpdating}
                                      className="border-0"
                                      style={{ width: '40px', height: '40px' }}
                                    >
                                      {isUpdating ? (
                                        <Spinner as="span" animation="border" size="sm" />
                                      ) : (
                                        <i className={`bi ${hasPerms ? 'bi-check-lg' : 'bi-dash'}`}></i>
                                      )}
                                    </Button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>

            {/* Leyenda */}
            <Card className="border-0 shadow-sm mt-4">
              <Card.Body>
                <h6 className="mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Leyenda
                </h6>
                <Row>
                  <Col md={6}>
                    <div className="d-flex align-items-center mb-2">
                      <Button variant="success" size="sm" className="me-2" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-check-lg"></i>
                      </Button>
                      <span>Permiso asignado</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex align-items-center mb-2">
                      <Button variant="outline-secondary" size="sm" className="me-2" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-dash"></i>
                      </Button>
                      <span>Permiso no asignado</span>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <LightFooter />
    </>
  );
};

export default RolePermissionMatrixPage;
