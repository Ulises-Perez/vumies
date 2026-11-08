// ============================================================================
// Multi-source abstraction.
// ----------------------------------------------------------------------------
// Unifies the playable web sources behind a single interface. The player asks
// "who has this content?" and shows a "Watch with…" list. Each Stream carries
// a `kind` that decides which component opens it. Web-only: there is no
// native torrent engine or native video driver in a browser.
// ============================================================================

/** Content type, agnostic to the source. */
export type MediaType = 'movie' | 'tv' | 'anime'

/** What to play. */
export interface Media {
  type: MediaType
  tmdbId: number
  /** IMDB id (`tt…`), needed by title-based sources. */
  imdbId?: string
  /** TV/anime only. */
  season?: number
  episode?: number
  /** For display/search in title-based sources. */
  title?: string
}

/** How a stream plays → decides the player component. */
export type StreamKind =
  | 'iframe' // third-party embed (Vimeus) → <iframe>
  | 'direct' // direct mp4/hls URL → <video>

/** A concrete stream the player can try to open. */
export interface Stream {
  /** Id of the source that produced it: 'vimeus' | … */
  sourceId: string
  /** Human-readable label for the "Watch with…" list. */
  label: string
  kind: StreamKind
  /** For iframe/direct. */
  url?: string
  /** Metadata for sorting/filtering. */
  quality?: '4K' | '1080p' | '720p' | 'SD' | (string & {})
  codec?: string
  /** ISO country codes (es, mx, gb…) detected from the name, for flags. */
  languages?: string[]
  /** Can the current player handle this codec without transcoding? */
  playable?: boolean
  /** Higher = prioritized earlier in the list and in auto-play. */
  weight?: number
}

/** A stream source (Vimeus, …). */
export interface StreamSource {
  id: string
  label: string
  /** Active? May look at settings or the environment. */
  isEnabled(): boolean
  /** Streams available for this content. Returns [] when it has nothing. */
  getStreams(media: Media): Promise<Stream[]>
}
