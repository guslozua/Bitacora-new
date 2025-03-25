-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 25-03-2025 a las 17:15:28
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

--
-- Volcado de datos para la tabla `bitacora`
--

INSERT INTO `bitacora` (`id`, `tipo_evento`, `descripcion`, `id_usuario`, `nombre_usuario`, `id_proyecto`, `nombre_proyecto`, `id_tarea`, `nombre_tarea`, `id_subtarea`, `nombre_subtarea`, `fecha`) VALUES
(1, 'CREACIÓN', 'Proyecto creado: Proyecto 07', 6, NULL, 7, NULL, NULL, NULL, NULL, NULL, '2025-03-24 14:20:03'),
(2, 'ACTUALIZACIÓN', 'Proyecto actualizado: Proyecto 7 actualizado', 6, NULL, 7, NULL, NULL, NULL, NULL, NULL, '2025-03-24 14:21:13'),
(3, 'ELIMINACIÓN', 'Proyecto eliminado: Proyecto 7 actualizado', 6, NULL, 7, NULL, NULL, NULL, NULL, NULL, '2025-03-24 14:22:19'),
(4, 'CREACIÓN', 'Tarea creada: Nueva Tarea a ver q onda ', 6, NULL, 1, NULL, 12, NULL, NULL, NULL, '2025-03-24 14:45:53'),
(5, 'CREACIÓN', 'Tarea creada: Nueva Tarea a ver q onda ', 6, 'Usuario Prueba', 1, 'Nuevo Proyecto 01', 13, 'Nueva Tarea a ver q onda ', NULL, NULL, '2025-03-24 21:13:51'),
(6, 'ACTUALIZACIÓN', 'Tarea actualizada: Tarea 13 (en progreso)', 6, 'Usuario Prueba', 1, 'Nuevo Proyecto 01', 13, 'Tarea 13', NULL, NULL, '2025-03-24 21:26:42'),
(7, 'ELIMINACIÓN', 'Tarea eliminada: Tarea 13', 6, 'Usuario Prueba', 1, 'Nuevo Proyecto 01', 13, 'Tarea 13', NULL, NULL, '2025-03-24 21:27:32'),
(8, 'CREACIÓN', 'Proyecto creado: Proyecto 08', 6, 'Usuario Prueba', 8, 'Proyecto 08', NULL, NULL, NULL, NULL, '2025-03-24 21:39:43'),
(9, 'ACTUALIZACIÓN', 'Proyecto actualizado: Proyecto 888actualizado (activo)', 6, 'Usuario Prueba', 8, 'Proyecto 888actualizado', NULL, NULL, NULL, NULL, '2025-03-24 21:40:29'),
(10, 'ELIMINACIÓN', 'Proyecto eliminado: undefined', 6, 'Usuario Prueba', 8, NULL, NULL, NULL, NULL, NULL, '2025-03-24 21:41:59'),
(11, 'CREACIÓN', 'Subtarea creada: SUB tarea  para ver si funciona y queda ', 6, 'Usuario Prueba', 1, 'Nuevo Proyecto 01', 4, 'Nueva Tarea 01', 16, 'SUB tarea  para ver si funciona y queda ', '2025-03-24 21:44:43'),
(12, 'ACTUALIZACIÓN', 'Subtarea actualizada: Subtarea editada nueva (completado)', 6, 'Usuario Prueba', 1, 'Nuevo Proyecto 01', 4, 'Nueva Tarea 01', 16, 'Subtarea editada nueva', '2025-03-24 21:45:12'),
(13, 'ELIMINACIÓN', 'Subtarea eliminada: Subtarea editada nueva', 6, 'Usuario Prueba', 1, 'Nuevo Proyecto 01', 4, 'Nueva Tarea 01', 16, 'Subtarea editada nueva', '2025-03-24 21:45:38'),
(14, 'CREACIÓN', 'Proyecto creado: Proyecto 009', 6, 'Usuario Prueba', 9, 'Proyecto 009', NULL, NULL, NULL, NULL, '2025-03-24 21:57:56'),
(15, 'ACTUALIZACIÓN', 'Proyecto actualizado: Proyecto 9 reloaded (activo)', 6, 'Usuario Prueba', 9, 'Proyecto 9 reloaded', NULL, NULL, NULL, NULL, '2025-03-24 21:58:32'),
(16, 'ELIMINACIÓN', 'Proyecto eliminado: Proyecto 9 reloaded', 6, 'Usuario Prueba', 9, 'Proyecto 9 reloaded', NULL, NULL, NULL, NULL, '2025-03-24 21:59:21');

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
-- Estructura de tabla para la tabla `permisos`
--

CREATE TABLE `permisos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `permisos`
--

INSERT INTO `permisos` (`id`, `nombre`) VALUES
(2, 'crear_tareas'),
(3, 'editar_tareas'),
(4, 'eliminar_tareas'),
(1, 'ver_proyectos');

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
  `estado` enum('activo','completado','archivado','cancelado') DEFAULT 'activo',
  `id_usuario_responsable` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `proyectos`
--

INSERT INTO `proyectos` (`id`, `nombre`, `descripcion`, `fecha_inicio`, `fecha_fin`, `estado`, `id_usuario_responsable`) VALUES
(1, 'Nuevo Proyecto 01', 'Descripción del proyecto', '2024-03-25', '2024-04-30', 'activo', 6),
(2, 'Proyecto 02', 'Descripción del proyecto', '2024-03-25', '2024-04-30', NULL, NULL),
(3, 'Proyecto 3 actualizado', 'Descripción editada', '2025-03-25', '2025-04-30', 'activo', 6),
(6, 'Proyecto 06', 'Descripción del proyecto', '2024-03-25', '2024-04-30', 'activo', NULL);

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
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `nombre`) VALUES
(1, 'Admin'),
(3, 'SuperAdmin'),
(2, 'User');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rol_permiso`
--

