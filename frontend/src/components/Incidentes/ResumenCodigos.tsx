// src/components/Incidentes/ResumenCodigos.tsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, ProgressBar, Spinner, Alert } from 'react-bootstrap';
import { Incidente, CodigoAplicado } from '../../models/Event';
import { formatearMinutosComoHoras } from '../../utils/DateUtils';
import CalculadoraService from '../../services/CalculadoraService';

interface ResumenCodigosProps {
  incidente: Incidente;
  codigos: CodigoAplicado[];
}

interface ResumenData {
  totalMinutos: number;
  totalImporte: number;
  distribucionCodigos: {
    tipo: string;
    minutos: number;
    porcentaje: number;
    importe: number;
  }[];
}

const ResumenCodigos: React.FC<ResumenCodigosProps> = ({ incidente, codigos }) => {
  const [resumen, setResumen] = useState<ResumenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calcular resumen al montar el componente o cuando cambian los códigos
  useEffect(() => {
    generarResumen();
  }, [incidente, codigos]);
  
  // Generar resumen de códigos
  const generarResumen = () => {
    try {
      setLoading(true);
      
      if (!incidente || codigos.length === 0) {
        setResumen(null);
        return;
      }
      
      // Usar el servicio de cálculo para generar el resumen
      const resumenData = CalculadoraService.generarResumen(incidente, codigos);
      setResumen(resumenData);
    } catch (error: any) {
      console.error('Error al generar resumen:', error);
      setError('No se pudo generar el resumen de códigos');
    } finally {
      setLoading(false);
    }
  };
  
  // Obtener descripción tipo de código
  const getTipoDescripcion = (tipo: string): string => {
    switch (tipo) {
      case 'GP':
        return 'Guardia Pasiva';
      case 'GA':
        return 'Guardia Activa';
      case 'HN':
        return 'Hora Nocturna';
      case 'FE':
        return 'Feriado';
      case 'FS':
        return 'Fin de Semana';
      case 'AD':
        return 'Adicional';
      default:
        return tipo;
    }
  };
  
  // Obtener color para el tipo de código
  const getTipoColor = (tipo: string): string => {
    switch (tipo) {
      case 'GP':
        return 'primary';
      case 'GA':
        return 'success';
      case 'HN':
        return 'dark';
      case 'FE':
        return 'danger';
      case 'FS':
        return 'warning';
      case 'AD':
        return 'info';
      default:
        return 'secondary';
    }
  };
  
  if (loading) {
    return (
      <Card className="shadow-sm mb-3">
        <Card.Body className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Cargando resumen de códigos...</p>
        </Card.Body>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }
  
  if (!resumen || codigos.length === 0) {
    return (
      <Alert variant="info">
        No hay códigos asociados a este incidente.
      </Alert>
    );
  }
  
  return (
    <Card className="shadow-sm mb-3">
      <Card.Header>
        <Card.Title>Resumen de Códigos</Card.Title>
      </Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col md={6}>
            <div className="mb-3">
              <h6>Duración Total</h6>
              <h3>{formatearMinutosComoHoras(resumen.totalMinutos)}</h3>
              <p className="text-muted">{resumen.totalMinutos} minutos</p>
            </div>
          </Col>
          {resumen.totalImporte > 0 && (
            <Col md={6}>
              <div className="mb-3">
                <h6>Importe Estimado</h6>
                <h3>${resumen.totalImporte.toFixed(2)}</h3>
              </div>
            </Col>
          )}
        </Row>
        
        <h6>Distribución por Tipo de Código</h6>
        <Table responsive className="mt-3">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Minutos</th>
              <th>Porcentaje</th>
              {resumen.totalImporte > 0 && <th>Importe</th>}
            </tr>
          </thead>
          <tbody>
            {resumen.distribucionCodigos.map((item, index) => (
              <tr key={index}>
                <td>
                  <Badge bg={getTipoColor(item.tipo)} className="me-2">
                    {item.tipo}
                  </Badge>
                  {getTipoDescripcion(item.tipo)}
                </td>
                <td>{formatearMinutosComoHoras(item.minutos)} ({item.minutos} min)</td>
                <td>
                  <div className="d-flex align-items-center">
                    <span className="me-2">{item.porcentaje.toFixed(1)}%</span>
                    <ProgressBar 
                      now={item.porcentaje} 
                      variant={getTipoColor(item.tipo)}
                      style={{ width: '100px', height: '8px' }} 
                    />
                  </div>
                </td>
                {resumen.totalImporte > 0 && <td>${item.importe.toFixed(2)}</td>}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default ResumenCodigos;