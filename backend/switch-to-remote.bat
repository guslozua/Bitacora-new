@echo off
REM ============================================
REM Script para cambiar a configuración REMOTA
REM ============================================

echo.
echo ========================================
echo   CAMBIANDO A CONFIGURACION REMOTA
echo ========================================
echo.

REM Verificar que existe el archivo .env.remote
if not exist ".env.remote" (
    echo [ERROR] No se encuentra el archivo .env.remote
    echo Por favor, crea el archivo .env.remote con los datos del servidor
    pause
    exit /b 1
)

REM Hacer backup del .env actual si existe
if exist ".env" (
    echo [*] Guardando .env actual como .env.current.backup
    copy /Y ".env" ".env.current.backup" >nul
)

REM Copiar configuración remota
echo [*] Copiando configuracion remota...
copy /Y ".env.remote" ".env" >nul

echo.
echo [OK] Configuracion REMOTA activada
echo.
echo IMPORTANTE:
echo - Asegurate de estar conectado a la VPN
echo - Verifica que el archivo .env.remote tenga los datos correctos
echo - Para volver a local, ejecuta: switch-to-local.bat
echo.

pause
