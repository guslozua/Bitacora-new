# Bitácora 01 - Sistema de Gestión de Tareas

Un sistema completo de gestión de tareas desarrollado con React y Node.js.

## 🚀 Estructura del Proyecto

```
Bitacora_01/
├── frontend/          # Aplicación React
├── backend/           # API Node.js/Express
└── README.md         # Este archivo
```

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- MySQL
- npm o yarn

## 🛠 Instalación

### Backend
```bash
cd backend
npm install
cp .env.example .env    # Configura tus variables de entorno
npm start               # Servidor en puerto 5000
```

### Frontend
```bash
cd frontend
npm install
npm start               # Aplicación en puerto 3000
```

## 🗄 Base de Datos

1. Ejecuta el script `taskmanagementsystem.sql` para crear la estructura inicial
2. Configura las variables de entorno en `backend/.env`:
   - DB_HOST
   - DB_USER
   - DB_PASSWORD
   - DB_NAME

## 🧪 Testing

Para probar la conexión a la base de datos:
```bash
cd backend
node testDB.js
```

## 🔒 Seguridad

Para verificar vulnerabilidades de seguridad:
```bash
cd backend
npm run audit

cd ../frontend  
npm audit
```

Para intentar solucionar automáticamente:
```bash
npm run audit-fix
```

## 📦 Estructura de Archivos

### Backend
- `server.js` - Servidor principal
- `aternity_server.js` - Servidor adicional
- `config/` - Configuraciones
- `controllers/` - Controladores de rutas
- `models/` - Modelos de datos
- `routes/` - Definición de rutas
- `middleware/` - Middlewares personalizados
- `utils/` - Utilidades

### Frontend
- Aplicación React con TypeScript
- Configuración con Vite
- Bootstrap para estilos

## 🔧 Contribución

1. Fork el proyecto
2. Crea tu branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añade nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
