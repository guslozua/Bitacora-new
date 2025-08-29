import React, { useState, useEffect } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { fetchAssignedUsers } from '../services/userService';

interface User {
  id: number;
  nombre: string;
  email: string;
  avatar?: string;
}

interface UserAvatarsProps {
  itemId: string;
  itemType: 'project' | 'task' | 'subtask';
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatars: React.FC<UserAvatarsProps> = ({
  itemId,
  itemType,
  maxDisplay = 3,
  size = 'md'
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Determinar el tamaño en píxeles según la prop size
  const avatarSize = size === 'sm' ? 24 : size === 'md' ? 30 : 36;
  
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        // Usar servicio actualizado con rutas directas
        const assignedUsers = await fetchAssignedUsers(itemType, itemId);
        setUsers(assignedUsers);
        setError(null);
      } catch (error: any) {
        // Solo log errores que no sean 404 para reducir spam en console
        if (error.response?.status !== 404) {
          console.warn(`UserAvatars: Error al cargar usuarios para ${itemType} ${itemId}:`, error.message);
        }
        setError(error.message);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (itemId) {
      loadUsers();
    }
  }, [itemId, itemType]);
  
  if (loading) {
    return (
      <div className="user-avatar-skeleton" style={{ display: 'inline-block' }}>
        <div 
          className="bg-secondary opacity-25 rounded-circle"
          style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}
        ></div>
      </div>
    );
  }
  
  if (error) {
    return null; // En caso de error, simplemente no mostrar nada
  }
  
  if (users.length === 0) {
    return null; // Si no hay usuarios asignados, no mostrar nada
  }
  
  // Determinar cuántos usuarios mostrar y si hay más
  const displayUsers = users.slice(0, maxDisplay);
  const hasMore = users.length > maxDisplay;
  const moreCount = users.length - maxDisplay;
  
  return (
    <div className="d-flex align-items-center" style={{ marginLeft: '5px' }}>
      {displayUsers.map((user, index) => (
        <OverlayTrigger
          // 🚨 FIX: Clave más robusta que combina itemId, userId e index para evitar duplicados
          key={`${itemType}-${itemId}-user-${user.id}-${index}`}
          placement="top"
          // 🚨 FIX: ID único del tooltip para evitar conflictos
          overlay={<Tooltip id={`tooltip-${itemType}-${itemId}-user-${user.id}-${index}`}>{user.nombre}</Tooltip>}
        >
          <div 
            className="user-avatar" 
            style={{ 
              marginLeft: index > 0 ? `-${avatarSize / 3}px` : '0',
              zIndex: 10 - index,
              position: 'relative'
            }}
          >
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.nombre} 
                className="rounded-circle border border-white" 
                style={{ width: `${avatarSize}px`, height: `${avatarSize}px`, objectFit: 'cover' }} 
              />
            ) : (
              <div 
                className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center border border-white" 
                style={{ width: `${avatarSize}px`, height: `${avatarSize}px`, fontSize: `${avatarSize / 2}px` }}
              >
                {user.nombre.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </OverlayTrigger>
      ))}
      
      {hasMore && (
        <OverlayTrigger
          // 🚨 FIX: Clave única para el botón "más usuarios"
          key={`${itemType}-${itemId}-more-users`}
          placement="top"
          overlay={
            // 🚨 FIX: ID único del tooltip para "más usuarios"
            <Tooltip id={`tooltip-${itemType}-${itemId}-more-users`}>
              {users.slice(maxDisplay).map(u => u.nombre).join(', ')}
            </Tooltip>
          }
        >
          <div 
            className="more-users rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center border border-white" 
            style={{ 
              width: `${avatarSize}px`, 
              height: `${avatarSize}px`, 
              marginLeft: `-${avatarSize / 3}px`,
              fontSize: `${avatarSize / 2.5}px`,
              position: 'relative',
              zIndex: 1
            }}
          >
            +{moreCount}
          </div>
        </OverlayTrigger>
      )}
    </div>
  );
};

export default UserAvatars;