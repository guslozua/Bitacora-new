// src/components/IntegralUserManagement/MatrizPermisosManager.tsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Spinner, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  getRolePermissionMatrix,
  assignPermissionToRole,
  removePermissionFromRole,
  Permission
} from '../../services/permissionService';
import { Role } from '../../services/roleService';

interface MatrixData {
  roles: Role[];
  permissions: Permission[];
  matrix: {
    role: Role;
    permissions: Permission[];
  }[];
}

const MatrizPermisosManager: React.FC = () => {
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null); // roleId-permissionId
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadMatrix();
  }, []);

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
        text: err.message || 'Error al modificar permisos'
      });
    } finally {
      setUpdating(null);
    }
  };

  const getPermissionCountByRole = (roleId: number): number => {
    if (!matrixData) return 0;
    const roleMatrix = matrixData.matrix.find(m => m.role.id === roleId);
    return roleMatrix ? roleMatrix.permissions.length : 0;
  };

  const getTotalPermissionsByCategory = (categoria: string): number => {
    if (!matrixData) return 0;
    return matrixData.permissions.filter(p => p.categoria === categoria).length;
  };

  const getUniqueCategories = (): string[] => {
    if (!matrixData) return [];
    const categories = matrixData.permissions.map(p => p.categoria);
    return Array.from(new Set(categories)).sort();
  };

  const getFilteredPermissions = (): Permission[] => {
    if (!matrixData) return [];
    if (filterCategory === 'all') return matrixData.permissions;
    return matrixData.permissions.filter(p => p.categoria === filterCategory);
  };

  const getCategoryColor = (categoria: string): string => {
    const colors: { [key: string]: string } = {
      'sistema': 'danger',
      'proyectos': 'primary',
      'tareas': 'success',
      'subtareas': 'info',
      'informes': 'warning',
      'usuarios': 'secondary',
      'configuracion': 'dark',
      'general': 'light'
    };
    return colors[categoria] || 'secondary';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando matriz de permisos...</span>
        </Spinner>
      </div>
    );
  }

  if (!matrixData) {
    return (
      <Alert variant="warning">
        <i className="bi bi-exclamation-triangle me-2"></i>
        No se pudo cargar la matriz de permisos
      </Alert>
    );
  }

  const filteredPermissions = getFilteredPermissions();

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
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-success mb-2">
                <i className="bi bi-shield-check" style={{ fontSize: '2rem' }}></i>
              </div>
              <h4 className="mb-1">{matrixData.roles.length}</h4>
              <small className="text-muted">Total de Roles</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-info mb-2">
                <i className="bi bi-key-fill" style={{ fontSize: '2rem' }}></i>
              </div>
              <h4 className="mb-1">{matrixData.permissions.length}</h4>
              <small className="text-muted">Total de Permisos</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-primary mb-2">
                <i className="bi bi-grid-3x3-gap-fill" style={{ fontSize: '2rem' }}></i>
              </div>
              <h4 className="mb-1">
                {matrixData.matrix.reduce((total, roleMatrix) => total + roleMatrix.permissions.length, 0)}
              </h4>
              <small className="text-muted">Asignaciones Totales</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-warning mb-2">
                <i className="bi bi-tags-fill" style={{ fontSize: '2rem' }}></i>
              </div>
              <h4 className="mb-1">{getUniqueCategories().length}</h4>
              <small className="text-muted">Categorías</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6}>
              <h6 className="fw-bold mb-0">
                <i className="bi bi-grid-3x3-gap-fill me-2 text-success"></i>
                Matriz de Roles y Permisos
              </h6>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small text-muted mb-1">Filtrar por categoría:</Form.Label>
                <Form.Select
                  size="sm"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">Todas las categorías ({matrixData.permissions.length})</option>
                  {getUniqueCategories().map(cat => (
                    <option key={cat} value={cat}>
                      {cat} ({getTotalPermissionsByCategory(cat)})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Matriz */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="bg-light sticky-top">
                <tr>
                  <th className="border-end" style={{ minWidth: '200px', position: 'sticky', left: 0, zIndex: 10, backgroundColor: '#f8f9fa' }}>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-shield-check me-2 text-success"></i>
                      <strong>Roles / Permisos</strong>
                    </div>
                  </th>
                  {filteredPermissions.map((permission) => (
                    <th key={permission.id} className="text-center border-start" style={{ minWidth: '120px' }}>
                      <div className="d-flex flex-column align-items-center">
                        <Badge bg={getCategoryColor(permission.categoria)} className="mb-1 small">
                          {permission.categoria}
                        </Badge>
                        <code className="small text-primary">{permission.nombre}</code>
                        {permission.descripcion && (
                          <small className="text-muted text-truncate" style={{ maxWidth: '100px' }}>
                            {permission.descripcion}
                          </small>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData.roles.map((role) => (
                  <tr key={role.id}>
                    <td className="border-end fw-medium" style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white' }}>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-shield-check text-warning me-2"></i>
                          <div>
                            <div className="fw-bold">{role.nombre}</div>
                            {role.is_default === 1 && (
                              <Badge bg="warning" className="small">
                                <i className="bi bi-star-fill me-1"></i>
                                Por defecto
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge bg="info" className="ms-2">
                          {getPermissionCountByRole(role.id)}
                        </Badge>
                      </div>
                    </td>
                    {filteredPermissions.map((permission) => {
                      const updateKey = `${role.id}-${permission.id}`;
                      const isUpdating = updating === updateKey;
                      const hasCurrentPermission = hasPermission(role.id, permission.id);
                      
                      return (
                        <td key={permission.id} className="text-center border-start p-2">
                          <Button
                            variant={hasCurrentPermission ? 'success' : 'outline-secondary'}
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => togglePermission(role.id, permission.id)}
                            className="border-0"
                            style={{ width: '40px', height: '40px' }}
                            title={`${hasCurrentPermission ? 'Remover' : 'Asignar'} permiso "${permission.nombre}" ${hasCurrentPermission ? 'de' : 'a'} rol "${role.nombre}"`}
                          >
                            {isUpdating ? (
                              <Spinner animation="border" size="sm" />
                            ) : hasCurrentPermission ? (
                              <i className="bi bi-check-lg"></i>
                            ) : (
                              <i className="bi bi-dash"></i>
                            )}
                          </Button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Leyenda */}
      <Card className="border-0 shadow-sm mt-3">
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6 className="fw-bold mb-2">
                <i className="bi bi-info-circle me-2 text-primary"></i>
                Leyenda
              </h6>
              <div className="d-flex align-items-center mb-2">
                <Button variant="success" size="sm" className="me-2" style={{ width: '30px', height: '30px' }}>
                  <i className="bi bi-check-lg"></i>
                </Button>
                <span>Permiso asignado al rol</span>
              </div>
              <div className="d-flex align-items-center">
                <Button variant="outline-secondary" size="sm" className="me-2" style={{ width: '30px', height: '30px' }}>
                  <i className="bi bi-dash"></i>
                </Button>
                <span>Permiso no asignado (hacer clic para asignar)</span>
              </div>
            </Col>
            <Col md={6}>
              <h6 className="fw-bold mb-2">
                <i className="bi bi-palette me-2 text-primary"></i>
                Categorías de Permisos
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {getUniqueCategories().map(cat => (
                  <Badge key={cat} bg={getCategoryColor(cat)} className="d-flex align-items-center">
                    {cat} ({getTotalPermissionsByCategory(cat)})
                  </Badge>
                ))}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default MatrizPermisosManager;