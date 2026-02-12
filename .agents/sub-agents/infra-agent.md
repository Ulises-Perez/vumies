# ⚙️ Infra Agent — Módulo Infraestructura & Configuración

## Rol

Sub-agente especializado en la **infraestructura técnica** de Vumies: configuración, routing, variables de entorno, tipos base, build system, y setup de nuevos módulos.

## Skill Asignado

**`skill-creator`** — DEBE consultarse cuando se necesite crear nuevos módulos o skills. Permite escalar la arquitectura MOMC de forma autónoma.

## Archivos Bajo Responsabilidad

```
src/core/
├── config/
│   └── api.config.ts
├── router/
│   └── index.ts
├── stores/
│   ├── app.store.ts
│   └── index.ts
└── index.ts

# Archivos raíz del proyecto
src/App.vue
src/main.ts
src/modules/*/index.ts      (barrel exports)
vite.config.ts
tsconfig.json
tsconfig.app.json
tsconfig.node.json
postcss.config.js
.env
```

## Responsabilidades

1. **API Config**: URLs base, tokens, y helpers de imagen para TMDB y Vimeus
2. **Router**: definición de rutas con lazy loading, guards, y scroll behavior
3. **App Store**: estado global de la app (géneros, búsqueda activa)
4. **Barrel Exports**: mantener `index.ts` de cada módulo actualizado
5. **Build Config**: Vite, TypeScript, PostCSS, Tailwind configs
6. **Variables de Entorno**: gestión de `.env` y tipos de `import.meta.env`
7. **Escalabilidad**: registrar nuevos módulos, crear nuevos sub-agentes

## Dependencias

- Es consumido por TODOS los módulos (capa base)
- No consume ningún módulo funcional

## Reglas

- `api.config.ts` nunca debe exponer tokens directamente; usar `import.meta.env`
- El router debe usar lazy loading (`() => import(...)`) para todas las vistas
- Los barrel exports deben re-exportar solo lo necesario (no exports internos)
- Cada nuevo módulo debe registrarse en el router y tener su barrel export
- El alias `@/` debe apuntar a `src/` en Vite y TypeScript
