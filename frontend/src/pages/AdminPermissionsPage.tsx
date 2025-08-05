// src/pages/AdminPermissionsPage.tsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner, Alert, Modal, Form, ButtonGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import LightFooter from '../components/LightFooter';
import { isAuthenticated } from '../services/authService';
import { 
  fetchAllPermissions, 
  fetchPermissionsByCategory,
  createPermission, 
  updatePermission, 
  deletePermission,
  Permission,
  PermissionsByCategory,
  CreatePermissionData,
  UpdatePermissionData
} from '../services/permissionService';

const AdminPermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [categorizedPermissions, setCategorizedPermissions] = useState<PermissionsByCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'category'>('category');
  const navigate = useNavigate();

  // Estados para el modal de crear/editar permiso
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [permissionForm, setPermissionForm] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'sistema'
  });

  // Categorías disponibles
  const availableCategories = [
    'sistema',
    'proyectos', 
    'tareas',
    'subtareas',
    'informes',
    'usuarios',
    'configuracion',
    'general'
  ];

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadPermissions();
  }, [navigate]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar permisos en ambos formatos
      const [allPermissions, categorizedPerms] = await Promise.all([
        fetchAllPermissions(),
        fetchPermissionsByCategory()
      ]);
      
      setPermissions(allPermissions || []);
      setCategorizedPermissions(categorizedPerms || []);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin');
  };

  const handleCreatePermission = () => {
    setEditingPermission(null);
    setPermissionForm({
      nombre: '',
      descripcion: '',
      categoria: 'sistema'
    });
    setShowPermissionModal(true);
  };

  const handleEditPermission = (permission: Permission) => {
    setEditingPermission(permission);
    setPermissionForm({
      nombre: permission.nombre,
      descripcion: permission.descripcion || '',
      categoria: permission.categoria
    });
    setShowPermissionModal(true);
  };

  const handleDeletePermission = async (permission: Permission) => {
    const result = await Swal.fire({
      title: '¿Eliminar permiso?',
      html: `
        <p>¿Estás seguro de que quieres eliminar el permiso <strong>"${permission.nombre}"</strong>?</p>
        <br>
        <p style="color: #dc3545; font-size: 14px;">
          ⚠️ Esta acción no se puede deshacer y eliminará el permiso de todos los roles.
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
      await deletePermission(permission.id);
      
      // Recargar la lista de permisos
      await loadPermissions();
      
      // Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Permiso eliminado!',
        text: 'El permiso ha sido eliminado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error al eliminar el permiso'
      });
    }
  };

  const handleSavePermission = async () => {
    if (!permissionForm.nombre.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre del permiso es requerido'
      });
      return;
    }

    try {
      const permissionData: CreatePermissionData | UpdatePermissionData = {
        nombre: permissionForm.nombre.trim(),
        descripcion: permissionForm.descripcion.trim(),
        categoria: permissionForm.categoria
      };

      if (editingPermission) {
        await updatePermission(editingPermission.id, permissionData);
      } else {
        await createPermission(permissionData);
      }

      // Cerrar modal
      setShowPermissionModal(false);
      
      // Recargar la lista de permisos
      await loadPermissions();
      
      // Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: editingPermission ? '¡Permiso actualizado!' : '¡Permiso creado!',
        text: editingPermission ? 'El permiso ha sido actualizado correctamente' : 'El permiso ha sido creado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
      
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error al guardar el permiso'
      });
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

  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

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
                  Gestión de Permisos
                </h2>
                <p className="text-muted mb-0">
                  Administra los permisos del sistema y asígnalos a roles
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
                  variant="primary"
                  onClick={handleCreatePermission}
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  Nuevo Permiso
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
                      <i className="bi bi-key-fill" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h4 className="mb-1">{permissions.length}</h4>
                    <small className="text-muted">Total de Permisos</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <div className="text-success mb-2">
                      <i className="bi bi-collection" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <h4 className="mb-1">{categorizedPermissions.length}</h4>
                    <small className="text-muted">Categorías</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Selector de vista */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-light border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-list-ul me-2"></i>
                    Lista de Permisos
                  </h5>
                  <ButtonGroup>
                    <Button
                      variant={viewMode === 'category' ? 'primary' : 'outline-primary'}
                      onClick={() => setViewMode('category')}
                      size="sm"
                    >
                      <i className="bi bi-collection me-1"></i>
                      Por Categoría
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
                      onClick={() => setViewMode('list')}
                      size="sm"
                    >
                      <i className="bi bi-list me-1"></i>
                      Lista Completa
                    </Button>
                  </ButtonGroup>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                {viewMode === 'category' ? (
                  // Vista por categorías
                  categorizedPermissions.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-key-fill text-muted" style={{ fontSize: '3rem' }}></i>
                      <p className="text-muted mt-3">No hay permisos registrados</p>
                      <Button variant="primary" onClick={handleCreatePermission}>
                        Crear primer permiso
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3">
                      {categorizedPermissions.map((category) => (
                        <div key={category.categoria} className="mb-4">
                          <h6 className="text-uppercase text-muted mb-3">
                            <i className={`${getCategoryIcon(category.categoria)} me-2`}></i>
                            {category.categoria}
                            <Badge bg={getBadgeColor(category.categoria)} className="ms-2">
                              {category.permisos.length}
                            </Badge>
                          </h6>
                          <Row>
                            {category.permisos.map((permission) => (
                              <Col md={6} lg={4} key={permission.id} className="mb-3">
                                <Card className="h-100 border border-light">
                                  <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <h6 className="mb-1">{permission.nombre}</h6>
                                      <div className="btn-group" role="group">
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={() => handleEditPermission(permission)}
                                          title="Editar permiso"
                                        >
                                          <i className="bi bi-pencil"></i>
                                        </Button>
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() => handleDeletePermission(permission)}
                                          title="Eliminar permiso"
                                        >
                                          <i className="bi bi-trash"></i>
                                        </Button>
                                      </div>
                                    </div>
                                    <p className="text-muted small mb-0">
                                      {permission.descripcion || 'Sin descripción'}
                                    </p>
                                  </Card.Body>
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  // Vista de lista completa
                  permissions.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-key-fill text-muted" style={{ fontSize: '3rem' }}></i>
                      <p className="text-muted mt-3">No hay permisos registrados</p>
                      <Button variant="primary" onClick={handleCreatePermission}>
                        Crear primer permiso
                      </Button>
                    </div>
                  ) : (
                    <Table responsive hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Permiso</th>
                          <th>Descripción</th>
                          <th>Categoría</th>
                          <th>Fecha Creación</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissions.map((permission) => (
                          <tr key={permission.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-key text-primary me-2"></i>
                                <strong>{permission.nombre}</strong>
                              </div>
                            </td>
                            <td>
                              <span className="text-muted">
                                {permission.descripcion || 'Sin descripción'}
                              </span>
                            </td>
                            <td>
                              <Badge bg={getBadgeColor(permission.categoria)}>
                                <i className={`${getCategoryIcon(permission.categoria)} me-1`}></i>
                                {permission.categoria}
                              </Badge>
                            </td>
                            <td>
                              <small className="text-muted">
                                {new Date(permission.fecha_creacion).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <div className="btn-group" role="group">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleEditPermission(permission)}
                                  title="Editar permiso"
                                >
                                  <i className="bi bi-pencil"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeletePermission(permission)}
                                  title="Eliminar permiso"
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modal para crear/editar permiso */}
        <Modal show={showPermissionModal} onHide={() => setShowPermissionModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-key-fill me-2"></i>
              {editingPermission ? 'Editar Permiso' : 'Crear Nuevo Permiso'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>Nombre del Permiso</strong>
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ej: crear_usuario"
                      value={permissionForm.nombre}
                      onChange={(e) => setPermissionForm(prev => ({ ...prev, nombre: e.target.value }))}
                    />
                    <Form.Text className="text-muted">
                      Usa snake_case: crear_proyecto, editar_tarea, etc.
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>Categoría</strong>
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={permissionForm.categoria}
                      onChange={(e) => setPermissionForm(prev => ({ ...prev, categoria: e.target.value }))}
                    >
                      {availableCategories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>Descripción</strong>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Describe qué permite hacer este permiso..."
                      value={permissionForm.descripcion}
                      onChange={(e) => setPermissionForm(prev => ({ ...prev, descripcion: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPermissionModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSavePermission}>
              <i className="bi bi-check-lg me-1"></i>
              {editingPermission ? 'Actualizar' : 'Crear'} Permiso
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
      <LightFooter />
    </>
  );
};

export default AdminPermissionsPage;
