-- =========================================
-- SCRIPT DE VERIFICACIÓN Y SOLUCIÓN DE PROBLEMAS
-- TASK MANAGEMENT SYSTEM - SQL SERVER 2016
-- =========================================

USE [taskmanagementsystem]
GO

-- =========================================
-- VERIFICAR COMPATIBILIDAD
-- =========================================

PRINT '=== VERIFICACIÓN DE COMPATIBILIDAD ==='

-- Verificar versión de SQL Server
SELECT 
    @@VERSION AS 'Versión SQL Server',
    SERVERPROPERTY('ProductVersion') AS 'Versión Producto',
    SERVERPROPERTY('ProductLevel') AS 'Nivel Producto',
    SERVERPROPERTY('Edition') AS 'Edición'

-- Verificar nivel de compatibilidad
SELECT 
    name AS 'Base de Datos',
    compatibility_level AS 'Nivel Compatibilidad',
    CASE compatibility_level
        WHEN 130 THEN 'SQL Server 2016'
        WHEN 140 THEN 'SQL Server 2017'
        WHEN 150 THEN 'SQL Server 2019'
        WHEN 160 THEN 'SQL Server 2022'
        ELSE 'Versión no identificada'
    END AS 'Versión Compatible'
FROM sys.databases 
WHERE name = 'taskmanagementsystem'

-- =========================================
-- VERIFICAR ESQUEMAS
-- =========================================

PRINT '=== VERIFICACIÓN DE ESQUEMAS ==='

-- Verificar que el esquema existe
IF EXISTS (SELECT * FROM sys.schemas WHERE name = 'taskmanagementsystem')
    PRINT '✓ Esquema [taskmanagementsystem] existe correctamente'
ELSE
    PRINT '✗ ERROR: Esquema [taskmanagementsystem] NO existe'

-- Listar todos los esquemas
SELECT 
    name AS 'Esquema',
    schema_id AS 'ID',
    principal_id AS 'Principal ID'
FROM sys.schemas
ORDER BY name

-- =========================================
-- VERIFICAR TABLAS
-- =========================================

PRINT '=== VERIFICACIÓN DE TABLAS ==='

-- Verificar que las tablas principales existen
DECLARE @tablas TABLE (nombre NVARCHAR(255))
INSERT INTO @tablas VALUES 
    ('taskmanagementsystem.abm_pic'),
    ('taskmanagementsystem.abm_social'),
    ('taskmanagementsystem.personas'),
    ('taskmanagementsystem.usuarios'),
    ('taskmanagementsystem.tareas')

SELECT 
    t.nombre AS 'Tabla Esperada',
    CASE 
        WHEN OBJECT_ID(t.nombre) IS NOT NULL THEN '✓ Existe'
        ELSE '✗ NO EXISTE'
    END AS 'Estado'
FROM @tablas t

-- Listar todas las tablas del esquema
SELECT 
    SCHEMA_NAME(t.schema_id) + '.' + t.name AS 'Tabla Completa',
    t.name AS 'Nombre Tabla',
    t.create_date AS 'Fecha Creación',
    t.modify_date AS 'Fecha Modificación'
FROM sys.tables t
WHERE SCHEMA_NAME(t.schema_id) = 'taskmanagementsystem'
ORDER BY t.name

-- =========================================
-- VERIFICAR FUNCIONES
-- =========================================

PRINT '=== VERIFICACIÓN DE FUNCIONES ==='

-- Verificar funciones específicas
DECLARE @funciones TABLE (nombre NVARCHAR(255))
INSERT INTO @funciones VALUES 
    ('taskmanagementsystem.enum2str$abm_pic$tipo'),
    ('taskmanagementsystem.enum2str$abm_social$tipo')

SELECT 
    f.nombre AS 'Función Esperada',
    CASE 
        WHEN OBJECT_ID(f.nombre, 'FN') IS NOT NULL THEN '✓ Existe'
        ELSE '✗ NO EXISTE'
    END AS 'Estado'
FROM @funciones f

-- =========================================
-- VERIFICAR FOREIGN KEYS
-- =========================================

PRINT '=== VERIFICACIÓN DE FOREIGN KEYS ==='

SELECT 
    fk.name AS 'Nombre FK',
    OBJECT_SCHEMA_NAME(fk.parent_object_id) + '.' + OBJECT_NAME(fk.parent_object_id) AS 'Tabla Origen',
    OBJECT_SCHEMA_NAME(fk.referenced_object_id) + '.' + OBJECT_NAME(fk.referenced_object_id) AS 'Tabla Referenciada',
    fk.is_disabled AS 'Deshabilitada'
FROM sys.foreign_keys fk
WHERE OBJECT_SCHEMA_NAME(fk.parent_object_id) = 'taskmanagementsystem'
ORDER BY fk.name

-- =========================================
-- SCRIPT DE CORRECCIÓN DE ERRORES
-- =========================================

PRINT '=== CORRECCIÓN DE ERRORES COMUNES ==='

-- 1. Verificar y crear esquema si no existe
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'taskmanagementsystem')
BEGIN
    PRINT 'Creando esquema taskmanagementsystem...'
    EXEC('CREATE SCHEMA [taskmanagementsystem]')
    PRINT '✓ Esquema creado'
