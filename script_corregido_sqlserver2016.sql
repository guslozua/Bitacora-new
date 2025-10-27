-- =========================================
-- SCRIPT PARA SQL SERVER 2016 (COMPATIBILIDAD 130)
-- TASK MANAGEMENT SYSTEM
-- ORDEN CORREGIDO: ESQUEMAS -> TABLAS -> FOREIGN KEYS
-- =========================================

-- VERIFICAR SI LA BASE DE DATOS EXISTE Y ELIMINARLA SI ES NECESARIO
USE [master]
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'taskmanagementsystem')
BEGIN
    ALTER DATABASE [taskmanagementsystem] SET SINGLE_USER WITH ROLLBACK IMMEDIATE
    DROP DATABASE [taskmanagementsystem]
END
GO

-- CREAR LA BASE DE DATOS
CREATE DATABASE [taskmanagementsystem]
  CONTAINMENT = NONE
  ON PRIMARY 
( NAME = N'taskmanagementsystem', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL13.MSSQLSERVER\MSSQL\DATA\taskmanagementsystem.mdf' , SIZE = 73728KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'taskmanagementsystem_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL13.MSSQLSERVER\MSSQL\DATA\taskmanagementsystem_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
GO

-- ESTABLECER COMPATIBILIDAD PARA SQL SERVER 2016
ALTER DATABASE [taskmanagementsystem] SET COMPATIBILITY_LEVEL = 130
GO

-- CONFIGURACIONES DE BASE DE DATOS COMPATIBLES CON SQL SERVER 2016
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [taskmanagementsystem].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO

ALTER DATABASE [taskmanagementsystem] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET ARITHABORT OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET AUTO_CLOSE ON 
GO
ALTER DATABASE [taskmanagementsystem] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [taskmanagementsystem] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET CURSOR_DEFAULT GLOBAL 
GO
ALTER DATABASE [taskmanagementsystem] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET DISABLE_BROKER 
GO
ALTER DATABASE [taskmanagementsystem] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [taskmanagementsystem] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET RECOVERY SIMPLE 
GO
ALTER DATABASE [taskmanagementsystem] SET MULTI_USER 
GO
ALTER DATABASE [taskmanagementsystem] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [taskmanagementsystem] SET DB_CHAINING OFF 
GO

-- USAR LA BASE DE DATOS
USE [taskmanagementsystem]
GO

-- =========================================
-- PASO 1: CREAR USUARIOS Y ROLES
-- =========================================

-- Crear usuario si no existe
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'taskapp')
BEGIN
    CREATE USER [taskapp] FOR LOGIN [taskapp] WITH DEFAULT_SCHEMA=[dbo]
END
GO

-- Asignar roles
ALTER ROLE [db_owner] ADD MEMBER [taskapp]
GO

-- =========================================
-- PASO 2: CREAR ESQUEMAS
-- =========================================

-- Crear esquema taskmanagementsystem
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'taskmanagementsystem')
BEGIN
    EXEC('CREATE SCHEMA [taskmanagementsystem]')
END
GO

-- =========================================
-- PASO 3: CREAR FUNCIONES
-- =========================================

-- Función para abm_pic tipo
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF OBJECT_ID('[taskmanagementsystem].[enum2str$abm_pic$tipo]', 'FN') IS NOT NULL
    DROP FUNCTION [taskmanagementsystem].[enum2str$abm_pic$tipo]
GO

CREATE FUNCTION [taskmanagementsystem].[enum2str$abm_pic$tipo] 
( 
    @setval tinyint
)
RETURNS nvarchar(max)
AS 
    BEGIN
        RETURN 
            CASE @setval
                WHEN 1 THEN 'Alta'
                WHEN 2 THEN 'Baja'
                ELSE ''
            END
    END
GO

