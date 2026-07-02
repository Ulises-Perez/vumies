// Forma de la respuesta del addon Stremio Torrentio.
// GET {base}/stream/{movie|series}/{id}.json → { streams: [...] }
export interface TorrentioStream {
  /** Proveedor + resolución, p.ej. "Torrentio\n1080p". */
  name?: string
  /** Nombre del release + seeds/tamaño, p.ej. "Movie.2019.1080p.x264\n👤 50 💾 1.5 GB". */
  title?: string
  /** Hash del torrent (la mayoría de resultados). */
  infoHash?: string
  /** Índice del archivo dentro del torrent. */
  fileIdx?: number
  /** URL directa (solo cuando hay debrid configurado). */
  url?: string
  behaviorHints?: {
    bingeGroup?: string
    filename?: string
  }
}

export interface TorrentioResponse {
  streams: TorrentioStream[]
}
