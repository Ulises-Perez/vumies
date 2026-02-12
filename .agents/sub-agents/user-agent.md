# 👤 User Agent — Módulo Gestión de Usuario

## Rol

Sub-agente especializado en la **gestión de datos del usuario** de Vumies: favoritos, historial de visualización, y persistencia local.

## Skill Asignado

**`vue-best-practices`** — DEBE consultarse antes de cualquier implementación. Enfoque en Pinia stores con Setup pattern, reactividad, y persistencia segura.

## Archivos Bajo Responsabilidad

```
src/modules/user/
├── stores/
│   └── user.store.ts
├── views/
│   └── FavoritesView.vue
└── index.ts
```

## Responsabilidades

1. **User Store (Pinia)**: gestionar estado de favoritos y watch history
2. **Persistencia**: sincronización bidireccional con `localStorage` (keys: `vumies_favorites`, `vumies_history`)
3. **FavoritesView**: vista de favoritos del usuario con capacidad de eliminar items
4. **API del Store**: `addToFavorites`, `removeFromFavorites`, `toggleFavorite`, `isFavorite`, `addToHistory`, `clearHistory`

## Dependencias

- Consume componentes de `modules/ui/` para presentación
- Consume componentes de `modules/catalog/` (MovieCard, TVShowCard) para renderizar favoritos
- No tiene dependencias de servicios externos (todo es local)

## Reglas

- El historial se limita a los últimos 50 items
- `localStorage` debe wrapperse en try/catch para manejar errores de storage lleno
- Las interfaces `FavoriteItem` y `WatchHistoryItem` deben mantenerse tipadas
- Nunca modificar el store directamente fuera de las actions definidas
