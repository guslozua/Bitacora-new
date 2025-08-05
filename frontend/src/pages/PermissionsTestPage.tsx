// src/pages/PermissionsTestPage.tsx
// 🧪 PÁGINA DE PRUEBA PARA EL SISTEMA DE PERMISOS
// Esta página demuestra todas las funcionalidades del sistema de control de permisos

import React from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import PermissionGate from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import { 
  SYSTEM_PERMISSIONS, 
  PROJECT_PERMISSIONS, 
  TASK_PERMISSIONS,
  REPORT_PERMISSIONS,
  ROLES 
} from '../utils/permissions';

const PermissionsTestPage: React.FC = () => {
  const {
    userPermissions,
    userRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isLoading
  } = usePermissions();

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando permisos...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col xs={12}>
          <h2 className="mb-4">
            🧪 Página de Prueba - Sistema de Permisos
          </h2>
          <p className="text-muted mb-4">
            Esta página demuestra cómo funciona el sistema de control de permisos.
          </p>
        </Col>
      </Row>

      {/* Información del usuario actual */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">👤 Tu información actual</h5>
            </Card.Header>
            <Card.Body>
              <p><strong>Roles:</strong> {userRoles.length > 0 ? userRoles.join(', ') : 'Sin roles'}</p>
              <p><strong>Permisos:</strong> {userPermissions.length} permisos asignados</p>
              <details>
                <summary>Ver todos los permisos</summary>
                <div className="mt-2">
                  {userPermissions.map(permission => (
                    <Badge key={permission} bg="info" className="me-1 mb-1">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </details>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">🔍 Verificaciones rápidas</h5>
            </Card.Header>
            <Card.Body>
              <p>¿Eres Admin? {hasRole(ROLES.ADMIN) ? '✅ Sí' : '❌ No'}</p>
              <p>¿Eres SuperAdmin? {hasRole(ROLES.SUPER_ADMIN) ? '✅ Sí' : '❌ No'}</p>
              <p>¿Puedes crear usuarios? {hasPermission(SYSTEM_PERMISSIONS.CREATE_USER) ? '✅ Sí' : '❌ No'}</p>
              <p>¿Puedes gestionar roles? {hasPermission(SYSTEM_PERMISSIONS.MANAGE_ROLES) ? '✅ Sí' : '❌ No'}</p>
              <p>¿Tienes acceso admin? {hasPermission(SYSTEM_PERMISSIONS.ACCESS_ADMIN_PANEL) ? '✅ Sí' : '❌ No'}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Ejemplos de PermissionGate */}
      <Row className="mb-4">
        <Col xs={12}>
          <h3 className="mb-3">🛡️ Ejemplos de PermissionGate</h3>
        </Col>
        
        {/* Botones con permisos específicos */}
        <Col md={3} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <h6>Crear Usuario</h6>
              <p className="small text-muted">Requiere: crear_usuario</p>
              <PermissionGate 
                permission={SYSTEM_PERMISSIONS.CREATE_USER}
                fallback={
                  <Button variant="outline-secondary" disabled>
                    🔒 Sin permisos
                  </Button>
                }
              >
                <Button variant="success">
                  👤 Crear Usuario
                </Button>
              </PermissionGate>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <h6>Gestionar Roles</h6>
              <p className="small text-muted">Requiere: gestionar_roles</p>
              <PermissionGate 
                permission={SYSTEM_PERMISSIONS.MANAGE_ROLES}
                fallback={
                  <Button variant="outline-secondary" disabled>
                    🔒 Sin permisos
                  </Button>
                }
              >
                <Button variant="primary">
                  🛡️ Gestionar Roles
                </Button>
              </PermissionGate>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <h6>Ver Informes</h6>
              <p className="small text-muted">Requiere: ver_informes</p>
              <PermissionGate 
                permission={REPORT_PERMISSIONS.VIEW_REPORTS}
                fallback={
                  <Button variant="outline-secondary" disabled>
                    🔒 Sin permisos
                  </Button>
                }
              >
                <Button variant="info">
                  📈 Ver Informes
                </Button>
              </PermissionGate>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100">
            <Card.Body>
              <h6>Solo SuperAdmin</h6>
              <p className="small text-muted">Requiere: rol SuperAdmin</p>
              <PermissionGate 
                role={ROLES.SUPER_ADMIN}
                fallback={
                  <Button variant="outline-secondary" disabled>
                    🔒 Solo SuperAdmin
                  </Button>
                }
              >
                <Button variant="danger">
                  🔥 Función Crítica
                </Button>
              </PermissionGate>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Ejemplo de múltiples permisos */}
      <Row className="mb-4">
        <Col xs={12}>
          <h3 className="mb-3">🔀 Múltiples Permisos</h3>
        </Col>
        
        <Col md={6} className="mb-3">
          <Card>
            <Card.Body>
              <h6>Gestión de Proyectos (requiere TODOS)</h6>
              <p className="small text-muted">Requiere: crear_proyecto Y editar_proyecto</p>
              <PermissionGate 
                permissions={[PROJECT_PERMISSIONS.CREATE_PROJECT, PROJECT_PERMISSIONS.EDIT_PROJECT]}
                requireAll={true}
                fallback={
                  <Alert variant="warning" className="mb-0">
                    🚫 No tienes todos los permisos necesarios para gestionar proyectos
                  </Alert>
                }
              >
                <Alert variant="success" className="mb-0">
                  ✅ Puedes gestionar proyectos completamente
                </Alert>
              </PermissionGate>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-3">
          <Card>
            <Card.Body>
              <h6>Gestión de Tareas (requiere AL MENOS UNO)</h6>
              <p className="small text-muted">Requiere: crear_tarea O editar_tarea</p>
              <PermissionGate 
                permissions={[TASK_PERMISSIONS.CREATE_TASK, TASK_PERMISSIONS.EDIT_TASK]}
                requireAll={false}
                fallback={
                  <Alert variant="warning" className="mb-0">
                    🚫 No puedes gestionar tareas
                  </Alert>
                }
              >
                <Alert variant="info" className="mb-0">
                  📋 Puedes trabajar con tareas
                </Alert>
              </PermissionGate>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Secciones completas ocultas */}
      <Row className="mb-4">
        <Col xs={12}>
          <h3 className="mb-3">🚫 Secciones Protegidas</h3>
        </Col>
        
        <PermissionGate permission={SYSTEM_PERMISSIONS.ACCESS_ADMIN_PANEL}>
          <Col xs={12} className="mb-3">
            <Alert variant="danger">
              🚨 <strong>Panel de Administración</strong><br/>
              Esta sección solo es visible para usuarios con acceso administrativo.
              Si puedes ver esto, tienes el permiso 'acceder_panel_admin'.
            </Alert>
          </Col>
        </PermissionGate>
        
        <PermissionGate 
          role={ROLES.SUPER_ADMIN}
          fallback={
            <Col xs={12} className="mb-3">
              <Alert variant="secondary">
                🔒 Hay una sección aquí que solo pueden ver los SuperAdministradores
              </Alert>
            </Col>
          }
        >
          <Col xs={12} className="mb-3">
            <Alert variant="success">
              👑 <strong>¡Eres SuperAdmin!</strong><br/>
              Esta sección especial solo es visible para SuperAdministradores.
            </Alert>
          </Col>
        </PermissionGate>
      </Row>

      {/* Información de debugging */}
      <Row>
        <Col xs={12}>
          <Card className="bg-light">
            <Card.Header>
              <h5 className="mb-0">🔧 Información de Debug</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <h6>Funciones disponibles:</h6>
                  <ul className="small">
                    <li>hasPermission(permission)</li>
                    <li>hasAnyPermission([permissions])</li>
                    <li>hasAllPermissions([permissions])</li>
                    <li>hasRole(role)</li>
                  </ul>
                </Col>
                <Col md={4}>
                  <h6>Estados:</h6>
                  <ul className="small">
                    <li>isLoading: {isLoading ? 'true' : 'false'}</li>
                    <li>userPermissions.length: {userPermissions.length}</li>
                    <li>userRoles.length: {userRoles.length}</li>
                  </ul>
                </Col>
                <Col md={4}>
                  <h6>Ejemplos de uso:</h6>
                  <pre className="small bg-white p-2 border rounded">
                    {`// En componente
const { hasPermission } = usePermissions();

if (hasPermission('crear_usuario')) {
  // Mostrar botón crear
}`}
                  </pre>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PermissionsTestPage;