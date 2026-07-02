// ============================================================================
// Abstracción multi-fuente (Fase 1)
// ----------------------------------------------------------------------------
// Unifica Vimeus (iframe), Torrentio (torrent) y futuras fuentes detrás de una
// sola interfaz. El reproductor pregunta "¿quién tiene este contenido?" y
// muestra una lista "Ver con…" — así el usuario tiene más probabilidades de
// reproducir algo. Cada Stream lleva un `kind` que decide qué componente lo abre.
// ============================================================================

/** Tipo de contenido, agnóstico a la fuente. */
export type MediaType = 'movie' | 'tv' | 'anime'

/** Qué se quiere reproducir. */
export interface Media {
  type: MediaType
  tmdbId: number
  /** id de IMDB (`tt…`), necesario para addons tipo Torrentio. Se rellena en Fase 2. */
  imdbId?: string
  /** Solo tv/anime. */
  season?: number
  episode?: number
  /** Para mostrar/buscar en fuentes que van por título. */
  title?: string
}

/** Cómo se reproduce un stream → decide el componente del reproductor. */
export type StreamKind =
  | 'iframe' // embed de terceros (Vimeus) → <iframe>
  | 'direct' // URL directa mp4/hls → <video>
  | 'torrent' // infoHash → motor local (librqbit) + mpv (Fases 3-4)

/** Un stream concreto que el reproductor puede intentar abrir. */
export interface Stream {
  /** id de la fuente que lo produjo: 'vimeus' | 'torrentio' | … */
  sourceId: string
  /** Etiqueta legible para la lista "Ver con…". */
  label: string
  kind: StreamKind
  /** Para iframe/direct. */
  url?: string
  /** Para torrent (Fases 3-4). */
  infoHash?: string
  fileIdx?: number
  /** Metadatos para ordenar/filtrar. */
  quality?: '4K' | '1080p' | '720p' | 'SD' | (string & {})
  codec?: string
  /** Códigos de país ISO (es, mx, gb…) detectados del nombre, para banderas. */
  languages?: string[]
  /** ¿el reproductor actual puede con este códec sin transcodificar? */
  playable?: boolean
  /** Mayor = se prioriza antes en la lista y en el auto-play. */
  weight?: number
}

/** Una fuente de streams (Vimeus, Torrentio, AnimeAV1…). */
export interface StreamSource {
  id: string
  label: string
  /** ¿Activa? Puede mirar settings o el entorno (p.ej. si hay motor local). */
  isEnabled(): boolean
  /** Streams disponibles para este contenido. Devuelve [] si no tiene nada. */
  getStreams(media: Media): Promise<Stream[]>
}
