import React, { useState, useEffect, useMemo } from 'react';
import { ListGroup, Button, Badge, Spinner, Alert, Form, InputGroup, Dropdown } from 'react-bootstrap';
import UserSelector from './UserSelector';
import { 
  fetchAssignedUsers, 
  assignUsers, 
  removeUserAssignment, 
  getNumericId,
  diagnoseAPI,
  updateUserRole,
  clearCache,
  User
} from '../services/userService';

interface UserAssignmentProps {
  itemId: string;
  itemType: 'project' | 'task' | 'subtask';
  onUsersUpdated?: () => void;
  showRoles?: boolean;  // Para mostrar/ocultar roles
  pageSize?: number;    // Para paginación
  availableRoles?: string[]; // Roles disponibles
  defaultRole?: string; // Rol predeterminado
}

const UserAssignment: React.FC<UserAssignmentProps> = ({ 
  itemId, 
  itemType, 
  onUsersUpdated,
  showRoles = true,
  pageSize = 5,
  availableRoles = ['responsable', 'colaborador', 'observador'],
  defaultRole = 'colaborador'
}) => {
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSelector, setShowSelector] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [bulkSelectMode, setBulkSelectMode] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [editingRoleUserId, setEditingRoleUserId] = useState<number | null>(null);
  
  // Verificar si el tipo de elemento soporta roles
  const supportsRoles = itemType === 'project';
  
  // Diagnóstico removido para evitar spam de errores 404 en consola
  // Solo se ejecutará manualmente desde la página de diagnósticos
  
  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return assignedUsers;
    
    return assignedUsers.filter(user => 
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.rol && user.rol.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [assignedUsers, searchTerm]);
  
  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);
  
  // Agregar log para rastrear propiedades
  useEffect(() => {
    console.log(`[UserAssignment] Renderizando con itemType=${itemType}, itemId=${itemId}`);
    const numericId = getNumericId(itemId);
    console.log(`[UserAssignment] ID numérico: ${numericId}`);
    console.log(`[UserAssignment] Soporta roles: ${supportsRoles}`);
  }, [itemId, itemType, supportsRoles]);
  
  // Fetch assigned users
  const fetchUsers = async (forceFresh = false) => {
    if (!itemId) {
      console.warn("[UserAssignment] No se puede cargar usuarios sin un itemId");
      setAssignedUsers([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log(`[UserAssignment] Cargando usuarios asignados a ${itemType} con ID ${itemId}`);
      
      // Limpia caché para forzar datos frescos si es necesario
      if (forceFresh) {
        clearCache();
      }
      
      const users = await fetchAssignedUsers(itemType, itemId);
      console.log(`[UserAssignment] Usuarios cargados:`, users);
      
      // Verificar si los usuarios tienen el formato esperado
      // Aquí estamos asegurándonos de que tengamos acceso a id_usuario
      const processedUsers = users.map(user => {
        // Si ya tiene id_usuario, lo usamos
        if (user.id_usuario !== undefined) {
          return user;
        }
        // Si no tiene id_usuario pero tiene una estructura que incluye el ID del usuario
        if (user.id !== undefined) {
          return {
            ...user,
            // Asumimos que id contiene el ID de usuario si no hay id_usuario
            id_usuario: user.id
          };
        }
        return user;
      });
      
      setAssignedUsers(processedUsers);
    } catch (error: any) {
      console.error('[UserAssignment] Error al obtener usuarios asignados:', error);
      let errorMessage = 'Error al cargar usuarios asignados';
      
      if (error.response) {
        errorMessage += `: ${error.response.status} ${error.response.statusText}`;
        console.error('[UserAssignment] Detalles de la respuesta:', error.response.data);
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      setError(errorMessage);
      setAssignedUsers([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Ejecutar al montar o cuando cambia el itemId
  useEffect(() => {
    if (itemId) {
      fetchUsers();
    }
  }, [itemId, itemType]);
  
  // Función para cambiar el rol de un usuario
  const handleRoleChange = async (user: User, newRole: string) => {
    // Cerrar el menú de edición de rol
    setEditingRoleUserId(null);
    
    if (user.rol === newRole) {
      return; // No hay cambio
    }
    
    // Solo permitir cambiar roles en proyectos
    if (itemType !== 'project') {
      setError(`No se pueden cambiar roles en ${itemType}s, solo en proyectos`);
      return;
    }
    
    setProcessing(true);
    setError(null);
    setSuccess(null);
    
    const userId = user.id_usuario !== undefined ? user.id_usuario : user.id;
    
    try {
      console.log(`[UserAssignment] Cambiando rol de usuario ${userId} a ${newRole}`);
      
      // Llamar al servicio para actualizar el rol
      await updateUserRole(itemType, itemId, userId, newRole);
      
      // Recargar usuarios para ver cambios
      await fetchUsers(true);
      
      setSuccess(`Rol de ${user.nombre} actualizado a ${newRole}`);
      
      // Notificar al componente padre si es necesario
      if (onUsersUpdated) onUsersUpdated();
    } catch (error: any) {
      console.error('[UserAssignment] Error al cambiar rol:', error);
      
      let errorMessage = `Error al cambiar rol de ${user.nombre}`;
      
      if (error.response && error.response.data) {
        errorMessage += `: ${error.response.data.message || 'Error del servidor'}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };
  
  // Función mejorada para desasignar un usuario
  const handleRemoveUser = async (user: User) => {
    // Usar id_usuario en lugar de id si está disponible
    const userId = user.id_usuario !== undefined ? user.id_usuario : user.id;
    
    if (!window.confirm(`¿Está seguro que desea desasignar a ${user.nombre}?`)) {
      return;
    }
    
    setProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log(`[UserAssignment] Desasignando usuario ${userId} de ${itemType} ${itemId}`);
      console.log(`[UserAssignment] Datos completos del usuario:`, user);
      
      // Guardar una copia de los usuarios antes de la operación
      const beforeUsers = [...assignedUsers];
      console.log(`[UserAssignment] Usuarios antes:`, beforeUsers);
      
      // Intentar desasignar el usuario con el ID correcto
      await removeUserAssignment(itemType, itemId, userId);
      
      // Esperar un poco para dar tiempo al servidor
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recargar usuarios explícitamente
      console.log(`[UserAssignment] Recargando usuarios después de desasignación`);
      const afterUsers = await fetchAssignedUsers(itemType, itemId, true);
      console.log(`[UserAssignment] Usuarios después:`, afterUsers);
      
      // Actualizar la lista local
      setAssignedUsers(afterUsers);
      
      // Verificar si el usuario fue realmente eliminado
      // Ahora verificamos usando el id_usuario en lugar del id de la asignación
      const userStillThere = afterUsers.some(u => 
        (u.id_usuario !== undefined ? u.id_usuario === userId : u.id === userId)
      );
      
      if (userStillThere) {
        console.error(`[UserAssignment] Usuario ${userId} sigue en la lista a pesar de desasignación exitosa`);
        setError(`No se pudo desasignar al usuario ${user.nombre || userId}. El usuario sigue apareciendo en la lista.`);
      } else {
        console.log(`[UserAssignment] Usuario ${userId} desasignado exitosamente`);
        setSuccess('Usuario desasignado exitosamente');
        
        // Notificar al componente padre si es necesario
        if (onUsersUpdated) onUsersUpdated();
      }
    } catch (error: any) {
      console.error('[UserAssignment] Error al desasignar usuario:', error);
      
      let errorMessage = 'Error al desasignar usuario';
      
      if (error.response && error.response.data) {
        errorMessage += `: ${error.response.data.message || 'Error del servidor'}`;
        console.error('[UserAssignment] Respuesta de error:', error.response.data);
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      setError(errorMessage);
      
      // Recargar la lista de usuarios para mostrar el estado actual
      try {
        const currentUsers = await fetchAssignedUsers(itemType, itemId);
        setAssignedUsers(currentUsers);
      } catch (fetchError) {
        console.error('[UserAssignment] Error al recargar usuarios:', fetchError);
      }
    } finally {
      setProcessing(false);
    }
  };
  
  // Manejo de selección múltiple
  const handleUserSelectToggle = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  
  // Desasignar usuarios en masa
  const handleBulkRemove = async () => {
    if (selectedUsers.length === 0) {
      setError('Debe seleccionar al menos un usuario para desasignar');
      return;
    }
    
    if (!window.confirm(`¿Está seguro que desea desasignar ${selectedUsers.length} usuario(s)?`)) {
      return;
    }
    
    setProcessing(true);
    setError(null);
    setSuccess(null);
    
    const results: { success: boolean, userId: number, message: string }[] = [];
    
    for (const userId of selectedUsers) {
      try {
        await removeUserAssignment(itemType, itemId, userId);
        results.push({ success: true, userId, message: 'Desasignado exitosamente' });
      } catch (error: any) {
        console.error(`Error al desasignar usuario ${userId}:`, error);
        let message = 'Error desconocido';
        
        if (error.response && error.response.data && error.response.data.message) {
          message = error.response.data.message;
        } else if (error.message) {
          message = error.message;
        }
        
        results.push({ success: false, userId, message });
      }
    }
    
    // Recargar usuarios
    await fetchUsers(true);
    
    // Mostrar resultados
    const successCount = results.filter(r => r.success).length;
    if (successCount === selectedUsers.length) {
      setSuccess(`Se han desasignado exitosamente ${successCount} usuario(s)`);
    } else if (successCount > 0) {
      setSuccess(`Se han desasignado ${successCount} de ${selectedUsers.length} usuario(s)`);
      setError('Algunos usuarios no pudieron ser desasignados');
    } else {
      setError('No se pudo desasignar ningún usuario');
    }
    
    // Limpiar selección
    setSelectedUsers([]);
    setBulkSelectMode(false);
    setProcessing(false);
  };
  
  // Función para asignar usuarios seleccionados
  const handleAssignUsers = async (selectedUserIds: number[], roles?: Record<number, string>) => {
    if (selectedUserIds.length === 0) {
      setError('Debe seleccionar al menos un usuario para asignar');
      return;
    }
    
    setProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log(`[UserAssignment] Asignando usuarios ${selectedUserIds.join(', ')} a ${itemType} ${itemId}`);
      
      // Solo usar roles si estamos en proyecto
      const userRoles = supportsRoles ? roles : undefined;
      
      if (userRoles) {
        console.log('[UserAssignment] Roles seleccionados:', userRoles);
      } else if (itemType !== 'project') {
        console.log('[UserAssignment] No se usan roles para este tipo de elemento');
      }
      
      // Usar la función mejorada de assignUsers que maneja errores
      await assignUsers(itemType, itemId, selectedUserIds, userRoles);
      
      // Cerrar el selector y recargar la lista de usuarios
      setShowSelector(false);
      await fetchUsers(true); // Recargar lista completa con datos frescos
      console.log(`[UserAssignment] Usuarios asignados exitosamente`);
      
      // Mostrar mensaje de éxito
      setSuccess(`${selectedUserIds.length} usuario(s) asignado(s) exitosamente`);
      
      // Notificar al componente padre si es necesario
      if (onUsersUpdated) onUsersUpdated();
    } catch (error: any) {
      console.error('[UserAssignment] Error al asignar usuarios:', error);
      let errorMessage = 'Error al asignar usuarios';
      
      if (error.response) {
        errorMessage += `: ${error.response.status} ${error.response.statusText}`;
        console.error('[UserAssignment] Detalles de la respuesta:', error.response.data);
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };
  
  // Renderizar fecha en formato legible
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Renderizar un badge según el rol
  const renderRoleBadge = (rol?: string) => {
    if (!rol) return <Badge bg="secondary">Sin rol</Badge>;
    
    let variant: string;
    
    switch (rol.toLowerCase()) {
      case 'responsable':
        variant = 'primary';
        break;
      case 'colaborador':
        variant = 'success';
        break;
      case 'observador':
        variant = 'info';
        break;
      default:
        variant = 'secondary';
    }
    
    return <Badge bg={variant}>{rol}</Badge>;
  };
  
  // Determinar si ciertos roles son aplicables según el tipo de elemento
  const getAvailableRolesForItemType = () => {
    if (itemType === 'project') {
      return availableRoles;
    } else {
      // Para tareas y subtareas, no hay roles disponibles
      return [];
    }
  };
  
  const filteredRoles = getAvailableRolesForItemType();
  
  return (
    <div className="user-assignment mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Usuarios Asignados</h6>
        <div>
          {bulkSelectMode && (
            <Button 
              variant="outline-danger" 
              size="sm" 
              className="me-2"
              onClick={handleBulkRemove}
              disabled={processing || selectedUsers.length === 0}
            >
              <i className="bi bi-trash"></i> Desasignar ({selectedUsers.length})
            </Button>
          )}
          <Button 
            variant="outline-secondary" 
            size="sm" 
            className="me-2"
            onClick={() => {
              setBulkSelectMode(!bulkSelectMode);
              setSelectedUsers([]);
            }}
          >
            <i className={`bi bi-${bulkSelectMode ? 'x-circle' : 'list-check'}`}></i>
            {bulkSelectMode ? ' Cancelar' : ' Selección múltiple'}
          </Button>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={() => setShowSelector(true)}
            disabled={showSelector || processing}
          >
            <i className="bi bi-person-plus"></i> Asignar
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-3" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {assignedUsers.length > 0 && (
        <InputGroup className="mb-3">
          <InputGroup.Text>
            <i className="bi bi-search"></i>
          </InputGroup.Text>
          <Form.Control
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reiniciar a primera página al buscar
            }}
          />
          {searchTerm && (
            <Button 
              variant="outline-secondary" 
              onClick={() => setSearchTerm('')}
            >
              <i className="bi bi-x"></i>
            </Button>
          )}
        </InputGroup>
      )}
      
      {loading ? (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" />
          <p className="mt-2 small">Cargando usuarios asignados...</p>
        </div>
      ) : assignedUsers.length === 0 ? (
        <p className="text-muted small fst-italic">No hay usuarios asignados</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-muted small fst-italic">No se encontraron resultados para "{searchTerm}"</p>
      ) : (
        <>
          <ListGroup variant="flush" className="border rounded">
            {paginatedUsers.map(user => (
              <ListGroup.Item 
                key={user.id} 
                className="d-flex justify-content-between align-items-center py-2"
              >
                <div className="d-flex align-items-center">
                  {bulkSelectMode && (
                    <Form.Check
                      type="checkbox"
                      className="me-2"
                      checked={selectedUsers.includes(user.id_usuario || user.id)}
                      onChange={() => handleUserSelectToggle(user.id_usuario || user.id)}
                    />
                  )}
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.nombre} 
                      className="rounded-circle me-2" 
                      style={{ width: '30px', height: '30px', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div 
                      className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" 
                      style={{ width: '30px', height: '30px', fontSize: '14px' }}
                    >
                      {user.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="fw-semibold">{user.nombre}</div>
                    <div className="text-muted small">{user.email}</div>
                    {showRoles && supportsRoles && (
                      <div className="mt-1 d-flex align-items-center">
                        {editingRoleUserId === (user.id_usuario || user.id) ? (
                          <Form.Select 
                            size="sm"
                            className="me-2"
                            style={{ width: '130px' }}
                            value={user.rol || defaultRole}
                            onChange={(e) => handleRoleChange(user, e.target.value)}
                            onBlur={() => setEditingRoleUserId(null)}
                            autoFocus
                          >
                            {filteredRoles.map(role => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </option>
                            ))}
                          </Form.Select>
                        ) : (
                          <div 
                            onClick={() => setEditingRoleUserId(user.id_usuario || user.id)}
                            style={{ cursor: 'pointer' }}
                            title="Haz clic para cambiar el rol"
                          >
                            {renderRoleBadge(user.rol)}
                          </div>
                        )}
                      </div>
                    )}
                    {user.fecha_asignacion && (
                      <div className="text-muted small">
                        Asignado: {formatDate(user.fecha_asignacion)}
                      </div>
                    )}
                  </div>
                </div>
                {!bulkSelectMode && (
                  <div className="d-flex">
                    {showRoles && supportsRoles && !editingRoleUserId && (
                      <Dropdown className="me-2">
                        <Dropdown.Toggle variant="outline-secondary" size="sm" id={`role-dropdown-${user.id}`}>
                          <i className="bi bi-person-gear"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Header>Cambiar rol</Dropdown.Header>
                          {filteredRoles.map(role => (
                            <Dropdown.Item 
                              key={role}
                              active={user.rol === role}
                              onClick={() => handleRoleChange(user, role)}
                            >
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    )}
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => handleRemoveUser(user)}
                      disabled={processing}
                    >
                      {processing ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <i className="bi bi-x"></i>
                      )}
                    </Button>
                  </div>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <i className="bi bi-chevron-left"></i>
              </Button>
              <span className="mx-3 align-self-center">
                {currentPage} de {totalPages}
              </span>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                <i className="bi bi-chevron-right"></i>
              </Button>
            </div>
          )}
        </>
      )}
      
      {showSelector && (
        <UserSelector 
          assignedUserIds={assignedUsers.map(u => u.id_usuario || u.id)}
          onAssign={handleAssignUsers}
          onCancel={() => setShowSelector(false)}
          showRoleSelection={supportsRoles && showRoles}
          availableRoles={filteredRoles}
          defaultRole={defaultRole}
          itemType={itemType}
        />
      )}
      
      {processing && !showSelector && (
        <div className="text-center py-2 mt-2">
          <Spinner animation="border" size="sm" />
          <span className="ms-2 small">Procesando...</span>
        </div>
      )}
    </div>
  );
};

export default UserAssignment;