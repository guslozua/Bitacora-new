// ============================================================================
// SOLUCION TEMPORAL: Forzar 9 secciones del Dashboard
// ============================================================================

/**
 * Script para ejecutar en la consola del navegador
 * que fuerza la carga de las 9 secciones completas
 */

const force9Sections = () => {
  console.log('🔧 Forzando carga de 9 secciones del Dashboard...');
  
  // Configuración completa de las 9 secciones
  const complete9Sections = [
    {
      id: 'kpis-sistema',
      label: 'KPIs del Sistema',
      description: 'Indicadores clave y métricas del sistema',
      visible: true,
      icon: 'bi-speedometer2',
      order: 1
    },
    {
      id: 'actividad-reciente',
      label: 'Actividad Reciente',
      description: 'Últimas acciones y cambios en el sistema',
      visible: true,
      icon: 'bi-clock-history',
      order: 2
    },
    {
      id: 'calendario',
      label: 'Calendario',
      description: 'Mini calendario con eventos próximos',
      visible: true,
      icon: 'bi-calendar-event',
      order: 3
    },
    {
      id: 'anuncios',
      label: 'Anuncios',
      description: 'Carrusel de anuncios y noticias importantes',
      visible: true,
      icon: 'bi-megaphone',
      order: 4
    },
    {
      id: 'reportes-rapidos',
      label: 'Reportes Rápidos',
      description: 'Gráfico con estadísticas del sistema',
      visible: true,
      icon: 'bi-bar-chart-fill',
      order: 5
    },
    {
      id: 'proximos-eventos',
      label: 'Próximos Eventos',
      description: 'Lista de eventos programados',
      visible: true,
      icon: 'bi-calendar-check',
      order: 6
    },
    {
      id: 'acciones-rapidas',
      label: 'Acciones Rápidas',
      description: 'Botones para crear proyectos, tareas y eventos',
      visible: true,
      icon: 'bi-lightning-charge',
      order: 7
    },
    {
      id: 'resumen-sistema',
      label: 'Resumen del Sistema',
      description: 'Estadísticas generales y métricas del sistema',
      visible: true,
      icon: 'bi-pie-chart-fill',
      order: 8
    },
    {
      id: 'cronograma-proyectos',
      label: 'Cronograma de Proyectos',
      description: 'Vista Gantt con el cronograma de proyectos',
      visible: true,
      icon: 'bi-diagram-3-fill',
      order: 9
    }
  ];

  // Guardar en localStorage
  localStorage.setItem('dashboardSections', JSON.stringify(complete9Sections));
  console.log('✅ 9 secciones guardadas en localStorage');
  
  // Limpiar cualquier configuración del servidor que pueda estar interfiriendo
  sessionStorage.clear();
  console.log('✅ sessionStorage limpiado');
  
  // Mostrar información
  console.log('📋 Secciones configuradas:');
  complete9Sections.forEach((section, index) => {
    console.log(`${index + 1}. ${section.label} (${section.id})`);
  });
  
  console.log('\n🔄 Ahora recarga la página para ver las 9 secciones');
  
  return complete9Sections;
};

/**
 * Función para verificar que las 9 secciones están cargadas
 */
const verify9Sections = () => {
  const stored = localStorage.getItem('dashboardSections');
  if (stored) {
    const sections = JSON.parse(stored);
    console.log(`📊 Secciones en localStorage: ${sections.length}/9`);
    if (sections.length === 9) {
      console.log('✅ CORRECTO: Las 9 secciones están presentes');
      return true;
    } else {
      console.log('❌ PROBLEMA: Faltan secciones');
      return false;
    }
  } else {
    console.log('❌ No hay secciones en localStorage');
    return false;
  }
};

/**
 * Función completa de solución
 */
const fixDashboardSections = () => {
  console.log('🚀 Iniciando solución completa...');
  
  // 1. Verificar estado actual
  verify9Sections();
  
  // 2. Forzar las 9 secciones
  force9Sections();
  
  // 3. Verificar nuevamente
  const isFixed = verify9Sections();
  
  if (isFixed) {
    console.log('🎉 ¡SOLUCIONADO! Recarga la página para ver las 9 secciones');
    console.log('📝 Si aún no aparecen, verifica que no hay errores en la consola');
  } else {
    console.log('❌ Algo salió mal. Intenta manualmente:');
    console.log('1. localStorage.clear()');
    console.log('2. location.reload()');
  }
};

// Hacer las funciones disponibles globalmente
if (typeof window !== 'undefined') {
  (window as any).force9Sections = force9Sections;
  (window as any).verify9Sections = verify9Sections;
  (window as any).fixDashboardSections = fixDashboardSections;
  
  console.log('🔧 Funciones de solución disponibles:');
  console.log('- fixDashboardSections() - Solución completa');
  console.log('- force9Sections() - Forzar las 9 secciones');
  console.log('- verify9Sections() - Verificar estado');
}

export { force9Sections, verify9Sections, fixDashboardSections };
