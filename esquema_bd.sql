CREATE DATABASE TaskManagementSystem;
USE TaskManagementSystem;

-- Tabla de Usuarios
CREATE TABLE Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('User', 'Admin', 'SuperAdmin') DEFAULT 'User',
    estado ENUM('activo', 'verificado', 'bloqueado') DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Proyectos
CREATE TABLE Proyectos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado ENUM('activo', 'completado', 'archivado', 'cancelado') DEFAULT 'activo',
    id_usuario_responsable INT,
    FOREIGN KEY (id_usuario_responsable) REFERENCES Usuarios(id) ON DELETE SET NULL
);

-- Tabla de Tareas
CREATE TABLE Tareas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado ENUM('pendiente', 'en progreso', 'revisión', 'completado') DEFAULT 'pendiente',
    prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
    fecha_vencimiento DATE,
    id_proyecto INT,
    id_usuario_asignado INT,
    FOREIGN KEY (id_proyecto) REFERENCES Proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_asignado) REFERENCES Usuarios(id) ON DELETE SET NULL
);

-- Tabla de Subtareas
CREATE TABLE Subtareas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    estado ENUM('pendiente', 'en progreso', 'completado') DEFAULT 'pendiente',
    id_tarea INT,
    FOREIGN KEY (id_tarea) REFERENCES Tareas(id) ON DELETE CASCADE
);

-- Tabla de Comentarios
CREATE TABLE Comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contenido TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT,
    id_tarea INT,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_tarea) REFERENCES Tareas(id) ON DELETE CASCADE
);

-- Tabla de Reportes
CREATE TABLE Reportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    formato ENUM('PDF', 'Excel'),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- Tabla de Bitácora
CREATE TABLE Bitacora (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descripcion TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Permisos
CREATE TABLE Permisos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Tabla de Roles
CREATE TABLE Roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Tabla de Rol_Permiso (Relación muchos a muchos entre Roles y Permisos)
CREATE TABLE Rol_Permiso (
    id_rol INT,
    id_permiso INT,
    PRIMARY KEY (id_rol, id_permiso),
    FOREIGN KEY (id_rol) REFERENCES Roles(id) ON DELETE CASCADE,
    FOREIGN KEY (id_permiso) REFERENCES Permisos(id) ON DELETE CASCADE
);

-- Tabla de Usuario_Rol (Relación muchos a muchos entre Usuarios y Roles)
CREATE TABLE Usuario_Rol (
    id_usuario INT,
    id_rol INT,
    PRIMARY KEY (id_usuario, id_rol),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES Roles(id) ON DELETE CASCADE
);