CREATE TABLE `rol_permiso` (
  `id` int(11) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `id_permiso` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `rol_permiso`
--

INSERT INTO `rol_permiso` (`id`, `id_rol`, `id_permiso`) VALUES
(1, 2, 1),
(2, 2, 2),
(3, 2, 3),
(4, 3, 1),
(5, 3, 2),
(6, 3, 3),
(7, 3, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subtareas`
--

CREATE TABLE `subtareas` (
  `id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `estado` enum('pendiente','en progreso','completado') DEFAULT 'pendiente',
  `id_tarea` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `subtareas`
--

INSERT INTO `subtareas` (`id`, `titulo`, `estado`, `id_tarea`) VALUES
(2, 'Subtarea de ejemplo en tarea id4', 'pendiente', 4),
(3, 'Subtarea nueva de ejemplo en tarea id4', 'pendiente', 4),
(4, 'Subtarea nueva en tarea id4 - con id de proyecto', 'pendiente', 4),
(5, 'Subtarea nueva 2 en tarea id4 - con id de proyecto', 'pendiente', 4),
(6, 'Subtarea editada campion', 'completado', 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tareas`
--

CREATE TABLE `tareas` (
  `id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` enum('pendiente','en progreso','revisión','completado') DEFAULT 'pendiente',
  `prioridad` enum('baja','media','alta','urgente') DEFAULT 'media',
  `fecha_vencimiento` date DEFAULT NULL,
  `id_proyecto` int(11) DEFAULT NULL,
  `id_usuario_asignado` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `tareas`
--

INSERT INTO `tareas` (`id`, `titulo`, `descripcion`, `estado`, `prioridad`, `fecha_vencimiento`, `id_proyecto`, `id_usuario_asignado`) VALUES
(4, 'Nueva Tarea 01', 'Descripción de la tarea', 'pendiente', 'media', '2024-04-01', 1, 6),
(5, 'Nueva Tarea 02b', 'Descripción de la tarea', 'pendiente', 'media', '2024-04-01', 1, 6),
(6, 'Tarea actualizada amiguito hermoso', 'Descripción editada ahora', 'en progreso', 'alta', '2025-04-10', 1, 6),
(12, 'Nueva Tarea a ver q onda ', 'Descripción de la tarea con bitacora 2', 'pendiente', 'media', '2024-04-01', 1, 6);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('User','Admin','SuperAdmin') DEFAULT 'User',
  `estado` enum('activo','verificado','bloqueado') DEFAULT 'activo',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol`, `estado`, `fecha_creacion`) VALUES
(1, 'user', 'user@atpc.com', '$2b$10$xoIgApsEfVaVzHCVvKvB1.QgUrg.T9y2j.egma3yGkxbubpanv8hq', 'User', 'activo', '2025-03-20 01:55:42'),
(2, 'admin', 'admin@atpc.com', '$2b$10$SAdmrQe2E6AUEmsVHGtFa.9RVS30Xvyj3gCEqVLPdGrtEX6GtBSaa', 'Admin', 'activo', '2025-03-20 01:56:27'),
(3, 'superadmin', 'superadmin@atpc.com', '$2b$10$Vt4lZc87dHR3mxFHkhhZEOHPIWUgdSMvdnz5nUH98XoQF0sUMa4Ce', 'SuperAdmin', 'activo', '2025-03-20 01:57:18'),
(6, 'Usuario Prueba', 'test@example.com', '$2b$10$I4H0E0WM5VBRmqVCULp0tu5xKT8Lph4fNoYdBwY9LK.7Z1J847QN6', 'Admin', 'activo', '2025-03-21 02:19:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_rol`
--

CREATE TABLE `usuario_rol` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_rol` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `usuario_rol`
--

INSERT INTO `usuario_rol` (`id`, `id_usuario`, `id_rol`) VALUES
(1, 6, 2);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `bitacora`
--
ALTER TABLE `bitacora`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `comentarios`
--
ALTER TABLE `comentarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_tarea` (`id_tarea`);

--
-- Indices de la tabla `permisos`
--
ALTER TABLE `permisos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `proyectos`
--
ALTER TABLE `proyectos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario_responsable` (`id_usuario_responsable`);

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
-- Indices de la tabla `subtareas`
--
ALTER TABLE `subtareas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_tarea` (`id_tarea`);

--
-- Indices de la tabla `tareas`
--
ALTER TABLE `tareas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_proyecto` (`id_proyecto`),
  ADD KEY `id_usuario_asignado` (`id_usuario_asignado`);

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
-- AUTO_INCREMENT de la tabla `bitacora`
--
ALTER TABLE `bitacora`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `comentarios`
--
ALTER TABLE `comentarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `permisos`
--
ALTER TABLE `permisos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `proyectos`
--
ALTER TABLE `proyectos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `reportes`
--
ALTER TABLE `reportes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `rol_permiso`
--
ALTER TABLE `rol_permiso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `subtareas`
--
ALTER TABLE `subtareas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `tareas`
--
ALTER TABLE `tareas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `usuario_rol`
--
ALTER TABLE `usuario_rol`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
-- Filtros para la tabla `proyectos`
--
ALTER TABLE `proyectos`
  ADD CONSTRAINT `proyectos_ibfk_1` FOREIGN KEY (`id_usuario_responsable`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

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
-- Filtros para la tabla `tareas`
--
ALTER TABLE `tareas`
  ADD CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tareas_ibfk_2` FOREIGN KEY (`id_usuario_asignado`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

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
