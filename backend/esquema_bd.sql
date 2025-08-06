-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 06-08-2025 a las 05:55:09
-- Versión del servidor: 10.4.25-MariaDB
-- Versión de PHP: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `taskmanagementsystem`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `abm_pic`
--

CREATE TABLE `abm_pic` (
  `id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `tipo` enum('Alta','Baja') NOT NULL,
  `centro_region` varchar(100) DEFAULT NULL,
  `centro` varchar(100) DEFAULT NULL,
  `operacion` varchar(100) DEFAULT NULL,
  `cant_usuarios` int(11) DEFAULT NULL,
  `gestion` varchar(100) DEFAULT NULL,
  `itracker` text DEFAULT NULL,
  `fuente` varchar(255) DEFAULT NULL,
  `unique_key` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `abm_social`
--

CREATE TABLE `abm_social` (
  `id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `tipo` enum('Alta','Baja') NOT NULL,
  `centro` varchar(100) DEFAULT NULL,
  `operacion` varchar(100) DEFAULT NULL,
  `cant_usuarios` int(11) DEFAULT NULL,
  `gestion` varchar(100) DEFAULT NULL,
  `itracker` text DEFAULT NULL,
  `fuente` varchar(255) DEFAULT NULL,
  `unique_key` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL COMMENT 'Título del anuncio',
  `content` text NOT NULL COMMENT 'Contenido/descripción del anuncio',
  `type` enum('info','warning','success','danger') NOT NULL DEFAULT 'info' COMMENT 'Tipo de anuncio para estilos',
  `icon` varchar(100) DEFAULT 'bi bi-info-circle' COMMENT 'Icono Bootstrap a mostrar',
  `priority` int(11) DEFAULT 0 COMMENT 'Prioridad para ordenamiento (mayor = más prioritario)',
  `active` tinyint(1) DEFAULT 1 COMMENT 'Indica si el anuncio está activo',
  `start_date` datetime DEFAULT NULL COMMENT 'Fecha de inicio de vigencia (NULL = inmediato)',
  `end_date` datetime DEFAULT NULL COMMENT 'Fecha de fin de vigencia (NULL = sin fin)',
  `action_text` varchar(100) DEFAULT NULL COMMENT 'Texto del botón de acción',
  `action_url` varchar(255) DEFAULT NULL COMMENT 'URL o ruta del botón de acción',
  `target_audience` enum('all','admin','user','editor') DEFAULT 'all' COMMENT 'Audiencia objetivo',
  `views_count` int(11) DEFAULT 0 COMMENT 'Contador de visualizaciones',
  `clicks_count` int(11) DEFAULT 0 COMMENT 'Contador de clics en botones de acción',
  `created_by` int(11) NOT NULL COMMENT 'ID del usuario que creó el anuncio',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Sistema de gestión de anuncios dinámicos';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bitacora`
--

CREATE TABLE `bitacora` (
  `id` int(11) NOT NULL,
  `tipo_evento` varchar(100) NOT NULL,
  `descripcion` text NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `nombre_usuario` varchar(100) DEFAULT NULL,
  `id_proyecto` int(11) DEFAULT NULL,
  `nombre_proyecto` varchar(100) DEFAULT NULL,
  `id_tarea` int(11) DEFAULT NULL,
  `nombre_tarea` varchar(100) DEFAULT NULL,
  `id_subtarea` int(11) DEFAULT NULL,
  `nombre_subtarea` varchar(100) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `codigos_facturacion`
--

CREATE TABLE `codigos_facturacion` (
  `id` int(11) NOT NULL,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Código para sistema administrativo',
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Descripción del código',
  `notas` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Notas informativas sobre la aplicación del código',
  `tipo` enum('guardia_pasiva','guardia_activa','hora_nocturna','feriado','fin_semana','adicional') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de código',
  `dias_aplicables` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'L,M,X,J,V,S,D' COMMENT 'Días a los que aplica (L,M,X,J,V,S,D,F)',
  `hora_inicio` time DEFAULT NULL COMMENT 'Hora de inicio para aplicación',
  `hora_fin` time DEFAULT NULL COMMENT 'Hora de fin para aplicación',
  `factor_multiplicador` decimal(4,2) DEFAULT 1.00 COMMENT 'Factor para cálculos',
  `fecha_vigencia_desde` date NOT NULL COMMENT 'Fecha desde la que aplica',
  `fecha_vigencia_hasta` date DEFAULT NULL COMMENT 'Fecha hasta la que aplica (NULL = sin fin)',
  `estado` enum('activo','inactivo') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tipo_calculo` enum('guardia_pasiva','hora_activa','adicional_nocturno') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'hora_activa' COMMENT 'Tipo de cálculo que aplica este código',
  `factor_adicional` decimal(4,2) DEFAULT NULL COMMENT 'Factor adicional específico del código (ej: nocturno)',
  `unidad_facturacion` enum('por_periodo','por_hora','por_minuto') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'por_hora' COMMENT 'Unidad de facturación del código',
  `modalidad_convenio` enum('FC','DC') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FC' COMMENT 'FC = Fuera de Convenio, DC = Dentro de Convenio'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Códigos para facturación de guardias';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comentarios`
--

CREATE TABLE `comentarios` (
  `id` int(11) NOT NULL,
  `contenido` text NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `id_usuario` int(11) DEFAULT NULL,
  `id_tarea` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuraciones_globales`
--

CREATE TABLE `configuraciones_globales` (
  `id` int(11) NOT NULL,
  `tipo_configuracion` enum('sidebar','dashboard_sections','dashboard_kpis') NOT NULL COMMENT 'Tipo de configuración',
  `clave` varchar(100) NOT NULL COMMENT 'Identificador específico de la configuración',
  `valor` longtext NOT NULL COMMENT 'Valor de la configuración en formato JSON',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Si la configuración está activa',
  `orden` int(11) DEFAULT NULL COMMENT 'Orden para elementos que requieren secuencia',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción de qué hace esta configuración',
  `usuario_creacion` int(11) NOT NULL COMMENT 'ID del usuario que creó la configuración',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Configuraciones globales del sistema establecidas por SuperAdmin';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuraciones_usuarios_override`
--

CREATE TABLE `configuraciones_usuarios_override` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL COMMENT 'ID del usuario que tiene override',
  `configuracion_global_id` int(11) NOT NULL COMMENT 'ID de la configuración global que se sobrescribe',
  `valor_override` longtext NOT NULL COMMENT 'Valor override en formato JSON',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Si el override está activo',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Overrides de configuraciones globales por usuario específico';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `enlaces`
--

CREATE TABLE `enlaces` (
  `id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `url` varchar(512) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `creado_por` varchar(100) DEFAULT NULL,
  `categoria_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `enlaces_categorias`
--

CREATE TABLE `enlaces_categorias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `color` varchar(50) DEFAULT '#0d6efd'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `enlaces_urls`
--

CREATE TABLE `enlaces_urls` (
  `id` int(11) NOT NULL,
  `enlace_id` int(11) NOT NULL,
  `url` varchar(512) NOT NULL,
  `titulo` varchar(255) DEFAULT NULL,
  `orden` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipos_integrantes`
--

CREATE TABLE `equipos_integrantes` (
  `id` int(11) NOT NULL,
  `equipo_id` int(11) NOT NULL,
  `integrante_id` int(11) NOT NULL,
  `fecha_asignacion` datetime DEFAULT current_timestamp(),
  `es_responsable_principal` tinyint(1) DEFAULT 0 COMMENT 'Indica si es el responsable principal del equipo',
  `notas_asignacion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Relación entre equipos e integrantes';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipos_sistemas`
--

CREATE TABLE `equipos_sistemas` (
  `id` int(11) NOT NULL,
  `equipo_id` int(11) NOT NULL,
  `sistema_id` int(11) NOT NULL,
  `es_responsable_principal` tinyint(1) DEFAULT 0 COMMENT 'Indica si es el equipo principal responsable',
  `nivel_responsabilidad` enum('primario','secundario','soporte') DEFAULT 'primario',
  `fecha_asignacion` datetime DEFAULT current_timestamp(),
  `notas` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Relación entre equipos y sistemas que administran';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipos_tecnicos`
--

CREATE TABLE `equipos_tecnicos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL COMMENT 'Nombre del equipo (ej: GDA, DBAdmin)',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción del equipo y responsabilidades',
  `telefono_guardia` varchar(20) DEFAULT NULL COMMENT 'Teléfono principal de guardia',
  `email_grupo` varchar(100) DEFAULT NULL COMMENT 'Email del grupo/equipo',
  `color` varchar(7) DEFAULT '#007bff' COMMENT 'Color para identificación visual',
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `orden_visualizacion` int(11) DEFAULT 1 COMMENT 'Orden para mostrar en la interfaz',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Equipos técnicos de soporte';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos`
--

CREATE TABLE `eventos` (
  `id` int(11) NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Título del evento',
  `start` datetime NOT NULL COMMENT 'Fecha y hora de inicio',
  `end` datetime NOT NULL COMMENT 'Fecha y hora de fin',
  `allDay` tinyint(1) DEFAULT 0 COMMENT 'Indica si es un evento de todo el día',
  `type` enum('event','task','holiday','guardia','birthday','dayoff','gconect','vacation') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'event',
  `color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Color personalizado del evento',
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Descripción detallada del evento',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ubicación del evento',
  `completed` tinyint(1) DEFAULT 0 COMMENT 'Indica si la tarea está completada (solo para type=task)',
  `createdBy` int(11) DEFAULT NULL COMMENT 'ID del usuario que creó el evento',
  `createdAt` datetime DEFAULT current_timestamp() COMMENT 'Fecha de creación',
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Fecha de última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla para almacenar eventos, tareas y feriados del calendario';

--
-- Disparadores `eventos`
--
DELIMITER $$
CREATE TRIGGER `tr_eventos_update_timestamp` BEFORE UPDATE ON `eventos` FOR EACH ROW BEGIN
  SET NEW.updatedAt = CURRENT_TIMESTAMP;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_validate_event_dates` BEFORE INSERT ON `eventos` FOR EACH ROW BEGIN
  IF NEW.end < NEW.start THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La fecha de fin debe ser mayor o igual a la fecha de inicio';
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `flujos_escalamiento`
--

CREATE TABLE `flujos_escalamiento` (
  `id` int(11) NOT NULL,
  `sistema_id` int(11) NOT NULL,
  `equipo_primario_id` int(11) NOT NULL COMMENT 'Equipo que atiende inicialmente',
  `equipo_escalamiento_id` int(11) DEFAULT NULL COMMENT 'Equipo al que se escala si es necesario',
  `condicion_escalamiento` text DEFAULT NULL COMMENT 'Condiciones para escalar (ej: si no responde en 30min)',
  `tiempo_escalamiento_minutos` int(11) DEFAULT 30 COMMENT 'Tiempo antes de escalar',
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='DEPRECATED - Se usa flujo dinámico en getFlujoPorSistema()';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `glosario`
--

CREATE TABLE `glosario` (
  `id` int(11) NOT NULL,
  `termino` varchar(255) NOT NULL,
  `definicion` text NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `creado_por` varchar(100) DEFAULT NULL,
  `categoria_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `glosario_categorias`
--

CREATE TABLE `glosario_categorias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `color` varchar(50) DEFAULT '#0d6efd'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `guardias`
--

CREATE TABLE `guardias` (
  `id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `usuario` varchar(255) NOT NULL,
  `notas` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_incidentes_contactos`
--

CREATE TABLE `historial_incidentes_contactos` (
  `id` int(11) NOT NULL,
  `sistema_id` int(11) NOT NULL,
  `equipo_contactado_id` int(11) NOT NULL,
  `integrante_contactado_id` int(11) DEFAULT NULL,
  `fecha_incidente` datetime NOT NULL,
  `medio_contacto` enum('telefono','whatsapp','email','presencial') NOT NULL,
  `tiempo_respuesta_minutos` int(11) DEFAULT NULL,
  `resuelto` tinyint(1) DEFAULT 0,
  `observaciones` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL COMMENT 'Usuario que registró el contacto',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historial de contactos realizados durante incidentes';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `hitos`
--

CREATE TABLE `hitos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `impacto` text DEFAULT NULL,
  `id_proyecto_origen` int(11) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `hito_tareas`
--

CREATE TABLE `hito_tareas` (
  `id` int(11) NOT NULL,
  `id_hito` int(11) NOT NULL,
  `nombre_tarea` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` varchar(50) DEFAULT 'completada',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `id_tarea_origen` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `hito_usuarios`
--

CREATE TABLE `hito_usuarios` (
  `id` int(11) NOT NULL,
  `id_hito` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `rol` varchar(50) DEFAULT 'colaborador',
  `fecha_asignacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `incidentes_codigos`
--

CREATE TABLE `incidentes_codigos` (
  `id` int(11) NOT NULL,
  `id_incidente` int(11) NOT NULL,
  `id_codigo` int(11) NOT NULL,
  `minutos` int(11) NOT NULL COMMENT 'Minutos aplicables a este código',
  `importe` decimal(10,2) DEFAULT NULL COMMENT 'Importe calculado (opcional)',
  `id_tarifa_calculo` int(11) DEFAULT NULL COMMENT 'Tarifa utilizada para calcular este importe',
  `observacion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Relación entre incidentes y códigos aplicados';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `incidentes_estado_historico`
--

CREATE TABLE `incidentes_estado_historico` (
  `id` int(11) NOT NULL,
  `id_incidente` int(11) NOT NULL,
  `estado_anterior` varchar(20) DEFAULT NULL,
  `estado_nuevo` varchar(20) NOT NULL,
  `fecha_cambio` timestamp NOT NULL DEFAULT current_timestamp(),
  `id_usuario` int(11) DEFAULT NULL,
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `incidentes_guardia`
--

CREATE TABLE `incidentes_guardia` (
  `id` int(11) NOT NULL,
  `id_guardia` int(11) NOT NULL COMMENT 'ID de la guardia relacionada',
  `inicio` datetime NOT NULL COMMENT 'Fecha y hora de inicio del incidente',
  `fin` datetime NOT NULL COMMENT 'Fecha y hora de fin del incidente',
  `duracion_minutos` int(11) GENERATED ALWAYS AS (timestampdiff(MINUTE,`inicio`,`fin`)) STORED COMMENT 'Duración calculada en minutos',
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Descripción del incidente',
  `estado` enum('registrado','revisado','aprobado','rechazado','liquidado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'registrado',
  `id_usuario_registro` int(11) DEFAULT NULL COMMENT 'Usuario que registró el incidente',
  `observaciones` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Incidentes ocurridos durante guardias';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `integrantes`
--

CREATE TABLE `integrantes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `rol` varchar(100) DEFAULT NULL COMMENT 'Rol dentro del equipo (Coordinador, Developer, etc.)',
  `telefono_personal` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL COMMENT 'Número de WhatsApp (puede ser diferente al teléfono)',
  `disponibilidad` enum('disponible','ocupado','inactivo') DEFAULT 'disponible',
  `es_coordinador` tinyint(1) DEFAULT 0 COMMENT 'Indica si es coordinador del equipo',
  `notas` text DEFAULT NULL COMMENT 'Notas adicionales sobre el contacto',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Integrantes de los equipos técnicos';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ip_ranges_call_centers`
--

CREATE TABLE `ip_ranges_call_centers` (
  `id` int(11) NOT NULL,
  `nombre_call_center` varchar(100) NOT NULL,
  `ip_inicio` varchar(50) DEFAULT '',
  `ip_fin` varchar(50) DEFAULT '',
  `segmento_ip` varchar(100) DEFAULT NULL,
  `segmento_numero` int(11) DEFAULT 1,
  `localidad` varchar(100) DEFAULT NULL,
  `domicilio` varchar(255) DEFAULT NULL,
  `tipo_contrato` enum('PROPIO','TERCERO') DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Configuración de rangos IP para call centers';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `itracker_data`
--

CREATE TABLE `itracker_data` (
  `id` int(11) NOT NULL,
  `ticket_id` bigint(20) DEFAULT NULL,
  `unido_a` bigint(20) DEFAULT NULL,
  `t_0` varchar(255) DEFAULT NULL,
  `t_1` varchar(255) DEFAULT NULL,
  `t_2` varchar(255) DEFAULT NULL,
  `t_3` varchar(255) DEFAULT NULL,
  `fecha_apertura` datetime DEFAULT NULL,
  `u_apertura` varchar(50) DEFAULT NULL,
  `usuario_apertura` varchar(100) DEFAULT NULL,
  `equipo_apertura` varchar(100) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `abierto_a` varchar(100) DEFAULT NULL,
  `fecha_cierre` datetime DEFAULT NULL,
  `u_cierre` varchar(50) DEFAULT NULL,
  `usuario_cierre` varchar(100) DEFAULT NULL,
  `cierre_tipo` text DEFAULT NULL,
  `cierre_falla` text DEFAULT NULL,
  `cierre_novedad` text DEFAULT NULL,
  `cierre_comentario` text DEFAULT NULL,
  `archivo_origen` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `apertura_descripcion_error` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `liquidaciones_detalle`
--

CREATE TABLE `liquidaciones_detalle` (
  `id` int(11) NOT NULL,
  `id_liquidacion` int(11) NOT NULL,
  `id_incidente` int(11) NOT NULL,
  `id_guardia` int(11) NOT NULL,
  `usuario` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Usuario de guardia',
  `fecha` date NOT NULL,
  `total_minutos` int(11) NOT NULL,
  `total_importe` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detalle de liquidaciones de guardias';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `liquidaciones_guardia`
--

CREATE TABLE `liquidaciones_guardia` (
  `id` int(11) NOT NULL,
  `periodo` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Formato YYYY-MM',
  `fecha_generacion` datetime NOT NULL DEFAULT current_timestamp(),
  `estado` enum('pendiente','enviada','procesada','cerrada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `observaciones` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_usuario_generacion` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cabecera de liquidaciones de guardias';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logs`
--

CREATE TABLE `logs` (
  `id` int(11) NOT NULL,
  `level` enum('info','warning','error','debug') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Logs del sistema para diagnósticos';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `metricas_sesiones_historicas`
--

CREATE TABLE `metricas_sesiones_historicas` (
  `id` int(11) NOT NULL,
  `fecha_corte` date NOT NULL,
  `total_sesiones` int(11) DEFAULT 0,
  `total_sesiones_activas` int(11) DEFAULT 0,
  `total_vm_pic` int(11) DEFAULT 0,
  `total_vm_pic_activas` int(11) DEFAULT 0,
  `total_home` int(11) DEFAULT 0,
  `total_call_center` int(11) DEFAULT 0,
  `total_home_activas` int(11) DEFAULT 0,
  `total_call_center_activas` int(11) DEFAULT 0,
  `porcentaje_home` decimal(5,2) DEFAULT 0.00,
  `porcentaje_call_center` decimal(5,2) DEFAULT 0.00,
  `usuarios_unicos` int(11) DEFAULT 0,
  `versiones_receiver` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Distribución de versiones' CHECK (json_valid(`versiones_receiver`)),
  `detalle_call_centers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Detalle por call center' CHECK (json_valid(`detalle_call_centers`)),
  `archivo_origen` varchar(255) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Métricas históricas agregadas por fecha';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `mensaje` text NOT NULL,
  `referencia_id` int(11) DEFAULT NULL,
  `referencia_tipo` varchar(50) DEFAULT NULL,
  `leida` tinyint(1) DEFAULT 0,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permisos`
--

CREATE TABLE `permisos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `categoria` varchar(50) DEFAULT 'general',
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `placas`
--

CREATE TABLE `placas` (
  `id` int(11) NOT NULL,
  `numero_placa` varchar(50) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `impacto` enum('bajo','medio','alto') DEFAULT NULL,
  `clase` enum('Incidente','Comunicado','Mantenimiento') NOT NULL,
  `sistema` varchar(50) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_cierre` datetime DEFAULT NULL,
  `duracion` int(11) DEFAULT NULL,
  `cerrado_por` varchar(100) DEFAULT NULL,
  `causa_resolutiva` text DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proyectos`
--

CREATE TABLE `proyectos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `estado` enum('pendiente','en progreso','completado') DEFAULT 'pendiente',
  `prioridad` enum('baja','media','alta') DEFAULT 'media',
  `id_usuario_responsable` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proyecto_usuarios`
--

CREATE TABLE `proyecto_usuarios` (
  `id` int(11) NOT NULL,
  `id_proyecto` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `rol` enum('responsable','colaborador','observador') DEFAULT 'colaborador',
  `fecha_asignacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes`
--

CREATE TABLE `reportes` (
  `id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `contenido` text NOT NULL,
  `formato` enum('PDF','Excel') DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `id_usuario` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rol_permiso`
--

CREATE TABLE `rol_permiso` (
  `id` int(11) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `id_permiso` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sesiones_data`
--

CREATE TABLE `sesiones_data` (
  `id` int(11) NOT NULL,
  `usuario_asociado` varchar(255) DEFAULT NULL,
  `estado_sesion` varchar(50) DEFAULT NULL,
  `hora_inicio_sesion` datetime DEFAULT NULL,
  `anonimo` varchar(10) DEFAULT NULL,
  `nombre_punto_final` varchar(255) DEFAULT NULL,
  `ip_punto_final` varchar(15) DEFAULT NULL,
  `version_receiver` varchar(50) DEFAULT NULL,
  `nombre_maquina` varchar(255) DEFAULT NULL,
  `direccion_ip` varchar(15) DEFAULT NULL,
  `tiempo_inactividad` varchar(20) DEFAULT NULL,
  `campo_adicional` float DEFAULT NULL,
  `es_vm_pic` tinyint(1) DEFAULT 0 COMMENT 'Indica si la máquina sigue el patrón VMxxxPICxxxx',
  `ubicacion_tipo` enum('home','call_center','desconocido') DEFAULT 'desconocido',
  `call_center_asignado` varchar(100) DEFAULT NULL,
  `segmento_ip` varchar(50) DEFAULT NULL,
  `localidad_call_center` varchar(100) DEFAULT NULL,
  `domicilio_call_center` varchar(255) DEFAULT NULL,
  `tipo_contrato` enum('PROPIO','TERCERO') DEFAULT NULL,
  `fecha_procesamiento` date NOT NULL,
  `archivo_origen` varchar(255) DEFAULT NULL,
  `unique_key` varchar(255) DEFAULT NULL COMMENT 'Clave única para evitar duplicados',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Datos procesados de sesiones de usuarios';

--
-- Disparadores `sesiones_data`
--
DELIMITER $$
CREATE TRIGGER `tr_sesiones_data_unique_key` BEFORE INSERT ON `sesiones_data` FOR EACH ROW BEGIN
  IF NEW.unique_key IS NULL THEN
    SET NEW.unique_key = MD5(CONCAT(
      COALESCE(NEW.usuario_asociado, ''),
      COALESCE(NEW.nombre_maquina, ''),
      COALESCE(NEW.ip_punto_final, ''),
      COALESCE(NEW.hora_inicio_sesion, ''),
      COALESCE(NEW.direccion_ip, '')
    ));
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sistemas_monitoreados`
--

CREATE TABLE `sistemas_monitoreados` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL COMMENT 'Nombre del sistema/aplicación',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción del sistema',
  `criticidad` enum('alta','media','baja') DEFAULT 'media' COMMENT 'Nivel de criticidad del sistema',
  `categoria` varchar(50) DEFAULT NULL COMMENT 'Categoría del sistema (BD, Web, API, etc.)',
  `estado` enum('operativo','mantenimiento','inactivo') DEFAULT 'operativo',
  `url_monitoreo` varchar(255) DEFAULT NULL COMMENT 'URL para monitorear el sistema',
  `documentacion_url` varchar(255) DEFAULT NULL COMMENT 'URL de documentación',
  `orden_visualizacion` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Sistemas bajo supervisión técnica';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subtareas`
--

CREATE TABLE `subtareas` (
  `id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `estado` enum('pendiente','en progreso','completado') DEFAULT 'pendiente',
  `id_tarea` int(11) DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `prioridad` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subtarea_usuarios`
--

CREATE TABLE `subtarea_usuarios` (
  `id` int(11) NOT NULL,
  `id_subtarea` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `fecha_asignacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tabulaciones_data`
--

CREATE TABLE `tabulaciones_data` (
  `tarea_id` varchar(64) NOT NULL,
  `nombre_tarea` text DEFAULT NULL,
  `deposito` varchar(100) DEFAULT NULL,
  `progreso` varchar(50) DEFAULT NULL,
  `prioridad` varchar(50) DEFAULT NULL,
  `asignado_a` text DEFAULT NULL,
  `creado_por` varchar(100) DEFAULT NULL,
  `fecha_creacion` date DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `es_periodica` tinyint(1) DEFAULT NULL,
  `con_retraso` tinyint(1) DEFAULT NULL,
  `fecha_finalizacion` date DEFAULT NULL,
  `completado_por` varchar(100) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `archivo_origen` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tareas`
--

CREATE TABLE `tareas` (
  `id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` enum('pendiente','en progreso','completado') DEFAULT 'pendiente',
  `prioridad` enum('baja','media','alta') DEFAULT 'media',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `id_proyecto` int(11) DEFAULT NULL,
  `id_usuario_asignado` int(11) DEFAULT NULL,
  `dependencias` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'IDs de tareas de las que depende esta tarea' CHECK (json_valid(`dependencias`)),
  `migration_complete` tinyint(4) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tarea_usuarios`
--

CREATE TABLE `tarea_usuarios` (
  `id` int(11) NOT NULL,
  `id_tarea` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `fecha_asignacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tarifas`
--

CREATE TABLE `tarifas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `valor_guardia_pasiva` decimal(10,2) NOT NULL,
  `valor_hora_activa` decimal(10,2) NOT NULL,
  `valor_adicional_nocturno_habil` decimal(10,2) NOT NULL,
  `valor_adicional_nocturno_no_habil` decimal(10,2) NOT NULL,
  `vigencia_desde` date NOT NULL,
  `vigencia_hasta` date DEFAULT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `estado` enum('activo','inactivo','bloqueado') DEFAULT 'activo',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `imagen_perfil` varchar(255) DEFAULT NULL,
  `ultimo_acceso` datetime DEFAULT NULL,
  `fecha_actualizacion` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_rol`
--

CREATE TABLE `usuario_rol` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `fecha_asignacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_announcements_active`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_announcements_active` (
`id` int(11)
,`title` varchar(255)
,`content` text
,`type` enum('info','warning','success','danger')
,`icon` varchar(100)
,`priority` int(11)
,`active` tinyint(1)
,`start_date` datetime
,`end_date` datetime
,`action_text` varchar(100)
,`action_url` varchar(255)
,`target_audience` enum('all','admin','user','editor')
,`views_count` int(11)
,`clicks_count` int(11)
,`created_by` int(11)
,`created_at` timestamp
,`updated_at` timestamp
,`created_by_name` varchar(100)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_announcements_stats`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_announcements_stats` (
`total_announcements` bigint(21)
,`active_announcements` decimal(22,0)
,`inactive_announcements` decimal(22,0)
,`scheduled_announcements` decimal(22,0)
,`expired_announcements` decimal(22,0)
,`total_views` decimal(32,0)
,`total_clicks` decimal(32,0)
,`avg_views_per_announcement` decimal(35,2)
,`last_created_at` timestamp
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `v_proximos_eventos`
--

CREATE TABLE `v_proximos_eventos` (
  `id` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `start` datetime DEFAULT NULL,
  `end` datetime DEFAULT NULL,
  `allDay` tinyint(1) DEFAULT NULL,
  `type` enum('event','task','holiday','guardia','birthday','dayoff','gconect','vacation') DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `completed` tinyint(1) DEFAULT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_sesiones_stats_actual`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_sesiones_stats_actual` (
`total_sesiones` bigint(21)
,`sesiones_activas` bigint(21)
,`total_vm_pic` bigint(21)
,`vm_pic_activas` bigint(21)
,`total_home` bigint(21)
,`total_call_center` bigint(21)
,`home_activas` bigint(21)
,`call_center_activas` bigint(21)
,`porcentaje_home` decimal(26,2)
,`porcentaje_call_center` decimal(26,2)
,`usuarios_unicos` bigint(21)
,`ultima_actualizacion` date
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `v_tareas_pendientes`
--

CREATE TABLE `v_tareas_pendientes` (
  `id` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `start` datetime DEFAULT NULL,
  `end` datetime DEFAULT NULL,
  `allDay` tinyint(1) DEFAULT NULL,
  `type` enum('event','task','holiday','guardia','birthday','dayoff','gconect','vacation') DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `completed` tinyint(1) DEFAULT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_announcements_active`
--
DROP TABLE IF EXISTS `v_announcements_active`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_announcements_active`  AS SELECT `a`.`id` AS `id`, `a`.`title` AS `title`, `a`.`content` AS `content`, `a`.`type` AS `type`, `a`.`icon` AS `icon`, `a`.`priority` AS `priority`, `a`.`active` AS `active`, `a`.`start_date` AS `start_date`, `a`.`end_date` AS `end_date`, `a`.`action_text` AS `action_text`, `a`.`action_url` AS `action_url`, `a`.`target_audience` AS `target_audience`, `a`.`views_count` AS `views_count`, `a`.`clicks_count` AS `clicks_count`, `a`.`created_by` AS `created_by`, `a`.`created_at` AS `created_at`, `a`.`updated_at` AS `updated_at`, `u`.`nombre` AS `created_by_name` FROM (`announcements` `a` left join `usuarios` `u` on(`a`.`created_by` = `u`.`id`)) WHERE `a`.`active` = 1 AND (`a`.`start_date` is null OR `a`.`start_date` <= current_timestamp()) AND (`a`.`end_date` is null OR `a`.`end_date` >= current_timestamp()) ORDER BY `a`.`priority` DESC, `a`.`created_at` AS `DESCdesc` ASC  ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_announcements_stats`
--
DROP TABLE IF EXISTS `v_announcements_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_announcements_stats`  AS SELECT count(0) AS `total_announcements`, sum(case when `announcements`.`active` = 1 and (`announcements`.`start_date` is null or `announcements`.`start_date` <= current_timestamp()) and (`announcements`.`end_date` is null or `announcements`.`end_date` >= current_timestamp()) then 1 else 0 end) AS `active_announcements`, sum(case when `announcements`.`active` = 0 then 1 else 0 end) AS `inactive_announcements`, sum(case when `announcements`.`active` = 1 and `announcements`.`start_date` is not null and `announcements`.`start_date` > current_timestamp() then 1 else 0 end) AS `scheduled_announcements`, sum(case when `announcements`.`active` = 1 and `announcements`.`end_date` is not null and `announcements`.`end_date` < current_timestamp() then 1 else 0 end) AS `expired_announcements`, coalesce(sum(`announcements`.`views_count`),0) AS `total_views`, coalesce(sum(`announcements`.`clicks_count`),0) AS `total_clicks`, CASE WHEN count(0) > 0 THEN round(coalesce(sum(`announcements`.`views_count`),0) / count(0),2) ELSE 0 END AS `avg_views_per_announcement`, max(`announcements`.`created_at`) AS `last_created_at` FROM `announcements``announcements`  ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_sesiones_stats_actual`
--
DROP TABLE IF EXISTS `v_sesiones_stats_actual`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_sesiones_stats_actual`  AS SELECT count(0) AS `total_sesiones`, count(case when `sesiones_data`.`estado_sesion` = 'Active' then 1 end) AS `sesiones_activas`, count(0) AS `total_vm_pic`, count(case when `sesiones_data`.`estado_sesion` = 'Active' then 1 end) AS `vm_pic_activas`, count(case when `sesiones_data`.`ubicacion_tipo` = 'home' then 1 end) AS `total_home`, count(case when `sesiones_data`.`ubicacion_tipo` = 'call_center' then 1 end) AS `total_call_center`, count(case when `sesiones_data`.`ubicacion_tipo` = 'home' and `sesiones_data`.`estado_sesion` = 'Active' then 1 end) AS `home_activas`, count(case when `sesiones_data`.`ubicacion_tipo` = 'call_center' and `sesiones_data`.`estado_sesion` = 'Active' then 1 end) AS `call_center_activas`, round(count(case when `sesiones_data`.`ubicacion_tipo` = 'home' then 1 end) * 100.0 / count(0),2) AS `porcentaje_home`, round(count(case when `sesiones_data`.`ubicacion_tipo` = 'call_center' then 1 end) * 100.0 / count(0),2) AS `porcentaje_call_center`, count(distinct case when `sesiones_data`.`usuario_asociado` is not null and `sesiones_data`.`usuario_asociado` <> '' then `sesiones_data`.`usuario_asociado` end) AS `usuarios_unicos`, cast(max(`sesiones_data`.`created_at`) as date) AS `ultima_actualizacion` FROM `sesiones_data` WHERE `sesiones_data`.`es_vm_pic` = 11  ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `configuraciones_globales`
--
ALTER TABLE `configuraciones_globales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_tipo_clave` (`tipo_configuracion`,`clave`),
  ADD KEY `idx_tipo_configuracion` (`tipo_configuracion`),
  ADD KEY `idx_activo` (`activo`),
  ADD KEY `idx_orden` (`orden`),
  ADD KEY `fk_usuario_creacion` (`usuario_creacion`),
  ADD KEY `idx_tipo_activo` (`tipo_configuracion`,`activo`),
  ADD KEY `idx_usuario_fecha` (`usuario_creacion`,`fecha_creacion`);

--
-- Indices de la tabla `configuraciones_usuarios_override`
--
ALTER TABLE `configuraciones_usuarios_override`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_usuario_configuracion` (`usuario_id`,`configuracion_global_id`),
  ADD KEY `idx_usuario_id` (`usuario_id`),
  ADD KEY `idx_configuracion_global_id` (`configuracion_global_id`),
  ADD KEY `idx_activo` (`activo`);

--
-- Indices de la tabla `glosario`
--
ALTER TABLE `glosario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_termino` (`termino`),
  ADD KEY `idx_categoria` (`categoria_id`);

--
-- Indices de la tabla `guardias`
--
ALTER TABLE `guardias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_fecha_usuario` (`fecha`,`usuario`);

--
-- Indices de la tabla `hitos`
--
ALTER TABLE `hitos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hitos_proyecto` (`id_proyecto_origen`),
  ADD KEY `idx_hitos_fechas` (`fecha_inicio`,`fecha_fin`);

--
-- Indices de la tabla `hito_tareas`
--
ALTER TABLE `hito_tareas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hito_tareas_hito` (`id_hito`);

--
-- Indices de la tabla `hito_usuarios`
--
ALTER TABLE `hito_usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_hito_usuario` (`id_hito`,`id_usuario`),
  ADD KEY `idx_hito_usuarios_hito` (`id_hito`),
  ADD KEY `idx_hito_usuarios_usuario` (`id_usuario`);

--
-- Indices de la tabla `incidentes_guardia`
--
ALTER TABLE `incidentes_guardia`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `ip_ranges_call_centers`
--
ALTER TABLE `ip_ranges_call_centers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ip_ranges` (`ip_inicio`,`ip_fin`);

--
-- Indices de la tabla `metricas_sesiones_historicas`
--
ALTER TABLE `metricas_sesiones_historicas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_fecha_corte` (`fecha_corte`),
  ADD KEY `idx_fecha_corte` (`fecha_corte`);

--
-- Indices de la tabla `permisos`
--
ALTER TABLE `permisos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `placas`
--
ALTER TABLE `placas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `proyectos`
--
ALTER TABLE `proyectos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `sesiones_data`
--
ALTER TABLE `sesiones_data`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_session_key` (`unique_key`),
  ADD KEY `idx_fecha_procesamiento` (`fecha_procesamiento`),
  ADD KEY `idx_estado_sesion` (`estado_sesion`),
  ADD KEY `idx_es_vm_pic` (`es_vm_pic`),
  ADD KEY `idx_ubicacion_tipo` (`ubicacion_tipo`),
  ADD KEY `idx_ip_punto_final` (`ip_punto_final`),
  ADD KEY `idx_usuario_asociado` (`usuario_asociado`);

--
-- Indices de la tabla `subtareas`
--
ALTER TABLE `subtareas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `tareas`
--
ALTER TABLE `tareas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuario_rol`
--
ALTER TABLE `usuario_rol`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_usuario_rol` (`id_usuario`,`id_rol`),
  ADD KEY `idx_usuario` (`id_usuario`),
  ADD KEY `idx_rol` (`id_rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `configuraciones_globales`
--
ALTER TABLE `configuraciones_globales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `configuraciones_usuarios_override`
--
ALTER TABLE `configuraciones_usuarios_override`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `glosario`
--
ALTER TABLE `glosario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `guardias`
--
ALTER TABLE `guardias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `hitos`
--
ALTER TABLE `hitos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `hito_tareas`
--
ALTER TABLE `hito_tareas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `hito_usuarios`
--
ALTER TABLE `hito_usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `incidentes_guardia`
--
ALTER TABLE `incidentes_guardia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ip_ranges_call_centers`
--
ALTER TABLE `ip_ranges_call_centers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `metricas_sesiones_historicas`
--
ALTER TABLE `metricas_sesiones_historicas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `permisos`
--
ALTER TABLE `permisos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `placas`
--
ALTER TABLE `placas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proyectos`
--
ALTER TABLE `proyectos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `sesiones_data`
--
ALTER TABLE `sesiones_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `subtareas`
--
ALTER TABLE `subtareas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tareas`
--
ALTER TABLE `tareas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuario_rol`
--
ALTER TABLE `usuario_rol`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `hito_usuarios`
--
ALTER TABLE `hito_usuarios`
  ADD CONSTRAINT `fk_hito_usuarios_hito` FOREIGN KEY (`id_hito`) REFERENCES `hitos` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
