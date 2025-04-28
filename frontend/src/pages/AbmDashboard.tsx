import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Form } from 'react-bootstrap';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, ScatterChart, Scatter, ZAxis, Treemap,
  ComposedChart
} from 'recharts';

// Definición de interfaces para los datos
interface GestionItem {
  gestion: string;
  altas: number;
  bajas: number;
  neto: number;
}

interface CargaItem {
  fuente: string;
  ultima_fecha: string;
  total_usuarios: number;
}

// Definición de ex miembros del equipo
const exMiembros = ['Maria', 'Pablo', 'Emilio', 'Silvana'];
const AbmDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [month, setMonth] = useState<number | ''>('');

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const contentStyle: React.CSSProperties = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = '?';
      if (year) query += `year=${year}`;
      if (month) query += `${year ? '&' : ''}month=${month}`;
      
      // Si no hay filtros seleccionados, query será solo '?'
      const url = `http://localhost:5000/api/abm/stats${query !== '?' ? query : ''}`;
      
      const res = await axios.get(url);
      setData(res.data);
    } catch (err) {
      setError('Error al cargar datos del ABM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2022 }, (_, i) => 2023 + i);
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Paleta de colores moderna
  const colors = ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6', '#1abc9c'];
  const pieColors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f'];
  const areaColors = ['rgba(52, 152, 219, 0.2)', 'rgba(231, 76, 60, 0.2)', 'rgba(46, 204, 113, 0.2)'];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num || 0);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border shadow-sm rounded">
          <p className="mb-0"><strong>{label}</strong></p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="mb-0" style={{ color: entry.color }}>
              {`${entry.name}: ${formatNumber(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Renderiza gráfico de barras ajustado para mostrar mejor las diferencias
  const renderBarChart = (
    title: string,
    data: any[],
    dataKey: string,
    labelKey: string,
    color: string,
    limit: number = 5
  ) => {
    // Procesar los datos para reemplazar nombres de ex miembros
    const processedData = data?.map(item => {
      const newItem = {...item};
      // Si el labelKey (normalmente 'gestion') está en la lista de ex miembros
      if (exMiembros.includes(newItem[labelKey])) {
        // Guardar el nombre original en una propiedad separada para tooltips
        newItem.original_name = newItem[labelKey];
        // Reemplazar el nombre visible
        newItem[labelKey] = "Ex miembro";
      }
      return newItem;
    }) || [];
    
    // Limitamos a los primeros 'limit' elementos
    const limitedData = processedData.slice(0, limit);
    
    // Encontrar el valor máximo para ajustar la escala
    const maxValue = limitedData.length > 0 
      ? Math.max(...limitedData.map(d => d[dataKey] || 0)) 
      : 100;
    
    // Calcular un dominio ajustado
    const xAxisMax = Math.ceil(maxValue * 1.2);
    
    // Tooltip personalizado para mostrar nombre original
    const CustomBarTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const item = payload[0].payload;
        const displayName = item.original_name || label;
        
        return (
          <div className="bg-white p-2 border shadow-sm rounded">
            <p className="mb-0"><strong>{displayName}</strong></p>
            {payload.map((entry: any, index: number) => (
              <p key={index} className="mb-0" style={{ color: entry.color }}>
                {`${entry.name}: ${formatNumber(entry.value)}`}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };
    
    return (
      <Card className="shadow-sm border-0 mb-4 h-100">
        <Card.Body>
          <h6 className="fw-bold mb-3">{title}</h6>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={limitedData} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                domain={[0, xAxisMax]}
              />
              <YAxis 
                dataKey={labelKey} 
                type="category" 
                tick={{ fontSize: 10 }} 
              />
              <Tooltip content={CustomBarTooltip} />
              <Bar 
                dataKey={dataKey} 
                name="Usuarios" 
                fill={color} 
                radius={[0, 4, 4, 0]} 
                label={{ 
                  position: 'right', 
                  formatter: (value: number) => formatNumber(value),
                  fill: '#333',
                  fontSize: 12 
                }} 
              />
            </BarChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    );
  };
  
  // Nuevo gráfico de barras horizontales para altas por mes
  const renderMonthBarChart = (title: string, data: any[], color: string) => {
    // Encontrar el valor máximo para ajustar la escala
    const maxValue = data && data.length > 0 
      ? Math.max(...data.map(d => d.usuarios || 0)) 
      : 100;
    
    // Calcular un límite superior redondeado para que se vea bien
    const yAxisMax = Math.ceil(maxValue * 1.1 / 100) * 100;
    
    return (
      <Card className="shadow-sm border-0 mb-4 h-100">
        <Card.Body>
          <h6 className="fw-bold mb-3">{title}</h6>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" />
              <YAxis domain={[0, yAxisMax]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="usuarios" 
                name="Altas" 
                fill={color} 
                radius={[4, 4, 0, 0]} 
                // Agregar etiquetas para los valores grandes
                label={data.some(d => d.usuarios > 200) ? {
                  position: 'top',
                  formatter: (value: number) => value > 200 ? formatNumber(value) : '',
                  fill: '#333',
                  fontSize: 11
                } : undefined}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    );
  };
  
  // Nuevo gráfico combinado para operaciones con escala ajustada
  const renderComposedChart = (title: string, data: any[], dataKey: string, labelKey: string, color: string) => {
    // Procesar los datos para reemplazar nombres de ex miembros
    const processedData = data?.map(item => {
      const newItem = {...item};
      if (exMiembros.includes(newItem[labelKey])) {
        newItem.original_name = newItem[labelKey];
        newItem[labelKey] = "Ex miembro";
      }
      return newItem;
    }) || [];
    
    // Limitamos a los primeros 5 elementos
    const limitedData = processedData.slice(0, 5);
    
    // Encontrar el valor máximo para ajustar la escala
    const maxValue = limitedData.length > 0 
      ? Math.max(...limitedData.map(d => d[dataKey] || 0)) 
      : 100;
    
    // Calcular un dominio ajustado
    const xAxisMax = Math.ceil(maxValue * 1.2);
    
    // Tooltip personalizado para mostrar nombre original
    const CustomComposedTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const item = payload[0].payload;
        const displayName = item.original_name || label;
        
        return (
          <div className="bg-white p-2 border shadow-sm rounded">
            <p className="mb-0"><strong>{displayName}</strong></p>
            {payload.map((entry: any, index: number) => (
              <p key={index} className="mb-0" style={{ color: entry.color }}>
                {`${entry.name}: ${formatNumber(entry.value)}`}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };
    
    return (
      <Card className="shadow-sm border-0 mb-4 h-100">
        <Card.Body>
          <h6 className="fw-bold mb-3">{title}</h6>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart layout="vertical" data={limitedData} margin={{ left: 100 }}>
              <CartesianGrid stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, xAxisMax]} />
              <YAxis dataKey={labelKey} type="category" tick={{ fontSize: 10 }} />
              <Tooltip content={CustomComposedTooltip} />
              <Bar 
                dataKey={dataKey} 
                barSize={20} 
                fill={color} 
                name="Usuarios"
                radius={[0, 4, 4, 0]}
              />
              <Line 
                dataKey={dataKey} 
                stroke={color} 
                strokeWidth={2} 
                dot={{ stroke: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Usuarios"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    );
  };

  const renderPieChart = (
    title: string,
    data: any[],
    dataKey: string,
    labelKey: string,
    colors: string[]
  ) => {
    const processedData = data?.slice(0, 5).map((item, index) => {
      const label = exMiembros.includes(item[labelKey]) ? 'Ex miembro' : item[labelKey];
      return {
        name: label,
        value: item[dataKey],
      };
    }) || [];
  
    return (
      <Card className="shadow-sm border-0 mb-4 h-100">
        <Card.Body>
          <h6 className="fw-bold mb-3">{title}</h6>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {processedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatNumber(value)}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    );
  };
  

  

  // NUEVO: Componente mejorado para la última actualización
const renderUltimaActualizacion = () => {
  const getLatestUploadDate = () => {
    if (!data) return 'Fecha no disponible';
    
    // Obtener la fecha de las últimas cargas de cada plataforma
    const picLatest = data.ultimasCargasPic?.[0]?.ultima_fecha;
    const socialLatest = data.ultimasCargasSocial?.[0]?.ultima_fecha;
    
    // Tomar la fecha más reciente
    const latestDate = picLatest || socialLatest;

    console.log("Fecha recibida del backend:", latestDate);  // Verificar el valor recibido
    
    if (!latestDate) return 'Fecha no disponible';

    // Parsear la fecha en formato dd/mm/yyyy
    const parts = latestDate.split('/');
    if (parts.length === 3) {
      // Si está en formato dd/mm/yyyy
      const [day, month, year] = parts;
      
      // Crear fecha utilizando UTC para evitar ajustes de zona horaria
      // Nota: Los meses en JavaScript son base 0 (enero es 0), por eso restamos 1 al mes
      const parsedDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
      
      if (isNaN(parsedDate.getTime())) {
        return 'Fecha no válida';
      }

      // Formateamos la fecha para mostrarla en el formato 'dd/mm/yyyy'
      return parsedDate.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        timeZone: 'UTC' // Importante: usar UTC para la visualización
      });
    } else {
      // Si no está en formato dd/mm/yyyy, intentar un formato estándar
      const parsedDate = new Date(latestDate);
      
      if (isNaN(parsedDate.getTime())) {
        return 'Fecha no válida';
      }
      
      // Crear una nueva fecha en UTC para eliminar el efecto de la zona horaria
      const utcDate = new Date(Date.UTC(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate()
      ));
      
      return utcDate.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        timeZone: 'UTC'
      });
    }
  };

  const latestInfo = getLatestUploadDate();
  
  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Body className="p-4">
        <h5 className="fw-bold mb-3 text-center">
          <i className="bi bi-clock-history me-2 text-primary"></i>
          Última Actualización de Datos
        </h5>
        <div className="fs-3 mb-2 text-center text-muted">{latestInfo}</div>
      </Card.Body>
    </Card>
  );
};
  
  
  
  // NUEVO GRÁFICO: Gráfico de líneas para comparación de plataformas

const renderComparativaTotalChart = () => {
  if (!data) return null;
  
  // Definir interface para los datos mensuales y de gráfico
  interface MonthData {
    mes: string;
    usuarios?: number;
    altas?: number;
    bajas?: number;
    [key: string]: any;
  }
  
  interface ChartData {
    mes: string;
    'Altas PIC': number;
    'Bajas PIC': number;
    'Altas YSocial': number;
    'Bajas YSocial': number;
    [key: string]: any;
  }
  
  // Verificar si tenemos datos detallados por mes
  const hasMonthlyDetailPic = data.porMesPic && Array.isArray(data.porMesPic) && data.porMesPic.length > 0;
  const hasMonthlyDetailSocial = data.porMesSocial && Array.isArray(data.porMesSocial) && data.porMesSocial.length > 0;
  
  // Si no hay datos mensuales para ninguna plataforma, no mostrar el gráfico
  if (!hasMonthlyDetailPic && !hasMonthlyDetailSocial) {
    return (
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="text-center py-5">
          <i className="bi bi-bar-chart-line text-muted" style={{ fontSize: '2.5rem' }}></i>
          <h5 className="text-muted mt-3">No hay datos disponibles para mostrar en el gráfico</h5>
          <p className="text-muted">Intenta seleccionar otro período o verifica que haya datos cargados.</p>
        </Card.Body>
      </Card>
    );
  }
  
  // Obtener todos los meses disponibles (combinando ambas plataformas)
  const availableMonths = new Set<string>();
  
  if (hasMonthlyDetailPic) {
    data.porMesPic.forEach((item: MonthData) => {
      if (item.mes) availableMonths.add(item.mes);
    });
  }
  
  if (hasMonthlyDetailSocial) {
    data.porMesSocial.forEach((item: MonthData) => {
      if (item.mes) availableMonths.add(item.mes);
    });
  }
  
  // Convertir a array y ordenar
  const monthsArray = Array.from(availableMonths);
  const mesesOrden = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  monthsArray.sort((a, b) => mesesOrden.indexOf(a) - mesesOrden.indexOf(b));
  
  // Crear los datos para el gráfico usando solo los meses disponibles
  const monthlyData: ChartData[] = monthsArray.map(mes => {
    // Obtener datos para PIC
    const picData = hasMonthlyDetailPic 
      ? data.porMesPic.find((item: MonthData) => item.mes === mes) 
      : null;
    
    // Obtener datos para YSocial
    const socialData = hasMonthlyDetailSocial 
      ? data.porMesSocial.find((item: MonthData) => item.mes === mes) 
      : null;
    
    // Calcular ratio de bajas/altas para estimar bajas si no hay datos directos
    const picBajasRatio = data.total_altas_pic && data.total_bajas_pic 
      ? data.total_bajas_pic / data.total_altas_pic 
      : 0.8; // Valor por defecto si no hay totales
    
    const socialBajasRatio = data.total_altas_social && data.total_bajas_social 
      ? data.total_bajas_social / data.total_altas_social 
      : 0.2; // Valor por defecto si no hay totales
    
    // Obtener altas (o 0 si no hay datos)
    const altasPIC = picData?.usuarios || 0;
    const altasYSocial = socialData?.usuarios || 0;
    
    // Estimar bajas basándose en la proporción global altas/bajas
    // Solo si hay altas, sino poner 0
    const bajasPIC = altasPIC > 0 ? Math.round(altasPIC * picBajasRatio) : 0;
    const bajasYSocial = altasYSocial > 0 ? Math.round(altasYSocial * socialBajasRatio) : 0;
    
    return {
      mes,
      'Altas PIC': altasPIC,
      'Bajas PIC': bajasPIC,
      'Altas YSocial': altasYSocial,
      'Bajas YSocial': bajasYSocial
    };
  });
  
  // Filtrar cualquier mes donde todos los valores son 0
  const filteredData = monthlyData.filter(d => 
    d['Altas PIC'] > 0 || d['Bajas PIC'] > 0 || 
    d['Altas YSocial'] > 0 || d['Bajas YSocial'] > 0
  );
  
  // Si después de filtrar no quedan datos, mostrar mensaje
  if (filteredData.length === 0) {
    return (
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="text-center py-5">
          <i className="bi bi-bar-chart-line text-muted" style={{ fontSize: '2.5rem' }}></i>
          <h5 className="text-muted mt-3">No hay datos suficientes para mostrar en el gráfico</h5>
          <p className="text-muted">Intenta seleccionar otro período o verifica que haya datos cargados.</p>
        </Card.Body>
      </Card>
    );
  }
  
  // Calcular máximo para ajustar escala del eje Y
  const maxValue = Math.max(
    ...filteredData.map(d => 
      Math.max(d['Altas PIC'], d['Bajas PIC'], d['Altas YSocial'], d['Bajas YSocial'])
    )
  );
  
  // Redondear hacia arriba para tener un tope limpio
  const yAxisMax = Math.ceil(maxValue * 1.2 / 100) * 100;
  
  // Custom tooltip para mostrar los valores con formato
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Obtener los datos del mes actual
      const currentData = filteredData.find(d => d.mes === label);
      if (!currentData) return null;
      
      // Calcular el neto para cada plataforma
      const picNeto = currentData['Altas PIC'] - currentData['Bajas PIC'];
      const socialNeto = currentData['Altas YSocial'] - currentData['Bajas YSocial'];
      
      return (
        <div className="bg-white p-3 border shadow-sm rounded">
          <p className="fw-bold mb-2 border-bottom pb-1">{label}</p>
          
          <div className="mb-3">
            <p className="mb-0 fw-bold text-primary">PIC</p>
            <div className="ps-2">
              <p className="mb-0 text-primary">Altas: {formatNumber(currentData['Altas PIC'])}</p>
              <p className="mb-0 text-info">Bajas: {formatNumber(currentData['Bajas PIC'])}</p>
              <p className="mb-0 fw-bold mt-1" style={{color: picNeto >= 0 ? 'green' : 'red'}}>
                Neto: {picNeto >= 0 ? '+' : ''}{formatNumber(picNeto)}
              </p>
            </div>
          </div>
          
          <div>
            <p className="mb-0 fw-bold" style={{color: '#f39c12'}}>YSocial</p>
            <div className="ps-2">
              <p className="mb-0" style={{color: '#f39c12'}}>Altas: {formatNumber(currentData['Altas YSocial'])}</p>
              <p className="mb-0" style={{color: '#ffd180'}}>Bajas: {formatNumber(currentData['Bajas YSocial'])}</p>
              <p className="mb-0 fw-bold mt-1" style={{color: socialNeto >= 0 ? 'green' : 'red'}}>
                Neto: {socialNeto >= 0 ? '+' : ''}{formatNumber(socialNeto)}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Body>
        <h5 className="fw-bold mb-3">Barras Separadas por Plataforma y Mes</h5>
        <ResponsiveContainer width="100%" height={450}>
          <BarChart 
            data={filteredData}
            margin={{ top: 20, right: 30, left: 30, bottom: 10 }}
            barGap={4}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="mes" 
              tick={{ fontSize: 14 }}
              tickLine={false}
              axisLine={{ strokeWidth: 1 }}
            />
            <YAxis 
              domain={[0, yAxisMax]} 
              tickFormatter={(value) => formatNumber(value)}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomBarTooltip />} />
            
            {/* Barras para PIC */}
            <Bar
              dataKey="Altas PIC"
              name="Altas PIC"
              fill={colors[0]} // Color principal azul
            />
            <Bar
              dataKey="Bajas PIC"
              name="Bajas PIC"
              fill="#90caf9" // Versión más clara del azul
            />
            
            {/* Barras para YSocial */}
            <Bar
              dataKey="Altas YSocial"
              name="Altas YSocial"
              fill={colors[3]} // Color naranja
            />
            <Bar
              dataKey="Bajas YSocial"
              name="Bajas YSocial"
              fill="#ffd180" // Versión más clara del naranja
            />
          </BarChart>
        </ResponsiveContainer>
        
        {/* Resumen de totales con mejor estilo */}
        <div className="d-flex justify-content-center gap-5 mt-3 pt-2 border-top">
          <div className="text-center">
            <h6 className="text-muted mb-2">PIC - Total usuarios</h6>
            <div className="d-flex justify-content-center gap-4">
              <div>
                <span className="badge bg-primary">Altas</span>
                <div className="fw-bold">{formatNumber(data.total_altas_pic || 0)}</div>
              </div>
              <div>
                <span className="badge bg-info">Bajas</span>
                <div className="fw-bold">{formatNumber(data.total_bajas_pic || 0)}</div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h6 className="text-muted mb-2">YSocial - Total usuarios</h6>
            <div className="d-flex justify-content-center gap-4">
              <div>
                <span className="badge" style={{backgroundColor: colors[3]}}>Altas</span>
                <div className="fw-bold">{formatNumber(data.total_altas_social || 0)}</div>
              </div>
              <div>
                <span className="badge" style={{backgroundColor: "#ffd180"}}>Bajas</span>
                <div className="fw-bold">{formatNumber(data.total_bajas_social || 0)}</div>
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={handleLogout} />
      <div style={contentStyle}>
        <Container fluid className="py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0">Dashboard ABM - Altas y Bajas de Usuarios</h2>
            <div className="d-flex gap-2">
              <Form.Select 
                value={year} 
                onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : '')} 
                className="shadow-sm"
              >
                <option value="">Todos los años</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </Form.Select>
              <Form.Select 
                value={month} 
                onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : '')}
                className="shadow-sm"
              >
                <option value="">Todos los meses</option>
                {months.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
              </Form.Select>
            </div>
          </div>
  
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : data ? (
            <>
            {/* KPIs con íconos y estilo mejorado */}
            <Row className="mb-4 g-4">
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="p-0">
                      <div className="d-flex">
                        <div className="p-3 text-center border-end" style={{width: "33%"}}>
                          <h6 className="text-muted mb-1">Altas PIC</h6>
                          <h3 className="fw-bold text-primary mb-0">{formatNumber(data.total_altas_pic || 0)}</h3>
                          <div className="text-primary">
                            <i className="bi bi-graph-up-arrow"></i>
                          </div>
                        </div>
                        <div className="p-3 text-center border-end" style={{width: "33%"}}>
                          <h6 className="text-muted mb-1">Bajas PIC</h6>
                          <h3 className="fw-bold text-danger mb-0">{formatNumber(data.total_bajas_pic || 0)}</h3>
                          <div className="text-danger">
                            <i className="bi bi-graph-down-arrow"></i>
                          </div>
                        </div>
                        <div className="p-3 text-center" style={{width: "34%"}}>
                          <h6 className="text-muted mb-1">Balance Neto</h6>
                          <h3 className={`fw-bold mb-0 ${data.neto_pic >= 0 ? 'text-success' : 'text-danger'}`}>
                            {data.neto_pic >= 0 ? '+' : ''}{formatNumber(data.neto_pic || 0)}
                          </h3>
                          <div className={data.neto_pic >= 0 ? 'text-success' : 'text-danger'}>
                            <i className={`bi ${data.neto_pic >= 0 ? 'bi-arrow-up-circle' : 'bi-arrow-down-circle'}`}></i>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="p-0">
                      <div className="d-flex">
                        <div className="p-3 text-center border-end" style={{width: "33%"}}>
                          <h6 className="text-muted mb-1">Altas YSocial</h6>
                          <h3 className="fw-bold text-success mb-0">{formatNumber(data.total_altas_social || 0)}</h3>
                          <div className="text-success">
                            <i className="bi bi-person-plus-fill"></i>
                          </div>
                        </div>
                        <div className="p-3 text-center border-end" style={{width: "33%"}}>
                          <h6 className="text-muted mb-1">Bajas YSocial</h6>
                          <h3 className="fw-bold text-warning mb-0">{formatNumber(data.total_bajas_social || 0)}</h3>
                          <div className="text-warning">
                            <i className="bi bi-person-dash-fill"></i>
                          </div>
                        </div>
                        <div className="p-3 text-center" style={{width: "34%"}}>
                          <h6 className="text-muted mb-1">Balance Neto</h6>
                          <h3 className={`fw-bold mb-0 ${data.neto_social >= 0 ? 'text-success' : 'text-danger'}`}>
                            {data.neto_social >= 0 ? '+' : ''}{formatNumber(data.neto_social || 0)}
                          </h3>
                          <div className={data.neto_social >= 0 ? 'text-success' : 'text-danger'}>
                            <i className={`bi ${data.neto_social >= 0 ? 'bi-arrow-up-circle' : 'bi-arrow-down-circle'}`}></i>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              {/* NUEVO: Gráfico comparativo mejorado usando gráfico de líneas */}
              <Row className="mb-4">
                <Col md={12}>
                  {renderComparativaTotalChart()}
                </Col>
              </Row>
  
              {/* Columnas separadas por plataforma con gráficos mejorados */}
              <Row className="mb-4">
                <Col md={6}>
                  <h5 className="fw-bold mb-3 d-flex align-items-center">
                    <img src="/logopic.png" alt="PIC Logo" className="me-2" style={{ height: '30px' }} />
                    <span className="text-dark">PIC</span>
                  </h5>
                  {renderMonthBarChart('Altas por Mes - PIC', data.porMesPic, colors[0])}
                </Col>
                <Col md={6}>
                  <h5 className="fw-bold mb-3 d-flex align-items-center">
                    <img src="/logoyoizen.png" alt="YSocial Logo" className="me-2" style={{ height: '30px' }} />
                    <span className="text-dark">YSocial</span>
                  </h5>
                  {renderMonthBarChart('Altas por Mes - YSocial', data.porMesSocial, colors[3])}
                </Col>
              </Row>

              <Row className="mb-4 g-4">
                <Col md={6}>
                  {renderBarChart('Ranking por Centro - PIC', data.topCentrosPic, 'total', 'centro', colors[0], 5)}
                </Col>
                <Col md={6}>
                  {renderBarChart('Ranking por Centro - YSocial', data.topCentrosSocial, 'total', 'centro', colors[3], 5)}
                </Col>
              </Row>

              <Row className="mb-4 g-4">
                <Col md={6}>
                  {renderComposedChart('Ranking por Operación - PIC', data.topOperacionesPic, 'total', 'operacion', colors[4])}
                </Col>
                <Col md={6}>
                  {renderComposedChart('Ranking por Operación - YSocial', data.topOperacionesSocial, 'total', 'operacion', colors[5])}
                </Col>
              </Row>

              <Row className="mb-4 g-4">
                <Col md={6}>
                  {renderBarChart('Ranking por Gestión - PIC', data.topGestionesPic, 'total', 'gestion', colors[1], 5)}
                </Col>
                <Col md={6}>
                  {renderBarChart('Ranking por Gestión - YSocial', data.topGestionesSocial, 'total', 'gestion', colors[2], 5)}
                </Col>
              </Row>
              {/* Resumen por gestión con más detalle */}
              <h4 className="fw-bold mt-5 mb-4">
                <i className="bi bi-bar-chart-line me-2"></i>
                Resumen por Gestión
              </h4>
              <Row className="mb-4 g-4">
                <Col md={6}>
                  <Card className="shadow-sm border-0 mb-4 h-100">
                    <Card.Body>
                      <h6 className="fw-bold mb-3">Resumen por Gestión - PIC</h6>
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Gestión</th>
                              <th className="text-success">Altas</th>
                              <th className="text-danger">Bajas</th>
                              <th className="text-primary">Neto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.resumenGestionPic && data.resumenGestionPic.map((item: GestionItem, index: number) => {
                              const isExMiembro = exMiembros.includes(item.gestion);
                              const displayName = isExMiembro ? "Ex miembro" : item.gestion;
                              const tooltipAttr = isExMiembro ? { 'data-toggle': 'tooltip', 'title': `${item.gestion}` } : {};
                              
                              return (
                                <tr key={index}>
                                  <td {...tooltipAttr}>{displayName}</td>
                                  <td className="text-success fw-bold">{formatNumber(item.altas)}</td>
                                  <td className="text-danger">{formatNumber(item.bajas)}</td>
                                  <td className={item.neto >= 0 ? 'text-primary fw-bold' : 'text-danger fw-bold'}>
                                    {formatNumber(item.neto)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="shadow-sm border-0 mb-4 h-100">
                    <Card.Body>
                      <h6 className="fw-bold mb-3">Resumen por Gestión - YSocial</h6>
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Gestión</th>
                              <th className="text-success">Altas</th>
                              <th className="text-danger">Bajas</th>
                              <th className="text-primary">Neto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.resumenGestionSocial && data.resumenGestionSocial.map((item: GestionItem, index: number) => {
                              const isExMiembro = exMiembros.includes(item.gestion);
                              const displayName = isExMiembro ? "Ex miembro" : item.gestion;
                              const tooltipAttr = isExMiembro ? { 'data-toggle': 'tooltip', 'title': `${item.gestion}` } : {};
                              
                              return (
                                <tr key={index}>
                                  <td {...tooltipAttr}>{displayName}</td>
                                  <td className="text-success fw-bold">{formatNumber(item.altas)}</td>
                                  <td className="text-danger">{formatNumber(item.bajas)}</td>
                                  <td className={item.neto >= 0 ? 'text-primary fw-bold' : 'text-danger fw-bold'}>
                                    {formatNumber(item.neto)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              {/* Última actualización de datos al final */}
              {renderUltimaActualizacion()}
            </>
          ) : null}
        </Container>
        <Footer />
      </div>
    </div>
  );
};

export default AbmDashboard;