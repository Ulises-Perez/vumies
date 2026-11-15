import { API_CONFIG } from '@/core/config/api.config'
import type {
  Movie,
  TVShow,
  MovieDetails,
  TVShowDetails,
  TMDBResponse,
  TMDBGenresResponse,
  Credits,
  Season,
  TMDBVideosResponse,
  TMDBImagesResponse,
  TimeWindow,
  MultiSearchItem,
} from '../types/tmdb.types'

type Params = Record<string, string | number | boolean | undefined>

/** Response of /{movie|tv}/{id}/external_ids (we only use imdb_id). */
export interface TMDBExternalIds {
  id: number
  imdb_id: string | null
}

/**
 * Cliente TMDB sobre fetch nativo (antes axios).
 * Motivo: axios entraba en el chunk inicial vía App.vue -> app.store -> tmdb.service,
 * aunque la página de anime use fetch nativo. Aquí axios solo aportaba baseURL,
 * header Bearer, serialización de params y `.data`; todo replicable con fetch.
 */
/** Tope por request: sin esto una conexion colgada deja el esqueleto para siempre. */
const TMDB_TIMEOUT_MS = 12_000
/** Estados transitorios que valen un reintento inmediato (rate limit incluido). */
const TMDB_RETRY_DELAY_MS = 300

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

