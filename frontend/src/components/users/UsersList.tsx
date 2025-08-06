// src/components/users/UsersList.tsx
// 🔐 COMPONENTE CON CONTROL DE PERMISOS APLICADO
// - Ver detalles: USER_PERMISSIONS.VIEW_USERS
// - Editar usuario: SYSTEM_PERMISSIONS.EDIT_USER
// - Bloquear/Desbloquear: SYSTEM_PERMISSIONS.EDIT_USER  
// - Eliminar usuario: SYSTEM_PERMISSIONS.DELETE_USER

import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Pagination, Spinner, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { fetchAdminUsers, deleteUser, updateUser, UserFilters, UserAdmin } from '../../services/userService';
import UserDetailModal from './UserDetailModal';

// 🔐 NUEVOS IMPORTS PARA EL SISTEMA DE PERMISOS
import PermissionGate from '../PermissionGate';
import { usePermissions } from '../../hooks/usePermissions';
import { SYSTEM_PERMISSIONS, USER_PERMISSIONS } from '../../utils/permissions';

interface UsersListProps {
  filters?: UserFilters;
  onEditUser?: (userId: string) => void; // Prop para editar usuario
  onViewUser?: (userId: string) => void; // Prop para ver detalles (opcional)
}

const UsersList: React.FC<UsersListProps> = ({ filters = {}, onEditUser, onViewUser }) => {
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // Estados para el modal de detalles
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // 🔐 HOOK PARA VERIFICAR PERMISOS
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchAdminUsers(filters, currentPage);
      
      if (response.success) {
        setUsers(response.data || []);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
      } else {
        setError('Error al cargar usuarios');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar usuarios al montar el componente o cuando cambian los filtros o la página
  useEffect(() => {
    loadUsers();
  }, [currentPage, filters]);
  
  // Cambiar de página
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  // Ver detalles de usuario
  const handleViewUser = (userId: number) => {
    // Si existe onViewUser (prop externa), usarla
    if (onViewUser) {
      onViewUser(String(userId));
    } else {
      // Si no, usar el modal interno
      setSelectedUserId(String(userId));
      setShowDetailModal(true);
    }
  };
  
  // Cerrar modal de detalles
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
  };
  
  // Editar usuario desde el modal de detalles o desde la lista
  const handleEditUser = (userId: number) => {
    if (onEditUser) {
      onEditUser(String(userId));
    }
  };
  
  // Mostrar SweetAlert para eliminar usuario
  const handleDeleteUser = (user: UserAdmin) => {
    Swal.fire({
      title: 'Confirmar eliminación',
      text: `¿Estás seguro de que deseas eliminar al usuario ${user.nombre}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await deleteUser(user.id);
          
          Swal.fire(
            'Eliminado',
            `El usuario ${user.nombre} ha sido eliminado correctamente.`,
            'success'
          );
          
          loadUsers(); // Recargar usuarios
        } catch (error: any) {
          Swal.fire(
            'Error',
            'No se pudo eliminar el usuario.',
            'error'
          );
          setLoading(false);
        }
      }
    });
  };
  
  // Mostrar SweetAlert para bloquear/desbloquear usuario
  const handleToggleBlock = (user: UserAdmin) => {
    const isBlocked = user.estado === 'bloqueado';
    const action = isBlocked ? 'desbloquear' : 'bloquear';
    const actionText = isBlocked ? 'desbloquear' : 'bloquear';
    
    Swal.fire({
      title: `Confirmar ${action}`,
      text: `¿Estás seguro de que deseas ${actionText} al usuario ${user.nombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: isBlocked ? '#28a745' : '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: isBlocked ? 'Desbloquear' : 'Bloquear',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          const newStatus = isBlocked ? 'activo' : 'bloqueado';
          
          await updateUser(user.id, {
            ...user,
            nombre: user.nombre,
            email: user.email,
            estado: newStatus
          });
          
          Swal.fire(
            isBlocked ? 'Desbloqueado' : 'Bloqueado',
            `El usuario ${user.nombre} ha sido ${isBlocked ? 'desbloqueado' : 'bloqueado'} correctamente.`,
            'success'
          );
          
          loadUsers(); // Recargar usuarios
        } catch (error: any) {
          Swal.fire(
            'Error',
            `No se pudo ${actionText} al usuario.`,
            'error'
          );
          setLoading(false);
        }
      }
    });
  };
  
  // Renderizar badge de estado
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'activo':
        return <Badge bg="success">Activo</Badge>;
      case 'inactivo':
        return <Badge bg="warning">Inactivo</Badge>;
      case 'bloqueado':
        return <Badge bg="danger">Bloqueado</Badge>;
      default:
        return <Badge bg="secondary">{status || 'Desconocido'}</Badge>;
    }
  };
  
  // Renderizar badge de roles con colores diferentes según el rol
  const renderRoleBadges = (roles?: string[]) => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) return null;
    
    // Mapeo de roles a colores
    const roleColors: {[key: string]: string} = {
      'admin': 'danger',
      'Admin': 'danger',
      'SuperAdmin': 'dark',
      'User': 'success',
      'GestorProyectos': 'primary',
      'Gestor': 'primary',
      'Técnico': 'info',
      'Tecnico': 'info',
      'Visitante': 'secondary',
      'Auditor': 'warning',
      'Cliente': 'light text-dark',
      // Puedes agregar más roles según sea necesario
    };
    
    return roles.map((role, index) => {
      // Obtener color para el rol, o usar 'info' como predeterminado
      const bgColor = roleColors[role] || 'info';
      
      return (
        <Badge key={index} bg={bgColor} className="me-1 mb-1">
          {role}
        </Badge>
      );
    });
  };
  
  // Función para renderizar botones de acción con tooltips
  const renderActionButton = (
    variant: string,
    icon: string,
    tooltipText: string,
    onClick: () => void,
    disabled: boolean = false
  ) => {
    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip id={`tooltip-${tooltipText.toLowerCase().replace(/\s/g, '-')}`}>{tooltipText}</Tooltip>}
      >
        <Button 
          variant={variant} 
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className="me-1 mb-1"
          style={{ minWidth: '32px' }}
        >
          <i className={icon}></i>
        </Button>
      </OverlayTrigger>
    );
  };
  
  // 🔐 MOSTRAR LOADING SI ESTÁ CARGANDO USUARIOS O PERMISOS
  if ((loading && users.length === 0) || permissionsLoading) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }
  
  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Table responsive striped hover className="align-middle">
        <thead className="table-light">
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-4">
                No se encontraron usuarios
              </td>
            </tr>
          ) : (
            users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td className="fw-medium">{user.nombre}</td>
                <td>{user.email}</td>
                <td>{renderRoleBadges(user.roles)}</td>
                <td>{renderStatusBadge(user.estado)}</td>
                <td>
                  <div className="d-flex flex-wrap">
                    {/* 🔐 VER DETALLES - Cualquier usuario con acceso a la lista puede ver */}
                    <PermissionGate permission={USER_PERMISSIONS.VIEW_USERS}>
                      {renderActionButton(
                        "outline-info", 
                        "fas fa-eye", 
                        "Ver detalles del usuario", 
                        () => handleViewUser(user.id), 
                        loading
                      )}
                    </PermissionGate>
                    
                    {/* 🔐 EDITAR - Solo con permiso de editar usuarios */}
                    <PermissionGate permission={SYSTEM_PERMISSIONS.EDIT_USER}>
                      {renderActionButton(
                        "outline-primary", 
                        "fas fa-edit", 
                        "Editar información del usuario", 
                        () => handleEditUser(user.id), 
                        loading
                      )}
                    </PermissionGate>
                    
                    {/* 🔐 BLOQUEAR/DESBLOQUEAR - Solo con permiso de editar usuarios */}
                    <PermissionGate permission={SYSTEM_PERMISSIONS.EDIT_USER}>
                      {renderActionButton(
                        user.estado === 'bloqueado' ? 'outline-success' : 'outline-warning', 
                        user.estado === 'bloqueado' ? 'fas fa-unlock' : 'fas fa-ban', 
                        user.estado === 'bloqueado' ? 'Desbloquear acceso del usuario' : 'Bloquear acceso del usuario', 
                        () => handleToggleBlock(user), 
                        loading
                      )}
                    </PermissionGate>
                    
                    {/* 🔐 ELIMINAR - Solo con permiso de eliminar usuarios */}
                    <PermissionGate permission={SYSTEM_PERMISSIONS.DELETE_USER}>
                      {renderActionButton(
                        "outline-danger", 
                        "fas fa-trash", 
                        "Eliminar usuario permanentemente", 
                        () => handleDeleteUser(user), 
                        loading
                      )}
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      
      {/* Paginación */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1 || loading} />
            <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} />
            
            {/* Mostrar páginas (simplificado) */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => Math.abs(page - currentPage) < 3 || page === 1 || page === totalPages)
              .map(page => (
                <Pagination.Item 
                  key={page} 
                  active={page === currentPage}
                  onClick={() => handlePageChange(page)}
                  disabled={loading}
                >
                  {page}
                </Pagination.Item>
              ))}
            
            <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || loading} />
            <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || loading} />
          </Pagination>
        </div>
      )}
      
      {/* Modal de detalles */}
      <UserDetailModal
        show={showDetailModal}
        onHide={handleCloseDetailModal}
        userId={selectedUserId}
        onEdit={onEditUser ? (userId) => onEditUser(userId) : undefined}
      />
    </>
  );
};

export default UsersList;