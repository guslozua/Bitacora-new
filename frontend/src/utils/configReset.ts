// ============================================================================
// UTILIDAD: Resetear configuraciones guardadas para mostrar todas las secciones
// ============================================================================

/**
 * Limpia todas las configuraciones guardadas localmente
 * para forzar el uso de las configuraciones por defecto actualizadas
 */
export const resetAllConfigurations = (): void => {
  const configKeys = [
    'sidebarVisibility',
    'dashboardSections', 
    'kpiConfigs'
  ];

  console.log('🧹 Limpiando configuraciones locales...');
  
  configKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`✅ Eliminado: ${key}`);
    } catch (error) {
      console.error(`❌ Error eliminando ${key}:`, error);
    }
  });

  console.log('🔄 Configuraciones limpiadas. Recarga la página para ver todos los elementos.');
};

/**
 * Función específica para resetear solo las secciones del dashboard
 */
export const resetDashboardSections = (): void => {
  console.log('🧹 Limpiando configuración de secciones del Dashboard...');
  
  try {
    localStorage.removeItem('dashboardSections');
    console.log('✅ Secciones del Dashboard eliminadas');
    console.log('🔄 Recarga la página para ver las 9 secciones completas');
  } catch (error) {
    console.error('❌ Error eliminando secciones del Dashboard:', error);
  }
};

/**
 * Función para verificar específicamente las secciones del dashboard
 */
export const checkDashboardSections = (): void => {
  const dashboardSections = localStorage.getItem('dashboardSections');
  
  console.log('📊 Estado de secciones del Dashboard:');
  
  if (dashboardSections) {
    try {
      const sections = JSON.parse(dashboardSections);
      console.log(`📋 Secciones configuradas: ${sections.length}/9`);
      
      if (sections.length < 9) {
        console.log('⚠️ CONFIGURACIÓN INCOMPLETA - Ejecuta resetDashboardSections() para corregir');
      } else {
        console.log('✅ Configuración completa');
      }
      
      console.log('📝 Secciones actuales:', sections.map(s => s.id || s.name).join(', '));
    } catch (error) {
      console.log('❌ Error parsing dashboardSections - Ejecuta resetDashboardSections()');
    }
  } else {
    console.log('📋 Secciones del Dashboard: No configuradas (usará las 9 por defecto)');
  }
};

/**
 * Función para verificar cuántas secciones y KPIs están configurados
 */
export const checkConfigurationCounts = (): void => {
  const dashboardSections = localStorage.getItem('dashboardSections');
  const kpiConfigs = localStorage.getItem('kpiConfigs');
  
  console.log('📊 Estado actual de configuraciones:');
  
  if (dashboardSections) {
    try {
      const sections = JSON.parse(dashboardSections);
      console.log(`📋 Secciones del Dashboard: ${sections.length} configuradas`);
    } catch (error) {
      console.log('❌ Error parsing dashboardSections');
    }
  } else {
    console.log('📋 Secciones del Dashboard: No configuradas (usará defaults)');
  }
  
  if (kpiConfigs) {
    try {
      const kpis = JSON.parse(kpiConfigs);
      console.log(`📈 KPIs: ${kpis.length} configurados`);
    } catch (error) {
      console.log('❌ Error parsing kpiConfigs');
    }
  } else {
    console.log('📈 KPIs: No configurados (usará defaults)');
  }
};

/**
 * Para usar en la consola del navegador
 */
if (typeof window !== 'undefined') {
  (window as any).resetConfigs = resetAllConfigurations;
  (window as any).checkConfigs = checkConfigurationCounts;
  (window as any).resetDashboardSections = resetDashboardSections;
  (window as any).checkDashboardSections = checkDashboardSections;
  
  console.log('🔧 Utilidades disponibles en consola:');
  console.log('- resetConfigs() - Limpiar todas las configuraciones');
  console.log('- checkConfigs() - Ver estado actual');
  console.log('- resetDashboardSections() - Solo resetear secciones del Dashboard');
  console.log('- checkDashboardSections() - Ver estado de secciones del Dashboard');
}