class TMDBService {
  private baseURL = API_CONFIG.TMDB.BASE_URL.replace(/\/$/, '')
  private headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_CONFIG.TMDB.BEARER_TOKEN}`,
  }

  /**
   * Requests en vuelo por URL. Dos consumidores que piden lo mismo mientras la
   * primera esta abierta (portada, ficha, recomendaciones) comparten una sola
   * request; la entrada se borra al resolver, asi que la frescura no cambia.
   */
  private inFlight = new Map<string, Promise<unknown>>()

  /**
   * Respuestas recientes por URL. Navegar y volver (o montar dos vistas que piden
   * lo mismo) no debe volver a pegarle a TMDB; 5 min es mas que suficiente para
   * que el usuario no note datos viejos.
   */
  private cache = new Map<string, { at: number; value: Promise<unknown> }>()
  private static readonly CACHE_TTL_MS = 5 * 60_000
  private static readonly CACHE_MAX = 100

  /** Requests en vuelo, para cancelarlas al cambiar de ruta. */
  private controllers = new Set<AbortController>()

  /** Corta lo que quedo en vuelo: la vista vieja ya no puede pisar a la nueva. */
  abortAll(): void {
    for (const controller of this.controllers) controller.abort()
    this.controllers.clear()
  }

  private get<T>(path: string, params?: Params): Promise<T> {
    const url = new URL(this.baseURL + path)
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, String(v))
      }
    }

    const href = url.toString()
    const pending = this.inFlight.get(href)
    if (pending) return pending as Promise<T>

    const cached = this.cache.get(href)
    if (cached && Date.now() - cached.at < TMDBService.CACHE_TTL_MS) {
      return cached.value as Promise<T>
    }

    const request = this.request<T>(url, path).finally(() => this.inFlight.delete(href))
    this.inFlight.set(href, request)
    // Un fallo no se cachea: el proximo intento vuelve a pedir.
    request.catch(() => this.cache.delete(href))
    if (this.cache.size >= TMDBService.CACHE_MAX) {
      const oldest = this.cache.keys().next().value
      if (oldest !== undefined) this.cache.delete(oldest)
    }
    this.cache.set(href, { at: Date.now(), value: request })
    return request
  }

  private async request<T>(url: URL, path: string): Promise<T> {
    const controller = new AbortController()
    this.controllers.add(controller)
    const timeoutSignal =
      typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(TMDB_TIMEOUT_MS) : undefined
    const signal =
      timeoutSignal && typeof AbortSignal.any === 'function'
        ? AbortSignal.any([controller.signal, timeoutSignal])
        : controller.signal
    try {
      return await this.requestWithRetry<T>(url, path, signal)
    } finally {
      this.controllers.delete(controller)
    }
  }

  private async requestWithRetry<T>(url: URL, path: string, signal: AbortSignal): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await fetch(url, { headers: this.headers, signal })
        if (!res.ok) {
          if (attempt === 0 && (res.status === 429 || res.status >= 500)) {
            await sleep(TMDB_RETRY_DELAY_MS)
            continue
          }
          throw new Error(`TMDB ${res.status} ${res.statusText} @ ${path}`)
        }
        return (await res.json()) as T
      } catch (error) {
        // Cancelado por navegacion: no es un fallo, no se reintenta.
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        // Solo se reintenta un rechazo de red: un timeout ya consumio su ventana
        // y reintentarlo duplica la espera sin cambiar el resultado.
        if (attempt === 0 && error instanceof TypeError) {
          await sleep(TMDB_RETRY_DELAY_MS)
          continue
        }
        throw error
      }
    }
  }

  // Movies
  getTrendingMovies(timeWindow: TimeWindow = 'day', page = 1): Promise<TMDBResponse<Movie>> {
    return this.get(`/trending/movie/${timeWindow}`, { page, language: 'es-MX' })
  }

  getPopularMovies(page = 1): Promise<TMDBResponse<Movie>> {
    return this.get('/movie/popular', { page, language: 'es-MX' })
  }

  getNowPlayingMovies(page = 1): Promise<TMDBResponse<Movie>> {
    return this.get('/movie/now_playing', { page, language: 'es-MX' })
  }

  getUpcomingMovies(page = 1): Promise<TMDBResponse<Movie>> {
    return this.get('/movie/upcoming', { page, language: 'es-MX' })
  }

  getTopRatedMovies(page = 1): Promise<TMDBResponse<Movie>> {
    return this.get('/movie/top_rated', { page, language: 'es-MX' })
  }

  getMovieDetails(movieId: number): Promise<MovieDetails> {
    return this.get(`/movie/${movieId}`, { language: 'es-MX' })
  }

  getMovieCredits(movieId: number): Promise<Credits> {
    return this.get(`/movie/${movieId}/credits`, { language: 'es-MX' })
  }

  getMovieRecommendations(movieId: number, page = 1): Promise<TMDBResponse<Movie>> {
    return this.get(`/movie/${movieId}/recommendations`, { page, language: 'es-MX' })
  }

  getSimilarMovies(movieId: number, page = 1): Promise<TMDBResponse<Movie>> {
    return this.get(`/movie/${movieId}/similar`, { page, language: 'es-MX' })
  }

  getMovieVideos(movieId: number): Promise<TMDBVideosResponse> {
    return this.get(`/movie/${movieId}/videos`, {
      language: 'es-MX',
      include_video_language: 'es-MX,es,en',
    })
  }

  // TV Shows
  getTrendingTVShows(timeWindow: TimeWindow = 'day', page = 1): Promise<TMDBResponse<TVShow>> {
    return this.get(`/trending/tv/${timeWindow}`, { page, language: 'es-MX' })
  }

  getPopularTVShows(page = 1): Promise<TMDBResponse<TVShow>> {
    return this.get('/tv/popular', { page, language: 'es-MX' })
  }

  getTopRatedTVShows(page = 1): Promise<TMDBResponse<TVShow>> {
    return this.get('/tv/top_rated', { page, language: 'es-MX' })
  }

  getAiringTodayTVShows(page = 1): Promise<TMDBResponse<TVShow>> {
    return this.get('/tv/airing_today', { page, language: 'es-MX' })
  }

  getOnTheAirTVShows(page = 1): Promise<TMDBResponse<TVShow>> {
    return this.get('/tv/on_the_air', { page, language: 'es-MX' })
  }

  // Animes
  getPopularAnimes(page = 1): Promise<TMDBResponse<TVShow>> {
    return this.get('/discover/tv', {
      page,
      language: 'es-MX',
      with_genres: 16,
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
    })
  }

  getTopRatedAnimes(page = 1): Promise<TMDBResponse<TVShow>> {
    return this.get('/discover/tv', {
      page,
      language: 'es-MX',
      with_genres: 16,
      with_original_language: 'ja',
      sort_by: 'vote_average.desc',
      'vote_count.gte': 100,
    })
  }

  getTVShowDetails(tvId: number): Promise<TVShowDetails> {
    return this.get(`/tv/${tvId}`, { language: 'es-MX' })
  }

  getTVShowCredits(tvId: number): Promise<Credits> {
    return this.get(`/tv/${tvId}/credits`, { language: 'es-MX' })
  }

  getTVShowRecommendations(tvId: number, page = 1): Promise<TMDBResponse<TVShow>> {
    return this.get(`/tv/${tvId}/recommendations`, { page, language: 'es-MX' })
  }

  getSimilarTVShows(tvId: number, page = 1): Promise<TMDBResponse<TVShow>> {
    return this.get(`/tv/${tvId}/similar`, { page, language: 'es-MX' })
  }

  getSeasonDetails(tvId: number, seasonNumber: number): Promise<Season> {
    return this.get(`/tv/${tvId}/season/${seasonNumber}`, { language: 'es-MX' })
  }

  getTVShowVideos(tvId: number): Promise<TMDBVideosResponse> {
    return this.get(`/tv/${tvId}/videos`)
  }

  // Images (logos del título para la portada del reproductor, etc.)
  getMovieImages(movieId: number): Promise<TMDBImagesResponse> {
    return this.get(`/movie/${movieId}/images`, { include_image_language: 'es,en,null' })
  }

  getTVImages(tvId: number): Promise<TMDBImagesResponse> {
    return this.get(`/tv/${tvId}/images`, { include_image_language: 'es,en,null' })
  }

  // External IDs (IMDB, etc.)
  getMovieExternalIds(movieId: number): Promise<TMDBExternalIds> {
    return this.get(`/movie/${movieId}/external_ids`)
  }

  getTVShowExternalIds(tvId: number): Promise<TMDBExternalIds> {
    return this.get(`/tv/${tvId}/external_ids`)
  }

  // Genres
  getMovieGenres(): Promise<TMDBGenresResponse> {
    return this.get('/genre/movie/list', { language: 'es-MX' })
  }

  getTVGenres(): Promise<TMDBGenresResponse> {
    return this.get('/genre/tv/list', { language: 'es-MX' })
  }

  discoverMoviesByGenre(genreId: number, page = 1): Promise<TMDBResponse<Movie>> {
    return this.get('/discover/movie', {
      with_genres: genreId,
      page,
      language: 'es-MX',
      sort_by: 'popularity.desc',
    })
  }

  discoverTVShowsByGenre(genreId: number, page = 1): Promise<TMDBResponse<TVShow>> {
    return this.get('/discover/tv', {
      with_genres: genreId,
      page,
      language: 'es-MX',
      sort_by: 'popularity.desc',
    })
  }

  // Search
  searchMulti(query: string, page = 1): Promise<TMDBResponse<MultiSearchItem>> {
    return this.get('/search/multi', { query, page, language: 'es-MX' })
  }

  searchMovies(query: string, page = 1): Promise<TMDBResponse<Movie>> {
    return this.get('/search/movie', { query, page, language: 'es-MX' })
  }

  searchTVShows(query: string, page = 1): Promise<TMDBResponse<TVShow>> {
    return this.get('/search/tv', { query, page, language: 'es-MX' })
  }
}

export const tmdbService = new TMDBService()
export default tmdbService
