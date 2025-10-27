USE [master]
GO
CREATE DATABASE [taskmanagementsystem]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'taskmanagementsystem', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA\taskmanagementsystem.mdf' , SIZE = 73728KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'taskmanagementsystem_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA\taskmanagementsystem_log.ldf' , SIZE = 73728KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
GO
ALTER DATABASE [taskmanagementsystem] SET COMPATIBILITY_LEVEL = 130
GO
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
ALTER DATABASE [taskmanagementsystem] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [taskmanagementsystem] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET  DISABLE_BROKER 
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
ALTER DATABASE [taskmanagementsystem] SET  MULTI_USER 
GO
ALTER DATABASE [taskmanagementsystem] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [taskmanagementsystem] SET DB_CHAINING OFF 
GO
ALTER DATABASE [taskmanagementsystem] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [taskmanagementsystem] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [taskmanagementsystem] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [taskmanagementsystem] SET QUERY_STORE = ON
GO
ALTER DATABASE [taskmanagementsystem] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200)
GO
USE [taskmanagementsystem]
GO
CREATE USER [taskapp] FOR LOGIN [taskapp] WITH DEFAULT_SCHEMA=[dbo]
GO
ALTER ROLE [db_owner] ADD MEMBER [taskapp]
GO
CREATE SCHEMA [taskmanagementsystem]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
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
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
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
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$announcements$target_audience] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'all'
            WHEN 2 THEN 'admin'
            WHEN 3 THEN 'user'
            WHEN 4 THEN 'editor'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$announcements$type] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'info'
            WHEN 2 THEN 'warning'
            WHEN 3 THEN 'success'
            WHEN 4 THEN 'danger'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$codigos_facturacion$estado] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'activo'
            WHEN 2 THEN 'inactivo'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$codigos_facturacion$modalidad_convenio] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'FC'
            WHEN 2 THEN 'DC'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$codigos_facturacion$tipo] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'guardia_pasiva'
            WHEN 2 THEN 'guardia_activa'
            WHEN 3 THEN 'hora_nocturna'
            WHEN 4 THEN 'feriado'
            WHEN 5 THEN 'fin_semana'
            WHEN 6 THEN 'adicional'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$codigos_facturacion$tipo_calculo] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'guardia_pasiva'
            WHEN 2 THEN 'hora_activa'
            WHEN 3 THEN 'adicional_nocturno'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$codigos_facturacion$unidad_facturacion] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'por_periodo'
            WHEN 2 THEN 'por_hora'
            WHEN 3 THEN 'por_minuto'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$configuraciones_globales$tipo_configuracion] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'sidebar'
            WHEN 2 THEN 'dashboard_sections'
            WHEN 3 THEN 'dashboard_kpis'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$equipos_sistemas$nivel_responsabilidad] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'primario'
            WHEN 2 THEN 'secundario'
            WHEN 3 THEN 'soporte'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$equipos_tecnicos$estado] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'activo'
            WHEN 2 THEN 'inactivo'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$eventos$type] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'event'
            WHEN 2 THEN 'task'
            WHEN 3 THEN 'holiday'
            WHEN 4 THEN 'guardia'
            WHEN 5 THEN 'birthday'
            WHEN 6 THEN 'dayoff'
            WHEN 7 THEN 'gconect'
            WHEN 8 THEN 'vacation'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$historial_incidentes_contactos$medio_contacto] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'telefono'
            WHEN 2 THEN 'whatsapp'
            WHEN 3 THEN 'email'
            WHEN 4 THEN 'presencial'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$incidentes_guardia$estado] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'registrado'
            WHEN 2 THEN 'revisado'
            WHEN 3 THEN 'aprobado'
            WHEN 4 THEN 'rechazado'
            WHEN 5 THEN 'liquidado'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$integrantes$disponibilidad] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'disponible'
            WHEN 2 THEN 'ocupado'
            WHEN 3 THEN 'inactivo'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$ip_ranges_call_centers$tipo_contrato] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'PROPIO'
            WHEN 2 THEN 'TERCERO'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$liquidaciones_guardia$estado] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'pendiente'
            WHEN 2 THEN 'enviada'
            WHEN 3 THEN 'procesada'
            WHEN 4 THEN 'cerrada'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$logs$level] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'info'
            WHEN 2 THEN 'warning'
            WHEN 3 THEN 'error'
            WHEN 4 THEN 'debug'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$placas$clase] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'Incidente'
            WHEN 2 THEN 'Comunicado'
            WHEN 3 THEN 'Mantenimiento'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$placas$impacto] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'bajo'
            WHEN 2 THEN 'medio'
            WHEN 3 THEN 'alto'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$proyecto_usuarios$rol] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'responsable'
            WHEN 2 THEN 'colaborador'
            WHEN 3 THEN 'observador'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$proyectos$estado] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'pendiente'
            WHEN 2 THEN 'en progreso'
            WHEN 3 THEN 'completado'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$proyectos$prioridad] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'baja'
            WHEN 2 THEN 'media'
            WHEN 3 THEN 'alta'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$reportes$formato] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'PDF'
            WHEN 2 THEN 'Excel'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$sesiones_data$tipo_contrato] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'PROPIO'
            WHEN 2 THEN 'TERCERO'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$sesiones_data$ubicacion_tipo] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'home'
            WHEN 2 THEN 'call_center'
            WHEN 3 THEN 'desconocido'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$sistemas_monitoreados$criticidad] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'alta'
            WHEN 2 THEN 'media'
            WHEN 3 THEN 'baja'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$sistemas_monitoreados$estado] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'operativo'
            WHEN 2 THEN 'mantenimiento'
            WHEN 3 THEN 'inactivo'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$subtareas$estado] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'pendiente'
            WHEN 2 THEN 'en progreso'
            WHEN 3 THEN 'completado'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$tareas$estado] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'pendiente'
            WHEN 2 THEN 'en progreso'
            WHEN 3 THEN 'completado'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$tareas$prioridad] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'baja'
            WHEN 2 THEN 'media'
            WHEN 3 THEN 'alta'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$tarifas$estado] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'activo'
            WHEN 2 THEN 'inactivo'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$usuarios$estado] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'activo'
            WHEN 2 THEN 'inactivo'
            WHEN 3 THEN 'bloqueado'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$v_proximos_eventos$type] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'event'
            WHEN 2 THEN 'task'
            WHEN 3 THEN 'holiday'
            WHEN 4 THEN 'guardia'
            WHEN 5 THEN 'birthday'
            WHEN 6 THEN 'dayoff'
            WHEN 7 THEN 'gconect'
            WHEN 8 THEN 'vacation'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[enum2str$v_tareas_pendientes$type] 
