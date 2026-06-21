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
  TimeWindow,
} from '../types/tmdb.types'

type Params = Record<string, string | number | boolean | undefined>

/**
 * Cliente TMDB sobre fetch nativo (antes axios).
 * Motivo: axios entraba en el chunk inicial vía App.vue -> app.store -> tmdb.service,
 * aunque la página de anime use fetch nativo. Aquí axios solo aportaba baseURL,
 * header Bearer, serialización de params y `.data`; todo replicable con fetch.
 */
class TMDBService {
  private baseURL = API_CONFIG.TMDB.BASE_URL.replace(/\/$/, '')
  private headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_CONFIG.TMDB.BEARER_TOKEN}`,
  }

  private async get<T>(path: string, params?: Params): Promise<T> {
    const url = new URL(this.baseURL + path)
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, String(v))
      }
    }
    const res = await fetch(url, { headers: this.headers })
    if (!res.ok) throw new Error(`TMDB ${res.status} ${res.statusText} @ ${path}`)
    return res.json() as Promise<T>
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
  searchMulti(query: string, page = 1): Promise<TMDBResponse<Movie | TVShow>> {
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
