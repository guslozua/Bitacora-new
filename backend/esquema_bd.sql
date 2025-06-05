-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 05-06-2025 a las 21:04:54
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
  `id_rol` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_proximos_eventos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_proximos_eventos` (
`id` int(11)
,`title` varchar(255)
,`start` datetime
,`end` datetime
,`allDay` tinyint(1)
,`type` enum('event','task','holiday','guardia','birthday','dayoff','gconect','vacation')
,`color` varchar(50)
,`description` text
,`location` varchar(255)
,`completed` tinyint(1)
,`createdBy` int(11)
,`createdAt` datetime
,`updatedAt` datetime
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_tareas_pendientes`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_tareas_pendientes` (
`id` int(11)
,`title` varchar(255)
,`start` datetime
,`end` datetime
,`allDay` tinyint(1)
,`type` enum('event','task','holiday','guardia','birthday','dayoff','gconect','vacation')
,`color` varchar(50)
,`description` text
,`location` varchar(255)
,`completed` tinyint(1)
,`createdBy` int(11)
,`createdAt` datetime
,`updatedAt` datetime
);

-- --------------------------------------------------------

--
-- Estructura para la vista `v_proximos_eventos`
--
DROP TABLE IF EXISTS `v_proximos_eventos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_proximos_eventos`  AS SELECT `eventos`.`id` AS `id`, `eventos`.`title` AS `title`, `eventos`.`start` AS `start`, `eventos`.`end` AS `end`, `eventos`.`allDay` AS `allDay`, `eventos`.`type` AS `type`, `eventos`.`color` AS `color`, `eventos`.`description` AS `description`, `eventos`.`location` AS `location`, `eventos`.`completed` AS `completed`, `eventos`.`createdBy` AS `createdBy`, `eventos`.`createdAt` AS `createdAt`, `eventos`.`updatedAt` AS `updatedAt` FROM `eventos` WHERE `eventos`.`start` >= curdate() AND `eventos`.`start` <= curdate() + interval 7 day ORDER BY `eventos`.`start` ASC  ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_tareas_pendientes`
--
DROP TABLE IF EXISTS `v_tareas_pendientes`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_tareas_pendientes`  AS SELECT `eventos`.`id` AS `id`, `eventos`.`title` AS `title`, `eventos`.`start` AS `start`, `eventos`.`end` AS `end`, `eventos`.`allDay` AS `allDay`, `eventos`.`type` AS `type`, `eventos`.`color` AS `color`, `eventos`.`description` AS `description`, `eventos`.`location` AS `location`, `eventos`.`completed` AS `completed`, `eventos`.`createdBy` AS `createdBy`, `eventos`.`createdAt` AS `createdAt`, `eventos`.`updatedAt` AS `updatedAt` FROM `eventos` WHERE `eventos`.`type` = 'task' AND `eventos`.`completed` = 0 ORDER BY `eventos`.`start` ASC  ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `abm_pic`
--
ALTER TABLE `abm_pic`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_key` (`unique_key`);

--
-- Indices de la tabla `abm_social`
--
ALTER TABLE `abm_social`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_key` (`unique_key`);

--
-- Indices de la tabla `bitacora`
--
ALTER TABLE `bitacora`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `codigos_facturacion`
--
ALTER TABLE `codigos_facturacion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_codigo` (`codigo`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_estado_vigencia` (`estado`,`fecha_vigencia_desde`,`fecha_vigencia_hasta`),
  ADD KEY `idx_modalidad_convenio` (`modalidad_convenio`,`estado`),
  ADD KEY `idx_modalidad_convenio_estado` (`modalidad_convenio`,`estado`),
  ADD KEY `idx_modalidad_tipo_estado` (`modalidad_convenio`,`tipo`,`estado`);

--
-- Indices de la tabla `comentarios`
--
ALTER TABLE `comentarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_tarea` (`id_tarea`);

