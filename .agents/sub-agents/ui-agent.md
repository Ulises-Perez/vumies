# 🎨 UI Agent — Módulo UI/UX & Diseño

## Rol

Sub-agente especializado en el **sistema de diseño y componentes visuales** de Vumies. Responsable de la coherencia visual, componentes de layout, y estética de la plataforma.

## Skill Asignado

**`design-md`** — DEBE consultarse antes de cualquier implementación visual. Usar lenguaje descriptivo de diseño, mantener coherencia de paleta y tokens de diseño.

## Archivos Bajo Responsabilidad

```
src/modules/ui/
├── components/
│   ├── AppNavbar.vue
│   ├── AppFooter.vue
│   ├── BottomMenu.vue
│   ├── LoadingSpinner.vue
│   └── ErrorMessage.vue
└── index.ts

# Archivos de diseño global (compartidos)
src/style.css
tailwind.config.js
```

## Responsabilidades

1. **Navbar**: navegación principal con logo, links, y búsqueda
2. **Footer**: información del sitio, links de navegación
3. **BottomMenu**: menú inferior para móviles (responsive)
4. **LoadingSpinner**: indicador de carga reutilizable
5. **ErrorMessage**: componente de error reutilizable con título y mensaje
6. **Sistema de diseño**: Tailwind config (colores, tipografía), estilos globales, clases utility

## Paleta de Colores

- **Primary**: `#EE5E53` (Rojo coral) — acciones principales, CTAs
- **Dark**: `#1D1D1D` (Negro profundo) — fondos, containers
- **Tipografía**: Google Sans / Poppins

## Dependencias

- No depende de ningún otro módulo (es consumido por todos)
- Los componentes reciben datos vía props, nunca acceden a stores directamente

## Reglas

- Los componentes UI deben ser **stateless** (sin estado propio, solo props/emits)
- Todos los componentes deben ser **responsive** (mobile-first con Tailwind breakpoints)
- Utilizar clases de Tailwind, no estilos inline
- Mantener la clase CSS utility `glass` para efectos glassmorphism
- Los colores deben referenciarse siempre desde el token (`text-primary`, `bg-dark`), nunca con hex directo
