@echo off
REM ============================================
REM Script para cambiar a configuración LOCAL
REM ============================================

echo.
echo ========================================
echo   CAMBIANDO A CONFIGURACION LOCAL
echo ========================================
echo.

REM Verificar que existe el archivo .env.local.backup
if not exist ".env.local.backup" (
    echo [ERROR] No se encuentra el archivo .env.local.backup
    echo Restaurando desde configuracion por defecto...
    
    REM Crear configuración local por defecto
    echo PORT=5000> ".env"
    echo DB_HOST=GUSLAPTOP\SQLEXPRESS>> ".env"
    echo DB_PORT=60167>> ".env"
    echo DB_USER=taskapp>> ".env"
    echo DB_PASSWORD=Task123456>> ".env"
    echo DB_NAME=taskmanagementsystem>> ".env"
    echo JWT_SECRET=tu_jwt_secret_muy_seguro>> ".env"
    echo NODE_ENV=development>> ".env"
    echo ATERNITY_BASE_URL=https://us3-odata.aternity.com/aternity.odata/latest>> ".env"
    echo ATERNITY_USER=SGLozua@teco.com.ar>> ".env"
    
    echo [OK] Configuracion local por defecto creada
    pause
    exit /b 0
)

REM Hacer backup del .env actual si existe
if exist ".env" (
    echo [*] Guardando .env actual como .env.current.backup
    copy /Y ".env" ".env.current.backup" >nul
)

REM Copiar configuración local
echo [*] Copiando configuracion local...
copy /Y ".env.local.backup" ".env" >nul

echo.
echo [OK] Configuracion LOCAL activada
echo.
echo IMPORTANTE:
echo - Ahora estas conectado a tu SQL Server local
echo - Para volver a remoto, ejecuta: switch-to-remote.bat
echo.

pause