-- Función para abm_social tipo
IF OBJECT_ID('[taskmanagementsystem].[enum2str$abm_social$tipo]', 'FN') IS NOT NULL
    DROP FUNCTION [taskmanagementsystem].[enum2str$abm_social$tipo]
GO

CREATE FUNCTION [taskmanagementsystem].[enum2str$abm_social$tipo] 
( 
    @setval tinyint
)
RETURNS nvarchar(max)
AS 
    BEGIN
        RETURN 
            CASE @setval
                WHEN 1 THEN 'Alta'
                WHEN 2 THEN 'Baja'
                ELSE ''
            END
    END
GO

-- =========================================
-- PASO 4: CREAR TABLAS (EN ORDEN CORRECTO)
-- =========================================

-- PRIMERO: Tablas base sin dependencias

-- Crear tabla personas (tabla base)
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF OBJECT_ID('[taskmanagementsystem].[personas]', 'U') IS NOT NULL
    DROP TABLE [taskmanagementsystem].[personas]
GO

CREATE TABLE [taskmanagementsystem].[personas](
    [id] [bigint] IDENTITY(1,1) NOT NULL,
    [nombre] [nvarchar](255) NOT NULL,
    [apellido] [nvarchar](255) NOT NULL,
    [dni] [nvarchar](20) NULL,
    [telefono] [nvarchar](20) NULL,
    [email] [nvarchar](255) NULL,
    [direccion] [nvarchar](500) NULL,
    [fecha_nacimiento] [date] NULL,
    [activo] [bit] NOT NULL DEFAULT 1,
    [fecha_creacion] [datetime2](6) NOT NULL DEFAULT GETDATE(),
    [fecha_modificacion] [datetime2](6) NULL,
    CONSTRAINT [PK_personas] PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY]
GO

-- Crear tabla usuarios del sistema (tabla base)
IF OBJECT_ID('[taskmanagementsystem].[usuarios]', 'U') IS NOT NULL
    DROP TABLE [taskmanagementsystem].[usuarios]
GO

CREATE TABLE [taskmanagementsystem].[usuarios](
    [id] [bigint] IDENTITY(1,1) NOT NULL,
    [username] [nvarchar](100) NOT NULL,
    [password] [nvarchar](255) NOT NULL,
    [email] [nvarchar](255) NOT NULL,
    [nombre] [nvarchar](255) NOT NULL,
    [apellido] [nvarchar](255) NOT NULL,
    [activo] [bit] NOT NULL DEFAULT 1,
    [fecha_creacion] [datetime2](6) NOT NULL DEFAULT GETDATE(),
    [fecha_ultimo_acceso] [datetime2](6) NULL,
    CONSTRAINT [PK_usuarios] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UK_usuarios_username] UNIQUE ([username]),
    CONSTRAINT [UK_usuarios_email] UNIQUE ([email])
) ON [PRIMARY]
GO

-- SEGUNDO: Tablas que dependen de las tablas base

-- Crear tabla abm_pic (depende de personas)
IF OBJECT_ID('[taskmanagementsystem].[abm_pic]', 'U') IS NOT NULL
    DROP TABLE [taskmanagementsystem].[abm_pic]
GO

