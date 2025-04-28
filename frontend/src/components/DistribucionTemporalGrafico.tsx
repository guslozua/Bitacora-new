import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ComposedChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Bar, 
  Line, 
  ResponsiveContainer,
  TooltipProps 
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

interface DistribucionProps {
  year: string;
  month: string;
}

// Componente con tipos correctos
const DistribucionTemporalGrafico: React.FC<DistribucionProps> = ({ year, month }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [usarFechaCierre, setUsarFechaCierre] = useState<boolean>(true);

  // Colores para las diferentes clases
  const claseColors: Record<string, string> = {
    'Incidente': '#e74c3c',      // Rojo
    'Comunicado': '#3498db',     // Azul
    'Mantenimiento': '#9b59b6'   // Morado
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Obtener las placas filtradas por año y mes en lugar de las estadísticas
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
  }, [year, month, usarFechaCierre]);

  // Procesa las placas para calcular la distribución real por mes y clase
  const procesarDatosPorMes = (placas: PlacaData[]): ChartDataPoint[] => {
    // Objeto para almacenar conteos por mes
    const mesesData: Record<number, ChartDataPoint> = {};
    
    // Filtrar placas sin fecha de cierre si estamos usando fecha de cierre
    const placasFiltradas = usarFechaCierre 
      ? placas.filter(placa => placa.fecha_cierre) 
      : placas;
    
    // Agrupar placas por mes y contar por clase
    placasFiltradas.forEach(placa => {
      // Usar fecha de cierre si está habilitada y disponible, de lo contrario usar fecha de inicio
      const fecha = usarFechaCierre && placa.fecha_cierre 
        ? new Date(placa.fecha_cierre) 
        : new Date(placa.fecha_inicio);
      
      const mes = fecha.getMonth() + 1; // JavaScript months are 0-indexed
      
      // Inicializar el objeto de datos para el mes si no existe
      if (!mesesData[mes]) {
        mesesData[mes] = {
          mes: mes,
          incidentes: 0,
          comunicados: 0,
          mantenimientos: 0,
          total: 0
        };
      }
      
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
    
    // Convertir el objeto a un array para el gráfico y ordenar por mes
    const dataArray = Object.values(mesesData);
    return dataArray.sort((a, b) => a.mes - b.mes);
  };

  // Tooltip mejorado para mostrar el nombre del mes en lugar del número
  const CustomMonthTooltip: React.FC<TooltipData> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const monthIndex = parseInt(label || "0") - 1;
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

  const toggleFechaUsada = () => {
    setUsarFechaCierre(!usarFechaCierre);
  };

  if (loading) {
    return <div className="text-center">Cargando gráfico...</div>;
  }

  if (error) {
    return <div className="text-danger">Error: {error}</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Distribución Temporal de Placas</h5>
        <div className="form-check form-switch">
          <input 
            className="form-check-input" 
            type="checkbox" 
            id="flexSwitchCheckDefault" 
            checked={usarFechaCierre}
            onChange={toggleFechaUsada}
          />
          <label className="form-check-label" htmlFor="flexSwitchCheckDefault">
            {usarFechaCierre ? "Por fecha de cierre" : "Por fecha de inicio"}
          </label>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="mes"
            tickFormatter={(mes) => {
              const nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
              return nombres[parseInt(mes.toString()) - 1] || mes;
            }}
          />
          <YAxis />
          <Tooltip content={<CustomMonthTooltip />} />
          <Legend />
          <Bar dataKey="incidentes" name="Incidentes" stackId="a" fill={claseColors['Incidente']} />
          <Bar dataKey="comunicados" name="Comunicados" stackId="a" fill={claseColors['Comunicado']} />
          <Bar dataKey="mantenimientos" name="Mantenimientos" stackId="a" fill={claseColors['Mantenimiento']} />
          <Line type="monotone" dataKey="total" name="Total" stroke="#333" strokeWidth={2} dot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DistribucionTemporalGrafico;