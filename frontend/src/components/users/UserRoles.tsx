// src/components/users/UserRoles.tsx
import React from 'react';
import { Badge } from 'react-bootstrap';

interface UserRolesProps {
  userId: number;
  userRoles: string[];
  onRoleChange?: () => void;
}

const UserRoles: React.FC<UserRolesProps> = ({ userRoles = [] }) => {
  
  // Mapeo de roles a colores (mismo que en UsersList)
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
  };

  // Función para obtener el color del badge según el rol
  const getRoleColor = (role: string): string => {
    return roleColors[role] || 'info';
  };
  
  return (
    <div>
      {/* Badges en línea horizontal */}
      <div className="mb-3">
        {userRoles.length === 0 ? (
          <div className="text-center py-3 text-muted">
            <i className="fas fa-user-slash me-2"></i>
            Este usuario no tiene roles asignados
          </div>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {userRoles.map((role, index) => (
              <Badge 
                key={index}
                bg={getRoleColor(role)} 
                className="py-2 px-3" 
                style={{ fontSize: '0.9rem' }}
              >
                {role}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      {/* Mensaje informativo discreto */}
      <div className="text-muted" style={{ fontSize: '0.85rem' }}>
        <i className="fas fa-info-circle me-2"></i>
        Para modificar los roles de este usuario, utiliza el botón "Editar Usuario".
      </div>
    </div>
  );
};

export default UserRoles;
