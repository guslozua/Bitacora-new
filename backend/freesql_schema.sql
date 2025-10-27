-- Schema para FreeSQLDatabase.com
-- Proyecto: Sistema de Gestión de Tareas
-- Compatible con SQL Server (FreeSQLDatabase)

-- NOTA: No incluimos CREATE DATABASE ya que FreeSQLDatabase.com nos da una BD predefinida

-- =============================================================
-- TABLAS PRINCIPALES DEL SISTEMA
-- =============================================================

-- Tabla: usuarios
CREATE TABLE usuarios (
    id int IDENTITY(1,1) PRIMARY KEY,
    nombre nvarchar(100) NOT NULL,
    email nvarchar(100) NOT NULL UNIQUE,
    password nvarchar(255) NOT NULL,
    estado nvarchar(9) DEFAULT 'activo',
    fecha_creacion datetime DEFAULT GETDATE(),
    imagen_perfil nvarchar(255) NULL,
    ultimo_acceso datetime2(0) NULL,
    fecha_actualizacion datetime2(0) NULL
);

-- Tabla: roles
CREATE TABLE roles (
    id int IDENTITY(1,1) PRIMARY KEY,
    nombre nvarchar(50) NOT NULL UNIQUE,
    descripcion nvarchar(255) NULL,
    is_default smallint DEFAULT 0,
    fecha_creacion datetime2(0) DEFAULT GETDATE(),
    estado varchar(20) DEFAULT 'activo'
);

-- Tabla: permisos
CREATE TABLE permisos (
    id int IDENTITY(1,1) PRIMARY KEY,
    nombre nvarchar(100) NOT NULL UNIQUE,
    descripcion nvarchar(255) NULL,
    categoria nvarchar(50) DEFAULT 'general',
    fecha_creacion datetime2(0) DEFAULT GETDATE()
);

-- Tabla: usuario_rol (relación many-to-many)
CREATE TABLE usuario_rol (
    id int IDENTITY(1,1) PRIMARY KEY,
    id_usuario int NOT NULL,
    id_rol int NOT NULL,
    fecha_asignacion datetime DEFAULT GETDATE(),
    CONSTRAINT unique_usuario_rol UNIQUE (id_usuario, id_rol),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES roles(id) ON DELETE CASCADE
);

-- Tabla: rol_permiso (relación many-to-many)
CREATE TABLE rol_permiso (
    id int IDENTITY(1,1) PRIMARY KEY,
    id_rol int NOT NULL,
    id_permiso int NOT NULL,
    CONSTRAINT unique_rol_permiso UNIQUE (id_rol, id_permiso),
    FOREIGN KEY (id_rol) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (id_permiso) REFERENCES permisos(id) ON DELETE CASCADE
);

-- Tabla: proyectos
CREATE TABLE proyectos (
    id int IDENTITY(1,1) PRIMARY KEY,
    nombre nvarchar(255) NOT NULL,
    descripcion nvarchar(max) NULL,
    fecha_inicio date NULL,
    fecha_fin date NULL,
    estado nvarchar(11) DEFAULT 'pendiente',
    prioridad nvarchar(5) DEFAULT 'media',
    id_usuario_responsable int NULL,
    FOREIGN KEY (id_usuario_responsable) REFERENCES usuarios(id)
);

-- Tabla: tareas
CREATE TABLE tareas (
    id int IDENTITY(1,1) PRIMARY KEY,
    titulo nvarchar(255) NOT NULL,
    descripcion nvarchar(max) NULL,
    estado nvarchar(11) DEFAULT 'pendiente',
    prioridad nvarchar(5) DEFAULT 'media',
    fecha_inicio date NULL,
    fecha_vencimiento date NULL,
    id_proyecto int NULL,
    id_usuario_asignado int NULL,
    dependencias nvarchar(max) NULL,
    migration_complete smallint DEFAULT 0,
    FOREIGN KEY (id_proyecto) REFERENCES proyectos(id),
    FOREIGN KEY (id_usuario_asignado) REFERENCES usuarios(id)
);

-- Tabla: eventos (calendario)
CREATE TABLE eventos (
    id int IDENTITY(1,1) PRIMARY KEY,
    title nvarchar(255) NOT NULL,
    start datetime2(0) NOT NULL,
    [end] datetime2(0) NOT NULL,
    allDay smallint DEFAULT 0,
    type nvarchar(8) DEFAULT 'event',
    color nvarchar(50) NULL,
    description nvarchar(max) NULL,
    location nvarchar(255) NULL,
    completed smallint DEFAULT 0,
    createdBy int NULL,
    createdAt datetime2(0) DEFAULT GETDATE(),
    updatedAt datetime2(0) DEFAULT GETDATE(),
    FOREIGN KEY (createdBy) REFERENCES usuarios(id)
);

-- Tabla: guardias
CREATE TABLE guardias (
    id int IDENTITY(1,1) PRIMARY KEY,
    fecha date NOT NULL,
    usuario nvarchar(255) NOT NULL,
    notas nvarchar(max) NULL,
    createdAt datetime DEFAULT GETDATE(),
    updatedAt datetime DEFAULT GETDATE(),
    CONSTRAINT unique_fecha_usuario UNIQUE (fecha, usuario)
);

