# 📁 Plantillas de Página

Esta carpeta contiene modelos base reutilizables para crear nuevas páginas del sistema con una estructura ya preparada. Todas las plantillas incluyen Sidebar y Footer integrados para mantener la coherencia visual y funcional.

---

## ✨ ¿Cómo usarlas?

1. Copiá el archivo que necesites (por ejemplo, `PaginaConTabla.tsx`).
2. Pegalo dentro de `src/pages/` y renombralo (por ejemplo, `Usuarios.tsx`).
3. Cambiá el nombre del componente en el archivo (por ejemplo, de `PaginaConTabla` a `Usuarios`).
4. Personalizá el contenido según lo que necesites.

---

## 📦 Plantillas disponibles

### `PaginaBase.tsx`
Estructura mínima con:
- Sidebar colapsable
- Footer institucional
- Título principal

Ideal para páginas simples o personalizadas desde cero.

---

### `PaginaConTabla.tsx`
Plantilla que incluye:
- Una tabla Bootstrap vacía
- Encabezados predefinidos
- Estructura lista para renderizar datos

Ideal para listados de usuarios, tareas, proyectos, etc.

---

### `PaginaConFormulario.tsx`
Incluye un formulario funcional con:
- Campo de texto
- Campo de email
- Botón "Guardar"
- Ejemplo de `useState` y `handleSubmit`

Perfecto para crear formularios de carga o edición.

---

## 📌 Requisitos

Estas plantillas asumen que los siguientes componentes están disponibles:
- `components/Sidebar.tsx`
- `components/Footer.tsx`

---

## 🛠️ Sugerencia

Podés agregar más plantillas según las necesidades del proyecto:
- `PaginaConFiltros.tsx`
- `PaginaConKanban.tsx`
- `PaginaConTabs.tsx`

Mantené esta carpeta limpia y actualizada para facilitar el trabajo en equipo 🚀
