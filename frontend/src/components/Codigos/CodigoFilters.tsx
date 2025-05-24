// src/components/Codigos/CodigoFilters.tsx
import React from 'react';
import { Row, Col, Form, InputGroup, Button } from 'react-bootstrap';

interface CodigoFiltersProps {
  filters: {
    tipo: string;
    estado: string;
    search: string;
    incluirInactivos: boolean;
  };
  onFilterChange: (newFilters: any) => void;
}

const CodigoFilters: React.FC<CodigoFiltersProps> = ({ filters, onFilterChange }) => {
  // Función para limpiar filtros
  const clearFilters = () => {
    onFilterChange({
      tipo: '',
      estado: 'activo',
      search: '',
      incluirInactivos: false
    });
  };
  
  return (
    <div className="bg-light p-3 rounded mb-3">
      <Row className="g-3">
        <Col md={3}>
          <Form.Group controlId="filterTipo">
            <Form.Label>Tipo de Código</Form.Label>
            <Form.Select
              value={filters.tipo}
              onChange={(e) => onFilterChange({ tipo: e.target.value })}
            >
              <option value="">Todos los tipos</option>
              <option value="guardia_pasiva">Guardia Pasiva</option>
              <option value="guardia_activa">Guardia Activa</option>
              <option value="hora_nocturna">Hora Nocturna</option>
              <option value="feriado">Feriado</option>
              <option value="fin_semana">Fin de Semana</option>
              <option value="adicional">Adicional</option>
            </Form.Select>
          </Form.Group>
        </Col>
        
        <Col md={3}>
          <Form.Group controlId="filterEstado">
            <Form.Label>Estado</Form.Label>
            <Form.Select
              value={filters.estado}
              onChange={(e) => onFilterChange({ estado: e.target.value })}
              disabled={filters.incluirInactivos}
            >
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
              <option value="">Todos</option>
            </Form.Select>
          </Form.Group>
        </Col>
        
        <Col md={4}>
          <Form.Group controlId="filterSearch">
            <Form.Label>Buscar</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Código, descripción o notas..." // ✨ Texto actualizado
                value={filters.search}
                onChange={(e) => onFilterChange({ search: e.target.value })}
              />
              {filters.search && (
                <Button 
                  variant="outline-secondary"
                  onClick={() => onFilterChange({ search: '' })}
                >
                  <i className="bi bi-x"></i>
                </Button>
              )}
            </InputGroup>
          </Form.Group>
        </Col>
        
        <Col md={2} className="d-flex align-items-end">
          <Form.Group controlId="filterIncluirInactivos" className="mb-0">
            <Form.Check
              type="switch"
              label="Mostrar todos"
              checked={filters.incluirInactivos}
              onChange={(e) => onFilterChange({ 
                incluirInactivos: e.target.checked,
                estado: e.target.checked ? '' : 'activo'
              })}
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Row className="mt-2">
        <Col className="d-flex justify-content-end">
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={clearFilters}
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i>
            Limpiar filtros
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default CodigoFilters;