--
-- Indices de la tabla `enlaces`
--
ALTER TABLE `enlaces`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_titulo` (`titulo`),
  ADD KEY `idx_categoria_id` (`categoria_id`);

--
-- Indices de la tabla `enlaces_categorias`
--
ALTER TABLE `enlaces_categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `enlaces_urls`
--
ALTER TABLE `enlaces_urls`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_enlace_id` (`enlace_id`);

--
-- Indices de la tabla `equipos_integrantes`
--
ALTER TABLE `equipos_integrantes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_equipo_integrante` (`equipo_id`,`integrante_id`),
  ADD KEY `idx_equipo_id` (`equipo_id`),
  ADD KEY `idx_integrante_id` (`integrante_id`),
  ADD KEY `idx_responsable` (`es_responsable_principal`),
  ADD KEY `idx_integrantes_equipo_disponibilidad` (`equipo_id`,`integrante_id`) COMMENT 'Búsqueda rápida de integrantes por equipo';

--
-- Indices de la tabla `equipos_sistemas`
--
ALTER TABLE `equipos_sistemas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_equipo_sistema` (`equipo_id`,`sistema_id`),
  ADD KEY `idx_equipo_id` (`equipo_id`),
  ADD KEY `idx_sistema_id` (`sistema_id`),
  ADD KEY `idx_responsable` (`es_responsable_principal`),
  ADD KEY `idx_sistemas_equipo_responsabilidad` (`sistema_id`,`es_responsable_principal`) COMMENT 'Búsqueda rápida de equipos responsables por sistema';

--
-- Indices de la tabla `equipos_tecnicos`
--
ALTER TABLE `equipos_tecnicos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_nombre_equipo` (`nombre`),
  ADD KEY `idx_estado` (`estado`),
  ADD KEY `idx_orden` (`orden_visualizacion`);

--
-- Indices de la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_date_range` (`start`,`end`),
  ADD KEY `idx_createdBy` (`createdBy`),
  ADD KEY `idx_eventos_completed` (`completed`),
  ADD KEY `idx_eventos_upcoming` (`start`);
ALTER TABLE `eventos` ADD FULLTEXT KEY `idx_search` (`title`,`description`,`location`);

--
-- Indices de la tabla `flujos_escalamiento`
--
ALTER TABLE `flujos_escalamiento`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sistema_id` (`sistema_id`),
  ADD KEY `idx_equipo_primario` (`equipo_primario_id`),
  ADD KEY `idx_equipo_escalamiento` (`equipo_escalamiento_id`),
  ADD KEY `idx_escalamiento_activo` (`sistema_id`,`activo`) COMMENT 'Búsqueda rápida de flujos de escalamiento activos';

--
-- Indices de la tabla `glosario`
--
ALTER TABLE `glosario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_termino` (`termino`),
  ADD KEY `idx_categoria_id` (`categoria_id`);

--
-- Indices de la tabla `glosario_categorias`
--
ALTER TABLE `glosario_categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `guardias`
--
ALTER TABLE `guardias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_fecha_usuario` (`fecha`,`usuario`),
  ADD KEY `idx_fecha` (`fecha`);

--
-- Indices de la tabla `historial_incidentes_contactos`
--
ALTER TABLE `historial_incidentes_contactos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sistema_fecha` (`sistema_id`,`fecha_incidente`),
  ADD KEY `idx_equipo_contactado` (`equipo_contactado_id`),
  ADD KEY `idx_integrante_contactado` (`integrante_contactado_id`),
  ADD KEY `idx_created_by` (`created_by`);

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
  ADD KEY `id_tarea_origen` (`id_tarea_origen`),
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
-- Indices de la tabla `incidentes_codigos`
--
ALTER TABLE `incidentes_codigos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_incidente_codigo` (`id_incidente`,`id_codigo`),
  ADD KEY `idx_id_incidente` (`id_incidente`),
  ADD KEY `idx_id_codigo` (`id_codigo`),
  ADD KEY `idx_tarifa_calculo` (`id_tarifa_calculo`);

