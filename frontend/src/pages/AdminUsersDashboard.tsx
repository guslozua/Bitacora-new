// src/pages/AdminUsersDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import UsersList from '../components/users/UsersList';
import UsersFilter from '../components/users/UsersFilter';
import UserModalForm from '../components/users/UserModalForm';
import { isAuthenticated } from '../services/authService';
import { 
  fetchUserCount, 
  fetchActiveUserCount, 
  fetchAdminCount, 
  fetchBlockedUserCount,
  fetchAllUsers,
  UserFilters,
  UserAdmin
} from '../services/userService';
import { useNavigate } from 'react-router-dom';
import LightFooter from '../components/LightFooter';

// 🔐 NUEVOS IMPORTS PARA EL SISTEMA DE PERMISOS
import PermissionGate from '../components/PermissionGate';
import { usePermissions } from '../hooks/usePermissions';
import { SYSTEM_PERMISSIONS, USER_PERMISSIONS } from '../utils/permissions';

const AdminUsersDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [activeUserCount, setActiveUserCount] = useState<number>(0);
  const [adminCount, setAdminCount] = useState<number>(0);
  const [blockedUserCount, setBlockedUserCount] = useState<number>(0);
  const [filters, setFilters] = useState<UserFilters>({});
  const [allUsers, setAllUsers] = useState<UserAdmin[]>([]);
  const navigate = useNavigate();
  
  // 🔐 HOOK PARA VERIFICAR PERMISOS
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  
  // Estados para controlar el modal de creación/edición
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    checkAuthAndLoadData();
  }, [navigate]);

  // Manejar cambios en filtros
  const handleFilterChange = (newFilters: UserFilters): void => {
    setFilters(newFilters);
  };

  // Manejar la creación de un nuevo usuario
  const handleCreateUser = (): void => {
    setSelectedUserId(null); // Nuevo usuario
    setShowUserModal(true);
  };
  
  // Manejar la edición de un usuario
  const handleEditUser = (userId: string): void => {
    setSelectedUserId(userId);
    setShowUserModal(true);
  };
  
  // Manejar el cierre del modal de usuario
  const handleCloseUserModal = (): void => {
    setShowUserModal(false);
  };
  
  // Manejar el éxito al crear/editar un usuario
  const handleUserSaveSuccess = (): void => {
    // Recargar los datos
    setLoading(true);
    checkAuthAndLoadData();
  };

  // Volver al panel de administración
  const handleBack = (): void => {
    navigate('/admin');
  };
  
  // Función para cargar datos (para reutilizar)
  const checkAuthAndLoadData = async (): Promise<void> => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    try {
      // Primero, obtener todos los usuarios para poder calcular manualmente
      let users: UserAdmin[] = [];
      try {
        const allUsersData = await fetchAllUsers();
        if (Array.isArray(allUsersData)) {
          users = allUsersData as UserAdmin[];
          setAllUsers(users);
          console.log('Usuarios obtenidos:', users.length);
          
          // Calcular conteos a partir de los datos obtenidos
          setUserCount(users.length);
          
          // Usuarios activos (estado === 'activo')
          const activeUsers = users.filter((user: UserAdmin) => 
            user.estado === 'activo' || 
            user.status === 'active' || 
            user.estado === 'active' || 
            user.status === 'activo'
          );
          setActiveUserCount(activeUsers.length);
          console.log('Usuarios activos (calculado):', activeUsers.length);
          
          // Administradores (rol === 'admin' o 'superadmin')
          const adminUsers = users.filter(user => {
            console.log(`Analizando usuario para rol admin: ${user.nombre} (${user.email})`);
            
            // Registra todos los campos del usuario para encontrar dónde está el rol
            console.log('Campos del usuario:', Object.keys(user).join(', '));
            
            // Verificar diferentes formatos posibles
            if (user.roles && Array.isArray(user.roles)) {
              console.log(`  roles (array):`, user.roles);
              const isAdmin = user.roles.some(rol => 
                String(rol).toLowerCase().includes('admin') || 
                String(rol).toLowerCase().includes('superadmin') || 
                String(rol).toLowerCase().includes('administrator')
              );
              if (isAdmin) {
                console.log(`  ✅ Es admin por array de roles`);
                return true;
              }
            }
            
            if (user.rol) {
              console.log(`  rol (string): ${user.rol}`);
              const isAdmin = String(user.rol).toLowerCase().includes('admin') || 
                             String(user.rol).toLowerCase().includes('superadmin') || 
                             String(user.rol).toLowerCase().includes('administrator');
              if (isAdmin) {
                console.log(`  ✅ Es admin por campo rol`);
                return true;
              }
            }
            
            if (user.role) {
              console.log(`  role (string): ${user.role}`);
              const isAdmin = String(user.role).toLowerCase().includes('admin') || 
                             String(user.role).toLowerCase().includes('superadmin') || 
                             String(user.role).toLowerCase().includes('administrator');
              if (isAdmin) {
                console.log(`  ✅ Es admin por campo role`);
                return true;
              }
            }
            
            // Buscar en cualquier propiedad que tenga la palabra "admin" o "role"
            const adminProps = Object.keys(user).filter(key => 
              key.toLowerCase().includes('admin') || 
              key.toLowerCase().includes('rol') || 
              key.toLowerCase().includes('role')
            );
            
            if (adminProps.length > 0) {
              console.log(`  Propiedades relacionadas con rol:`, adminProps);
              
              for (const prop of adminProps) {
                const value = (user as any)[prop];
                console.log(`  ${prop}:`, value);
                
                if (typeof value === 'string' && String(value).toLowerCase().includes('admin')) {
                  console.log(`  ✅ Es admin por valor en campo ${prop}`);
                  return true;
                }
                
                if (Array.isArray(value)) {
                  const hasAdmin = value.some(item => 
                    typeof item === 'string' && String(item).toLowerCase().includes('admin')
                  );
                  if (hasAdmin) {
                    console.log(`  ✅ Es admin por valor en array ${prop}`);
                    return true;
                  }
                }
                
                // Si es un objeto, verificar si tiene alguna propiedad con "admin"
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                  console.log(`  Verificando objeto ${prop}:`, value);
                  const objProperties = Object.entries(value);
                  for (const [key, propValue] of objProperties) {
                    console.log(`    ${key}:`, propValue);
                    if (
                      (typeof propValue === 'string' && String(propValue).toLowerCase().includes('admin')) ||
                      (typeof key === 'string' && String(key).toLowerCase().includes('admin'))
                    ) {
                      console.log(`  ✅ Es admin por valor en objeto ${prop}.${key}`);
                      return true;
                    }
                  }
                }
              }
            }
            
            console.log(`  ❌ No es admin`);
            return false;
          });
          
          setAdminCount(adminUsers.length);
          console.log('Administradores detectados:', adminUsers.length);
          console.log('Usuarios admin:', adminUsers.map(u => `${u.nombre} (${u.email})`).join(', '));
          
          // Usuarios bloqueados (estado === 'bloqueado')
          const blockedUsers = users.filter((user: UserAdmin) => 
            user.estado === 'bloqueado' || 
            user.status === 'blocked' || 
            user.estado === 'blocked' || 
            user.status === 'bloqueado'
          );
          setBlockedUserCount(blockedUsers.length);
          console.log('Usuarios bloqueados (calculado):', blockedUsers.length);
        }
      } catch (userError) {
        console.error('Error al obtener todos los usuarios:', userError);
        
        // Si falla, intentamos usar las funciones específicas
        try {
          // Intentar cargar conteos usando las APIs individuales
          console.log('Intentando cargar conteos mediante API específicas...');
          
          const [totalData, activeData, adminData, blockedData] = await Promise.allSettled([
            fetchUserCount(),
            fetchActiveUserCount(),
            fetchAdminCount(),
            fetchBlockedUserCount()
          ]);
          
          console.log('Resultados de conteos:');
          console.log('Total:', totalData);
          console.log('Activos:', activeData);
          console.log('Administradores:', adminData);
          console.log('Bloqueados:', blockedData);
          
          // Procesar resultados
          if (totalData.status === 'fulfilled' && totalData.value.success) {
            setUserCount(totalData.value.count);
          }
          
          if (activeData.status === 'fulfilled' && activeData.value.success) {
            setActiveUserCount(activeData.value.count);
          } else {
            console.error('Error al cargar usuarios activos:', activeData);
          }
          
          if (adminData.status === 'fulfilled' && adminData.value.success) {
            setAdminCount(adminData.value.count);
          } else {
            console.error('Error al cargar administradores:', adminData);
          }
          
          if (blockedData.status === 'fulfilled' && blockedData.value.success) {
            setBlockedUserCount(blockedData.value.count);
          } else {
            console.error('Error al cargar usuarios bloqueados:', blockedData);
          }
        } catch (apiError) {
          console.error('Error al cargar mediante APIs específicas:', apiError);
          throw apiError;
        }
      }
    } catch (err) {
      setError('Error al cargar datos del dashboard');
      console.error('Error general al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="py-5 px-4 text-center">
        <Spinner animation="border" role="status" className="me-2" />
        <span>Cargando...</span>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 px-4">
      {error && <Alert variant="danger">{error}</Alert>}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center mb-1">
            <img
              src="/logoxside22.png"
              alt="Logo"
              style={{ width: '32px', height: '32px', marginRight: '10px' }}
            />
            <h2 className="mb-0 fw-bold">Administración de Usuarios</h2>
          </div>
          <p className="text-muted mb-0">
            Gestiona los usuarios del sistema, sus roles y permisos
          </p>
        </div>
        <div className="d-flex">
          <Button 
            variant="outline-secondary" 
            className="me-2 shadow-sm" 
            onClick={handleBack}
          >
            <i className="bi bi-arrow-left me-1"></i> Volver al Panel
          </Button>
          
          {/* 🔐 BOTÓN CREAR USUARIO CON CONTROL DE PERMISOS */}
          <PermissionGate 
            permission={SYSTEM_PERMISSIONS.CREATE_USER}
            fallback={
              <Button 
                variant="outline-primary" 
                className="shadow-sm" 
                disabled
                title="No tienes permisos para crear usuarios"
              >
                <i className="bi bi-lock me-1"></i> Sin permisos
              </Button>
            }
          >
            <Button 
              variant="primary" 
              className="shadow-sm"
              onClick={handleCreateUser}
              disabled={permissionsLoading}
            >
              <i className="bi bi-plus-circle me-1"></i> Nuevo Usuario
            </Button>
          </PermissionGate>
        </div>
      </div>
      
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total de Usuarios</h6>
                  <h2 className="fw-bold mb-0">{userCount}</h2>
                </div>
                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                  style={{ 
                    backgroundColor: '#3498db20',
                    width: '3.5rem',
                    height: '3.5rem',
                    padding: 0
                  }}>
                  <i className="bi bi-people-fill fs-3" style={{ color: '#3498db' }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Usuarios Activos</h6>
                  <h2 className="fw-bold mb-0">{activeUserCount}</h2>
                </div>
                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                  style={{ 
                    backgroundColor: '#2ecc7120',
                    width: '3.5rem',
                    height: '3.5rem',
                    padding: 0
                  }}>
                  <i className="bi bi-person-check-fill fs-3" style={{ color: '#2ecc71' }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Administradores</h6>
                  <h2 className="fw-bold mb-0">{adminCount}</h2>
                </div>
                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                  style={{ 
                    backgroundColor: '#9b59b620',
                    width: '3.5rem',
                    height: '3.5rem',
                    padding: 0
                  }}>
                  <i className="bi bi-shield-lock-fill fs-3" style={{ color: '#9b59b6' }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Usuarios Bloqueados</h6>
                  <h2 className="fw-bold mb-0">{blockedUserCount}</h2>
                </div>
                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                  style={{ 
                    backgroundColor: '#e74c3c20',
                    width: '3.5rem',
                    height: '3.5rem',
                    padding: 0
                  }}>
                  <i className="bi bi-person-fill-lock fs-3" style={{ color: '#e74c3c' }} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-list-ul me-2 text-primary"></i>
            Listado de Usuarios
          </h5>
        </Card.Header>
        <Card.Body>
          <UsersFilter onFilterChange={handleFilterChange} />
          <UsersList 
            filters={filters} 
            onEditUser={handleEditUser} 
          />
        </Card.Body>
      </Card>
      
      {/* Modal para crear/editar usuario */}
      <UserModalForm 
        show={showUserModal}
        onHide={handleCloseUserModal}
        userId={selectedUserId}
        onSuccess={handleUserSaveSuccess}
      />
      
      <LightFooter />
    </Container>
  );
};

export default AdminUsersDashboard;