CREATE TABLE [taskmanagementsystem].[abm_pic](
    [id] [bigint] IDENTITY(1,1) NOT NULL,
    [fecha] [datetime2](6) NOT NULL,
    [usuario] [nvarchar](255) NOT NULL,
    [tipo] [tinyint] NOT NULL,
    [observaciones] [nvarchar](max) NULL,
    [persona_id] [bigint] NOT NULL,
    CONSTRAINT [PK_abm_pic] PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Crear tabla abm_social (depende de personas)
IF OBJECT_ID('[taskmanagementsystem].[abm_social]', 'U') IS NOT NULL
    DROP TABLE [taskmanagementsystem].[abm_social]
GO

CREATE TABLE [taskmanagementsystem].[abm_social](
    [id] [bigint] IDENTITY(1,1) NOT NULL,
    [fecha] [datetime2](6) NOT NULL,
    [usuario] [nvarchar](255) NOT NULL,
    [tipo] [tinyint] NOT NULL,
    [observaciones] [nvarchar](max) NULL,
    [persona_id] [bigint] NOT NULL,
    CONSTRAINT [PK_abm_social] PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Crear tabla tareas (depende de usuarios y personas)
IF OBJECT_ID('[taskmanagementsystem].[tareas]', 'U') IS NOT NULL
    DROP TABLE [taskmanagementsystem].[tareas]
GO

CREATE TABLE [taskmanagementsystem].[tareas](
    [id] [bigint] IDENTITY(1,1) NOT NULL,
    [titulo] [nvarchar](255) NOT NULL,
    [descripcion] [nvarchar](max) NULL,
    [estado] [nvarchar](50) NOT NULL DEFAULT 'Pendiente',
    [prioridad] [nvarchar](20) NOT NULL DEFAULT 'Media',
    [fecha_creacion] [datetime2](6) NOT NULL DEFAULT GETDATE(),
    [fecha_vencimiento] [datetime2](6) NULL,
    [fecha_completada] [datetime2](6) NULL,
    [usuario_asignado_id] [bigint] NULL,
    [usuario_creador_id] [bigint] NOT NULL,
    [persona_relacionada_id] [bigint] NULL,
    CONSTRAINT [PK_tareas] PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- =========================================
-- PASO 5: CREAR FOREIGN KEYS (DESPUÉS DE CREAR TODAS LAS TABLAS)
-- =========================================

-- FK para abm_pic -> personas
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_abm_pic_personas')
BEGIN
    ALTER TABLE [taskmanagementsystem].[abm_pic] 
    ADD CONSTRAINT [FK_abm_pic_personas] 
    FOREIGN KEY([persona_id]) REFERENCES [taskmanagementsystem].[personas] ([id])
END
GO

-- FK para abm_social -> personas
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_abm_social_personas')
BEGIN
    ALTER TABLE [taskmanagementsystem].[abm_social] 
    ADD CONSTRAINT [FK_abm_social_personas] 
    FOREIGN KEY([persona_id]) REFERENCES [taskmanagementsystem].[personas] ([id])
END
GO

-- FK para tareas -> usuarios (asignado)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_tareas_usuarios_asignado')
BEGIN
    ALTER TABLE [taskmanagementsystem].[tareas] 
    ADD CONSTRAINT [FK_tareas_usuarios_asignado] 
    FOREIGN KEY([usuario_asignado_id]) REFERENCES [taskmanagementsystem].[usuarios] ([id])
END
GO

-- FK para tareas -> usuarios (creador)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_tareas_usuarios_creador')
BEGIN
    ALTER TABLE [taskmanagementsystem].[tareas] 
    ADD CONSTRAINT [FK_tareas_usuarios_creador] 
    FOREIGN KEY([usuario_creador_id]) REFERENCES [taskmanagementsystem].[usuarios] ([id])
END
GO

-- FK para tareas -> personas
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_tareas_personas')
BEGIN
    ALTER TABLE [taskmanagementsystem].[tareas] 
    ADD CONSTRAINT [FK_tareas_personas] 
    FOREIGN KEY([persona_relacionada_id]) REFERENCES [taskmanagementsystem].[personas] ([id])
END
GO

-- =========================================
-- PASO 6: CREAR ÍNDICES PARA MEJORAR PERFORMANCE
-- =========================================

-- Índices para tabla personas
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_personas_dni' AND object_id = OBJECT_ID('[taskmanagementsystem].[personas]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_personas_dni] ON [taskmanagementsystem].[personas] ([dni])
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_personas_email' AND object_id = OBJECT_ID('[taskmanagementsystem].[personas]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_personas_email] ON [taskmanagementsystem].[personas] ([email])
END
GO

-- Índices para tabla tareas
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tareas_estado' AND object_id = OBJECT_ID('[taskmanagementsystem].[tareas]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_tareas_estado] ON [taskmanagementsystem].[tareas] ([estado])
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_tareas_fecha_vencimiento' AND object_id = OBJECT_ID('[taskmanagementsystem].[tareas]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_tareas_fecha_vencimiento] ON [taskmanagementsystem].[tareas] ([fecha_vencimiento])
END
GO

