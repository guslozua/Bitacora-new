// src/components/Incidentes/DistribucionCodigos.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from 'react-bootstrap';
import { CodigoAplicado } from '../../models/Event';

interface DistribucionCodigosProps {
  codigos: CodigoAplicado[];
}

const DistribucionCodigos: React.FC<DistribucionCodigosProps> = ({ codigos }) => {
  // No mostrar gráfico si no hay códigos
  if (!codigos || codigos.length === 0) {
    return null;
  }
  
  // Agrupar minutos por tipo de código
  const distribucionPorTipo = codigos.reduce((result, codigo) => {
    // Extraer prefijo del código (primeras 2 letras)
    const tipoCodigo = codigo.codigo?.substring(0, 2) || 'OT';
    
    if (!result[tipoCodigo]) {
      result[tipoCodigo] = 0;
    }
    
    result[tipoCodigo] += codigo.minutos;
    return result;
  }, {} as Record<string, number>);
  
  // Convertir a formato para gráfico
  const data = Object.entries(distribucionPorTipo).map(([tipo, minutos]) => ({
    name: getTipoDescripcion(tipo),
    value: minutos,
    color: getTipoColor(tipo)
  }));
  
  // Obtener descripción del tipo
  function getTipoDescripcion(tipo: string): string {
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
  }
  
  // Obtener color para el tipo
  function getTipoColor(tipo: string): string {
    switch (tipo) {
      case 'GP':
        return '#0d6efd'; // primary
      case 'GA':
        return '#198754'; // success
      case 'HN':
        return '#212529'; // dark
      case 'FE':
        return '#dc3545'; // danger
      case 'FS':
        return '#ffc107'; // warning
      case 'AD':
        return '#0dcaf0'; // info
      default:
        return '#6c757d'; // secondary
    }
  }
  
  // Personalizar tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip bg-white p-2 border rounded shadow-sm">
          <p className="mb-1"><strong>{data.name}</strong></p>
          <p className="mb-0">{data.value} minutos ({Math.round(data.value / getTotalMinutos() * 100)}%)</p>
        </div>
      );
    }
    
    return null;
  };
  
  // Obtener total de minutos
  const getTotalMinutos = () => {
    return codigos.reduce((sum, codigo) => sum + codigo.minutos, 0);
  };
  
  return (
    <Card className="shadow-sm mb-3">
      <Card.Header>
        <Card.Title>Distribución de Tiempo</Card.Title>
      </Card.Header>
      <Card.Body>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
};

export default DistribucionCodigos;