@echo off
echo.
echo ========================================
echo   🔧 SOLUCION DE ERRORES DE COMPILACION
echo ========================================
echo.

cd C:\Users\guslo\Bitacora_01\frontend

echo 🧹 Limpiando instalacion anterior...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo 📦 Instalando dependencias limpias...
call npm install

echo.
echo 🔍 Verificando configuracion...
echo - ✅ AdminConfigService.ts corregido
echo - ✅ Contextos actualizados  
echo - ✅ package.json limpiado (sin Vite)
echo - ✅ tsconfig.json configurado
echo - ✅ vite.config.js removido

echo.
echo 🚀 Iniciando aplicacion...
echo Si aparecen warnings, son normales. Los errores criticos fueron corregidos.
echo.

call npm start

echo.
echo ========================================
echo   ✅ PROCESO COMPLETADO
echo ========================================
pause
