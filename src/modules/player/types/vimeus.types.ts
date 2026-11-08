// Vimeus Types
export interface VimeusEmbedOptions {
  tmdbId?: number
  imdbId?: string
  season?: number
  episode?: number
  theme?: string
  logoUrl?: string
  primaryColor?: string
}

export interface VimeusMovie {
  id: number
  content_type: 'movie'
  tmdb_id: number
  imdb_id: string
  title: string
  poster: string
  backdrop: string
  synced_at: string
}

export interface VimeusSeries {
  id: number
  content_type: 'series'
  tmdb_id: number
  imdb_id: string
  title: string
  poster: string
  backdrop: string
  total_seasons: number
  total_episodes: number
  synced_at: string
}

export interface VimeusAnime {
  id: number
  content_type: 'anime'
  tmdb_id: number
  imdb_id: string
  title: string
  poster: string
  backdrop: string
  total_seasons: number
  total_episodes: number
  synced_at: string
}

export interface VimeusEpisode {
  id: number
  content_type: 'series' | 'anime'
  tmdb_id: number
  imdb_id: string
  title: string
  poster: string
  backdrop: string
  season: number
  episode: number
  synced_at: string
}

export interface VimeusPagination {
  current_page: number
  total_pages: number
  total_results: number
  per_page: number
  has_next: boolean
  has_prev: boolean
}

/** Endpoints de listado documentados por Vimeus. */
export type VimeusListingKind = 'movies' | 'series' | 'animes' | 'episodes'

/** Parameters accepted by the listing API (sent to the same-origin Deno proxy as snake_case query params). */
export interface VimeusListingQuery {
  /** Página a recuperar (50 resultados por página). */
  page?: number
  /** Filtra episodios por ID de TMDB. */
  tmdbId?: number
  /** Filtra episodios por temporada; requiere `tmdbId`. */
  season?: number
  /** Restringe a contenido con al menos un embed compatible con CF token. */
  withCf?: boolean
}

export interface VimeusListResponse<T> {
  error: boolean
  message: string
  data: {
    movies?: T[]
    series?: T[]
    animes?: T[]
    episodes?: T[]
    pagination: VimeusPagination
  }
}

export type VimeusContentType = 'movie' | 'serie' | 'anime'

