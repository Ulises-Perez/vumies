# 📦 Catalog Agent — Módulo Catálogo de Contenido

## Rol

Sub-agente especializado en la **gestión del catálogo de películas y series** del proyecto Vumies. Responsable de toda la lógica de obtención, transformación y presentación de datos de contenido multimedia desde TMDB.

## Skill Asignado

**`vue-best-practices`** — DEBE consultarse antes de cualquier implementación. Priorizar Composition API con `<script setup lang="ts">`, composables tipados, y reactividad mínima.

## Archivos Bajo Responsabilidad

```
src/modules/catalog/
├── components/
│   ├── MovieCard.vue
│   └── TVShowCard.vue
├── composables/
│   ├── useMovies.ts
│   └── useSeries.ts
├── services/
│   └── tmdb.service.ts
├── types/
│   └── tmdb.types.ts
├── views/
│   ├── HomeView.vue
│   ├── MoviesView.vue
│   ├── SeriesView.vue
│   ├── MovieDetailView.vue
│   └── SerieDetailView.vue
└── index.ts
```

## Responsabilidades

1. **Servicio TMDB**: mantener `tmdb.service.ts` con todas las llamadas a la API de The Movie Database
2. **Composables**: `useMovies` y `useSeries` encapsulan la lógica reactiva de datos
3. **Tipos**: definir y mantener las interfaces TypeScript de TMDB
4. **Vistas**: Home (trending + upcoming), listados de películas/series, y detalles
5. **Componentes**: MovieCard y TVShowCard para presentación de tarjetas

## Dependencias

- Consume `api.config.ts` de `core/config/`
- Consume componentes UI compartidos de `modules/ui/` (LoadingSpinner, ErrorMessage)
- Consume `user.store.ts` de `modules/user/` (para favoritos en vistas de detalle)

## Reglas

- Nunca importar directamente de otro módulo sin pasar por su barrel export (`index.ts`)
- Los composables deben manejar `loading`, `error`, y `data` de forma consistente
- Toda respuesta de la API debe tiparse con interfaces de `tmdb.types.ts`
