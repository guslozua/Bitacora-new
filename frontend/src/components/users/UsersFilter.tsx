// src/components/users/UsersFilter.tsx
import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { fetchAllRoles, Role } from '../../services/roleService';
import { UserFilters } from '../../services/userService';

interface UsersFilterProps {
  onFilterChange: (filters: UserFilters) => void;
}

const UsersFilter: React.FC<UsersFilterProps> = ({ onFilterChange }) => {
  const [roles, setRoles] = useState<Array<{id: number, nombre: string}>>([]);
  const [filter, setFilter] = useState<UserFilters>({
    nombre: '',
    email: '',
    rol: '',
    estado: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar roles disponibles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true);
        setError(null);
        const rolesData = await fetchAllRoles();
        console.log('Roles cargados:', rolesData);
        setRoles(rolesData || []);
      } catch (err) {
        console.error('Error al cargar roles:', err);
        setError('No se pudieron cargar los roles');
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadRoles();
  }, []);

  // Manejar cambios en los campos de filtro
  const handleInputChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
  };

  // Aplicar filtros
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onFilterChange) {
      onFilterChange(filter);
    }
  };

  // Limpiar filtros
  const handleReset = () => {
    const resetFilter = {
      nombre: '',
      email: '',
      rol: '',
      estado: ''
    };
    setFilter(resetFilter);
    if (onFilterChange) {
      onFilterChange(resetFilter);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="mb-4">
      <Row className="mb-3">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              value={filter.nombre}
              onChange={handleInputChange}
              placeholder="Filtrar por nombre"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="text"
              name="email"
              value={filter.email}
              onChange={handleInputChange}
              placeholder="Filtrar por email"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Rol</Form.Label>
            <Form.Select
              name="rol"
              value={filter.rol}
              onChange={handleInputChange}
              disabled={loading || !!error}
            >
              <option value="">Todos los roles</option>
              {roles.map(rol => (
                <option key={rol.id} value={rol.nombre}>
                  {rol.nombre}
                </option>
              ))}
            </Form.Select>
            {error && <span className="text-danger small">{error}</span>}
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Estado</Form.Label>
            <Form.Select
              name="estado"
              value={filter.estado}
              onChange={handleInputChange}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="bloqueado">Bloqueado</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col xs="auto">
          <Button type="submit" variant="primary">
            <i className="fas fa-search me-2"></i>Aplicar Filtros
          </Button>
        </Col>
        <Col xs="auto">
          <Button type="button" variant="outline-secondary" onClick={handleReset}>
            <i className="fas fa-times me-2"></i>Limpiar
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default UsersFilter;