-- Tabla: configuraciones_globales
CREATE TABLE configuraciones_globales (
    id int IDENTITY(1,1) PRIMARY KEY,
    tipo_configuracion nvarchar(18) NOT NULL,
    clave nvarchar(100) NOT NULL,
    valor nvarchar(max) NOT NULL,
    activo smallint DEFAULT 1,
    orden int NULL,
    descripcion nvarchar(max) NULL,
    usuario_creacion int NOT NULL,
    fecha_creacion datetime DEFAULT GETDATE(),
    fecha_actualizacion datetime DEFAULT GETDATE(),
    CONSTRAINT unique_tipo_clave UNIQUE (tipo_configuracion, clave),
    FOREIGN KEY (usuario_creacion) REFERENCES usuarios(id)
);

-- Tabla: notificaciones
CREATE TABLE notificaciones (
    id int IDENTITY(1,1) PRIMARY KEY,
    id_usuario int NOT NULL,
    tipo nvarchar(50) NOT NULL,
    titulo nvarchar(100) NOT NULL,
    mensaje nvarchar(max) NOT NULL,
    referencia_id int NULL,
    referencia_tipo nvarchar(50) NULL,
    leida smallint DEFAULT 0,
    fecha_creacion datetime DEFAULT GETDATE(),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- =============================================================
-- DATOS INICIALES (SEED DATA)
-- =============================================================

-- Insertar roles básicos
INSERT INTO roles (nombre, descripcion, is_default) VALUES
('SuperAdmin', 'Administrador con acceso total al sistema', 0),
('Admin', 'Administrador con permisos avanzados', 0),
('Manager', 'Gestor de proyectos y equipos', 0),
('User', 'Usuario básico del sistema', 1);

-- Insertar permisos básicos
INSERT INTO permisos (nombre, descripcion, categoria) VALUES
-- Usuarios
('users.view', 'Ver usuarios', 'usuarios'),
('users.create', 'Crear usuarios', 'usuarios'),
('users.edit', 'Editar usuarios', 'usuarios'),
('users.delete', 'Eliminar usuarios', 'usuarios'),
-- Roles
('roles.manage', 'Gestionar roles y permisos', 'roles'),
-- Proyectos
('projects.view', 'Ver proyectos', 'proyectos'),
('projects.create', 'Crear proyectos', 'proyectos'),
('projects.edit', 'Editar proyectos', 'proyectos'),
('projects.delete', 'Eliminar proyectos', 'proyectos'),
-- Tareas
('tasks.view', 'Ver tareas', 'tareas'),
('tasks.create', 'Crear tareas', 'tareas'),
('tasks.edit', 'Editar tareas', 'tareas'),
('tasks.delete', 'Eliminar tareas', 'tareas'),
-- Guardias
('guardias.manage', 'Gestionar guardias', 'guardias'),
-- Configuraciones
('config.manage', 'Gestionar configuraciones', 'configuraciones'),
-- Dashboard
('dashboard.view', 'Ver dashboard', 'dashboard');

-- Asignar permisos a roles
-- SuperAdmin: todos los permisos
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id, p.id 
FROM roles r, permisos p 
WHERE r.nombre = 'SuperAdmin';

-- Admin: todos menos gestión de roles
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id, p.id 
FROM roles r, permisos p 
WHERE r.nombre = 'Admin' AND p.nombre != 'roles.manage';

-- Manager: proyectos y tareas
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id, p.id 
FROM roles r, permisos p 
WHERE r.nombre = 'Manager' AND p.categoria IN ('proyectos', 'tareas', 'dashboard');

-- User: solo ver
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id, p.id 
FROM roles r, permisos p 
WHERE r.nombre = 'User' AND p.nombre IN ('projects.view', 'tasks.view', 'dashboard.view');

-- Crear usuario administrador por defecto
-- Password: admin123 (hasheado con bcrypt)
INSERT INTO usuarios (nombre, email, password, estado) VALUES
('Administrador', 'admin@sistema.com', '$2b$10$xQp0s1WKfPiOBJKiGgWGDOKA4VtOzqYjuLkK5N3PpwAZv4XwC2QGe', 'activo');

-- Asignar rol SuperAdmin al usuario administrador
INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id, r.id 
FROM usuarios u, roles r 
WHERE u.email = 'admin@sistema.com' AND r.nombre = 'SuperAdmin';

-- =============================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =============================================================

CREATE INDEX IX_usuarios_email ON usuarios(email);
CREATE INDEX IX_usuario_rol_usuario ON usuario_rol(id_usuario);
CREATE INDEX IX_usuario_rol_rol ON usuario_rol(id_rol);
CREATE INDEX IX_proyectos_estado ON proyectos(estado);
CREATE INDEX IX_tareas_estado ON tareas(estado);
CREATE INDEX IX_tareas_proyecto ON tareas(id_proyecto);
CREATE INDEX IX_eventos_fecha ON eventos(start, [end]);
CREATE INDEX IX_guardias_fecha ON guardias(fecha);
CREATE INDEX IX_notificaciones_usuario ON notificaciones(id_usuario);

PRINT 'Base de datos creada exitosamente para FreeSQLDatabase.com'
PRINT 'Usuario administrador: admin@sistema.com'
PRINT 'Password: admin123'
