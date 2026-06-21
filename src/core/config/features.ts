/**
 * Feature flags de Vumies.
 *
 * El módulo de anime (catálogo AnimeAV1, rutas, navegación y ruteo de búsqueda a
 * anime) está desactivado TEMPORALMENTE. Todo el código sigue en el repo.
 *
 * Para REACTIVARLO: pon `__ANIME_ENABLED__` en `true` en el bloque `define` de
 * vite.config.ts. Ese es el toggle único: al ser una constante de build, con `false`
 * Rollup además tree-shakea las vistas/composables/servicios de anime del bundle.
 *
 * `FEATURES.anime` expone ese flag de forma ergonómica para el código de runtime
 * (v-if en plantillas, ruteo de resultados de búsqueda, etc.).
 */
export const FEATURES: { readonly anime: boolean } = {
  anime: __ANIME_ENABLED__,
}