-- Índices para tablas abm
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_abm_pic_persona_fecha' AND object_id = OBJECT_ID('[taskmanagementsystem].[abm_pic]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_abm_pic_persona_fecha] ON [taskmanagementsystem].[abm_pic] ([persona_id], [fecha])
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_abm_social_persona_fecha' AND object_id = OBJECT_ID('[taskmanagementsystem].[abm_social]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_abm_social_persona_fecha] ON [taskmanagementsystem].[abm_social] ([persona_id], [fecha])
END
GO

-- =========================================
-- PASO 7: INSERTAR DATOS DE EJEMPLO
-- =========================================

-- Insertar usuario administrador
IF NOT EXISTS (SELECT * FROM [taskmanagementsystem].[usuarios] WHERE username = 'admin')
BEGIN
    INSERT INTO [taskmanagementsystem].[usuarios] 
    ([username], [password], [email], [nombre], [apellido])
    VALUES 
    ('admin', 'admin123', 'admin@taskmanagement.com', 'Administrador', 'Sistema')
END
GO

-- Insertar algunas personas de ejemplo
IF NOT EXISTS (SELECT * FROM [taskmanagementsystem].[personas] WHERE dni = '12345678')
BEGIN
    INSERT INTO [taskmanagementsystem].[personas] 
    ([nombre], [apellido], [dni], [telefono], [email], [direccion], [fecha_nacimiento])
    VALUES 
    ('Juan', 'Pérez', '12345678', '123-456-7890', 'juan.perez@email.com', 'Calle Falsa 123', '1990-01-15'),
    ('María', 'González', '87654321', '098-765-4321', 'maria.gonzalez@email.com', 'Avenida Siempre Viva 456', '1985-05-20'),
    ('Carlos', 'López', '11223344', '555-123-4567', 'carlos.lopez@email.com', 'Boulevard de los Sueños 789', '1992-12-10')
END
GO

-- =========================================
-- VERIFICACIÓN FINAL
-- =========================================

PRINT 'Script ejecutado correctamente. Verificando estructura...'

-- Verificar que las tablas se crearon correctamente
SELECT 
    SCHEMA_NAME(t.schema_id) AS EsquemaTabla,
    t.name AS NombreTabla,
    COUNT(c.column_id) AS NumeroColumnas
FROM sys.tables t
INNER JOIN sys.columns c ON t.object_id = c.object_id
WHERE SCHEMA_NAME(t.schema_id) = 'taskmanagementsystem'
GROUP BY SCHEMA_NAME(t.schema_id), t.name
ORDER BY t.name

-- Verificar foreign keys
SELECT 
    fk.name AS NombreFK,
    OBJECT_NAME(fk.parent_object_id) AS TablaOrigen,
    OBJECT_NAME(fk.referenced_object_id) AS TablaReferenciada
FROM sys.foreign_keys fk
WHERE OBJECT_SCHEMA_NAME(fk.parent_object_id) = 'taskmanagementsystem'

-- Verificar funciones
SELECT 
    ROUTINE_NAME AS NombreFuncion,
    ROUTINE_TYPE AS Tipo
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = 'taskmanagementsystem'

PRINT 'Base de datos taskmanagementsystem creada exitosamente con compatibilidad SQL Server 2016'
PRINT 'Nivel de compatibilidad: 130 (SQL Server 2016)'
PRINT 'Todas las tablas, foreign keys e índices han sido creados correctamente'
