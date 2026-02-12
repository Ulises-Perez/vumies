# 🔍 Search Agent — Módulo Búsqueda

## Rol

Sub-agente especializado en la **funcionalidad de búsqueda** de Vumies. Gestiona la experiencia de búsqueda en tiempo real de películas y series.

## Skill Asignado

**`enhance-prompt`** — DEBE consultarse para optimizar la experiencia de búsqueda: inputs descriptivos, feedback visual, y estructuración de resultados.

## Archivos Bajo Responsabilidad

```
src/modules/search/
├── views/
│   └── SearchView.vue
└── index.ts
```

## Responsabilidades

1. **SearchView**: vista de búsqueda con input, resultados en grid, y estados vacíos
2. **Integración con app store**: utiliza `searchQuery` y `isSearchActive` del store central
3. **UX de búsqueda**: debounce de input, feedback de "sin resultados", loading states

## Dependencias

- Consume `tmdbService.searchMulti()` de `modules/catalog/` para ejecutar búsquedas
- Consume componentes de `modules/ui/` (LoadingSpinner, ErrorMessage)
- Consume componentes de `modules/catalog/` (MovieCard, TVShowCard) para renderizar resultados
- Consume `app.store.ts` de `core/stores/` para estado de búsqueda global

## Reglas

- La búsqueda debe tener debounce (mínimo 300ms) para evitar exceso de peticiones
- Mostrar estados diferenciados: vacío, buscando, sin resultados, resultados
- Los resultados deben filtrarse para mostrar solo `movie` y `tv` (excluir `person`)
