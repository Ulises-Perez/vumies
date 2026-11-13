import type { RouteLocationRaw } from 'vue-router'

/** Pieza del mosaico de destacados, ya resuelta por el llamador: sin campos de TMDB. */
export interface MosaicTile {
  id: number
  title: string
  /** URL de imagen ya resuelta (backdrop para el lead, poster para las piezas altas). */
  artwork: string
  /** Candidatos responsivos del mismo arte (w185/w342 poster, w780/w1280 backdrop). */
  artworkSrcSet?: string
  /** Año como texto, '' cuando se desconoce. */
  year: string
  /** Dato corto junto al título, ej. '78% Match'. '' cuando no aplica. */
  meta: string
  /** Sinopsis, solo se renderiza en el lead. */
  overview?: string
  /** Etiqueta de esquina. Solo se setea cuando el dato es real ('Estreno', 'Serie'). */
  badge?: string
  /** Destino del enlace de la pieza entera. */
  to: RouteLocationRaw
}
