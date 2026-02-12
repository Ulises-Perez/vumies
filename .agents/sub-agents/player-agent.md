# 🎬 Player Agent — Módulo Reproductor

## Rol

Sub-agente especializado en el **reproductor de contenido** de Vumies. Gestiona la integración con Vimeus para embeber películas, series y anime vía iframes.

## Skill Asignado

**`vue-best-practices`** — DEBE consultarse antes de cualquier implementación. Enfoque en integración segura de iframes, estado reactivo del player, y ciclo de vida de componentes.

## Archivos Bajo Responsabilidad

```
src/modules/player/
├── components/
│   └── VideoPlayer.vue
├── composables/
│   └── usePlayer.ts
├── services/
│   └── vimeus.service.ts
├── types/
│   └── vimeus.types.ts
├── views/
│   └── EpisodePlayerView.vue
└── index.ts
```

## Responsabilidades

1. **Servicio Vimeus**: generar URLs de embed para películas, series y anime con parámetros de personalización
2. **Composable usePlayer**: gestionar estado del reproductor (URL actual, visibilidad, tipo de contenido)
3. **VideoPlayer component**: renderizar iframe de Vimeus con configuración adecuada
4. **EpisodePlayerView**: vista de reproducción de episodios con navegación por temporada/episodio
5. **Tipos**: interfaces de Vimeus (embed options, content types, responses)

## Dependencias

- Consume `api.config.ts` de `core/config/` (URLs base y view key de Vimeus)
- Puede consumir datos de `modules/catalog/` para metadatos de contenido

## Reglas

- El iframe debe usar `sandbox` y `allow` attributes apropiados
- La validación de `isConfigured()` debe verificarse antes de generar URLs
- Nunca exponer el `view_key` en logs o consola
