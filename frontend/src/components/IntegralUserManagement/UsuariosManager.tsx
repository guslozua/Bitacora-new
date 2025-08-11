// src/components/IntegralUserManagement/UsuariosManager.tsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import UsersList from '../users/UsersList';
import UsersFilter from '../users/UsersFilter';
import UserModalForm from '../users/UserModalForm';
import { 
  fetchUserCount, 
  fetchActiveUserCount, 
  fetchAdminCount, 
  fetchBlockedUserCount,
  fetchAllUsers,
  UserFilters,
  UserAdmin
} from '../../services/userService';

// 🔐 IMPORTS PARA EL SISTEMA DE PERMISOS
import PermissionGate from '../PermissionGate';
import { usePermissions } from '../../hooks/usePermissions';
import { SYSTEM_PERMISSIONS } from '../../utils/permissions';

const UsuariosManager: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [activeUserCount, setActiveUserCount] = useState<number>(0);
  const [adminCount, setAdminCount] = useState<number>(0);
  const [blockedUserCount, setBlockedUserCount] = useState<number>(0);
  const [filters, setFilters] = useState<UserFilters>({});
  const [allUsers, setAllUsers] = useState<UserAdmin[]>([]);
  
  // 🔐 HOOK PARA VERIFICAR PERMISOS
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  
  // Estados para controlar el modal de creación/edición
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

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
    loadData();
  };
  
  // Función para cargar datos
  const loadData = async (): Promise<void> => {
    try {
      // Obtener todos los usuarios para poder calcular manualmente
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
          
          // Administradores (rol === 'admin' o 'superadmin')
          const adminUsers = users.filter(user => {
            // Verificar diferentes formatos posibles
            if (user.roles && Array.isArray(user.roles)) {
              const isAdmin = user.roles.some(rol => 
                String(rol).toLowerCase().includes('admin') || 
                String(rol).toLowerCase().includes('superadmin') || 
                String(rol).toLowerCase().includes('administrator')
              );
              if (isAdmin) return true;
            }
            
            if (user.rol) {
              const isAdmin = String(user.rol).toLowerCase().includes('admin') || 
                             String(user.rol).toLowerCase().includes('superadmin') || 
                             String(user.rol).toLowerCase().includes('administrator');
              if (isAdmin) return true;
            }
            
            if (user.role) {
              const isAdmin = String(user.role).toLowerCase().includes('admin') || 
                             String(user.role).toLowerCase().includes('superadmin') || 
                             String(user.role).toLowerCase().includes('administrator');
              if (isAdmin) return true;
            }
            
            return false;
          });
          
          setAdminCount(adminUsers.length);
          
          // Usuarios bloqueados (estado === 'bloqueado')
          const blockedUsers = users.filter((user: UserAdmin) => 
            user.estado === 'bloqueado' || 
            user.status === 'blocked' || 
            user.estado === 'blocked' || 
            user.status === 'bloqueado'
          );
          setBlockedUserCount(blockedUsers.length);
        }
      } catch (userError) {
        console.error('Error al obtener todos los usuarios:', userError);
        
        // Si falla, intentamos usar las funciones específicas
        try {
          const [totalData, activeData, adminData, blockedData] = await Promise.allSettled([
            fetchUserCount(),
            fetchActiveUserCount(),
            fetchAdminCount(),
            fetchBlockedUserCount()
          ]);
          
          // Procesar resultados
          if (totalData.status === 'fulfilled' && totalData.value.success) {
            setUserCount(totalData.value.count);
          }
          
          if (activeData.status === 'fulfilled' && activeData.value.success) {
            setActiveUserCount(activeData.value.count);
          }
          
          if (adminData.status === 'fulfilled' && adminData.value.success) {
            setAdminCount(adminData.value.count);
          }
          
          if (blockedData.status === 'fulfilled' && blockedData.value.success) {
            setBlockedUserCount(blockedData.value.count);
          }
        } catch (apiError) {
          console.error('Error al cargar mediante APIs específicas:', apiError);
          throw apiError;
        }
      }
    } catch (err) {
      setError('Error al cargar datos de usuarios');
      console.error('Error general al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-5 text-center">
        <Spinner animation="border" role="status" className="me-2" />
        <span>Cargando datos de usuarios...</span>
      </div>
    );
  }

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* KPIs de usuarios */}
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
      
      {/* Sección de gestión */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">
          <i className="bi bi-list-ul me-2 text-primary"></i>
          Listado de Usuarios
        </h6>
        
        {/* 🔐 BOTÓN CREAR USUARIO CON CONTROL DE PERMISOS */}
        <PermissionGate 
          permission={SYSTEM_PERMISSIONS.CREATE_USER}
          fallback={
            <Button 
              variant="outline-primary" 
              size="sm"
              disabled
              title="No tienes permisos para crear usuarios"
            >
              <i className="bi bi-lock me-1"></i> Sin permisos
            </Button>
          }
        >
          <Button 
            variant="primary" 
            size="sm"
            onClick={handleCreateUser}
            disabled={permissionsLoading}
          >
            <i className="bi bi-plus-circle me-1"></i> Nuevo Usuario
          </Button>
        </PermissionGate>
      </div>
      
      {/* Filtros y lista */}
      <Card className="border-0 shadow-sm">
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
    </div>
  );
};

export default UsuariosManager;