--
-- Indices de la tabla `incidentes_estado_historico`
--
ALTER TABLE `incidentes_estado_historico`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_incidente` (`id_incidente`);

--
-- Indices de la tabla `incidentes_guardia`
--
ALTER TABLE `incidentes_guardia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_id_guardia` (`id_guardia`),
  ADD KEY `idx_inicio_fin` (`inicio`,`fin`),
  ADD KEY `idx_estado` (`estado`);

--
-- Indices de la tabla `integrantes`
--
ALTER TABLE `integrantes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_nombre_apellido` (`nombre`,`apellido`),
  ADD KEY `idx_disponibilidad` (`disponibilidad`),
  ADD KEY `idx_coordinador` (`es_coordinador`);

--
-- Indices de la tabla `itracker_data`
--
ALTER TABLE `itracker_data`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ticket_id` (`ticket_id`);

--
-- Indices de la tabla `liquidaciones_detalle`
--
ALTER TABLE `liquidaciones_detalle`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_id_liquidacion` (`id_liquidacion`),
  ADD KEY `idx_id_incidente` (`id_incidente`),
  ADD KEY `idx_id_guardia` (`id_guardia`),
  ADD KEY `idx_usuario_fecha` (`usuario`,`fecha`);

--
-- Indices de la tabla `liquidaciones_guardia`
--
ALTER TABLE `liquidaciones_guardia`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_periodo` (`periodo`),
  ADD KEY `idx_estado` (`estado`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `permisos`
--
ALTER TABLE `permisos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `placas`
--
ALTER TABLE `placas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_placa` (`numero_placa`);

--
-- Indices de la tabla `proyectos`
--
ALTER TABLE `proyectos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario_responsable` (`id_usuario_responsable`);

--
-- Indices de la tabla `proyecto_usuarios`
--
ALTER TABLE `proyecto_usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_proyecto_usuario` (`id_proyecto`,`id_usuario`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `reportes`
--
ALTER TABLE `reportes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `rol_permiso`
--
ALTER TABLE `rol_permiso`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_rol` (`id_rol`,`id_permiso`),
  ADD KEY `id_permiso` (`id_permiso`);

--
-- Indices de la tabla `sistemas_monitoreados`
--
ALTER TABLE `sistemas_monitoreados`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_nombre_sistema` (`nombre`),
  ADD KEY `idx_criticidad` (`criticidad`),
  ADD KEY `idx_estado` (`estado`),
  ADD KEY `idx_categoria` (`categoria`);

--
-- Indices de la tabla `subtareas`
--
ALTER TABLE `subtareas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_tarea` (`id_tarea`);

--
-- Indices de la tabla `subtarea_usuarios`
--
ALTER TABLE `subtarea_usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_subtarea_usuario` (`id_subtarea`,`id_usuario`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `tabulaciones_data`
--
ALTER TABLE `tabulaciones_data`
  ADD PRIMARY KEY (`tarea_id`);

--
-- Indices de la tabla `tareas`
--
ALTER TABLE `tareas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_proyecto` (`id_proyecto`),
  ADD KEY `id_usuario_asignado` (`id_usuario_asignado`);

--
-- Indices de la tabla `tarea_usuarios`
--
ALTER TABLE `tarea_usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_tarea_usuario` (`id_tarea`,`id_usuario`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `tarifas`
--
ALTER TABLE `tarifas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `usuario_rol`
--
ALTER TABLE `usuario_rol`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_usuario` (`id_usuario`,`id_rol`),
  ADD KEY `id_rol` (`id_rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `abm_pic`
--
ALTER TABLE `abm_pic`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `abm_social`
--
ALTER TABLE `abm_social`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `bitacora`
--
ALTER TABLE `bitacora`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `codigos_facturacion`
--
ALTER TABLE `codigos_facturacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `comentarios`
--
ALTER TABLE `comentarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `enlaces`
--
ALTER TABLE `enlaces`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `enlaces_categorias`
--
ALTER TABLE `enlaces_categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `enlaces_urls`
--
ALTER TABLE `enlaces_urls`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `equipos_integrantes`
--
ALTER TABLE `equipos_integrantes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `equipos_sistemas`
--
ALTER TABLE `equipos_sistemas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `equipos_tecnicos`
--
ALTER TABLE `equipos_tecnicos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `flujos_escalamiento`
--
ALTER TABLE `flujos_escalamiento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `glosario`
--
ALTER TABLE `glosario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `glosario_categorias`
--
ALTER TABLE `glosario_categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `guardias`
--
ALTER TABLE `guardias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `historial_incidentes_contactos`
--
ALTER TABLE `historial_incidentes_contactos`
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
-- AUTO_INCREMENT de la tabla `incidentes_codigos`
--
ALTER TABLE `incidentes_codigos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `incidentes_estado_historico`
--
ALTER TABLE `incidentes_estado_historico`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `incidentes_guardia`
--
ALTER TABLE `incidentes_guardia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `integrantes`
--
ALTER TABLE `integrantes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `itracker_data`
--
ALTER TABLE `itracker_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `liquidaciones_detalle`
--
ALTER TABLE `liquidaciones_detalle`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `liquidaciones_guardia`
--
ALTER TABLE `liquidaciones_guardia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
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
-- AUTO_INCREMENT de la tabla `proyecto_usuarios`
--
ALTER TABLE `proyecto_usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `reportes`
--
ALTER TABLE `reportes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `rol_permiso`
--
ALTER TABLE `rol_permiso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `sistemas_monitoreados`
--
ALTER TABLE `sistemas_monitoreados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `subtareas`
--
ALTER TABLE `subtareas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `subtarea_usuarios`
--
ALTER TABLE `subtarea_usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tareas`
--
ALTER TABLE `tareas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tarea_usuarios`
--
ALTER TABLE `tarea_usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tarifas`
--
ALTER TABLE `tarifas`
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
-- Filtros para la tabla `comentarios`
--
ALTER TABLE `comentarios`
  ADD CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comentarios_ibfk_2` FOREIGN KEY (`id_tarea`) REFERENCES `tareas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `enlaces`
--
ALTER TABLE `enlaces`
  ADD CONSTRAINT `fk_enlaces_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `enlaces_categorias` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `enlaces_urls`
--
ALTER TABLE `enlaces_urls`
  ADD CONSTRAINT `fk_enlaces_urls_enlace` FOREIGN KEY (`enlace_id`) REFERENCES `enlaces` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `equipos_integrantes`
--
ALTER TABLE `equipos_integrantes`
  ADD CONSTRAINT `fk_equipos_integrantes_equipo` FOREIGN KEY (`equipo_id`) REFERENCES `equipos_tecnicos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_equipos_integrantes_integrante` FOREIGN KEY (`integrante_id`) REFERENCES `integrantes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `equipos_sistemas`
--
ALTER TABLE `equipos_sistemas`
  ADD CONSTRAINT `fk_equipos_sistemas_equipo` FOREIGN KEY (`equipo_id`) REFERENCES `equipos_tecnicos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_equipos_sistemas_sistema` FOREIGN KEY (`sistema_id`) REFERENCES `sistemas_monitoreados` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD CONSTRAINT `fk_eventos_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `flujos_escalamiento`
--
ALTER TABLE `flujos_escalamiento`
  ADD CONSTRAINT `fk_flujos_equipo_escalamiento` FOREIGN KEY (`equipo_escalamiento_id`) REFERENCES `equipos_tecnicos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_flujos_equipo_primario` FOREIGN KEY (`equipo_primario_id`) REFERENCES `equipos_tecnicos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_flujos_sistema` FOREIGN KEY (`sistema_id`) REFERENCES `sistemas_monitoreados` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `glosario`
--
ALTER TABLE `glosario`
  ADD CONSTRAINT `fk_glosario_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `glosario_categorias` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `historial_incidentes_contactos`
--
ALTER TABLE `historial_incidentes_contactos`
  ADD CONSTRAINT `fk_historial_created_by` FOREIGN KEY (`created_by`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_historial_equipo` FOREIGN KEY (`equipo_contactado_id`) REFERENCES `equipos_tecnicos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_historial_integrante` FOREIGN KEY (`integrante_contactado_id`) REFERENCES `integrantes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_historial_sistema` FOREIGN KEY (`sistema_id`) REFERENCES `sistemas_monitoreados` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `hitos`
--
ALTER TABLE `hitos`
  ADD CONSTRAINT `hitos_ibfk_1` FOREIGN KEY (`id_proyecto_origen`) REFERENCES `proyectos` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `hito_tareas`
--
ALTER TABLE `hito_tareas`
  ADD CONSTRAINT `hito_tareas_ibfk_1` FOREIGN KEY (`id_hito`) REFERENCES `hitos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hito_tareas_ibfk_2` FOREIGN KEY (`id_tarea_origen`) REFERENCES `tareas` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `hito_usuarios`
--
ALTER TABLE `hito_usuarios`
  ADD CONSTRAINT `hito_usuarios_ibfk_1` FOREIGN KEY (`id_hito`) REFERENCES `hitos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hito_usuarios_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `incidentes_codigos`
--
ALTER TABLE `incidentes_codigos`
  ADD CONSTRAINT `fk_codigo_tarifa` FOREIGN KEY (`id_tarifa_calculo`) REFERENCES `tarifas` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_incidente_codigos_codigo` FOREIGN KEY (`id_codigo`) REFERENCES `codigos_facturacion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_incidente_codigos_incidente` FOREIGN KEY (`id_incidente`) REFERENCES `incidentes_guardia` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `incidentes_estado_historico`
--
ALTER TABLE `incidentes_estado_historico`
  ADD CONSTRAINT `incidentes_estado_historico_ibfk_1` FOREIGN KEY (`id_incidente`) REFERENCES `incidentes_guardia` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `incidentes_guardia`
--
ALTER TABLE `incidentes_guardia`
  ADD CONSTRAINT `fk_incidente_guardia` FOREIGN KEY (`id_guardia`) REFERENCES `guardias` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `liquidaciones_detalle`
--
ALTER TABLE `liquidaciones_detalle`
  ADD CONSTRAINT `fk_liquidaciones_detalle_guardia` FOREIGN KEY (`id_guardia`) REFERENCES `guardias` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_liquidaciones_detalle_incidente` FOREIGN KEY (`id_incidente`) REFERENCES `incidentes_guardia` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_liquidaciones_detalle_liquidacion` FOREIGN KEY (`id_liquidacion`) REFERENCES `liquidaciones_guardia` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `proyectos`
--
ALTER TABLE `proyectos`
  ADD CONSTRAINT `proyectos_ibfk_1` FOREIGN KEY (`id_usuario_responsable`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `proyecto_usuarios`
--
ALTER TABLE `proyecto_usuarios`
  ADD CONSTRAINT `proyecto_usuarios_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `proyecto_usuarios_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `reportes`
--
ALTER TABLE `reportes`
  ADD CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `rol_permiso`
--
ALTER TABLE `rol_permiso`
  ADD CONSTRAINT `rol_permiso_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rol_permiso_ibfk_2` FOREIGN KEY (`id_permiso`) REFERENCES `permisos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `subtareas`
--
ALTER TABLE `subtareas`
  ADD CONSTRAINT `subtareas_ibfk_1` FOREIGN KEY (`id_tarea`) REFERENCES `tareas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `subtarea_usuarios`
--
ALTER TABLE `subtarea_usuarios`
  ADD CONSTRAINT `subtarea_usuarios_ibfk_1` FOREIGN KEY (`id_subtarea`) REFERENCES `subtareas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subtarea_usuarios_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tareas`
--
ALTER TABLE `tareas`
  ADD CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tareas_ibfk_2` FOREIGN KEY (`id_usuario_asignado`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `tarea_usuarios`
--
ALTER TABLE `tarea_usuarios`
  ADD CONSTRAINT `tarea_usuarios_ibfk_1` FOREIGN KEY (`id_tarea`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tarea_usuarios_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuario_rol`
--
ALTER TABLE `usuario_rol`
  ADD CONSTRAINT `usuario_rol_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `usuario_rol_ibfk_2` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
