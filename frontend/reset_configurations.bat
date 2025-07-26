@echo off
echo.
echo ========================================
echo   🔄 RESET DE CONFIGURACIONES
echo ========================================
echo.

echo Este script limpiará las configuraciones guardadas
echo para mostrar TODAS las secciones y KPIs disponibles.
echo.

echo Secciones del Dashboard que aparecerán:
echo - ✅ KPIs del Sistema
echo - ✅ Actividad Reciente  
echo - ✅ Calendario
echo - ✅ Anuncios
echo - ✅ Reportes Rápidos
echo - ✅ Próximos Eventos
echo - ✅ Acciones Rápidas
echo - ✅ Resumen del Sistema
echo - ✅ Cronograma de Proyectos
echo.

echo KPIs que aparecerán (14 total):
echo - ✅ Proyectos Activos
echo - ✅ Tareas Pendientes
echo - ✅ Usuarios Activos  
echo - ✅ Eventos Hoy
echo - ✅ Total Altas PIC
echo - ✅ Total Altas Social
echo - ✅ Árboles de Tabulación
echo - ✅ Registros iTracker
echo - ✅ Hitos Completados
echo - ✅ Placas Generadas
echo - ✅ Contactos Activos
echo - ✅ Mensajes Pendientes
echo - 🔒 Sesiones Activas (experimental)
echo - 🔒 Alertas Aternity (experimental)
echo.

pause

echo.
echo 🔧 Instrucciones para aplicar el reset:
echo.
echo 1. Ve al AdminPanel en tu navegador
echo 2. Abre la consola del navegador (F12)
echo 3. Ejecuta: resetConfigs()
echo 4. Recarga la página
echo.
echo Alternativamente, ejecuta manualmente:
echo localStorage.removeItem('dashboardSections');
echo localStorage.removeItem('kpiConfigs');
echo location.reload();
echo.

echo ========================================
echo   ✅ INSTRUCCIONES COMPLETAS
echo ========================================
pause
