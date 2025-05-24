// src/components/Codigos/CodigoSelector.tsx - CON INDICADORES DE MEDIANOCHE
import React, { useState, useEffect } from 'react';
import { Form, ListGroup, Badge, Spinner, Button } from 'react-bootstrap';
import CodigoService, { Codigo } from '../../services/CodigoService';

interface CodigoSelectorProps {
  onSelect: (codigo: Codigo) => void;
  codigosSeleccionados?: number[];
  filtro?: {
    tipo?: string;
    fecha?: Date;
    horaInicio?: string;
    horaFin?: string;
  };
}

const CodigoSelector: React.FC<CodigoSelectorProps> = ({ 
  onSelect, 
  codigosSeleccionados = [],
  filtro
}) => {
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');

  // ✨ FUNCIÓN PARA DETECTAR SI CRUZA MEDIANOCHE
  const cruzaMedianoche = (horaInicio: string, horaFin: string): boolean => {
    if (!horaInicio || !horaFin) return false;
    
    const [inicioH, inicioM] = horaInicio.split(':').map(Number);
    const [finH, finM] = horaFin.split(':').map(Number);
    
    const inicioMinutos = inicioH * 60 + inicioM;
    const finMinutos = finH * 60 + finM;
    
    return finMinutos < inicioMinutos;
  };

  // ✨ FUNCIÓN PARA OBTENER DESCRIPCIÓN DEL HORARIO
  const getDescripcionHorario = (horaInicio: string, horaFin: string): string => {
    if (!horaInicio || !horaFin) return 'Todo el día';
    
    if (cruzaMedianoche(horaInicio, horaFin)) {
      return `${horaInicio} - ${horaFin} (cruza medianoche)`;
    } else {
      return `${horaInicio} - ${horaFin}`;
    }
  };
  
  // Cargar códigos al montar el componente o cuando cambia el filtro
  useEffect(() => {
    cargarCodigos();
  }, [filtro]);
  
  // Cargar códigos desde el servicio
  const cargarCodigos = async () => {
    try {
      setLoading(true);
      
      let params: any = { estado: 'activo' };
      
      // Aplicar filtros si existen
      if (filtro) {
        if (filtro.tipo) params.tipo = filtro.tipo;
        if (filtro.fecha) params.fecha_vigencia = filtro.fecha.toISOString().split('T')[0];
      }
      
      const codigosData = await CodigoService.fetchCodigos(params);
      setCodigos(codigosData);
    } catch (error: any) {
      console.error('Error al cargar códigos:', error);
      setError('No se pudieron cargar los códigos');
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrar códigos por búsqueda y tipo
  const codigosFiltrados = codigos
    .filter(codigo => {
      // Filtrar por término de búsqueda - incluye búsqueda en notas
      const matchesSearch = 
        searchTerm === '' || 
        codigo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        codigo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (codigo.notas && codigo.notas.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtrar por tipo seleccionado
      const matchesTipo = selectedTipo === '' || codigo.tipo === selectedTipo;
      
      return matchesSearch && matchesTipo;
    })
    // Ordenar por código
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
  
  // Obtener etiqueta para tipo
  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'guardia_pasiva':
        return 'Guardia Pasiva';
      case 'guardia_activa':
        return 'Guardia Activa';
      case 'hora_nocturna':
        return 'Hora Nocturna';
      case 'feriado':
        return 'Feriado';
      case 'fin_semana':
        return 'Fin de Semana';
      case 'adicional':
        return 'Adicional';
      default:
        return tipo;
    }
  };
  
  // Obtener color para tipo
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'guardia_pasiva':
        return 'primary';
      case 'guardia_activa':
        return 'success';
      case 'hora_nocturna':
        return 'dark';
      case 'feriado':
        return 'danger';
      case 'fin_semana':
        return 'warning';
      case 'adicional':
        return 'info';
      default:
        return 'secondary';
    }
  };
  
  // Agrupar códigos por tipo
  const codigosPorTipo = codigosFiltrados.reduce((result, codigo) => {
    const tipo = codigo.tipo;
    
    if (!result[tipo]) {
      result[tipo] = [];
    }
    
    result[tipo].push(codigo);
    return result;
  }, {} as Record<string, Codigo[]>);
  
  return (
    <div>
      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          placeholder="Buscar código, descripción o notas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form.Group>
      
      <div className="mb-3 d-flex flex-wrap gap-2">
        <Button
          variant={selectedTipo === '' ? 'primary' : 'outline-primary'}
          size="sm"
          onClick={() => setSelectedTipo('')}
        >
          Todos
        </Button>
        
        {['guardia_pasiva', 'guardia_activa', 'hora_nocturna', 'feriado', 'fin_semana', 'adicional'].map(tipo => (
          <Button
            key={tipo}
            variant={selectedTipo === tipo ? getTipoColor(tipo) : `outline-${getTipoColor(tipo)}`}
            size="sm"
            onClick={() => setSelectedTipo(tipo === selectedTipo ? '' : tipo)}
          >
            {getTipoLabel(tipo)}
          </Button>
        ))}
      </div>
      
      {loading ? (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" />
          <p className="mt-2 mb-0 text-muted">Cargando códigos...</p>
        </div>
      ) : error ? (
        <div className="text-danger">
          {error}
        </div>
      ) : codigosFiltrados.length === 0 ? (
        <div className="text-center py-3">
          <p className="mb-0 text-muted">No se encontraron códigos con los filtros aplicados.</p>
        </div>
      ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {Object.entries(codigosPorTipo).map(([tipo, codigosTipo]) => (
            <div key={tipo} className="mb-3">
              <h6 className="border-bottom pb-2">
                <Badge bg={getTipoColor(tipo)} className="me-2">
                  {getTipoLabel(tipo)}
                </Badge>
              </h6>
              
              <ListGroup>
                {codigosTipo.map(codigo => {
                  const isSelected = codigosSeleccionados.includes(codigo.id!);
                  const tieneHorario = codigo.hora_inicio && codigo.hora_fin;
                  const cruzaNoche = tieneHorario && cruzaMedianoche(codigo.hora_inicio!, codigo.hora_fin!);
                  
                  return (
                    <ListGroup.Item
                      key={codigo.id}
                      action
                      onClick={() => !isSelected && onSelect(codigo)}
                      disabled={isSelected}
                      className="d-flex justify-content-between align-items-start"
                    >
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center">
                          <strong>{codigo.codigo}</strong>
                          {/* ✨ INDICADOR DE MEDIANOCHE */}
                          {cruzaNoche && (
                            <i className="bi bi-moon-stars text-warning ms-2" 
                               title="Cruza medianoche"></i>
                          )}
                        </div>
                        
                        <p className="mb-1 small text-muted">{codigo.descripcion}</p>
                        
                        {/* ✨ MOSTRAR HORARIO SI EXISTE */}
                        {tieneHorario && (
                          <p className="mb-1 text-info small">
                            <i className="bi bi-clock me-1"></i>
                            {getDescripcionHorario(codigo.hora_inicio!, codigo.hora_fin!)}
                          </p>
                        )}
                        
                        {/* Mostrar notas si existen */}
                        {codigo.notas && (
                          <p className="mb-0 text-muted small">
                            <i className="bi bi-info-circle me-1"></i>
                            {codigo.notas.length > 80 
                              ? `${codigo.notas.substring(0, 80)}...` 
                              : codigo.notas
                            }
                          </p>
                        )}
                      </div>
                      
                      <div className="d-flex align-items-center ms-2 flex-column">
                        {codigo.factor_multiplicador !== 1 && (
                          <Badge bg="secondary" className="mb-1">
                            x{codigo.factor_multiplicador}
                          </Badge>
                        )}
                        
                        {isSelected ? (
                          <Badge bg="success">
                            <i className="bi bi-check"></i> Seleccionado
                          </Badge>
                        ) : (
                          <Badge bg="light" text="dark">
                            <i className="bi bi-plus"></i> Agregar
                          </Badge>
                        )}
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodigoSelector;