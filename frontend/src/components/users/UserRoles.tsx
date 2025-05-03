// src/components/users/UserRoles.tsx
import React, { useState, useEffect } from 'react';
import { ListGroup, Button, Form, Badge, Alert, Spinner } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { Role, fetchAllRoles, assignRoleToUser, removeRoleFromUser } from '../../services/roleService';

interface UserRolesProps {
  userId: number;
  userRoles: string[];
}

const UserRoles: React.FC<UserRolesProps> = ({ userId, userRoles = [] }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cargar roles disponibles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await fetchAllRoles();
        setRoles(data);
      } catch (err: any) {
        setError('Error al cargar roles disponibles');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoles();
  }, []);
  
  // Asignar nuevo rol
  const handleAssignRole = async () => {
    if (!selectedRole) return;
    
    try {
      setUpdating(true);
      const roleObj = roles.find(r => r.nombre === selectedRole);
      
      if (roleObj) {
        await assignRoleToUser(userId, roleObj.id);
        
        Swal.fire({
          icon: 'success',
          title: 'Rol asignado',
          text: `El rol ${selectedRole} ha sido asignado correctamente.`,
          showConfirmButton: false,
          timer: 1500
        });
        
        // Recargar la página para ver los cambios
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Error al asignar rol'
      });
    } finally {
      setUpdating(false);
    }
  };
  
  // Quitar rol con confirmación
  const handleRemoveRole = (roleName: string) => {
    Swal.fire({
      title: 'Confirmar',
      text: `¿Estás seguro de quitar el rol "${roleName}" a este usuario?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Quitar rol',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setUpdating(true);
          const roleObj = roles.find(r => r.nombre === roleName);
          
          if (roleObj) {
            await removeRoleFromUser(userId, roleObj.id);
            
            Swal.fire({
              icon: 'success',
              title: 'Rol eliminado',
              text: 'El rol ha sido eliminado correctamente.',
              showConfirmButton: false,
              timer: 1500
            });
            
            // Recargar la página para ver los cambios
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.response?.data?.message || 'Error al quitar rol'
          });
        } finally {
          setUpdating(false);
        }
      }
    });
  };
  
  if (loading) return <Spinner animation="border" />;
  
  // Filtrar roles disponibles (excluir los ya asignados)
  const availableRoles = roles.filter(role => 
    !userRoles.includes(role.nombre)
  );
  
  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <ListGroup className="mb-4">
        {userRoles.length === 0 ? (
          <ListGroup.Item className="text-center py-3">
            Este usuario no tiene roles asignados
          </ListGroup.Item>
        ) : (
          userRoles.map((role, index) => (
            <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
              <div>
                <Badge bg="info" className="me-2">{role}</Badge>
              </div>
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={() => handleRemoveRole(role)}
                disabled={updating}
              >
                <i className="fas fa-times"></i>
              </Button>
            </ListGroup.Item>
          ))
        )}
      </ListGroup>
      
      <Form.Group className="mb-3">
        <Form.Label>Asignar nuevo rol</Form.Label>
        <div className="d-flex gap-2">
          <Form.Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={updating || availableRoles.length === 0}
          >
            <option value="">Selecciona un rol</option>
            {availableRoles.map(role => (
              <option key={role.id} value={role.nombre}>
                {role.nombre}
              </option>
            ))}
          </Form.Select>
          <Button 
            variant="primary" 
            onClick={handleAssignRole}
            disabled={!selectedRole || updating}
          >
            {updating ? <Spinner animation="border" size="sm" /> : 'Asignar'}
          </Button>
        </div>
      </Form.Group>
    </div>
  );
};

export default UserRoles;