( 
   @setval tinyint
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 1 THEN 'event'
            WHEN 2 THEN 'task'
            WHEN 3 THEN 'holiday'
            WHEN 4 THEN 'guardia'
            WHEN 5 THEN 'birthday'
            WHEN 6 THEN 'dayoff'
            WHEN 7 THEN 'gconect'
            WHEN 8 THEN 'vacation'
            ELSE ''
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$abm_pic$tipo] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$abm_pic$tipo(taskmanagementsystem.str2enum$abm_pic$tipo(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$abm_social$tipo] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$abm_social$tipo(taskmanagementsystem.str2enum$abm_social$tipo(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$announcements$target_audience] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$announcements$target_audience(taskmanagementsystem.str2enum$announcements$target_audience(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$announcements$type] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$announcements$type(taskmanagementsystem.str2enum$announcements$type(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$codigos_facturacion$estado] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$codigos_facturacion$estado(taskmanagementsystem.str2enum$codigos_facturacion$estado(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$codigos_facturacion$modalidad_convenio] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$codigos_facturacion$modalidad_convenio(taskmanagementsystem.str2enum$codigos_facturacion$modalidad_convenio(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$codigos_facturacion$tipo] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$codigos_facturacion$tipo(taskmanagementsystem.str2enum$codigos_facturacion$tipo(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$codigos_facturacion$tipo_calculo] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$codigos_facturacion$tipo_calculo(taskmanagementsystem.str2enum$codigos_facturacion$tipo_calculo(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$codigos_facturacion$unidad_facturacion] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$codigos_facturacion$unidad_facturacion(taskmanagementsystem.str2enum$codigos_facturacion$unidad_facturacion(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$configuraciones_globales$tipo_configuracion] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$configuraciones_globales$tipo_configuracion(taskmanagementsystem.str2enum$configuraciones_globales$tipo_configuracion(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$equipos_sistemas$nivel_responsabilidad] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$equipos_sistemas$nivel_responsabilidad(taskmanagementsystem.str2enum$equipos_sistemas$nivel_responsabilidad(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$equipos_tecnicos$estado] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$equipos_tecnicos$estado(taskmanagementsystem.str2enum$equipos_tecnicos$estado(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$eventos$type] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$eventos$type(taskmanagementsystem.str2enum$eventos$type(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$historial_incidentes_contactos$medio_contacto] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$historial_incidentes_contactos$medio_contacto(taskmanagementsystem.str2enum$historial_incidentes_contactos$medio_contacto(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$incidentes_guardia$estado] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$incidentes_guardia$estado(taskmanagementsystem.str2enum$incidentes_guardia$estado(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$integrantes$disponibilidad] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$integrantes$disponibilidad(taskmanagementsystem.str2enum$integrantes$disponibilidad(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$ip_ranges_call_centers$tipo_contrato] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$ip_ranges_call_centers$tipo_contrato(taskmanagementsystem.str2enum$ip_ranges_call_centers$tipo_contrato(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$liquidaciones_guardia$estado] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$liquidaciones_guardia$estado(taskmanagementsystem.str2enum$liquidaciones_guardia$estado(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$logs$level] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$logs$level(taskmanagementsystem.str2enum$logs$level(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$placas$clase] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$placas$clase(taskmanagementsystem.str2enum$placas$clase(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$placas$impacto] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$placas$impacto(taskmanagementsystem.str2enum$placas$impacto(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$proyecto_usuarios$rol] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$proyecto_usuarios$rol(taskmanagementsystem.str2enum$proyecto_usuarios$rol(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$proyectos$estado] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$proyectos$estado(taskmanagementsystem.str2enum$proyectos$estado(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$proyectos$prioridad] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$proyectos$prioridad(taskmanagementsystem.str2enum$proyectos$prioridad(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$reportes$formato] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$reportes$formato(taskmanagementsystem.str2enum$reportes$formato(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$sesiones_data$tipo_contrato] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$sesiones_data$tipo_contrato(taskmanagementsystem.str2enum$sesiones_data$tipo_contrato(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$sesiones_data$ubicacion_tipo] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$sesiones_data$ubicacion_tipo(taskmanagementsystem.str2enum$sesiones_data$ubicacion_tipo(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$sistemas_monitoreados$criticidad] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$sistemas_monitoreados$criticidad(taskmanagementsystem.str2enum$sistemas_monitoreados$criticidad(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$sistemas_monitoreados$estado] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$sistemas_monitoreados$estado(taskmanagementsystem.str2enum$sistemas_monitoreados$estado(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$subtareas$estado] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$subtareas$estado(taskmanagementsystem.str2enum$subtareas$estado(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$tareas$estado] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$tareas$estado(taskmanagementsystem.str2enum$tareas$estado(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$tareas$prioridad] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$tareas$prioridad(taskmanagementsystem.str2enum$tareas$prioridad(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$tarifas$estado] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$tarifas$estado(taskmanagementsystem.str2enum$tarifas$estado(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$usuarios$estado] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$usuarios$estado(taskmanagementsystem.str2enum$usuarios$estado(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$v_proximos_eventos$type] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$v_proximos_eventos$type(taskmanagementsystem.str2enum$v_proximos_eventos$type(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[norm_enum$v_tareas_pendientes$type] 
( 
   @setval nvarchar(max)
)
RETURNS nvarchar(max)
AS 
   BEGIN
      RETURN taskmanagementsystem.enum2str$v_tareas_pendientes$type(taskmanagementsystem.str2enum$v_tareas_pendientes$type(@setval))
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$abm_pic$tipo] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'Alta' THEN 1
            WHEN 'Baja' THEN 2
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$abm_social$tipo] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'Alta' THEN 1
            WHEN 'Baja' THEN 2
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$announcements$target_audience] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'all' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'user' THEN 3
            WHEN 'editor' THEN 4
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$announcements$type] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'info' THEN 1
            WHEN 'warning' THEN 2
            WHEN 'success' THEN 3
            WHEN 'danger' THEN 4
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$codigos_facturacion$estado] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'activo' THEN 1
            WHEN 'inactivo' THEN 2
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$codigos_facturacion$modalidad_convenio] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'FC' THEN 1
            WHEN 'DC' THEN 2
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$codigos_facturacion$tipo] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'guardia_pasiva' THEN 1
            WHEN 'guardia_activa' THEN 2
            WHEN 'hora_nocturna' THEN 3
            WHEN 'feriado' THEN 4
            WHEN 'fin_semana' THEN 5
            WHEN 'adicional' THEN 6
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$codigos_facturacion$tipo_calculo] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'guardia_pasiva' THEN 1
            WHEN 'hora_activa' THEN 2
            WHEN 'adicional_nocturno' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$codigos_facturacion$unidad_facturacion] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'por_periodo' THEN 1
            WHEN 'por_hora' THEN 2
            WHEN 'por_minuto' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$configuraciones_globales$tipo_configuracion] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'sidebar' THEN 1
            WHEN 'dashboard_sections' THEN 2
            WHEN 'dashboard_kpis' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$equipos_sistemas$nivel_responsabilidad] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'primario' THEN 1
            WHEN 'secundario' THEN 2
            WHEN 'soporte' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$equipos_tecnicos$estado] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'activo' THEN 1
            WHEN 'inactivo' THEN 2
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$eventos$type] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'event' THEN 1
            WHEN 'task' THEN 2
            WHEN 'holiday' THEN 3
            WHEN 'guardia' THEN 4
            WHEN 'birthday' THEN 5
            WHEN 'dayoff' THEN 6
            WHEN 'gconect' THEN 7
            WHEN 'vacation' THEN 8
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$historial_incidentes_contactos$medio_contacto] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'telefono' THEN 1
            WHEN 'whatsapp' THEN 2
            WHEN 'email' THEN 3
            WHEN 'presencial' THEN 4
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$incidentes_guardia$estado] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'registrado' THEN 1
            WHEN 'revisado' THEN 2
            WHEN 'aprobado' THEN 3
            WHEN 'rechazado' THEN 4
            WHEN 'liquidado' THEN 5
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$integrantes$disponibilidad] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'disponible' THEN 1
            WHEN 'ocupado' THEN 2
            WHEN 'inactivo' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$ip_ranges_call_centers$tipo_contrato] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'PROPIO' THEN 1
            WHEN 'TERCERO' THEN 2
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$liquidaciones_guardia$estado] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'pendiente' THEN 1
            WHEN 'enviada' THEN 2
            WHEN 'procesada' THEN 3
            WHEN 'cerrada' THEN 4
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$logs$level] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'info' THEN 1
            WHEN 'warning' THEN 2
            WHEN 'error' THEN 3
            WHEN 'debug' THEN 4
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$placas$clase] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'Incidente' THEN 1
            WHEN 'Comunicado' THEN 2
            WHEN 'Mantenimiento' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$placas$impacto] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'bajo' THEN 1
            WHEN 'medio' THEN 2
            WHEN 'alto' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$proyecto_usuarios$rol] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'responsable' THEN 1
            WHEN 'colaborador' THEN 2
            WHEN 'observador' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$proyectos$estado] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'pendiente' THEN 1
            WHEN 'en progreso' THEN 2
            WHEN 'completado' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$proyectos$prioridad] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'baja' THEN 1
            WHEN 'media' THEN 2
            WHEN 'alta' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$reportes$formato] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'PDF' THEN 1
            WHEN 'Excel' THEN 2
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$sesiones_data$tipo_contrato] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'PROPIO' THEN 1
            WHEN 'TERCERO' THEN 2
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$sesiones_data$ubicacion_tipo] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'home' THEN 1
            WHEN 'call_center' THEN 2
            WHEN 'desconocido' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$sistemas_monitoreados$criticidad] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'alta' THEN 1
            WHEN 'media' THEN 2
            WHEN 'baja' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$sistemas_monitoreados$estado] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'operativo' THEN 1
            WHEN 'mantenimiento' THEN 2
            WHEN 'inactivo' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$subtareas$estado] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'pendiente' THEN 1
            WHEN 'en progreso' THEN 2
            WHEN 'completado' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$tareas$estado] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'pendiente' THEN 1
            WHEN 'en progreso' THEN 2
            WHEN 'completado' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$tareas$prioridad] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'baja' THEN 1
            WHEN 'media' THEN 2
            WHEN 'alta' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$tarifas$estado] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'activo' THEN 1
            WHEN 'inactivo' THEN 2
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$usuarios$estado] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'activo' THEN 1
            WHEN 'inactivo' THEN 2
            WHEN 'bloqueado' THEN 3
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$v_proximos_eventos$type] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'event' THEN 1
            WHEN 'task' THEN 2
            WHEN 'holiday' THEN 3
            WHEN 'guardia' THEN 4
            WHEN 'birthday' THEN 5
            WHEN 'dayoff' THEN 6
            WHEN 'gconect' THEN 7
            WHEN 'vacation' THEN 8
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [taskmanagementsystem].[str2enum$v_tareas_pendientes$type] 
( 
   @setval nvarchar(max)
)
RETURNS tinyint
AS 
   BEGIN
      RETURN 
         CASE @setval
            WHEN 'event' THEN 1
            WHEN 'task' THEN 2
            WHEN 'holiday' THEN 3
            WHEN 'guardia' THEN 4
            WHEN 'birthday' THEN 5
            WHEN 'dayoff' THEN 6
            WHEN 'gconect' THEN 7
            WHEN 'vacation' THEN 8
            ELSE 0
         END
   END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[announcements](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[title] [nvarchar](255) NOT NULL,
	[content] [nvarchar](max) NOT NULL,
	[type] [nvarchar](7) NOT NULL,
	[icon] [nvarchar](100) NULL,
	[priority] [int] NULL,
	[active] [smallint] NULL,
	[start_date] [datetime2](0) NULL,
	[end_date] [datetime2](0) NULL,
	[action_text] [nvarchar](100) NULL,
	[action_url] [nvarchar](255) NULL,
	[target_audience] [nvarchar](6) NULL,
	[views_count] [int] NULL,
	[clicks_count] [int] NULL,
	[created_by] [int] NOT NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL,
 CONSTRAINT [PK_announcements_new] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [taskmanagementsystem].[v_announcements_stats] AS
SELECT 
    COUNT(*) AS total_announcements,
    
    SUM(CASE 
        WHEN active = 1 
        AND (start_date IS NULL OR start_date <= GETDATE()) 
        AND (end_date IS NULL OR end_date >= GETDATE()) 
        THEN 1 
        ELSE 0 
    END) AS active_announcements,
    
    SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) AS inactive_announcements,
    
    SUM(CASE 
        WHEN active = 1 
        AND start_date IS NOT NULL 
        AND start_date > GETDATE() 
        THEN 1 
        ELSE 0 
    END) AS scheduled_announcements,
    
    SUM(CASE 
        WHEN active = 1 
        AND end_date IS NOT NULL 
        AND end_date < GETDATE() 
        THEN 1 
        ELSE 0 
    END) AS expired_announcements,
    
    ISNULL(SUM(views_count), 0) AS total_views,
    ISNULL(SUM(clicks_count), 0) AS total_clicks,
    
    -- Protección contra división por cero
    CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND(CAST(ISNULL(SUM(views_count), 0) AS FLOAT) / COUNT(*), 2)
        ELSE 0.0 
    END AS avg_views_per_announcement,
    
    MAX(created_at) AS last_created_at
    
FROM taskmanagementsystem.announcements;
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[sesiones_data](
	[id] [int] IDENTITY(30025,1) NOT NULL,
	[usuario_asociado] [nvarchar](255) NULL,
	[estado_sesion] [nvarchar](50) NULL,
	[hora_inicio_sesion] [datetime2](0) NULL,
	[anonimo] [nvarchar](10) NULL,
	[nombre_punto_final] [nvarchar](255) NULL,
	[ip_punto_final] [nvarchar](15) NULL,
	[version_receiver] [nvarchar](50) NULL,
	[nombre_maquina] [nvarchar](255) NULL,
	[direccion_ip] [nvarchar](15) NULL,
	[tiempo_inactividad] [nvarchar](20) NULL,
	[campo_adicional] [real] NULL,
	[es_vm_pic] [smallint] NULL,
	[ubicacion_tipo] [nvarchar](11) NULL,
	[call_center_asignado] [nvarchar](100) NULL,
	[segmento_ip] [nvarchar](50) NULL,
	[localidad_call_center] [nvarchar](100) NULL,
	[domicilio_call_center] [nvarchar](255) NULL,
	[tipo_contrato] [nvarchar](7) NULL,
	[fecha_procesamiento] [date] NOT NULL,
	[archivo_origen] [nvarchar](255) NULL,
	[unique_key] [nvarchar](255) NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL,
 CONSTRAINT [PK_sesiones_data_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [sesiones_data$unique_session_key] UNIQUE NONCLUSTERED 
(
	[unique_key] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [taskmanagementsystem].[v_sesiones_stats_actual] AS
SELECT 
    COUNT(*) AS total_sesiones,
    
    COUNT(CASE WHEN estado_sesion = 'Active' THEN 1 END) AS sesiones_activas,
    COUNT(*) AS total_vm_pic,
    COUNT(CASE WHEN estado_sesion = 'Active' THEN 1 END) AS vm_pic_activas,
    
    COUNT(CASE WHEN ubicacion_tipo = 'home' THEN 1 END) AS total_home,
    COUNT(CASE WHEN ubicacion_tipo = 'call_center' THEN 1 END) AS total_call_center,
    
    COUNT(CASE 
        WHEN ubicacion_tipo = 'home' AND estado_sesion = 'Active' 
        THEN 1 
    END) AS home_activas,
    
    COUNT(CASE 
        WHEN ubicacion_tipo = 'call_center' AND estado_sesion = 'Active' 
        THEN 1 
    END) AS call_center_activas,
    
    -- Protección contra división por cero para porcentajes
    CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND(COUNT(CASE WHEN ubicacion_tipo = 'home' THEN 1 END) * 100.0 / COUNT(*), 2)
        ELSE 0.0 
    END AS porcentaje_home,
    
    CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND(COUNT(CASE WHEN ubicacion_tipo = 'call_center' THEN 1 END) * 100.0 / COUNT(*), 2)
        ELSE 0.0 
    END AS porcentaje_call_center,
    
    COUNT(DISTINCT CASE 
        WHEN usuario_asociado IS NOT NULL AND usuario_asociado <> '' 
        THEN usuario_asociado 
    END) AS usuarios_unicos,
    
    CAST(MAX(created_at) AS DATE) AS ultima_actualizacion
    
FROM taskmanagementsystem.sesiones_data 
WHERE es_vm_pic = 1; -- Cambié de 11 a 1 (valor booleano típico)
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[usuarios](
	[id] [int] IDENTITY(25,1) NOT NULL,
	[nombre] [nvarchar](100) NOT NULL,
	[email] [nvarchar](100) NOT NULL,
	[password] [nvarchar](255) NOT NULL,
	[estado] [nvarchar](9) NULL,
	[fecha_creacion] [datetime] NOT NULL,
	[imagen_perfil] [nvarchar](255) NULL,
	[ultimo_acceso] [datetime2](0) NULL,
	[fecha_actualizacion] [datetime2](0) NULL,
 CONSTRAINT [PK_usuarios_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
*   SSMA informational messages:
*   M2SS0003: The following SQL clause was ignored during conversion:
*   ALGORITHM =  UNDEFINED.
*   M2SS0003: The following SQL clause was ignored during conversion:
*   DEFINER = `root`@`localhost`.
*   M2SS0003: The following SQL clause was ignored during conversion:
*   SQL SECURITY DEFINER.
*/

CREATE VIEW [taskmanagementsystem].[v_announcements_active] (
   [id], 
   [title], 
   [content], 
   [type], 
   [icon], 
   [priority], 
   [active], 
   [start_date], 
   [end_date], 
   [action_text], 
   [action_url], 
   [target_audience], 
   [views_count], 
   [clicks_count], 
   [created_by], 
   [created_at], 
   [updated_at], 
   [created_by_name])
AS 
   SELECT TOP (9223372036854775807) 
      a.id AS id, 
      a.title AS title, 
      a.content AS content, 
      a.type AS type, 
      a.icon AS icon, 
      a.priority AS priority, 
      a.active AS active, 
      a.start_date AS start_date, 
      a.end_date AS end_date, 
      a.action_text AS action_text, 
      a.action_url AS action_url, 
      a.target_audience AS target_audience, 
      a.views_count AS views_count, 
      a.clicks_count AS clicks_count, 
      a.created_by AS created_by, 
      a.created_at AS created_at, 
      a.updated_at AS updated_at, 
      u.nombre AS created_by_name
   FROM (taskmanagementsystem.announcements  AS a 
      LEFT JOIN taskmanagementsystem.usuarios  AS u 
      ON (a.created_by = u.id))
   WHERE 
      a.active = 1 AND 
      (a.start_date IS NULL OR a.start_date <= getdate()) AND 
      (a.end_date IS NULL OR a.end_date >= getdate())
      ORDER BY a.priority DESC, a.created_at DESC
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[abm_pic](
	[id] [int] NOT NULL,
	[fecha] [date] NOT NULL,
	[tipo] [nvarchar](4) NOT NULL,
	[centro_region] [nvarchar](100) NULL,
	[centro] [nvarchar](100) NULL,
	[operacion] [nvarchar](100) NULL,
	[cant_usuarios] [int] NULL,
	[gestion] [nvarchar](100) NULL,
	[itracker] [nvarchar](max) NULL,
	[fuente] [nvarchar](255) NULL,
	[unique_key] [nvarchar](255) NULL,
	[created_at] [datetime] NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[abm_social](
	[id] [int] NOT NULL,
	[fecha] [date] NOT NULL,
	[tipo] [nvarchar](4) NOT NULL,
	[centro] [nvarchar](100) NULL,
	[operacion] [nvarchar](100) NULL,
	[cant_usuarios] [int] NULL,
	[gestion] [nvarchar](100) NULL,
	[itracker] [nvarchar](max) NULL,
	[fuente] [nvarchar](255) NULL,
	[unique_key] [nvarchar](255) NULL,
	[created_at] [datetime] NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[bitacora](
	[id] [int] NOT NULL,
	[tipo_evento] [nvarchar](100) NOT NULL,
	[descripcion] [nvarchar](max) NOT NULL,
	[id_usuario] [int] NULL,
	[nombre_usuario] [nvarchar](100) NULL,
	[id_proyecto] [int] NULL,
	[nombre_proyecto] [nvarchar](100) NULL,
	[id_tarea] [int] NULL,
	[nombre_tarea] [nvarchar](100) NULL,
	[id_subtarea] [int] NULL,
	[nombre_subtarea] [nvarchar](100) NULL,
	[fecha] [datetime] NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[codigos_facturacion](
	[id] [int] NOT NULL,
	[codigo] [nvarchar](20) NOT NULL,
	[descripcion] [nvarchar](255) NOT NULL,
	[notas] [nvarchar](max) NULL,
	[tipo] [nvarchar](14) NOT NULL,
	[dias_aplicables] [nvarchar](20) NOT NULL,
	[hora_inicio] [time](7) NULL,
	[hora_fin] [time](7) NULL,
	[factor_multiplicador] [decimal](4, 2) NULL,
	[fecha_vigencia_desde] [date] NOT NULL,
	[fecha_vigencia_hasta] [date] NULL,
	[estado] [nvarchar](8) NOT NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL,
	[tipo_calculo] [nvarchar](18) NOT NULL,
	[factor_adicional] [decimal](4, 2) NULL,
	[unidad_facturacion] [nvarchar](11) NOT NULL,
	[modalidad_convenio] [nvarchar](2) NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[comentarios](
	[id] [int] NOT NULL,
	[contenido] [nvarchar](max) NOT NULL,
	[fecha] [datetime] NOT NULL,
	[id_usuario] [int] NULL,
	[id_tarea] [int] NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[configuraciones_globales](
	[id] [int] IDENTITY(7,1) NOT NULL,
	[tipo_configuracion] [nvarchar](18) NOT NULL,
	[clave] [nvarchar](100) NOT NULL,
	[valor] [nvarchar](max) NOT NULL,
	[activo] [smallint] NOT NULL,
	[orden] [int] NULL,
	[descripcion] [nvarchar](max) NULL,
	[usuario_creacion] [int] NOT NULL,
	[fecha_creacion] [datetime] NOT NULL,
	[fecha_actualizacion] [datetime] NOT NULL,
 CONSTRAINT [PK_configuraciones_globales_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [configuraciones_globales$unique_tipo_clave] UNIQUE NONCLUSTERED 
(
	[tipo_configuracion] ASC,
	[clave] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[configuraciones_usuarios_override](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[usuario_id] [int] NOT NULL,
	[configuracion_global_id] [int] NOT NULL,
	[valor_override] [nvarchar](max) NOT NULL,
	[activo] [smallint] NOT NULL,
	[fecha_creacion] [datetime] NOT NULL,
	[fecha_actualizacion] [datetime] NOT NULL,
 CONSTRAINT [PK_configuraciones_usuarios_override_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [configuraciones_usuarios_override$unique_usuario_configuracion] UNIQUE NONCLUSTERED 
(
	[usuario_id] ASC,
	[configuracion_global_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[enlaces](
	[id] [int] IDENTITY(34,1) NOT NULL,
	[titulo] [nvarchar](255) NOT NULL,
	[url] [nvarchar](max) NOT NULL,
	[descripcion] [nvarchar](max) NULL,
	[fecha_creacion] [datetime] NULL,
	[creado_por] [nvarchar](255) NULL,
	[categoria_id] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[enlaces_categorias](
	[id] [int] NOT NULL,
	[nombre] [nvarchar](100) NOT NULL,
	[color] [nvarchar](50) NULL,
	[descripcion] [nvarchar](500) NULL
) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[enlaces_urls](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[enlace_id] [int] NOT NULL,
	[url] [nvarchar](max) NOT NULL,
	[titulo] [nvarchar](255) NULL,
	[orden] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[equipos_integrantes](
	[id] [int] NOT NULL,
	[equipo_id] [int] NOT NULL,
	[integrante_id] [int] NOT NULL,
	[fecha_asignacion] [datetime2](0) NULL,
	[es_responsable_principal] [smallint] NULL,
	[notas_asignacion] [nvarchar](max) NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[equipos_sistemas](
	[id] [int] NOT NULL,
	[equipo_id] [int] NOT NULL,
	[sistema_id] [int] NOT NULL,
	[es_responsable_principal] [smallint] NULL,
	[nivel_responsabilidad] [nvarchar](10) NULL,
	[fecha_asignacion] [datetime2](0) NULL,
	[notas] [nvarchar](max) NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[equipos_tecnicos](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](100) NOT NULL,
	[descripcion] [nvarchar](max) NULL,
	[telefono_guardia] [nvarchar](20) NULL,
	[email_grupo] [nvarchar](100) NULL,
	[color] [nvarchar](7) NULL,
	[estado] [nvarchar](8) NULL,
	[orden_visualizacion] [int] NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL,
 CONSTRAINT [PK_equipos_tecnicos_temp] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[eventos](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[title] [nvarchar](255) NOT NULL,
	[start] [datetime2](0) NOT NULL,
	[end] [datetime2](0) NOT NULL,
	[allDay] [smallint] NULL,
	[type] [nvarchar](8) NOT NULL,
	[color] [nvarchar](50) NULL,
	[description] [nvarchar](max) NULL,
	[location] [nvarchar](255) NULL,
	[completed] [smallint] NULL,
	[createdBy] [int] NULL,
	[createdAt] [datetime2](0) NULL,
	[updatedAt] [datetime2](0) NULL,
	[ssma$rowid] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_eventos_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UK_eventos_ssma$rowid] UNIQUE NONCLUSTERED 
(
	[ssma$rowid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[eventos_backup](
	[id] [int] NOT NULL,
	[title] [nvarchar](255) NOT NULL,
	[start] [datetime2](0) NOT NULL,
	[end] [datetime2](0) NOT NULL,
	[allDay] [smallint] NULL,
	[type] [nvarchar](8) NOT NULL,
	[color] [nvarchar](50) NULL,
	[description] [nvarchar](max) NULL,
	[location] [nvarchar](255) NULL,
	[completed] [smallint] NULL,
	[createdBy] [int] NULL,
	[createdAt] [datetime2](0) NULL,
	[updatedAt] [datetime2](0) NULL,
	[ssma$rowid] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_eventos_ssma$rowid] PRIMARY KEY NONCLUSTERED 
(
	[ssma$rowid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[flujos_escalamiento](
	[id] [int] NOT NULL,
	[sistema_id] [int] NOT NULL,
	[equipo_primario_id] [int] NOT NULL,
	[equipo_escalamiento_id] [int] NULL,
	[condicion_escalamiento] [nvarchar](max) NULL,
	[tiempo_escalamiento_minutos] [int] NULL,
	[activo] [smallint] NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[glosario](
	[id] [int] IDENTITY(264,1) NOT NULL,
	[termino] [nvarchar](255) NOT NULL,
	[definicion] [nvarchar](max) NOT NULL,
	[fecha_creacion] [datetime] NOT NULL,
	[creado_por] [nvarchar](100) NULL,
	[categoria_id] [int] NULL,
 CONSTRAINT [PK_glosario_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [glosario$unique_termino] UNIQUE NONCLUSTERED 
(
	[termino] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[glosario_categorias](
	[id] [int] NOT NULL,
	[nombre] [nvarchar](100) NOT NULL,
	[color] [nvarchar](50) NULL,
	[descripcion] [nvarchar](500) NULL
) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[guardias](
	[id] [int] IDENTITY(3035,1) NOT NULL,
	[fecha] [date] NOT NULL,
	[usuario] [nvarchar](255) NOT NULL,
	[notas] [nvarchar](max) NULL,
	[createdAt] [datetime] NOT NULL,
	[updatedAt] [datetime] NOT NULL,
 CONSTRAINT [PK_guardias_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [guardias$unique_fecha_usuario] UNIQUE NONCLUSTERED 
(
	[fecha] ASC,
	[usuario] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[historial_incidentes_contactos](
	[id] [int] NOT NULL,
	[sistema_id] [int] NOT NULL,
	[equipo_contactado_id] [int] NOT NULL,
	[integrante_contactado_id] [int] NULL,
	[fecha_incidente] [datetime2](0) NOT NULL,
	[medio_contacto] [nvarchar](10) NOT NULL,
	[tiempo_respuesta_minutos] [int] NULL,
	[resuelto] [smallint] NULL,
	[observaciones] [nvarchar](max) NULL,
	[created_by] [int] NULL,
	[created_at] [datetime] NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[hito_tareas](
	[id] [int] IDENTITY(2,1) NOT NULL,
	[id_hito] [int] NOT NULL,
	[nombre_tarea] [nvarchar](255) NOT NULL,
	[descripcion] [nvarchar](max) NULL,
	[estado] [nvarchar](50) NULL,
	[fecha_inicio] [date] NULL,
	[fecha_fin] [date] NULL,
	[id_tarea_origen] [int] NULL,
 CONSTRAINT [PK_hito_tareas_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[hito_usuarios](
	[id] [int] IDENTITY(5,1) NOT NULL,
	[id_hito] [int] NOT NULL,
	[id_usuario] [int] NOT NULL,
	[rol] [nvarchar](50) NULL,
	[fecha_asignacion] [datetime] NOT NULL,
 CONSTRAINT [PK_hito_usuarios_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [hito_usuarios$unique_hito_usuario] UNIQUE NONCLUSTERED 
(
	[id_hito] ASC,
	[id_usuario] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[hitos](
	[id] [int] IDENTITY(11,1) NOT NULL,
	[nombre] [nvarchar](255) NOT NULL,
	[fecha_inicio] [date] NULL,
	[fecha_fin] [date] NULL,
	[descripcion] [nvarchar](max) NULL,
	[impacto] [nvarchar](max) NULL,
	[id_proyecto_origen] [int] NULL,
	[fecha_creacion] [datetime] NOT NULL,
	[fecha_actualizacion] [datetime] NOT NULL,
 CONSTRAINT [PK_hitos_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[incidentes_codigos](
	[id] [int] NOT NULL,
	[id_incidente] [int] NOT NULL,
	[id_codigo] [int] NOT NULL,
	[minutos] [int] NOT NULL,
	[importe] [decimal](10, 2) NULL,
	[id_tarifa_calculo] [int] NULL,
	[observacion] [nvarchar](255) NULL,
	[created_at] [datetime] NOT NULL
) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[incidentes_estado_historico](
	[id] [int] NOT NULL,
	[id_incidente] [int] NOT NULL,
	[estado_anterior] [nvarchar](20) NULL,
	[estado_nuevo] [nvarchar](20) NOT NULL,
	[fecha_cambio] [datetime] NOT NULL,
	[id_usuario] [int] NULL,
	[observaciones] [nvarchar](max) NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[incidentes_guardia](
	[id] [int] IDENTITY(3,1) NOT NULL,
	[id_guardia] [int] NOT NULL,
	[inicio] [datetime2](0) NOT NULL,
	[fin] [datetime2](0) NOT NULL,
	[duracion_minutos]  AS (datediff(minute,[inicio],[fin])) PERSISTED,
	[descripcion] [nvarchar](max) NOT NULL,
	[estado] [nvarchar](10) NOT NULL,
	[id_usuario_registro] [int] NULL,
	[observaciones] [nvarchar](max) NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL,
 CONSTRAINT [PK_incidentes_guardia_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[integrantes](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](50) NOT NULL,
	[apellido] [nvarchar](50) NOT NULL,
	[rol] [nvarchar](100) NULL,
	[telefono_personal] [nvarchar](20) NULL,
	[email] [nvarchar](100) NULL,
	[whatsapp] [nvarchar](20) NULL,
	[disponibilidad] [nvarchar](10) NULL,
	[es_coordinador] [smallint] NULL,
	[notas] [nvarchar](max) NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL,
 CONSTRAINT [PK_integrantes_temp] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[ip_ranges_call_centers](
	[id] [int] IDENTITY(101,1) NOT NULL,
	[nombre_call_center] [nvarchar](100) NOT NULL,
	[ip_inicio] [nvarchar](50) NULL,
	[ip_fin] [nvarchar](50) NULL,
	[segmento_ip] [nvarchar](100) NULL,
	[segmento_numero] [int] NULL,
	[localidad] [nvarchar](100) NULL,
	[domicilio] [nvarchar](255) NULL,
	[tipo_contrato] [nvarchar](7) NULL,
	[descripcion] [nvarchar](max) NULL,
	[activo] [smallint] NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL,
 CONSTRAINT [PK_ip_ranges_call_centers_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[itracker_data](
	[id] [int] NOT NULL,
	[ticket_id] [bigint] NULL,
	[unido_a] [bigint] NULL,
	[t_0] [nvarchar](255) NULL,
	[t_1] [nvarchar](255) NULL,
	[t_2] [nvarchar](255) NULL,
	[t_3] [nvarchar](255) NULL,
	[fecha_apertura] [datetime2](0) NULL,
	[u_apertura] [nvarchar](50) NULL,
	[usuario_apertura] [nvarchar](100) NULL,
	[equipo_apertura] [nvarchar](100) NULL,
	[estado] [nvarchar](50) NULL,
	[abierto_a] [nvarchar](100) NULL,
	[fecha_cierre] [datetime2](0) NULL,
	[u_cierre] [nvarchar](50) NULL,
	[usuario_cierre] [nvarchar](100) NULL,
	[cierre_tipo] [nvarchar](max) NULL,
	[cierre_falla] [nvarchar](max) NULL,
	[cierre_novedad] [nvarchar](max) NULL,
	[cierre_comentario] [nvarchar](max) NULL,
	[archivo_origen] [nvarchar](255) NULL,
	[created_at] [datetime] NOT NULL,
	[apertura_descripcion_error] [nvarchar](max) NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[liquidaciones_detalle](
	[id] [int] NOT NULL,
	[id_liquidacion] [int] NOT NULL,
	[id_incidente] [int] NOT NULL,
	[id_guardia] [int] NOT NULL,
	[usuario] [nvarchar](255) NOT NULL,
	[fecha] [date] NOT NULL,
	[total_minutos] [int] NOT NULL,
	[total_importe] [decimal](10, 2) NULL,
	[created_at] [datetime] NOT NULL
) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[liquidaciones_guardia](
	[id] [int] NOT NULL,
	[periodo] [nvarchar](7) NOT NULL,
	[fecha_generacion] [datetime2](0) NOT NULL,
	[estado] [nvarchar](9) NOT NULL,
	[observaciones] [nvarchar](max) NULL,
	[id_usuario_generacion] [int] NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[logs](
	[id] [int] NOT NULL,
	[level] [nvarchar](7) NOT NULL,
	[action] [nvarchar](100) NOT NULL,
	[description] [nvarchar](max) NOT NULL,
	[user_id] [int] NULL,
	[ip_address] [nvarchar](45) NULL,
	[user_agent] [nvarchar](max) NULL,
	[created_at] [datetime] NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[metricas_sesiones_historicas](
	[id] [int] IDENTITY(13,1) NOT NULL,
	[fecha_corte] [date] NOT NULL,
	[total_sesiones] [int] NULL,
	[total_sesiones_activas] [int] NULL,
	[total_vm_pic] [int] NULL,
	[total_vm_pic_activas] [int] NULL,
	[total_home] [int] NULL,
	[total_call_center] [int] NULL,
	[total_home_activas] [int] NULL,
	[total_call_center_activas] [int] NULL,
	[porcentaje_home] [decimal](5, 2) NULL,
	[porcentaje_call_center] [decimal](5, 2) NULL,
	[usuarios_unicos] [int] NULL,
	[versiones_receiver] [nvarchar](max) NULL,
	[detalle_call_centers] [nvarchar](max) NULL,
	[archivo_origen] [nvarchar](255) NULL,
	[observaciones] [nvarchar](max) NULL,
	[created_at] [datetime] NOT NULL,
 CONSTRAINT [PK_metricas_sesiones_historicas_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [metricas_sesiones_historicas$unique_fecha_corte] UNIQUE NONCLUSTERED 
(
	[fecha_corte] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[notificaciones](
	[id] [int] NOT NULL,
	[id_usuario] [int] NOT NULL,
	[tipo] [nvarchar](50) NOT NULL,
	[titulo] [nvarchar](100) NOT NULL,
	[mensaje] [nvarchar](max) NOT NULL,
	[referencia_id] [int] NULL,
	[referencia_tipo] [nvarchar](50) NULL,
	[leida] [smallint] NULL,
	[fecha_creacion] [datetime] NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[permisos](
	[id] [int] IDENTITY(92,1) NOT NULL,
	[nombre] [nvarchar](100) NOT NULL,
	[descripcion] [nvarchar](255) NULL,
	[categoria] [nvarchar](50) NULL,
	[fecha_creacion] [datetime2](0) NULL,
 CONSTRAINT [PK_permisos_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[placas](
	[id] [int] IDENTITY(115,1) NOT NULL,
	[numero_placa] [nvarchar](50) NOT NULL,
	[titulo] [nvarchar](255) NOT NULL,
	[descripcion] [nvarchar](max) NULL,
	[impacto] [nvarchar](5) NULL,
	[clase] [nvarchar](13) NOT NULL,
	[sistema] [nvarchar](50) NOT NULL,
	[fecha_inicio] [datetime2](0) NOT NULL,
	[fecha_cierre] [datetime2](0) NULL,
	[duracion] [int] NULL,
	[cerrado_por] [nvarchar](100) NULL,
	[causa_resolutiva] [nvarchar](max) NULL,
	[fecha_creacion] [datetime] NOT NULL,
 CONSTRAINT [PK_placas_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[proyecto_usuarios](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[id_proyecto] [int] NOT NULL,
	[id_usuario] [int] NOT NULL,
	[rol] [nvarchar](11) NULL,
	[fecha_asignacion] [datetime2](0) NULL,
 CONSTRAINT [PK_proyecto_usuarios_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[proyectos](
	[id] [int] IDENTITY(28,1) NOT NULL,
	[nombre] [nvarchar](255) NOT NULL,
	[descripcion] [nvarchar](max) NULL,
	[fecha_inicio] [date] NULL,
	[fecha_fin] [date] NULL,
	[estado] [nvarchar](11) NULL,
	[prioridad] [nvarchar](5) NULL,
	[id_usuario_responsable] [int] NULL,
 CONSTRAINT [PK_proyectos_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[reportes](
	[id] [int] NOT NULL,
	[titulo] [nvarchar](255) NOT NULL,
	[contenido] [nvarchar](max) NOT NULL,
	[formato] [nvarchar](5) NULL,
	[fecha_creacion] [datetime] NOT NULL,
	[id_usuario] [int] NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[rol_permiso](
	[id] [int] IDENTITY(218,1) NOT NULL,
	[id_rol] [int] NOT NULL,
	[id_permiso] [int] NOT NULL,
 CONSTRAINT [PK_rol_permiso_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [rol_permiso$unique_rol_permiso] UNIQUE NONCLUSTERED 
(
	[id_rol] ASC,
	[id_permiso] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[roles](
	[id] [int] NOT NULL,
	[nombre] [nvarchar](50) NOT NULL,
	[descripcion] [nvarchar](255) NULL,
	[is_default] [smallint] NULL,
	[fecha_creacion] [datetime2](0) NULL,
	[estado] [varchar](20) NOT NULL
) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[sistemas_monitoreados](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](100) NOT NULL,
	[descripcion] [nvarchar](max) NULL,
	[criticidad] [nvarchar](5) NULL,
	[categoria] [nvarchar](50) NULL,
	[estado] [nvarchar](13) NULL,
	[url_monitoreo] [nvarchar](255) NULL,
	[documentacion_url] [nvarchar](255) NULL,
	[orden_visualizacion] [int] NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL,
 CONSTRAINT [PK_sistemas_monitoreados_temp] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[subtarea_usuarios](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[id_subtarea] [int] NOT NULL,
	[id_usuario] [int] NOT NULL,
	[fecha_asignacion] [datetime2](0) NULL,
 CONSTRAINT [PK_subtarea_usuarios_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[subtareas](
	[id] [int] IDENTITY(32,1) NOT NULL,
	[titulo] [nvarchar](255) NOT NULL,
	[estado] [nvarchar](11) NULL,
	[id_tarea] [int] NULL,
	[fecha_inicio] [date] NULL,
	[fecha_vencimiento] [date] NULL,
	[descripcion] [nvarchar](max) NULL,
	[prioridad] [nvarchar](max) NULL,
 CONSTRAINT [PK_subtareas_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[tabulaciones_data](
	[tarea_id] [nvarchar](64) NOT NULL,
	[nombre_tarea] [nvarchar](max) NULL,
	[deposito] [nvarchar](100) NULL,
	[progreso] [nvarchar](50) NULL,
	[prioridad] [nvarchar](50) NULL,
	[asignado_a] [nvarchar](max) NULL,
	[creado_por] [nvarchar](100) NULL,
	[fecha_creacion] [date] NULL,
	[fecha_inicio] [date] NULL,
	[fecha_vencimiento] [date] NULL,
	[es_periodica] [smallint] NULL,
	[con_retraso] [smallint] NULL,
	[fecha_finalizacion] [date] NULL,
	[completado_por] [nvarchar](100) NULL,
	[descripcion] [nvarchar](max) NULL,
	[archivo_origen] [nvarchar](255) NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[tarea_usuarios](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[id_tarea] [int] NOT NULL,
	[id_usuario] [int] NOT NULL,
	[fecha_asignacion] [datetime2](0) NULL,
 CONSTRAINT [PK_tarea_usuarios_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[tareas](
	[id] [int] IDENTITY(30,1) NOT NULL,
	[titulo] [nvarchar](255) NOT NULL,
	[descripcion] [nvarchar](max) NULL,
	[estado] [nvarchar](11) NULL,
	[prioridad] [nvarchar](5) NULL,
	[fecha_inicio] [date] NULL,
	[fecha_vencimiento] [date] NULL,
	[id_proyecto] [int] NULL,
	[id_usuario_asignado] [int] NULL,
	[dependencias] [nvarchar](max) NULL,
	[migration_complete] [smallint] NULL,
 CONSTRAINT [PK_tareas_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[tarifas](
	[id] [int] NOT NULL,
	[nombre] [nvarchar](255) NOT NULL,
	[valor_guardia_pasiva] [decimal](10, 2) NOT NULL,
	[valor_hora_activa] [decimal](10, 2) NOT NULL,
	[valor_adicional_nocturno_habil] [decimal](10, 2) NOT NULL,
	[valor_adicional_nocturno_no_habil] [decimal](10, 2) NOT NULL,
	[vigencia_desde] [date] NOT NULL,
	[vigencia_hasta] [date] NULL,
	[estado] [nvarchar](8) NULL,
	[observaciones] [nvarchar](max) NULL,
	[created_at] [datetime] NOT NULL,
	[updated_at] [datetime] NOT NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[usuario_rol](
	[id] [int] IDENTITY(42,1) NOT NULL,
	[id_usuario] [int] NOT NULL,
	[id_rol] [int] NOT NULL,
	[fecha_asignacion] [datetime] NOT NULL,
 CONSTRAINT [PK_usuario_rol_id] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [usuario_rol$unique_usuario_rol] UNIQUE NONCLUSTERED 
(
	[id_usuario] ASC,
	[id_rol] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[v_proximos_eventos](
	[id] [int] NULL,
	[title] [nvarchar](255) NULL,
	[start] [datetime2](0) NULL,
	[end] [datetime2](0) NULL,
	[allDay] [smallint] NULL,
	[type] [nvarchar](8) NULL,
	[color] [nvarchar](50) NULL,
	[description] [nvarchar](max) NULL,
	[location] [nvarchar](255) NULL,
	[completed] [smallint] NULL,
	[createdBy] [int] NULL,
	[createdAt] [datetime2](0) NULL,
	[updatedAt] [datetime2](0) NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [taskmanagementsystem].[v_tareas_pendientes](
	[id] [int] NULL,
	[title] [nvarchar](255) NULL,
	[start] [datetime2](0) NULL,
	[end] [datetime2](0) NULL,
	[allDay] [smallint] NULL,
	[type] [nvarchar](8) NULL,
	[color] [nvarchar](50) NULL,
	[description] [nvarchar](max) NULL,
	[location] [nvarchar](255) NULL,
	[completed] [smallint] NULL,
	[createdBy] [int] NULL,
	[createdAt] [datetime2](0) NULL,
	[updatedAt] [datetime2](0) NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [fk_usuario_creacion] ON [taskmanagementsystem].[configuraciones_globales]
(
	[usuario_creacion] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_activo] ON [taskmanagementsystem].[configuraciones_globales]
(
	[activo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_orden] ON [taskmanagementsystem].[configuraciones_globales]
(
	[orden] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
CREATE NONCLUSTERED INDEX [idx_tipo_activo] ON [taskmanagementsystem].[configuraciones_globales]
(
	[tipo_configuracion] ASC,
	[activo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
CREATE NONCLUSTERED INDEX [idx_tipo_configuracion] ON [taskmanagementsystem].[configuraciones_globales]
(
	[tipo_configuracion] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_usuario_fecha] ON [taskmanagementsystem].[configuraciones_globales]
(
	[usuario_creacion] ASC,
	[fecha_creacion] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_activo] ON [taskmanagementsystem].[configuraciones_usuarios_override]
(
	[activo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_configuracion_global_id] ON [taskmanagementsystem].[configuraciones_usuarios_override]
(
	[configuracion_global_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_usuario_id] ON [taskmanagementsystem].[configuraciones_usuarios_override]
(
	[usuario_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_categoria] ON [taskmanagementsystem].[glosario]
(
	[categoria_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_hito_tareas_hito] ON [taskmanagementsystem].[hito_tareas]
(
	[id_hito] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_hito_usuarios_hito] ON [taskmanagementsystem].[hito_usuarios]
(
	[id_hito] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_hito_usuarios_usuario] ON [taskmanagementsystem].[hito_usuarios]
(
	[id_usuario] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_hitos_fechas] ON [taskmanagementsystem].[hitos]
(
	[fecha_inicio] ASC,
	[fecha_fin] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_hitos_proyecto] ON [taskmanagementsystem].[hitos]
(
	[id_proyecto_origen] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
CREATE NONCLUSTERED INDEX [idx_ip_ranges] ON [taskmanagementsystem].[ip_ranges_call_centers]
(
	[ip_inicio] ASC,
	[ip_fin] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_fecha_corte] ON [taskmanagementsystem].[metricas_sesiones_historicas]
(
	[fecha_corte] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_permiso] ON [taskmanagementsystem].[rol_permiso]
(
	[id_permiso] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_rol] ON [taskmanagementsystem].[rol_permiso]
(
	[id_rol] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_es_vm_pic] ON [taskmanagementsystem].[sesiones_data]
(
	[es_vm_pic] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
CREATE NONCLUSTERED INDEX [idx_estado_sesion] ON [taskmanagementsystem].[sesiones_data]
(
	[estado_sesion] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_fecha_procesamiento] ON [taskmanagementsystem].[sesiones_data]
(
	[fecha_procesamiento] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
CREATE NONCLUSTERED INDEX [idx_ip_punto_final] ON [taskmanagementsystem].[sesiones_data]
(
	[ip_punto_final] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
CREATE NONCLUSTERED INDEX [idx_ubicacion_tipo] ON [taskmanagementsystem].[sesiones_data]
(
	[ubicacion_tipo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
CREATE NONCLUSTERED INDEX [idx_usuario_asociado] ON [taskmanagementsystem].[sesiones_data]
(
	[usuario_asociado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [IX_subtarea_usuarios_subtarea] ON [taskmanagementsystem].[subtarea_usuarios]
(
	[id_subtarea] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [IX_subtarea_usuarios_usuario] ON [taskmanagementsystem].[subtarea_usuarios]
(
	[id_usuario] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [IX_tarea_usuarios_tarea] ON [taskmanagementsystem].[tarea_usuarios]
(
	[id_tarea] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [IX_tarea_usuarios_usuario] ON [taskmanagementsystem].[tarea_usuarios]
(
	[id_usuario] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_rol] ON [taskmanagementsystem].[usuario_rol]
(
	[id_rol] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [idx_usuario] ON [taskmanagementsystem].[usuario_rol]
(
	[id_usuario] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER TABLE [taskmanagementsystem].[abm_pic] ADD  DEFAULT (NULL) FOR [centro_region]
GO
ALTER TABLE [taskmanagementsystem].[abm_pic] ADD  DEFAULT (NULL) FOR [centro]
GO
ALTER TABLE [taskmanagementsystem].[abm_pic] ADD  DEFAULT (NULL) FOR [operacion]
GO
ALTER TABLE [taskmanagementsystem].[abm_pic] ADD  DEFAULT (NULL) FOR [cant_usuarios]
GO
ALTER TABLE [taskmanagementsystem].[abm_pic] ADD  DEFAULT (NULL) FOR [gestion]
GO
ALTER TABLE [taskmanagementsystem].[abm_pic] ADD  DEFAULT (NULL) FOR [itracker]
GO
ALTER TABLE [taskmanagementsystem].[abm_pic] ADD  DEFAULT (NULL) FOR [fuente]
GO
ALTER TABLE [taskmanagementsystem].[abm_pic] ADD  DEFAULT (NULL) FOR [unique_key]
GO
ALTER TABLE [taskmanagementsystem].[abm_pic] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[abm_social] ADD  DEFAULT (NULL) FOR [centro]
GO
ALTER TABLE [taskmanagementsystem].[abm_social] ADD  DEFAULT (NULL) FOR [operacion]
GO
ALTER TABLE [taskmanagementsystem].[abm_social] ADD  DEFAULT (NULL) FOR [cant_usuarios]
GO
ALTER TABLE [taskmanagementsystem].[abm_social] ADD  DEFAULT (NULL) FOR [gestion]
GO
ALTER TABLE [taskmanagementsystem].[abm_social] ADD  DEFAULT (NULL) FOR [itracker]
GO
ALTER TABLE [taskmanagementsystem].[abm_social] ADD  DEFAULT (NULL) FOR [fuente]
GO
ALTER TABLE [taskmanagementsystem].[abm_social] ADD  DEFAULT (NULL) FOR [unique_key]
GO
ALTER TABLE [taskmanagementsystem].[abm_social] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[announcements] ADD  DEFAULT (N'info') FOR [type]
GO
ALTER TABLE [taskmanagementsystem].[announcements] ADD  DEFAULT (N'bi bi-info-circle') FOR [icon]
GO
ALTER TABLE [taskmanagementsystem].[announcements] ADD  DEFAULT ((0)) FOR [priority]
GO
ALTER TABLE [taskmanagementsystem].[announcements] ADD  DEFAULT ((1)) FOR [active]
GO
ALTER TABLE [taskmanagementsystem].[announcements] ADD  DEFAULT (NULL) FOR [start_date]
GO
ALTER TABLE [taskmanagementsystem].[announcements] ADD  DEFAULT (NULL) FOR [end_date]
GO
ALTER TABLE [taskmanagementsystem].[announcements] ADD  DEFAULT (NULL) FOR [action_text]
GO
ALTER TABLE [taskmanagementsystem].[announcements] ADD  DEFAULT (NULL) FOR [action_url]
GO
ALTER TABLE [taskmanagementsystem].[announcements] ADD  DEFAULT (N'all') FOR [target_audience]
GO
ALTER TABLE [taskmanagementsystem].[announcements] ADD  DEFAULT ((0)) FOR [views_count]
GO
ALTER TABLE [taskmanagementsystem].[announcements] ADD  DEFAULT ((0)) FOR [clicks_count]
GO
ALTER TABLE [taskmanagementsystem].[announcements] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[announcements] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [taskmanagementsystem].[bitacora] ADD  DEFAULT (NULL) FOR [id_usuario]
GO
ALTER TABLE [taskmanagementsystem].[bitacora] ADD  DEFAULT (NULL) FOR [nombre_usuario]
GO
ALTER TABLE [taskmanagementsystem].[bitacora] ADD  DEFAULT (NULL) FOR [id_proyecto]
GO
ALTER TABLE [taskmanagementsystem].[bitacora] ADD  DEFAULT (NULL) FOR [nombre_proyecto]
GO
ALTER TABLE [taskmanagementsystem].[bitacora] ADD  DEFAULT (NULL) FOR [id_tarea]
GO
ALTER TABLE [taskmanagementsystem].[bitacora] ADD  DEFAULT (NULL) FOR [nombre_tarea]
GO
ALTER TABLE [taskmanagementsystem].[bitacora] ADD  DEFAULT (NULL) FOR [id_subtarea]
GO
ALTER TABLE [taskmanagementsystem].[bitacora] ADD  DEFAULT (NULL) FOR [nombre_subtarea]
GO
ALTER TABLE [taskmanagementsystem].[bitacora] ADD  DEFAULT (getdate()) FOR [fecha]
GO
ALTER TABLE [taskmanagementsystem].[codigos_facturacion] ADD  DEFAULT (NULL) FOR [notas]
GO
ALTER TABLE [taskmanagementsystem].[codigos_facturacion] ADD  DEFAULT (N'L,M,X,J,V,S,D') FOR [dias_aplicables]
GO
ALTER TABLE [taskmanagementsystem].[codigos_facturacion] ADD  DEFAULT (NULL) FOR [hora_inicio]
GO
ALTER TABLE [taskmanagementsystem].[codigos_facturacion] ADD  DEFAULT (NULL) FOR [hora_fin]
GO
ALTER TABLE [taskmanagementsystem].[codigos_facturacion] ADD  DEFAULT ((1.00)) FOR [factor_multiplicador]
GO
ALTER TABLE [taskmanagementsystem].[codigos_facturacion] ADD  DEFAULT (NULL) FOR [fecha_vigencia_hasta]
GO
ALTER TABLE [taskmanagementsystem].[codigos_facturacion] ADD  DEFAULT (N'activo') FOR [estado]
GO
ALTER TABLE [taskmanagementsystem].[codigos_facturacion] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[codigos_facturacion] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [taskmanagementsystem].[codigos_facturacion] ADD  DEFAULT (N'hora_activa') FOR [tipo_calculo]
GO
ALTER TABLE [taskmanagementsystem].[codigos_facturacion] ADD  DEFAULT (NULL) FOR [factor_adicional]
GO
ALTER TABLE [taskmanagementsystem].[codigos_facturacion] ADD  DEFAULT (N'por_hora') FOR [unidad_facturacion]
GO
ALTER TABLE [taskmanagementsystem].[codigos_facturacion] ADD  DEFAULT (N'FC') FOR [modalidad_convenio]
GO
ALTER TABLE [taskmanagementsystem].[comentarios] ADD  DEFAULT (getdate()) FOR [fecha]
GO
ALTER TABLE [taskmanagementsystem].[comentarios] ADD  DEFAULT (NULL) FOR [id_usuario]
GO
ALTER TABLE [taskmanagementsystem].[comentarios] ADD  DEFAULT (NULL) FOR [id_tarea]
GO
ALTER TABLE [taskmanagementsystem].[configuraciones_globales] ADD  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [taskmanagementsystem].[configuraciones_globales] ADD  DEFAULT (NULL) FOR [orden]
GO
ALTER TABLE [taskmanagementsystem].[configuraciones_globales] ADD  DEFAULT (NULL) FOR [descripcion]
GO
ALTER TABLE [taskmanagementsystem].[configuraciones_globales] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [taskmanagementsystem].[configuraciones_globales] ADD  DEFAULT (getdate()) FOR [fecha_actualizacion]
GO
ALTER TABLE [taskmanagementsystem].[configuraciones_usuarios_override] ADD  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [taskmanagementsystem].[configuraciones_usuarios_override] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [taskmanagementsystem].[configuraciones_usuarios_override] ADD  DEFAULT (getdate()) FOR [fecha_actualizacion]
GO
ALTER TABLE [taskmanagementsystem].[enlaces] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [taskmanagementsystem].[enlaces_categorias] ADD  DEFAULT (N'#0d6efd') FOR [color]
GO
ALTER TABLE [taskmanagementsystem].[enlaces_urls] ADD  DEFAULT ((1)) FOR [orden]
GO
ALTER TABLE [taskmanagementsystem].[equipos_integrantes] ADD  DEFAULT (getdate()) FOR [fecha_asignacion]
GO
ALTER TABLE [taskmanagementsystem].[equipos_integrantes] ADD  DEFAULT ((0)) FOR [es_responsable_principal]
GO
ALTER TABLE [taskmanagementsystem].[equipos_integrantes] ADD  DEFAULT (NULL) FOR [notas_asignacion]
GO
ALTER TABLE [taskmanagementsystem].[equipos_sistemas] ADD  DEFAULT ((0)) FOR [es_responsable_principal]
GO
ALTER TABLE [taskmanagementsystem].[equipos_sistemas] ADD  DEFAULT (N'primario') FOR [nivel_responsabilidad]
GO
ALTER TABLE [taskmanagementsystem].[equipos_sistemas] ADD  DEFAULT (getdate()) FOR [fecha_asignacion]
GO
ALTER TABLE [taskmanagementsystem].[equipos_sistemas] ADD  DEFAULT (NULL) FOR [notas]
GO
ALTER TABLE [taskmanagementsystem].[eventos] ADD  DEFAULT ((0)) FOR [allDay]
GO
ALTER TABLE [taskmanagementsystem].[eventos] ADD  DEFAULT (N'event') FOR [type]
GO
ALTER TABLE [taskmanagementsystem].[eventos] ADD  DEFAULT (NULL) FOR [color]
GO
ALTER TABLE [taskmanagementsystem].[eventos] ADD  DEFAULT (NULL) FOR [description]
GO
ALTER TABLE [taskmanagementsystem].[eventos] ADD  DEFAULT (NULL) FOR [location]
GO
ALTER TABLE [taskmanagementsystem].[eventos] ADD  DEFAULT ((0)) FOR [completed]
GO
ALTER TABLE [taskmanagementsystem].[eventos] ADD  DEFAULT (NULL) FOR [createdBy]
GO
ALTER TABLE [taskmanagementsystem].[eventos] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [taskmanagementsystem].[eventos] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [taskmanagementsystem].[eventos] ADD  DEFAULT (newid()) FOR [ssma$rowid]
GO
ALTER TABLE [taskmanagementsystem].[eventos_backup] ADD  DEFAULT ((0)) FOR [allDay]
GO
ALTER TABLE [taskmanagementsystem].[eventos_backup] ADD  DEFAULT (N'event') FOR [type]
GO
ALTER TABLE [taskmanagementsystem].[eventos_backup] ADD  DEFAULT (NULL) FOR [color]
GO
ALTER TABLE [taskmanagementsystem].[eventos_backup] ADD  DEFAULT (NULL) FOR [description]
GO
ALTER TABLE [taskmanagementsystem].[eventos_backup] ADD  DEFAULT (NULL) FOR [location]
GO
ALTER TABLE [taskmanagementsystem].[eventos_backup] ADD  DEFAULT ((0)) FOR [completed]
GO
ALTER TABLE [taskmanagementsystem].[eventos_backup] ADD  DEFAULT (NULL) FOR [createdBy]
GO
ALTER TABLE [taskmanagementsystem].[eventos_backup] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [taskmanagementsystem].[eventos_backup] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [taskmanagementsystem].[eventos_backup] ADD  DEFAULT (newid()) FOR [ssma$rowid]
GO
ALTER TABLE [taskmanagementsystem].[flujos_escalamiento] ADD  DEFAULT (NULL) FOR [equipo_escalamiento_id]
GO
ALTER TABLE [taskmanagementsystem].[flujos_escalamiento] ADD  DEFAULT (NULL) FOR [condicion_escalamiento]
GO
ALTER TABLE [taskmanagementsystem].[flujos_escalamiento] ADD  DEFAULT ((30)) FOR [tiempo_escalamiento_minutos]
GO
ALTER TABLE [taskmanagementsystem].[flujos_escalamiento] ADD  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [taskmanagementsystem].[flujos_escalamiento] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[flujos_escalamiento] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [taskmanagementsystem].[glosario] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [taskmanagementsystem].[glosario] ADD  DEFAULT (NULL) FOR [creado_por]
GO
ALTER TABLE [taskmanagementsystem].[glosario] ADD  DEFAULT (NULL) FOR [categoria_id]
GO
ALTER TABLE [taskmanagementsystem].[glosario_categorias] ADD  DEFAULT (N'#0d6efd') FOR [color]
GO
ALTER TABLE [taskmanagementsystem].[guardias] ADD  DEFAULT (NULL) FOR [notas]
GO
ALTER TABLE [taskmanagementsystem].[guardias] ADD  DEFAULT (getdate()) FOR [createdAt]
GO
ALTER TABLE [taskmanagementsystem].[guardias] ADD  DEFAULT (getdate()) FOR [updatedAt]
GO
ALTER TABLE [taskmanagementsystem].[historial_incidentes_contactos] ADD  DEFAULT (NULL) FOR [integrante_contactado_id]
GO
ALTER TABLE [taskmanagementsystem].[historial_incidentes_contactos] ADD  DEFAULT (NULL) FOR [tiempo_respuesta_minutos]
GO
ALTER TABLE [taskmanagementsystem].[historial_incidentes_contactos] ADD  DEFAULT ((0)) FOR [resuelto]
GO
ALTER TABLE [taskmanagementsystem].[historial_incidentes_contactos] ADD  DEFAULT (NULL) FOR [observaciones]
GO
ALTER TABLE [taskmanagementsystem].[historial_incidentes_contactos] ADD  DEFAULT (NULL) FOR [created_by]
GO
ALTER TABLE [taskmanagementsystem].[historial_incidentes_contactos] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[hito_tareas] ADD  DEFAULT (NULL) FOR [descripcion]
GO
ALTER TABLE [taskmanagementsystem].[hito_tareas] ADD  DEFAULT (N'completada') FOR [estado]
GO
ALTER TABLE [taskmanagementsystem].[hito_tareas] ADD  DEFAULT (NULL) FOR [fecha_inicio]
GO
ALTER TABLE [taskmanagementsystem].[hito_tareas] ADD  DEFAULT (NULL) FOR [fecha_fin]
GO
ALTER TABLE [taskmanagementsystem].[hito_tareas] ADD  DEFAULT (NULL) FOR [id_tarea_origen]
GO
ALTER TABLE [taskmanagementsystem].[hito_usuarios] ADD  DEFAULT (N'colaborador') FOR [rol]
GO
ALTER TABLE [taskmanagementsystem].[hito_usuarios] ADD  DEFAULT (getdate()) FOR [fecha_asignacion]
GO
ALTER TABLE [taskmanagementsystem].[hitos] ADD  DEFAULT (NULL) FOR [fecha_inicio]
GO
ALTER TABLE [taskmanagementsystem].[hitos] ADD  DEFAULT (NULL) FOR [fecha_fin]
GO
ALTER TABLE [taskmanagementsystem].[hitos] ADD  DEFAULT (NULL) FOR [descripcion]
GO
ALTER TABLE [taskmanagementsystem].[hitos] ADD  DEFAULT (NULL) FOR [impacto]
GO
ALTER TABLE [taskmanagementsystem].[hitos] ADD  DEFAULT (NULL) FOR [id_proyecto_origen]
GO
ALTER TABLE [taskmanagementsystem].[hitos] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [taskmanagementsystem].[hitos] ADD  DEFAULT (getdate()) FOR [fecha_actualizacion]
GO
ALTER TABLE [taskmanagementsystem].[incidentes_codigos] ADD  DEFAULT (NULL) FOR [importe]
GO
ALTER TABLE [taskmanagementsystem].[incidentes_codigos] ADD  DEFAULT (NULL) FOR [id_tarifa_calculo]
GO
ALTER TABLE [taskmanagementsystem].[incidentes_codigos] ADD  DEFAULT (NULL) FOR [observacion]
GO
ALTER TABLE [taskmanagementsystem].[incidentes_codigos] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[incidentes_estado_historico] ADD  DEFAULT (NULL) FOR [estado_anterior]
GO
ALTER TABLE [taskmanagementsystem].[incidentes_estado_historico] ADD  DEFAULT (getdate()) FOR [fecha_cambio]
GO
ALTER TABLE [taskmanagementsystem].[incidentes_estado_historico] ADD  DEFAULT (NULL) FOR [id_usuario]
GO
ALTER TABLE [taskmanagementsystem].[incidentes_estado_historico] ADD  DEFAULT (NULL) FOR [observaciones]
GO
ALTER TABLE [taskmanagementsystem].[incidentes_guardia] ADD  DEFAULT (N'registrado') FOR [estado]
GO
ALTER TABLE [taskmanagementsystem].[incidentes_guardia] ADD  DEFAULT (NULL) FOR [id_usuario_registro]
GO
ALTER TABLE [taskmanagementsystem].[incidentes_guardia] ADD  DEFAULT (NULL) FOR [observaciones]
GO
ALTER TABLE [taskmanagementsystem].[incidentes_guardia] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[incidentes_guardia] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [taskmanagementsystem].[ip_ranges_call_centers] ADD  DEFAULT (N'') FOR [ip_inicio]
GO
ALTER TABLE [taskmanagementsystem].[ip_ranges_call_centers] ADD  DEFAULT (N'') FOR [ip_fin]
GO
ALTER TABLE [taskmanagementsystem].[ip_ranges_call_centers] ADD  DEFAULT (NULL) FOR [segmento_ip]
GO
ALTER TABLE [taskmanagementsystem].[ip_ranges_call_centers] ADD  DEFAULT ((1)) FOR [segmento_numero]
GO
ALTER TABLE [taskmanagementsystem].[ip_ranges_call_centers] ADD  DEFAULT (NULL) FOR [localidad]
GO
ALTER TABLE [taskmanagementsystem].[ip_ranges_call_centers] ADD  DEFAULT (NULL) FOR [domicilio]
GO
ALTER TABLE [taskmanagementsystem].[ip_ranges_call_centers] ADD  DEFAULT (NULL) FOR [tipo_contrato]
GO
ALTER TABLE [taskmanagementsystem].[ip_ranges_call_centers] ADD  DEFAULT (NULL) FOR [descripcion]
GO
ALTER TABLE [taskmanagementsystem].[ip_ranges_call_centers] ADD  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [taskmanagementsystem].[ip_ranges_call_centers] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[ip_ranges_call_centers] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [ticket_id]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [unido_a]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [t_0]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [t_1]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [t_2]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [t_3]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [fecha_apertura]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [u_apertura]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [usuario_apertura]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [equipo_apertura]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [estado]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [abierto_a]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [fecha_cierre]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [u_cierre]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [usuario_cierre]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [cierre_tipo]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [cierre_falla]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [cierre_novedad]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [cierre_comentario]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [archivo_origen]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[itracker_data] ADD  DEFAULT (NULL) FOR [apertura_descripcion_error]
GO
ALTER TABLE [taskmanagementsystem].[liquidaciones_detalle] ADD  DEFAULT (NULL) FOR [total_importe]
GO
ALTER TABLE [taskmanagementsystem].[liquidaciones_detalle] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[liquidaciones_guardia] ADD  DEFAULT (getdate()) FOR [fecha_generacion]
GO
ALTER TABLE [taskmanagementsystem].[liquidaciones_guardia] ADD  DEFAULT (N'pendiente') FOR [estado]
GO
ALTER TABLE [taskmanagementsystem].[liquidaciones_guardia] ADD  DEFAULT (NULL) FOR [observaciones]
GO
ALTER TABLE [taskmanagementsystem].[liquidaciones_guardia] ADD  DEFAULT (NULL) FOR [id_usuario_generacion]
GO
ALTER TABLE [taskmanagementsystem].[liquidaciones_guardia] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[liquidaciones_guardia] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [taskmanagementsystem].[logs] ADD  DEFAULT (N'info') FOR [level]
GO
ALTER TABLE [taskmanagementsystem].[logs] ADD  DEFAULT (NULL) FOR [user_id]
GO
ALTER TABLE [taskmanagementsystem].[logs] ADD  DEFAULT (NULL) FOR [ip_address]
GO
ALTER TABLE [taskmanagementsystem].[logs] ADD  DEFAULT (NULL) FOR [user_agent]
GO
ALTER TABLE [taskmanagementsystem].[logs] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT ((0)) FOR [total_sesiones]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT ((0)) FOR [total_sesiones_activas]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT ((0)) FOR [total_vm_pic]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT ((0)) FOR [total_vm_pic_activas]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT ((0)) FOR [total_home]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT ((0)) FOR [total_call_center]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT ((0)) FOR [total_home_activas]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT ((0)) FOR [total_call_center_activas]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT ((0.00)) FOR [porcentaje_home]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT ((0.00)) FOR [porcentaje_call_center]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT ((0)) FOR [usuarios_unicos]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT (NULL) FOR [versiones_receiver]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT (NULL) FOR [detalle_call_centers]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT (NULL) FOR [archivo_origen]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT (NULL) FOR [observaciones]
GO
ALTER TABLE [taskmanagementsystem].[metricas_sesiones_historicas] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[notificaciones] ADD  DEFAULT (NULL) FOR [referencia_id]
GO
ALTER TABLE [taskmanagementsystem].[notificaciones] ADD  DEFAULT (NULL) FOR [referencia_tipo]
GO
ALTER TABLE [taskmanagementsystem].[notificaciones] ADD  DEFAULT ((0)) FOR [leida]
GO
ALTER TABLE [taskmanagementsystem].[notificaciones] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [taskmanagementsystem].[permisos] ADD  DEFAULT (NULL) FOR [descripcion]
GO
ALTER TABLE [taskmanagementsystem].[permisos] ADD  DEFAULT (N'general') FOR [categoria]
GO
ALTER TABLE [taskmanagementsystem].[permisos] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [taskmanagementsystem].[placas] ADD  DEFAULT (NULL) FOR [descripcion]
GO
ALTER TABLE [taskmanagementsystem].[placas] ADD  DEFAULT (NULL) FOR [impacto]
GO
ALTER TABLE [taskmanagementsystem].[placas] ADD  DEFAULT (NULL) FOR [fecha_cierre]
GO
ALTER TABLE [taskmanagementsystem].[placas] ADD  DEFAULT (NULL) FOR [duracion]
GO
ALTER TABLE [taskmanagementsystem].[placas] ADD  DEFAULT (NULL) FOR [cerrado_por]
GO
ALTER TABLE [taskmanagementsystem].[placas] ADD  DEFAULT (NULL) FOR [causa_resolutiva]
GO
ALTER TABLE [taskmanagementsystem].[placas] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [taskmanagementsystem].[proyecto_usuarios] ADD  DEFAULT ('colaborador') FOR [rol]
GO
ALTER TABLE [taskmanagementsystem].[proyecto_usuarios] ADD  DEFAULT (getdate()) FOR [fecha_asignacion]
GO
ALTER TABLE [taskmanagementsystem].[proyectos] ADD  DEFAULT (NULL) FOR [descripcion]
GO
ALTER TABLE [taskmanagementsystem].[proyectos] ADD  DEFAULT (NULL) FOR [fecha_inicio]
GO
ALTER TABLE [taskmanagementsystem].[proyectos] ADD  DEFAULT (NULL) FOR [fecha_fin]
GO
ALTER TABLE [taskmanagementsystem].[proyectos] ADD  DEFAULT (N'pendiente') FOR [estado]
GO
ALTER TABLE [taskmanagementsystem].[proyectos] ADD  DEFAULT (N'media') FOR [prioridad]
GO
ALTER TABLE [taskmanagementsystem].[proyectos] ADD  DEFAULT (NULL) FOR [id_usuario_responsable]
GO
ALTER TABLE [taskmanagementsystem].[reportes] ADD  DEFAULT (NULL) FOR [formato]
GO
ALTER TABLE [taskmanagementsystem].[reportes] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [taskmanagementsystem].[reportes] ADD  DEFAULT (NULL) FOR [id_usuario]
GO
ALTER TABLE [taskmanagementsystem].[roles] ADD  DEFAULT (NULL) FOR [descripcion]
GO
ALTER TABLE [taskmanagementsystem].[roles] ADD  DEFAULT ((0)) FOR [is_default]
GO
ALTER TABLE [taskmanagementsystem].[roles] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [taskmanagementsystem].[roles] ADD  DEFAULT ('activo') FOR [estado]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [usuario_asociado]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [estado_sesion]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [hora_inicio_sesion]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [anonimo]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [nombre_punto_final]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [ip_punto_final]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [version_receiver]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [nombre_maquina]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [direccion_ip]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [tiempo_inactividad]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [campo_adicional]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT ((0)) FOR [es_vm_pic]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (N'desconocido') FOR [ubicacion_tipo]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [call_center_asignado]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [segmento_ip]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [localidad_call_center]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [domicilio_call_center]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [tipo_contrato]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [archivo_origen]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (NULL) FOR [unique_key]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[sesiones_data] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [taskmanagementsystem].[subtarea_usuarios] ADD  DEFAULT (getdate()) FOR [fecha_asignacion]
GO
ALTER TABLE [taskmanagementsystem].[subtareas] ADD  DEFAULT (N'pendiente') FOR [estado]
GO
ALTER TABLE [taskmanagementsystem].[subtareas] ADD  DEFAULT (NULL) FOR [id_tarea]
GO
ALTER TABLE [taskmanagementsystem].[subtareas] ADD  DEFAULT (NULL) FOR [fecha_inicio]
GO
ALTER TABLE [taskmanagementsystem].[subtareas] ADD  DEFAULT (NULL) FOR [fecha_vencimiento]
GO
ALTER TABLE [taskmanagementsystem].[subtareas] ADD  DEFAULT (NULL) FOR [descripcion]
GO
ALTER TABLE [taskmanagementsystem].[subtareas] ADD  DEFAULT (NULL) FOR [prioridad]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [nombre_tarea]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [deposito]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [progreso]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [prioridad]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [asignado_a]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [creado_por]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [fecha_creacion]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [fecha_inicio]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [fecha_vencimiento]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [es_periodica]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [con_retraso]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [fecha_finalizacion]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [completado_por]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [descripcion]
GO
ALTER TABLE [taskmanagementsystem].[tabulaciones_data] ADD  DEFAULT (NULL) FOR [archivo_origen]
GO
ALTER TABLE [taskmanagementsystem].[tarea_usuarios] ADD  DEFAULT (getdate()) FOR [fecha_asignacion]
GO
ALTER TABLE [taskmanagementsystem].[tareas] ADD  DEFAULT (NULL) FOR [descripcion]
GO
ALTER TABLE [taskmanagementsystem].[tareas] ADD  DEFAULT (N'pendiente') FOR [estado]
GO
ALTER TABLE [taskmanagementsystem].[tareas] ADD  DEFAULT (N'media') FOR [prioridad]
GO
ALTER TABLE [taskmanagementsystem].[tareas] ADD  DEFAULT (NULL) FOR [fecha_inicio]
GO
ALTER TABLE [taskmanagementsystem].[tareas] ADD  DEFAULT (NULL) FOR [fecha_vencimiento]
GO
ALTER TABLE [taskmanagementsystem].[tareas] ADD  DEFAULT (NULL) FOR [id_proyecto]
GO
ALTER TABLE [taskmanagementsystem].[tareas] ADD  DEFAULT (NULL) FOR [id_usuario_asignado]
GO
ALTER TABLE [taskmanagementsystem].[tareas] ADD  DEFAULT (NULL) FOR [dependencias]
GO
ALTER TABLE [taskmanagementsystem].[tareas] ADD  DEFAULT ((0)) FOR [migration_complete]
GO
ALTER TABLE [taskmanagementsystem].[tarifas] ADD  DEFAULT (NULL) FOR [vigencia_hasta]
GO
ALTER TABLE [taskmanagementsystem].[tarifas] ADD  DEFAULT (N'activo') FOR [estado]
GO
ALTER TABLE [taskmanagementsystem].[tarifas] ADD  DEFAULT (NULL) FOR [observaciones]
GO
ALTER TABLE [taskmanagementsystem].[tarifas] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [taskmanagementsystem].[tarifas] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [taskmanagementsystem].[usuario_rol] ADD  DEFAULT (getdate()) FOR [fecha_asignacion]
GO
ALTER TABLE [taskmanagementsystem].[usuarios] ADD  DEFAULT (N'activo') FOR [estado]
GO
ALTER TABLE [taskmanagementsystem].[usuarios] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [taskmanagementsystem].[usuarios] ADD  DEFAULT (NULL) FOR [imagen_perfil]
GO
ALTER TABLE [taskmanagementsystem].[usuarios] ADD  DEFAULT (NULL) FOR [ultimo_acceso]
GO
ALTER TABLE [taskmanagementsystem].[usuarios] ADD  DEFAULT (NULL) FOR [fecha_actualizacion]
GO
ALTER TABLE [taskmanagementsystem].[v_proximos_eventos] ADD  DEFAULT (NULL) FOR [id]
GO
ALTER TABLE [taskmanagementsystem].[v_proximos_eventos] ADD  DEFAULT (NULL) FOR [title]
GO
ALTER TABLE [taskmanagementsystem].[v_proximos_eventos] ADD  DEFAULT (NULL) FOR [start]
GO
ALTER TABLE [taskmanagementsystem].[v_proximos_eventos] ADD  DEFAULT (NULL) FOR [end]
GO
ALTER TABLE [taskmanagementsystem].[v_proximos_eventos] ADD  DEFAULT (NULL) FOR [allDay]
GO
ALTER TABLE [taskmanagementsystem].[v_proximos_eventos] ADD  DEFAULT (NULL) FOR [type]
GO
ALTER TABLE [taskmanagementsystem].[v_proximos_eventos] ADD  DEFAULT (NULL) FOR [color]
GO
ALTER TABLE [taskmanagementsystem].[v_proximos_eventos] ADD  DEFAULT (NULL) FOR [description]
GO
ALTER TABLE [taskmanagementsystem].[v_proximos_eventos] ADD  DEFAULT (NULL) FOR [location]
GO
ALTER TABLE [taskmanagementsystem].[v_proximos_eventos] ADD  DEFAULT (NULL) FOR [completed]
GO
ALTER TABLE [taskmanagementsystem].[v_proximos_eventos] ADD  DEFAULT (NULL) FOR [createdBy]
GO
ALTER TABLE [taskmanagementsystem].[v_proximos_eventos] ADD  DEFAULT (NULL) FOR [createdAt]
GO
ALTER TABLE [taskmanagementsystem].[v_proximos_eventos] ADD  DEFAULT (NULL) FOR [updatedAt]
GO
ALTER TABLE [taskmanagementsystem].[v_tareas_pendientes] ADD  DEFAULT (NULL) FOR [id]
GO
ALTER TABLE [taskmanagementsystem].[v_tareas_pendientes] ADD  DEFAULT (NULL) FOR [title]
GO
ALTER TABLE [taskmanagementsystem].[v_tareas_pendientes] ADD  DEFAULT (NULL) FOR [start]
GO
ALTER TABLE [taskmanagementsystem].[v_tareas_pendientes] ADD  DEFAULT (NULL) FOR [end]
GO
ALTER TABLE [taskmanagementsystem].[v_tareas_pendientes] ADD  DEFAULT (NULL) FOR [allDay]
GO
ALTER TABLE [taskmanagementsystem].[v_tareas_pendientes] ADD  DEFAULT (NULL) FOR [type]
GO
ALTER TABLE [taskmanagementsystem].[v_tareas_pendientes] ADD  DEFAULT (NULL) FOR [color]
GO
ALTER TABLE [taskmanagementsystem].[v_tareas_pendientes] ADD  DEFAULT (NULL) FOR [description]
GO
ALTER TABLE [taskmanagementsystem].[v_tareas_pendientes] ADD  DEFAULT (NULL) FOR [location]
GO
ALTER TABLE [taskmanagementsystem].[v_tareas_pendientes] ADD  DEFAULT (NULL) FOR [completed]
GO
ALTER TABLE [taskmanagementsystem].[v_tareas_pendientes] ADD  DEFAULT (NULL) FOR [createdBy]
GO
ALTER TABLE [taskmanagementsystem].[v_tareas_pendientes] ADD  DEFAULT (NULL) FOR [createdAt]
GO
ALTER TABLE [taskmanagementsystem].[v_tareas_pendientes] ADD  DEFAULT (NULL) FOR [updatedAt]
GO
ALTER TABLE [taskmanagementsystem].[roles]  WITH CHECK ADD CHECK  (([estado]='inactivo' OR [estado]='activo'))
GO
USE [master]
GO
ALTER DATABASE [taskmanagementsystem] SET  READ_WRITE 
GO
