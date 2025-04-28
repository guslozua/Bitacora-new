import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';

// Definir interfaces para los tipos
interface PlacaData {
  id: number;
  numero_placa: string;
  titulo: string;
  descripcion: string;
  impacto: 'bajo' | 'medio' | 'alto' | null;
  clase: 'Incidente' | 'Comunicado' | 'Mantenimiento';
  sistema: string;
  fecha_inicio: string;
  fecha_cierre?: string | null;
  duracion?: number | null;
  cerrado_por?: string | null;
  causa_resolutiva?: string | null;
}

interface ChartDataPoint {
  mes: number;
  incidentes: number;
  comunicados: number;
  mantenimientos: number;
  total: number;
}

interface TooltipData {
  active?: boolean;
  payload?: any[];
  label?: string;
}

interface PlacasPorMesProps {
  year: string;
  month: string;
  porMesData?: Array<{
    mes: number;
    cantidad: number;
  }>;
  porMesCierreData?: Array<{
    mes: number;
    cantidad: number;
  }>;
}

const PlacasPorMesLineChart: React.FC<PlacasPorMesProps> = ({ 
  year,
  month,
  porMesData, 
  porMesCierreData 
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);
  // Valores predeterminados: por fecha de cierre y mostrar solo el total
  const [mostrarPorCierre, setMostrarPorCierre] = useState<boolean>(true);
  const [mostrarPorClase, setMostrarPorClase] = useState<boolean>(false);

  // Colores para las diferentes clases
  const claseColors = {
    'Incidente': '#e74c3c',      // Rojo
    'Comunicado': '#3498db',     // Azul
    'Mantenimiento': '#9b59b6',  // Morado
    'Total': '#2c3e50'           // Negro azulado
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Obtener las placas filtradas por año y mes
        const query = new URLSearchParams({
          year,
          month
        }).toString();
        
        const res = await axios.get<PlacaData[]>(`http://localhost:5000/api/placas/list?${query}`);
        
        // Procesar los datos para agruparlos por mes y clase
        const placas = res.data;
        const dataPorMes = procesarDatosPorMes(placas);
        
        setChartData(dataPorMes);
        setError('');
      } catch (err) {
        console.error('Error al cargar datos para el gráfico:', err);
        setError('Error al cargar datos del gráfico');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [year, month, mostrarPorCierre, mostrarPorClase]);

  // Procesa las placas para calcular la distribución por mes y clase
  const procesarDatosPorMes = (placas: PlacaData[]): any[] => {
    // Inicializar objeto para todos los meses (1-12)
    const mesesData: Record<number, any> = {};
    for (let i = 1; i <= 12; i++) {
      mesesData[i] = {
        mes: i.toString(),
        incidentes: 0,
        comunicados: 0,
        mantenimientos: 0,
        total: 0
      };
    }
    
    // Filtrar placas sin fecha de cierre si estamos usando fecha de cierre
    const placasFiltradas = mostrarPorCierre 
      ? placas.filter(placa => placa.fecha_cierre) 
      : placas;
    
    // Agrupar placas por mes y contar por clase
    placasFiltradas.forEach(placa => {
      // Usar fecha de cierre si está habilitada y disponible, de lo contrario usar fecha de inicio
      const fecha = mostrarPorCierre && placa.fecha_cierre 
        ? new Date(placa.fecha_cierre) 
        : new Date(placa.fecha_inicio);
      
      const mes = fecha.getMonth() + 1; // JavaScript months are 0-indexed
      
      // Incrementar contadores específicos según la clase de la placa
      if (placa.clase === 'Incidente') {
        mesesData[mes].incidentes += 1;
      } else if (placa.clase === 'Comunicado') {
        mesesData[mes].comunicados += 1;
      } else if (placa.clase === 'Mantenimiento') {
        mesesData[mes].mantenimientos += 1;
      }
      
      // Incrementar el total
      mesesData[mes].total += 1;
    });
    
    // Convertir a array para el gráfico, filtrar meses sin datos y ordenar
    const dataArray = Object.values(mesesData)
      .filter(item => mostrarPorClase ? true : item.total > 0) // Filtrar meses sin datos solo si no mostramos por clase
      .sort((a, b) => parseInt(a.mes) - parseInt(b.mes));

    return dataArray;
  };

  // Tooltip personalizado para mostrar nombres de mes en lugar de números
  const CustomMonthTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const monthIndex = parseInt(label) - 1;
      const monthName = monthNames[monthIndex] || label;

      return (
        <div className="bg-white p-2 border shadow-sm rounded">
          <p className="mb-0 fw-bold">{monthName}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="mb-0" style={{ color: entry.color || entry.stroke || entry.fill }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="text-center">Cargando gráfico...</div>;
  }

  if (error) {
    return <div className="text-danger">Error: {error}</div>;
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Placas por Mes</h5>
        <div className="d-flex gap-3">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="mostrarPorClase"
              checked={mostrarPorClase}
              onChange={(e) => setMostrarPorClase(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="mostrarPorClase">
              {mostrarPorClase ? "Mostrar por clase" : "Mostrar total"}
            </label>
          </div>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="mostrarPorCierre"
              checked={mostrarPorCierre}
              onChange={(e) => setMostrarPorCierre(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="mostrarPorCierre">
              {mostrarPorCierre ? "Por fecha de cierre" : "Por fecha de apertura"}
            </label>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="mes"
            tickFormatter={(mes) => {
              const nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
              return nombres[parseInt(mes) - 1] || mes;
            }}
          />
          <YAxis />
          <Tooltip content={<CustomMonthTooltip />} />
          <Legend />
          
          {/* Líneas por clase, mostradas solo si mostrarPorClase es true */}
          {mostrarPorClase && (
            <>
              <Line 
                type="monotone" 
                dataKey="incidentes" 
                name="Incidentes" 
                stroke={claseColors['Incidente']} 
                strokeWidth={2} 
                dot={{ r: 4, strokeWidth: 1, fill: 'white', stroke: claseColors['Incidente'] }} 
                activeDot={{ r: 6, stroke: claseColors['Incidente'], strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="comunicados" 
                name="Comunicados" 
                stroke={claseColors['Comunicado']} 
                strokeWidth={2} 
                dot={{ r: 4, strokeWidth: 1, fill: 'white', stroke: claseColors['Comunicado'] }} 
                activeDot={{ r: 6, stroke: claseColors['Comunicado'], strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="mantenimientos" 
                name="Mantenimientos" 
                stroke={claseColors['Mantenimiento']} 
                strokeWidth={2} 
                dot={{ r: 4, strokeWidth: 1, fill: 'white', stroke: claseColors['Mantenimiento'] }} 
                activeDot={{ r: 6, stroke: claseColors['Mantenimiento'], strokeWidth: 2 }}
              />
            </>
          )}
          
          {/* Línea de total siempre visible, pero más destacada cuando mostrarPorClase es false */}
          <Line 
            type="monotone" 
            dataKey="total" 
            name="Total" 
            stroke={claseColors['Total']} 
            strokeWidth={mostrarPorClase ? 3 : 4} 
            dot={{ r: mostrarPorClase ? 4 : 6, strokeWidth: 1, fill: 'white', stroke: claseColors['Total'] }} 
            activeDot={{ r: mostrarPorClase ? 6 : 8, stroke: claseColors['Total'], strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
      {mostrarPorCierre && (
        <div className="text-center mt-2">
          <small className="text-muted fst-italic">
            <i className="bi bi-info-circle me-1"></i>
            Solo se muestran placas con fecha de cierre registrada
          </small>
        </div>
      )}
    </>
  );
};

export default PlacasPorMesLineChart;