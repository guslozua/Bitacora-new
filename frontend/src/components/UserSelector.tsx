import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form, ListGroup, Spinner, Alert, Badge, InputGroup } from 'react-bootstrap';
import { fetchAllUsers, User } from '../services/userService';

interface UserSelectorProps {
  assignedUserIds: number[];
  onAssign: (userIds: number[], roles?: Record<number, string>) => void;
  onCancel: () => void;
  showRoleSelection?: boolean;
  availableRoles?: string[];
  defaultRole?: string;
  itemType?: 'project' | 'task' | 'subtask';
}

const UserSelector: React.FC<UserSelectorProps> = ({
  assignedUserIds,
  onAssign,
  onCancel,
  showRoleSelection = true,
  availableRoles = ['responsable', 'colaborador', 'observador'],
  defaultRole = 'colaborador',
  itemType = 'project'
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [userRoles, setUserRoles] = useState<Record<number, string>>({});
  
  // Determinar si realmente debe mostrar la selección de roles basado en el tipo de elemento
  const shouldShowRoleSelection = showRoleSelection && itemType === 'project';
  
  // Carga de usuarios
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const allUsers = await fetchAllUsers();
        setUsers(allUsers);
      } catch (error: any) {
        console.error('Error al cargar usuarios:', error);
        setError(`Error al cargar la lista de usuarios: ${error.message || 'Error desconocido'}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);
  
  // Inicializar roles por defecto para usuarios seleccionados
  useEffect(() => {
    if (!shouldShowRoleSelection) return;
    
    const newRoles: Record<number, string> = {};
    selectedUserIds.forEach(userId => {
      // Si ya tiene un rol asignado, mantenerlo
      if (userRoles[userId]) {
        newRoles[userId] = userRoles[userId];
      } else {
        // Si no, usar el rol por defecto
        newRoles[userId] = defaultRole;
      }
    });
    setUserRoles(newRoles);
  }, [selectedUserIds, defaultRole, userRoles, shouldShowRoleSelection]);
  
  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Filtrar usuarios ya asignados
      const isAlreadyAssigned = assignedUserIds.includes(user.id_usuario || user.id);
      if (isAlreadyAssigned) return false;
      
      // Filtrar por búsqueda
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        user.nombre.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    });
  }, [users, assignedUserIds, searchTerm]);
  
  // Manejo de selección
  const handleUserSelect = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      // Quitar de la selección
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      // Añadir a la selección
      setSelectedUserIds([...selectedUserIds, userId]);
      
      // Asignar rol por defecto si no tiene uno
      if (shouldShowRoleSelection && !userRoles[userId]) {
        setUserRoles({
          ...userRoles,
          [userId]: defaultRole
        });
      }
    }
  };
  
  // Cambiar el rol de un usuario
  const handleRoleChange = (userId: number, role: string) => {
    setUserRoles({
      ...userRoles,
      [userId]: role
    });
  };
  
  // Manejar asignación
  const handleAssign = () => {
    if (selectedUserIds.length === 0) {
      setError('Debe seleccionar al menos un usuario para asignar');
      return;
    }
    
    // Si no se usa selección de roles o no es un proyecto, enviar solo los IDs
    if (!shouldShowRoleSelection) {
      onAssign(selectedUserIds);
      return;
    }
    
    // Si se usa selección de roles, enviar IDs y roles
    const selectedRoles: Record<number, string> = {};
    selectedUserIds.forEach(userId => {
      selectedRoles[userId] = userRoles[userId] || defaultRole;
    });
    
    onAssign(selectedUserIds, selectedRoles);
  };
  
  // Aplicar el mismo rol a todos los usuarios seleccionados
  const applyRoleToAll = (role: string) => {
    const newRoles: Record<number, string> = { ...userRoles };
    selectedUserIds.forEach(userId => {
      newRoles[userId] = role;
    });
    setUserRoles(newRoles);
  };
  
  return (
    <Modal show onHide={onCancel} backdrop="static" size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Seleccionar Usuarios</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <InputGroup className="mb-3">
          <InputGroup.Text>
            <i className="bi bi-search"></i>
          </InputGroup.Text>
          <Form.Control
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="mt-2">Cargando usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <Alert variant="info">
            {searchTerm 
              ? `No se encontraron usuarios que coincidan con "${searchTerm}"` 
              : 'No hay usuarios disponibles para asignar'}
          </Alert>
        ) : (
          <>
            <div className="mb-3 d-flex justify-content-between align-items-center">
              <span>
                {selectedUserIds.length > 0 
                  ? `${selectedUserIds.length} usuario(s) seleccionado(s)` 
                  : 'Seleccione usuarios para asignar'}
              </span>
              {selectedUserIds.length > 0 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => setSelectedUserIds([])}
                >
                  Limpiar selección
                </Button>
              )}
            </div>
            
            <ListGroup className="user-list mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {filteredUsers.map(user => (
                <ListGroup.Item 
                  key={user.id}
                  action
                  active={selectedUserIds.includes(user.id_usuario || user.id)}
                  onClick={() => handleUserSelect(user.id_usuario || user.id)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center">
                    <Form.Check
                      type="checkbox"
                      className="me-2"
                      checked={selectedUserIds.includes(user.id_usuario || user.id)}
                      onChange={() => {}} // Manejado por onClick del ListGroup.Item
                      onClick={(e) => e.stopPropagation()} // Evitar doble toggle
                    />
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
                      <div className="fw-medium">{user.nombre}</div>
                      <div className="text-muted small">{user.email}</div>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
            
            {/* Selección de roles para usuarios seleccionados */}
            {shouldShowRoleSelection && selectedUserIds.length > 0 && (
              <div className="selected-users-roles mt-4">
                <h6>Roles para usuarios seleccionados</h6>
                <p className="text-muted small">Solo los proyectos permiten asignar roles</p>
                
                <ListGroup variant="flush" className="border rounded">
                  {selectedUserIds.map(userId => {
                    const user = users.find(u => (u.id_usuario || u.id) === userId);
                    if (!user) return null;
                    
                    return (
                      <ListGroup.Item key={userId} className="py-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <span>{user.nombre}</span>
                          <Form.Select 
                            size="sm" 
                            style={{ width: '40%' }}
                            value={userRoles[userId] || defaultRole}
                            onChange={(e) => handleRoleChange(userId, e.target.value)}
                          >
                            {availableRoles.map(role => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
                
                {/* Asignar el mismo rol a todos */}
                {selectedUserIds.length > 1 && (
                  <div className="mt-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small">Aplicar el mismo rol a todos:</span>
                      <div>
                        {availableRoles.map(role => (
                          <Button 
                            key={role}
                            variant="outline-secondary" 
                            size="sm" 
                            className="ms-1"
                            onClick={() => applyRoleToAll(role)}
                          >
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleAssign}
          disabled={selectedUserIds.length === 0 || loading}
        >
          Asignar {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserSelector;