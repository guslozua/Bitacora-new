import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Form, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiConfig';
import Sidebar from '../components/Sidebar';
import ThemedFooter from '../components/ThemedFooter'; // 🔥 CAMBIO: Footer temático
import { useTheme } from '../context/ThemeContext'; // 🔥 AGREGAR IMPORT

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend, PieChart, Pie, Cell,
  LabelList
} from 'recharts';

interface TabulacionesStats {
  total: number;
  porFechaFinal: { fecha: string; cantidad: number }[];
  porMes: { mes: number; cantidad: number }[];
  completadoPor: { usuario: string; cantidad: number }[];
  creadoPor: { usuario: string; cantidad: number }[];
  rankingTab: { arbol: string; cantidad: number }[];
  diagnostico?: {
    sin_fecha_finalizacion: number;
    sin_completado_por: number;
    sin_creado_por: number;
    sin_nombre_tarea: number;
    total_registros: number;
  };
  ultimaActualizacion?: string; // Añadido para la fecha de última actualización
}

// Lista oficial de árboles de tabulación
const ARBOLES_OFICIALES = [
  "tab.recupero",
  "tab.abono",
  "tab.admrosout",
  "tab.altovalor",
  "tab.bocable",
  "tab.boportafija",
  "tab.borecupero",
  "tab.cablebo",
  "tab.cablecbc",
  "tab.cablecbs",
  "tab.CABLECUSTOMER",
  "tab.cablecustomuy",
  "tab.cablesoporte",
  "tab.caprofan",
  "tab.carteraexecutive",
  "tab.cater",
  "tab.cbssmb",
  "tab.cgr",
  "tab.clarinpapel",
  "tab.cncustomer",
  "tab.cnsoporte",
  "tab.cocmx.relllamadoreshfc",
  "tab.comcorpo",
  "tab.conexiontotal",
  "tab.contencioncv",
  "tab.Converg",
  "tab.corpoventasout",
  "tab.custoconvergente",
  "tab.empresasmovilht",
  "tab.Empresasmovilintegral",
  "tab.empresasreten",
  "tab.facturaunificada",
  "tab.fidemigra",
  "tab.fijaintegral",
  "tab.fijaretencion",
  "tab.fijasoporte",
  "tab.flowappuy",
  "tab.gestionesuy",
  "tab.gestionesvarias",
  "tab.gestorescobranza",
  "tab.ggcccorpcom",
  "tab.ggcccorptec",
  "tab.hightech",
  "tab.hightechcorpo",
  "tab.icfs.solremota",
  "tab.icmc.customerconvnplay",
  "tab.icmc.recuperocustomer",
  "tab.icmc.recuperosoporte",
  "tab.icmc.soportenplay",
  "tab.iffs.llamadasrecibidasyrealizadas",
  "tab.iffs.soportecomobile",
  "tab.ifmc.customerftth",
  "tab.ifmc.soporteftth",
  "tab.ifmg.profijaretencion",
  "tab.imec.carteraexecutive",
  "tab.immc.personal",
  "tab.immc.prepago",
  "tab.immz.mdafan",
  "tab.integralb2b",
  "tab.integralcorpo",
  "tab.integralsmb",
  "tab.isladegra",
  "tab.isladigitclasicohd",
  "tab.masit",
  "tab.migra",
  "tab.migrafansmb",
  "tab.ocmb.bogestvarias",
  "tab.ocmb.bopbu",
  "tab.ocmb.boreclamosscore",
  "tab.ocmb.boreintegrogral",
  "tab.ocmb.reclamospaginas",
  "tab.ocmc.fibersecurity2",
  "tab.ocmg.retenhbo",
  "tab.offs.cdr",
  "tab.offs.cerochocientos",
  "tab.offs.dyr",
  "tab.offs.hfc",
  "tab.ofmc.migratelefoniahiq",
  "tab.ommg.portoutivr",
  "tab.ommg.probajasmovil",
  "tab.ommv.proventas",
  "tab.ventasin",
  "tab.onbcentric",
  "tab.onboarding",
  "tab.poolcorpo",
  "tab.porta",
  "tab.ocmv.portaexpertos",
  "tab.portanoconv",
  "tab.portawb",
  "tab.portawinsoho",
  "tab.portacancelada",
  "tab.ppay",
  "tab.prorecudownapre",
  "tab.prospfija",
  "tab.pymesout",
  "tab.recuperouy",
  "tab.rellamadoresmovil",
  "tab.REPACTASERVICEICD",
  "tab.retencioncv",
  "tab.retenciones",
  "tab.retenout",
  "tab.smarthomeventas",
  "tab.smbcomercial",
  "tab.smbmovilintegral",
  "tab.smbreten",
  "tab.soportefanftth",
  "tab.soportemovil",
  "tab.soporteonb",
  "tab.soportesmb",
  "tab.tecnicacorpo",
  "tab.TeleRed",
  "tab.teleredcustomer",
  "tab.unet",
  "tab.ventacorpomigraout",
  "tab.ventaincv",
  "tab.ventascorpo",
  "tab.vtasolucionesciber",
  "tab.vtasolucionesiot",
  "tab.vtexfan"
];

// Función para verificar si un árbol debe ser excluido (sin clasificar)
const esArbolExcluido = (arbol: string): boolean => {
  if (!arbol) return true;
  const normalizado = arbol.toLowerCase().trim();
  return normalizado === 'sin clasificar' || normalizado === 'sinclasificar';
};

// Normaliza un nombre y extrae todos los patrones tab.xxx que encuentre
function extraerTodosLosTabsDeNombre(nombre: string): string[] {
  if (!nombre) return ['Sin clasificar'];

  // Normalizar: convertir a minúsculas y eliminar espacios extra
  const normalizado = nombre.toLowerCase().trim();

  // Buscar todos los patrones "tab.xxx" o "tab.xxx.xxx"
  const regex = /\b(tab\.[a-z0-9]+(\.[a-z0-9]+)?)\b/gi;
  const matches = normalizado.match(regex);

  // También buscar patrones "tap.xxx" (error común de escritura)
  const regexTap = /\b(tap\.[a-z0-9]+(\.[a-z0-9]+)?)\b/gi;
  const matchesTap = normalizado.match(regexTap);

  const resultado: string[] = [];

  // Agregar coincidencias de tab.
  if (matches && matches.length > 0) {
    matches.forEach(match => resultado.push(match));
  }

  // Agregar coincidencias de tap. corrigiendo a tab.
  if (matchesTap && matchesTap.length > 0) {
    matchesTap.forEach(match => resultado.push(match.replace('tap.', 'tab.')));
  }

  // Si no encontramos nada, usar estrategias alternativas para casos especiales
  if (resultado.length === 0) {
    // Buscar después de separadores comunes
    const posiblesSeparadores = ['-', ':', '|', '–', '—'];
    for (const sep of posiblesSeparadores) {
      if (normalizado.includes(sep)) {
        const partes = normalizado.split(sep);
        // Buscar en cada parte después del separador
        for (const parte of partes) {
          const trimmed = parte.trim();
          if (trimmed.startsWith('tab.')) {
            // Extraer solo la parte que comienza con tab.
            const soloTab = trimmed.match(/tab\.[a-z0-9]+(\.[a-z0-9]+)?/i);
            if (soloTab) resultado.push(soloTab[0]);
            else resultado.push(trimmed);
          }
        }
      }
    }
  }

  // Si aún no encontramos nada, buscar tab. en cualquier posición
  if (resultado.length === 0 && normalizado.includes('tab.')) {
    const inicio = normalizado.indexOf('tab.');
    let fin = normalizado.indexOf(' ', inicio);
    if (fin === -1) fin = normalizado.length;
    resultado.push(normalizado.substring(inicio, fin));
  }

  // Eliminar sufijos numéricos comunes y versiones (por ejemplo, "tab.nombre 1" o "tab.nombre V01082024")
  const resultadoFinal = resultado.map(arbol => {
    // Eliminar números y versiones al final
    return arbol.replace(/\s+[0-9]+(\s+\([0-9]+\))?$/, '')  // Eliminar "tab.xxx 1" o "tab.xxx 1 (1)"
      .replace(/\s+V[0-9]+$/i, '')                // Eliminar "tab.xxx V123"
      .replace(/\.xlsx$/, '')                     // Eliminar extensiones de archivo
      .trim();
  });

  // Si no encontramos un patrón tab, identificar palabras clave
  if (resultadoFinal.length === 0) {
    // Identificar por palabras clave comunes
    if (normalizado.includes('customer')) return ['customer'];
    if (normalizado.includes('soporte')) return ['soporte'];
    if (normalizado.includes('abono')) return ['tab.abono'];
    if (normalizado.includes('alto valor')) return ['tab.altovalor'];

    return ['Sin clasificar'];
  }

  return resultadoFinal;
}

// Agrupa tareas por árbol correctamente identificado
function agruparPorArbol(tareas: any[]): { arbol: string; cantidad: number }[] {
  if (!tareas || !Array.isArray(tareas) || tareas.length === 0) return [];

  const conteo: Record<string, number> = {};

  // Procesar cada tarea y extraer todos los árboles que contiene
  tareas.forEach(tarea => {
    if (!tarea.nombre_tarea) return;

    const arboles = extraerTodosLosTabsDeNombre(tarea.nombre_tarea);

    arboles.forEach(arbol => {
      // Saltar árboles "Sin clasificar"
      if (esArbolExcluido(arbol)) return;

      // Normalizar para evitar duplicados por mayúsculas/minúsculas
      const arbolNormalizado = arbol.toLowerCase();
      conteo[arbolNormalizado] = (conteo[arbolNormalizado] || 0) + 1;
    });
  });

  // Convertir a formato para gráfica y ordenar por cantidad
  return Object.entries(conteo)
    .map(([arbol, cantidad]) => {
      // Mejorar la presentación para la gráfica
      let nombreMostrar = arbol;

      // Si es una categoría especial sin tab. explícito
      if (arbol === 'customer' || arbol === 'soporte') {
        nombreMostrar = arbol.charAt(0).toUpperCase() + arbol.slice(1);
      }
      // Para los demás, verificar si es un árbol oficial conocido
      else {
        const arbolOficial = ARBOLES_OFICIALES.find(
          a => a.toLowerCase() === arbol.toLowerCase()
        );
        if (arbolOficial) {
          nombreMostrar = arbolOficial; // Usar nombre oficial con mayúsculas correctas
        }
      }

      return { arbol: nombreMostrar, cantidad };
    })
    .filter(item => !esArbolExcluido(item.arbol)) // Filtrar los no clasificados con función especializada
    .sort((a, b) => b.cantidad - a.cantidad);
}

const TabulacionesDash = () => {
  const { isDarkMode } = useTheme(); // 🔥 AGREGAR HOOK
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [data, setData] = useState<TabulacionesStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [rawTabulaciones, setRawTabulaciones] = useState<any[]>([]);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // 🎨 COLORES DINÁMICOS SEGÚN EL TEMA
  const getThemeColors = () => {
    if (isDarkMode) {
      return {
        // Modo oscuro
        background: '#212529',
        textPrimary: '#ffffff',
        textSecondary: '#adb5bd',
        textMuted: '#6c757d',
        gridColor: '#495057',
        tooltipBg: 'rgba(52, 58, 64, 0.95)'
      };
    } else {
      return {
        // Modo claro (original)
        background: '#ffffff',
        textPrimary: '#212529',
        textSecondary: '#6c757d',
        textMuted: '#94a3b8',
        gridColor: '#f0f0f0',
        tooltipBg: 'rgba(255, 255, 255, 0.95)'
      };
    }
  };

  const themeColors = getThemeColors();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const query = `year=${selectedYear}&month=${selectedMonth}`;
      const res = await axios.get(`${API_BASE_URL}/tabulaciones/stats?${query}`);

      // Almacenar datos crudos para procesamiento local
      let tareasParaAnalizar: any[] = [];

      // Si el backend envía rawTabulaciones, úsalas
      if (res.data.rawTabulaciones && Array.isArray(res.data.rawTabulaciones)) {
        tareasParaAnalizar = res.data.rawTabulaciones;
      }
      // Si no, tratar de extraer de las tareas existentes si están disponibles
      else if (res.data.tareas && Array.isArray(res.data.tareas)) {
        tareasParaAnalizar = res.data.tareas;
      }

      // Si no hay datos crudos, usar el ranking existente pero filtrar estrictamente
      let rankingCalculado = (res.data.rankingTab || [])
        .filter((item: any) =>
          !esArbolExcluido(item.arbol) &&
          item.arbol !== 'sin clasificar' &&
          item.arbol?.toLowerCase() !== 'sin clasificar'
        )
        .slice(0, 10);

      // Si tenemos datos para analizar, generar nuestro propio ranking
      if (tareasParaAnalizar.length > 0) {
        const rankingDetallado = agruparPorArbol(tareasParaAnalizar)
          .filter(item =>
            !esArbolExcluido(item.arbol) &&
            item.arbol !== 'sin clasificar' &&
            item.arbol?.toLowerCase() !== 'sin clasificar'
          )
          .slice(0, 10);

        // Usar siempre la vista detallada
        rankingCalculado = rankingDetallado;

        setRawTabulaciones(tareasParaAnalizar);
      }

      // Procesamiento de datos para asegurar que no haya valores nulos
      const processedData: TabulacionesStats = {
        total: res.data.total || 0,

        // Filtrar fechas nulas y ordenar cronológicamente
        porFechaFinal: (res.data.porFechaFinal || [])
          .filter((item: any) => item && item.fecha)
          .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),

        // Datos agrupados por mes
        porMes: res.data.porMes || [],

        // Filtrar usuarios nulos y limitar a top 7
        completadoPor: (res.data.completadoPor || [])
          .filter((item: any) => item && item.usuario)
          .slice(0, 7),

        // Filtrar usuarios nulos y limitar a top 7
        creadoPor: (res.data.creadoPor || [])
          .filter((item: any) => item && item.usuario)
          .slice(0, 7),

        // Usar el ranking calculado
        rankingTab: rankingCalculado,

        // Información de diagnóstico
        diagnostico: res.data.diagnostico,

        // Agregar fecha de última actualización
        ultimaActualizacion: res.data.ultimaActualizacion
      };

      setData(processedData);
    } catch (err) {
      setError('Error al obtener estadísticas');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedYear, selectedMonth]);

  // Paleta de colores
  const colors = ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6', '#1abc9c'];
  const pieColors = ['#3498db', '#2ecc71', '#f1c40f'];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  const agruparPorMes = (items: { fecha: string; cantidad: number }[]) => {
    const meses = Array(12).fill(0);

    items.forEach((item) => {
      const fecha = new Date(item.fecha);
      const mes = fecha.getMonth(); // 0 = Enero
      meses[mes] += item.cantidad;
    });

    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return meses.map((cantidad, index) => ({
      mes: (index + 1).toString(),
      nombre: nombresMeses[index],
      cantidad,
    }));
  };

  // 🎨 TOOLTIP ADAPTADO AL TEMA
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="p-2 border shadow-sm rounded"
          style={{
            backgroundColor: themeColors.tooltipBg,
            color: themeColors.textPrimary,
            borderColor: isDarkMode ? '#6c757d' : '#dee2e6'
          }}
        >
          <p className="mb-0"><strong>{label}</strong></p>
          <p className="mb-0 text-primary">{`${payload[0].name}: ${formatNumber(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  const months = [
    { label: 'Todos', value: 'all' },
    { label: 'Enero', value: '1' },
    { label: 'Febrero', value: '2' },
    { label: 'Marzo', value: '3' },
    { label: 'Abril', value: '4' },
    { label: 'Mayo', value: '5' },
    { label: 'Junio', value: '6' },
    { label: 'Julio', value: '7' },
    { label: 'Agosto', value: '8' },
    { label: 'Septiembre', value: '9' },
    { label: 'Octubre', value: '10' },
    { label: 'Noviembre', value: '11' },
    { label: 'Diciembre', value: '12' }
  ];

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
    backgroundColor: themeColors.background, // 🔥 AGREGAR BACKGROUND DINÁMICO
  };

  // NUEVO: Componente para mostrar la última actualización de datos
  const renderUltimaActualizacion = () => {
    const getLatestUpdateDate = () => {
      if (!data || !data.ultimaActualizacion) {
        // Si no existe en la respuesta del backend, usar la fecha actual como fallback
        const today = new Date();
        return today.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }

      const latestDate = data.ultimaActualizacion;

      // Parsear la fecha (asumiendo que viene en formato dd/mm/yyyy o similar)
      const parts = latestDate.split('/');
      if (parts.length === 3) {
        // Si está en formato dd/mm/yyyy
        const [day, month, year] = parts;

        // Crear fecha utilizando UTC para evitar ajustes de zona horaria
        const parsedDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));

        if (isNaN(parsedDate.getTime())) {
          return 'Fecha no válida';
        }

        // Formateamos la fecha para mostrarla en el formato 'dd/mm/yyyy'
        return parsedDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'UTC'
        });
      } else {
        // Intentar un formato estándar
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

    const latestInfo = getLatestUpdateDate();

    return (
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-4">
          <h5 className="fw-bold mb-3 text-center" style={{ color: themeColors.textPrimary }}>
            <i className="bi bi-clock-history me-2 text-primary"></i>
            Última Actualización de Datos
          </h5>
          <div className="fs-3 mb-2 text-center" style={{ color: themeColors.textMuted }}>
            {latestInfo}
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
            <h2 className="mb-0 fw-bold" style={{ color: themeColors.textPrimary }}>
              Dashboard Tabulaciones
            </h2>
            <div className="d-flex gap-2">
              <select
                className="form-select shadow-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="all">Todos los años</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
              <select
                className="form-select shadow-sm"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
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
              {/* KPIs con estilo moderno */}
              <Row className="g-4 mb-4">
                <Col md={3}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1" style={{ color: themeColors.textMuted }}>Total Tareas</h6>
                          <h2 className="fw-bold mb-0" style={{ color: themeColors.textPrimary }}>
                            {formatNumber(data.total)}
                          </h2>
                        </div>
                        <div className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '3.5rem',
                            height: '3.5rem',
                            padding: 0,
                            backgroundColor: isDarkMode ? '#495057' : '#f8f9fa'
                          }}>
                          <i className="bi bi-collection fs-3" style={{ color: themeColors.textPrimary }} />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {data.diagnostico && (
                  <>
                    <Col md={3}>
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1" style={{ color: themeColors.textMuted }}>Tareas Finalizadas</h6>
                              <h2 className="fw-bold mb-0 text-primary">
                                {formatNumber(data.diagnostico.total_registros - data.diagnostico.sin_fecha_finalizacion)}
                              </h2>
                            </div>
                            <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '3.5rem',
                                height: '3.5rem',
                                padding: 0
                              }}>
                              <i className="bi bi-check-circle fs-3 text-primary" />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={3}>
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1" style={{ color: themeColors.textMuted }}>Tareas Pendientes</h6>
                              <h2 className="fw-bold mb-0 text-warning">
                                {formatNumber(data.diagnostico.sin_fecha_finalizacion)}
                              </h2>
                            </div>
                            <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '3.5rem',
                                height: '3.5rem',
                                padding: 0
                              }}>
                              <i className="bi bi-clock-history fs-3 text-warning" />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={3}>
                      <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1" style={{ color: themeColors.textMuted }}>Sin Usuario</h6>
                              <h2 className="fw-bold mb-0 text-danger">
                                {formatNumber(data.diagnostico.sin_completado_por)}
                              </h2>
                            </div>
                            <div className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '3.5rem',
                                height: '3.5rem',
                                padding: 0
                              }}>
                              <i className="bi bi-exclamation-triangle fs-3 text-danger" />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </>
                )}
              </Row>

              {/* Alertas de calidad de datos */}
              {data.diagnostico && data.diagnostico.sin_fecha_finalizacion > 0 && (
                <Alert variant="warning" className="mb-4">
                  <Alert.Heading>Datos incompletos detectados</Alert.Heading>
                  <p>
                    Se detectaron registros con datos incompletos que pueden afectar las estadísticas:
                  </p>
                  <ul>
                    {data.diagnostico.sin_fecha_finalizacion > 0 && (
                      <li>{data.diagnostico.sin_fecha_finalizacion} tareas sin fecha de finalización</li>
                    )}
                    {data.diagnostico.sin_completado_por > 0 && (
                      <li>{data.diagnostico.sin_completado_por} tareas sin información de quién las completó</li>
                    )}
                    {data.diagnostico.sin_creado_por > 0 && (
                      <li>{data.diagnostico.sin_creado_por} tareas sin información de quién las creó</li>
                    )}
                  </ul>
                </Alert>
              )}

              {/* Gráficas reordenadas según solicitud */}
              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3" style={{ color: themeColors.textPrimary }}>
                        Tareas por Mes
                      </h5>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart
                          data={data.porFechaFinal?.length > 0
                            ? agruparPorMes(data.porFechaFinal)
                            : Array.from({ length: 12 }, (_, i) => ({
                              mes: (i + 1).toString(),
                              nombre: '',
                              cantidad: 0
                            }))
                          }
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} />
                          <XAxis dataKey="nombre" tick={{ fill: themeColors.textSecondary }} />
                          <YAxis tick={{ fill: themeColors.textSecondary }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="cantidad"
                            name="Tareas"
                            stroke={colors[0]}
                            strokeWidth={2}
                            dot={{ r: 5, strokeWidth: 1 }}
                            activeDot={{ r: 7, stroke: colors[0] }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Estado de tareas */}
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3" style={{ color: themeColors.textPrimary }}>
                        Estado de Tareas
                      </h5>
                      {data.diagnostico ? (
                        <div className="d-flex justify-content-center">
                          <ResponsiveContainer width="80%" height={250}>
                            <PieChart>
                              <Pie
                                data={[
                                  {
                                    tipo: 'Finalizadas',
                                    value: data.diagnostico.total_registros - data.diagnostico.sin_fecha_finalizacion
                                  },
                                  {
                                    tipo: 'Pendientes',
                                    value: data.diagnostico.sin_fecha_finalizacion
                                  }
                                ]}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                innerRadius={60}
                                dataKey="value"
                                nameKey="tipo"
                                label={({ tipo, percent }) => `${tipo}: ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                              >
                                <Cell fill={pieColors[0]} />
                                <Cell fill={pieColors[1]} />
                              </Pie>
                              <Tooltip />
                              <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ color: themeColors.textPrimary }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="text-center py-5" style={{ color: themeColors.textMuted }}>
                          <p>No hay datos de estado disponibles</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="g-4 mb-4">
                {/* Tareas completadas por usuario */}
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3" style={{ color: themeColors.textPrimary }}>
                        Tareas Completadas por Usuario
                      </h5>
                      {data.completadoPor && data.completadoPor.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={data.completadoPor}
                            layout="vertical"
                            margin={{ left: 120 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} horizontal={false} />
                            <XAxis type="number" tick={{ fill: themeColors.textSecondary }} />
                            <YAxis
                              dataKey="usuario"
                              type="category"
                              tick={{ fontSize: 10, fill: themeColors.textSecondary }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                              dataKey="cantidad"
                              name="Tareas"
                              fill={colors[2]}
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-5" style={{ color: themeColors.textMuted }}>
                          <p>No hay datos de tareas completadas disponibles</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Tareas creadas por usuario */}
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="fw-bold mb-3" style={{ color: themeColors.textPrimary }}>
                        Ranking Usuarios solicitantes
                      </h5>
                      {data.creadoPor && data.creadoPor.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={data.creadoPor}
                            layout="vertical"
                            margin={{ left: 120 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} horizontal={false} />
                            <XAxis type="number" tick={{ fill: themeColors.textSecondary }} />
                            <YAxis
                              dataKey="usuario"
                              type="category"
                              tick={{ fontSize: 10, fill: themeColors.textSecondary }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                              dataKey="cantidad"
                              name="Tareas"
                              fill={colors[3]}
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-5" style={{ color: themeColors.textMuted }}>
                          <p>No hay datos de creación de tareas disponibles</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Ranking de árboles */}
              <Row className="g-4 mb-4">
                <Col md={12}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold mb-0" style={{ color: themeColors.textPrimary }}>
                          Ranking Árboles de Tabulación
                        </h5>
                      </div>
                      {data.rankingTab && data.rankingTab.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={data.rankingTab.filter(item => !esArbolExcluido(item.arbol))}
                            layout="vertical"
                            margin={{ left: 120 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridColor} horizontal={false} />
                            <XAxis type="number" tick={{ fill: themeColors.textSecondary }} />
                            <YAxis
                              dataKey="arbol"
                              type="category"
                              tick={{ fontSize: 10, fill: themeColors.textSecondary }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                              dataKey="cantidad"
                              name="Tabulaciones"
                              fill={colors[1]}
                              radius={[0, 4, 4, 0]}
                              label={{ position: 'right', formatter: (val: any) => formatNumber(val) }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-5" style={{ color: themeColors.textMuted }}>
                          <p>No hay datos de árboles de tabulación disponibles</p>
                        </div>
                      )}

                      {/* Información de procesamiento */}
                      <div className="mt-3">
                        <Alert variant="info" className="mb-0">
                          <small>
                            <i className="bi bi-info-circle me-2"></i>
                            Ranking de los árboles de tabulación más solicitados
                          </small>
                        </Alert>
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

        <ThemedFooter />
      </div>
    </div>
  );
};

export default TabulacionesDash;