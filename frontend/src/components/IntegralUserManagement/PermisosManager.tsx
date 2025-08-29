// src/components/IntegralUserManagement/PermisosManager.tsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Spinner, Alert, Modal, Form, ButtonGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
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
} from '../../services/permissionService';

const PermisosManager: React.FC = () => {
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
    loadPermissions();
  }, []);

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
    console.log('Editando permiso:', permission); // Debug log
    setPermissionForm({
      nombre: permission.nombre,
      descripcion: permission.descripcion || '',
      categoria: permission.categoria || 'general' // Valor por defecto si categoria es null
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
          ⚠️ Esta acción no se puede deshacer y afectará a todos los roles que tengan este permiso.
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

    // Validar que la categoría no esté vacía
    if (!permissionForm.categoria || permissionForm.categoria.trim() === '') {
      setPermissionForm(prev => ({ ...prev, categoria: 'general' }));
    }

    try {
      const permissionData: CreatePermissionData | UpdatePermissionData = {
        nombre: permissionForm.nombre.trim(),
        descripcion: permissionForm.descripcion.trim(),
        categoria: permissionForm.categoria.trim() || 'general'
      };

      console.log('Enviando datos:', permissionData); // Debug log

      if (editingPermission) {
        await updatePermission(editingPermission.id, permissionData as UpdatePermissionData);
      } else {
        await createPermission(permissionData as CreatePermissionData);
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

  const getCategoryColor = (categoria: string): string => {
    // Manejar valores null/undefined
    const cat = categoria || 'general';
    
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
    return colors[cat] || 'secondary';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando permisos...</span>
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
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-info mb-2">
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
              <div className="text-primary mb-2">
                <i className="bi bi-tags-fill" style={{ fontSize: '2rem' }}></i>
              </div>
              <h4 className="mb-1">{categorizedPermissions.length}</h4>
              <small className="text-muted">Categorías</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-success mb-2">
                <i className="bi bi-shield-check" style={{ fontSize: '2rem' }}></i>
              </div>
              <h4 className="mb-1">{permissions.filter(p => p.categoria === 'sistema').length}</h4>
              <small className="text-muted">Permisos de Sistema</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-warning mb-2">
                <i className="bi bi-person-gear" style={{ fontSize: '2rem' }}></i>
              </div>
              <h4 className="mb-1">{permissions.filter(p => p.categoria === 'usuarios').length}</h4>
              <small className="text-muted">Permisos de Usuarios</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Controles */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <h6 className="fw-bold mb-0 me-3">
            <i className="bi bi-list-ul me-2 text-info"></i>
            Permisos del Sistema
          </h6>
          <ButtonGroup size="sm">
            <Button 
              variant={viewMode === 'category' ? 'info' : 'outline-info'}
              onClick={() => setViewMode('category')}
            >
              <i className="bi bi-tags me-1"></i>
              Por Categoría
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'info' : 'outline-info'}
              onClick={() => setViewMode('list')}
            >
              <i className="bi bi-list me-1"></i>
              Lista Completa
            </Button>
          </ButtonGroup>
        </div>
        <Button 
          variant="info"
          size="sm"
          onClick={handleCreatePermission}
        >
          <i className="bi bi-plus-lg me-1"></i>
          Nuevo Permiso
        </Button>
      </div>

      {/* Vista por categorías */}
      {viewMode === 'category' ? (
        <div>
          {categorizedPermissions.map((category) => (
            <Card key={category.categoria} className="border-0 shadow-sm mb-3">
              <Card.Header className={`bg-${getCategoryColor(category.categoria)} text-white`}>
                <h6 className="mb-0">
                  <i className="bi bi-tag-fill me-2"></i>
                  {category.categoria.toUpperCase()} ({category.permisos.length})
                </h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Permiso</th>
                      <th>Descripción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.permisos.map((permission) => (
                      <tr key={permission.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-key text-info me-2"></i>
                            <code className="text-primary">{permission.nombre}</code>
                          </div>
                        </td>
                        <td>
                          <span className="text-muted">
                            {permission.descripcion || 'Sin descripción'}
                          </span>
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
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : (
        /* Vista de lista completa */
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {permissions.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-key-fill text-muted" style={{ fontSize: '3rem' }}></i>
                <p className="text-muted mt-3">No hay permisos registrados</p>
                <Button variant="info" onClick={handleCreatePermission}>
                  Crear primer permiso
                </Button>
              </div>
            ) : (
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Permiso</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission) => (
                    <tr key={permission.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-key text-info me-2"></i>
                          <code className="text-primary">{permission.nombre}</code>
                        </div>
                      </td>
                      <td>
                        <Badge bg={getCategoryColor(permission.categoria || 'general')}>
                          {permission.categoria || 'general'}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-muted">
                          {permission.descripcion || 'Sin descripción'}
                        </span>
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
            )}
          </Card.Body>
        </Card>
      )}

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
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong>Nombre del Permiso</strong>
                    <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: CREATE_USER, VIEW_REPORTS, etc."
                    value={permissionForm.nombre}
                    onChange={(e) => setPermissionForm({...permissionForm, nombre: e.target.value})}
                  />
                  <Form.Text className="text-muted">
                    Usa MAYÚSCULAS y guiones bajos (snake_case)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong>Categoría</strong>
                    <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={permissionForm.categoria}
                    onChange={(e) => setPermissionForm({...permissionForm, categoria: e.target.value})}
                  >
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
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
                placeholder="Describe qué permite hacer este permiso..."
                value={permissionForm.descripcion}
                onChange={(e) => setPermissionForm({...permissionForm, descripcion: e.target.value})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPermissionModal(false)}>
            Cancelar
          </Button>
          <Button variant="info" onClick={handleSavePermission}>
            <i className="bi bi-check-lg me-1"></i>
            {editingPermission ? 'Actualizar' : 'Crear'} Permiso
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PermisosManager;