END

-- 2. Verificar permisos del usuario actual
SELECT 
    dp.name AS 'Usuario',
    dp.type_desc AS 'Tipo',
    r.name AS 'Rol'
FROM sys.database_principals dp
LEFT JOIN sys.database_role_members rm ON dp.principal_id = rm.member_principal_id
LEFT JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
WHERE dp.name = USER_NAME()
ORDER BY dp.name, r.name

-- 3. Script para recrear tabla abm_pic si hay problemas
IF OBJECT_ID('taskmanagementsystem.abm_pic') IS NULL
BEGIN
    PRINT 'Recreando tabla abm_pic...'
    
    CREATE TABLE [taskmanagementsystem].[abm_pic](
        [id] [bigint] IDENTITY(1,1) NOT NULL,
        [fecha] [datetime2](6) NOT NULL,
        [usuario] [nvarchar](255) NOT NULL,
        [tipo] [tinyint] NOT NULL,
        [observaciones] [nvarchar](max) NULL,
        [persona_id] [bigint] NOT NULL,
        CONSTRAINT [PK_abm_pic] PRIMARY KEY CLUSTERED ([id] ASC)
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
    
    PRINT '✓ Tabla abm_pic recreada'
END

-- =========================================
-- SCRIPT DE LIMPIEZA PARA EMPEZAR DE NUEVO
-- =========================================

PRINT '=== SCRIPT DE LIMPIEZA (USAR SOLO SI ES NECESARIO) ==='

/*
-- DESCOMENTA ESTE BLOQUE SOLO SI NECESITAS EMPEZAR DE NUEVO

-- Eliminar foreign keys
IF OBJECT_ID('taskmanagementsystem.FK_abm_pic_personas', 'F') IS NOT NULL
    ALTER TABLE [taskmanagementsystem].[abm_pic] DROP CONSTRAINT [FK_abm_pic_personas]

IF OBJECT_ID('taskmanagementsystem.FK_abm_social_personas', 'F') IS NOT NULL
    ALTER TABLE [taskmanagementsystem].[abm_social] DROP CONSTRAINT [FK_abm_social_personas]

-- Eliminar tablas en orden correcto
IF OBJECT_ID('taskmanagementsystem.abm_pic') IS NOT NULL
    DROP TABLE [taskmanagementsystem].[abm_pic]

IF OBJECT_ID('taskmanagementsystem.abm_social') IS NOT NULL
    DROP TABLE [taskmanagementsystem].[abm_social]

IF OBJECT_ID('taskmanagementsystem.tareas') IS NOT NULL
    DROP TABLE [taskmanagementsystem].[tareas]

IF OBJECT_ID('taskmanagementsystem.personas') IS NOT NULL
    DROP TABLE [taskmanagementsystem].[personas]

IF OBJECT_ID('taskmanagementsystem.usuarios') IS NOT NULL
    DROP TABLE [taskmanagementsystem].[usuarios]

-- Eliminar funciones
IF OBJECT_ID('taskmanagementsystem.enum2str$abm_pic$tipo', 'FN') IS NOT NULL
    DROP FUNCTION [taskmanagementsystem].[enum2str$abm_pic$tipo]

IF OBJECT_ID('taskmanagementsystem.enum2str$abm_social$tipo', 'FN') IS NOT NULL
    DROP FUNCTION [taskmanagementsystem].[enum2str$abm_social$tipo]

PRINT 'Limpieza completada. Ahora ejecuta el script principal.'
*/

-- =========================================
-- VERIFICACIÓN FINAL
-- =========================================

PRINT '=== VERIFICACIÓN FINAL ==='

-- Contar objetos por tipo
SELECT 
    type_desc AS 'Tipo de Objeto',
    COUNT(*) AS 'Cantidad'
FROM sys.objects
WHERE schema_id = SCHEMA_ID('taskmanagementsystem')
GROUP BY type_desc
ORDER BY type_desc

-- Verificar que podemos hacer SELECT en las tablas principales
BEGIN TRY
    SELECT COUNT(*) AS 'Registros en personas' FROM [taskmanagementsystem].[personas]
    SELECT COUNT(*) AS 'Registros en usuarios' FROM [taskmanagementsystem].[usuarios]
    SELECT COUNT(*) AS 'Registros en abm_pic' FROM [taskmanagementsystem].[abm_pic]
    PRINT '✓ Todas las consultas SELECT funcionan correctamente'
END TRY
BEGIN CATCH
    PRINT '✗ ERROR en consultas SELECT: ' + ERROR_MESSAGE()
END CATCH

-- Probar las funciones
BEGIN TRY
    SELECT [taskmanagementsystem].[enum2str$abm_pic$tipo](1) AS 'Función abm_pic'
    SELECT [taskmanagementsystem].[enum2str$abm_social$tipo](1) AS 'Función abm_social'
    PRINT '✓ Las funciones funcionan correctamente'
END TRY
BEGIN CATCH
    PRINT '✗ ERROR en funciones: ' + ERROR_MESSAGE()
END CATCH

PRINT 'Verificación completada.'