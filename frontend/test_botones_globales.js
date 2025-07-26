// ============================================================================
// TEST DIRECTO PARA BOTONES GLOBALES - Ejecutar en consola del navegador
// ============================================================================

/*
INSTRUCCIONES:

1. Ve al AdminPanel
2. Abre la consola del navegador (F12)
3. Copia y pega este código
4. Ejecuta: testGlobalButtons()
5. Verifica los logs en la consola

=============================================================================
*/

const testGlobalButtons = async () => {
  console.log('🧪 Testing botones globales del Dashboard...');
  
  // Simular las 9 secciones
  const testSections = [
    {id: 'kpis-sistema', label: 'KPIs del Sistema', visible: true, order: 1},
    {id: 'actividad-reciente', label: 'Actividad Reciente', visible: true, order: 2},
    {id: 'calendario', label: 'Calendario', visible: true, order: 3},
    {id: 'anuncios', label: 'Anuncios', visible: false, order: 4}, // Esta la ponemos oculta para test
    {id: 'reportes-rapidos', label: 'Reportes Rápidos', visible: true, order: 5},
    {id: 'proximos-eventos', label: 'Próximos Eventos', visible: true, order: 6},
    {id: 'acciones-rapidas', label: 'Acciones Rápidas', visible: true, order: 7},
    {id: 'resumen-sistema', label: 'Resumen del Sistema', visible: true, order: 8},
    {id: 'cronograma-proyectos', label: 'Cronograma de Proyectos', visible: true, order: 9}
  ];

  console.log('📋 Configuración de test (Anuncios ocultos):');
  testSections.forEach(section => {
    console.log(`${section.order}. ${section.label} - ${section.visible ? '✅ Visible' : '❌ Oculto'}`);
  });

  // Test 1: Verificar AdminConfigService
  console.log('\n🔧 Test 1: Verificando AdminConfigService...');
  try {
    // Verificar que el servicio existe
    if (typeof AdminConfigService === 'undefined') {
      console.log('❌ AdminConfigService no está disponible en la consola');
      console.log('💡 Intenta: window.AdminConfigService o revisa los imports');
      return;
    }

    // Test del método saveDashboardConfiguration
    console.log('🔍 Testeando saveDashboardConfiguration...');
    
    // Primero guardar como configuración personal
    const personalResult = await AdminConfigService.saveDashboardConfiguration(testSections, false);
    console.log(`📱 Configuración personal: ${personalResult ? '✅ OK' : '❌ FALLÓ'}`);

    // Luego guardar como configuración global
    const globalResult = await AdminConfigService.saveDashboardConfiguration(testSections, true);
    console.log(`🌐 Configuración global: ${globalResult ? '✅ OK' : '❌ FALLÓ'}`);

    if (!globalResult) {
      console.log('❌ El problema está en AdminConfigService.saveDashboardConfiguration()');
      console.log('💡 Revisar backend o la implementación del método');
    }

  } catch (error) {
    console.error('❌ Error en AdminConfigService:', error);
  }

  // Test 2: Verificar endpoints del backend
  console.log('\n🔧 Test 2: Verificando endpoints del backend...');
  try {
    const token = localStorage.getItem('token');
    const apiUrl = 'http://localhost:5000/api/admin-config/dashboard'; // Ajustar según tu configuración
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({
        config_value: JSON.stringify(testSections),
        is_global: true
      })
    });

    console.log(`📡 Respuesta del backend: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend responde correctamente:', data);
    } else {
      console.log('❌ El backend no está respondiendo correctamente');
      console.log('💡 Verificar que el servidor esté corriendo y los endpoints existan');
    }

  } catch (error) {
    console.error('❌ Error conectando con backend:', error);
  }

  // Test 3: Verificar localStorage
  console.log('\n🔧 Test 3: Verificando localStorage...');
  localStorage.setItem('dashboardSections', JSON.stringify(testSections));
  const stored = localStorage.getItem('dashboardSections');
  if (stored) {
    const parsed = JSON.parse(stored);
    console.log(`💾 localStorage: ${parsed.length === 9 ? '✅ OK' : '❌ FALLÓ'} (${parsed.length}/9 secciones)`);
  }

  console.log('\n🎯 RESUMEN DEL TEST:');
  console.log('1. Revisar los logs de AdminConfigService');
  console.log('2. Verificar que el backend responda correctamente');
  console.log('3. Si todo está bien, el problema puede estar en el contexto o componente');
  console.log('\n🔄 Recarga la página después del test para ver los cambios');
};

// Test más simple para verificar solo el contexto
const testContextDirectly = () => {
  console.log('🧪 Test directo del contexto...');
  
  // Verificar si podemos acceder al contexto desde React DevTools o globals
  if (typeof React !== 'undefined') {
    console.log('✅ React está disponible');
    console.log('💡 Usa React DevTools para inspeccionar el DashboardSectionVisibilityContext');
  }
  
  // Verificar estado del localStorage
  const current = localStorage.getItem('dashboardSections');
  if (current) {
    const sections = JSON.parse(current);
    console.log(`📊 Secciones actuales: ${sections.length}`);
    console.log('📋 Detalles:');
    sections.forEach(s => console.log(`  ${s.order}. ${s.label} - ${s.visible ? 'Visible' : 'Oculto'}`));
  }
  
  console.log('\n🎯 Para probar los botones globales:');
  console.log('1. Cambia la visibilidad de una sección');
  console.log('2. Haz clic en "Aplicar a Todos"');
  console.log('3. Observa los logs de la consola');
  console.log('4. Verifica el badge de sincronización');
};

// Hacer funciones disponibles globalmente
window.testGlobalButtons = testGlobalButtons;
window.testContextDirectly = testContextDirectly;

console.log('🔧 Tests de botones globales cargados:');
console.log('- testGlobalButtons() - Test completo');
console.log('- testContextDirectly() - Test simple del contexto');
console.log('\n🚀 Ejecuta: testGlobalButtons()');
