import axios, { type AxiosInstance } from 'axios'
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

class TMDBService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.TMDB.BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_CONFIG.TMDB.BEARER_TOKEN}`,
      },
    })
  }

  // Movies
  async getTrendingMovies(timeWindow: TimeWindow = 'day', page = 1): Promise<TMDBResponse<Movie>> {
    const response = await this.api.get(`/trending/movie/${timeWindow}`, {
      params: { page, language: 'es-MX' },
    })
    return response.data
  }

  async getPopularMovies(page = 1): Promise<TMDBResponse<Movie>> {
    const response = await this.api.get('/movie/popular', {
      params: { page, language: 'es-MX' },
    })
    return response.data
  }

  async getNowPlayingMovies(page = 1): Promise<TMDBResponse<Movie>> {
    const response = await this.api.get('/movie/now_playing', {
      params: { page, language: 'es-MX' },
    })
    return response.data
  }

  async getUpcomingMovies(page = 1): Promise<TMDBResponse<Movie>> {
    const response = await this.api.get('/movie/upcoming', {
      params: { page, language: 'es-MX' },
    })
    return response.data
  }

  async getTopRatedMovies(page = 1): Promise<TMDBResponse<Movie>> {
    const response = await this.api.get('/movie/top_rated', {
      params: { page, language: 'es-MX' },
    })
    return response.data
  }

  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    const response = await this.api.get(`/movie/${movieId}`, {
      params: { language: 'es-MX' },
    })
    return response.data
  }

  async getMovieCredits(movieId: number): Promise<Credits> {
    const response = await this.api.get(`/movie/${movieId}/credits`, {
      params: { language: 'es-MX' },
    })
    return response.data
  }

  async getMovieRecommendations(movieId: number, page = 1): Promise<TMDBResponse<Movie>> {
    const response = await this.api.get(`/movie/${movieId}/recommendations`, {
      params: { page, language: 'es-MX' },
    })
    return response.data
  }

  async getSimilarMovies(movieId: number, page = 1): Promise<TMDBResponse<Movie>> {
    const response = await this.api.get(`/movie/${movieId}/similar`, {
      params: { page, language: 'es-MX' },
    })
    return response.data
  }

  async getMovieVideos(movieId: number): Promise<TMDBVideosResponse> {
    const response = await this.api.get(`/movie/${movieId}/videos`, {
      params: {
        language: 'es-MX',
        include_video_language: 'es-MX,es,en'
      }
    })
    return response.data
  }

  // TV Shows
  async getTrendingTVShows(timeWindow: TimeWindow = 'day', page = 1): Promise<TMDBResponse<TVShow>> {
    const response = await this.api.get(`/trending/tv/${timeWindow}`, {
      params: { page, language: 'es-MX' },
    })
    return response.data
  }

  async getPopularTVShows(page = 1): Promise<TMDBResponse<TVShow>> {
    const response = await this.api.get('/tv/popular', {
      params: { page, language: 'es-MX' },
    })
    return response.data
  }

  async getTopRatedTVShows(page = 1): Promise<TMDBResponse<TVShow>> {
    const response = await this.api.get('/tv/top_rated', {
      params: { page, language: 'es-MX' },
    })
    return response.data
  }

  async getAiringTodayTVShows(page = 1): Promise<TMDBResponse<TVShow>> {
    const response = await this.api.get('/tv/airing_today', {
      params: { page, language: 'es-MX' },
    })
    return response.data
  }

  async getOnTheAirTVShows(page = 1): Promise<TMDBResponse<TVShow>> {
    const response = await this.api.get('/tv/on_the_air', {
      params: { page, language: 'es-MX' },
    })
    return response.data
  }

  // Animes
  async getPopularAnimes(page = 1): Promise<TMDBResponse<TVShow>> {
    const response = await this.api.get('/discover/tv', {
      params: {
        page,
        language: 'es-MX',
        with_genres: 16,
        with_original_language: 'ja',
        sort_by: 'popularity.desc',
      },
    })
    return response.data
  }

  async getTopRatedAnimes(page = 1): Promise<TMDBResponse<TVShow>> {
    const response = await this.api.get('/discover/tv', {
      params: {
        page,
        language: 'es-MX',
        with_genres: 16,
        with_original_language: 'ja',
        sort_by: 'vote_average.desc',
        'vote_count.gte': 100,
      },
    })
    return response.data
  }

  async getTVShowDetails(tvId: number): Promise<TVShowDetails> {
    const response = await this.api.get(`/tv/${tvId}`, {
      params: { language: 'es-MX' },
    })
    return response.data
  }

  async getTVShowCredits(tvId: number): Promise<Credits> {
    const response = await this.api.get(`/tv/${tvId}/credits`, {
      params: { language: 'es-MX' },
    })
    return response.data
  }

  async getTVShowRecommendations(tvId: number, page = 1): Promise<TMDBResponse<TVShow>> {
    const response = await this.api.get(`/tv/${tvId}/recommendations`, {
      params: { page, language: 'es-MX' },
    })
    return response.data
  }

  async getSimilarTVShows(tvId: number, page = 1): Promise<TMDBResponse<TVShow>> {
    const response = await this.api.get(`/tv/${tvId}/similar`, {
      params: { page, language: 'es-MX' },
    })
    return response.data
  }

  async getSeasonDetails(tvId: number, seasonNumber: number): Promise<Season> {
    const response = await this.api.get(`/tv/${tvId}/season/${seasonNumber}`, {
      params: { language: 'es-MX' },
    })
    return response.data
  }

  async getTVShowVideos(tvId: number): Promise<TMDBVideosResponse> {
    const response = await this.api.get(`/tv/${tvId}/videos`)
    return response.data
  }

  // Genres
  async getMovieGenres(): Promise<TMDBGenresResponse> {
    const response = await this.api.get('/genre/movie/list', {
      params: { language: 'es-MX' },
    })
    return response.data
  }

  async getTVGenres(): Promise<TMDBGenresResponse> {
    const response = await this.api.get('/genre/tv/list', {
      params: { language: 'es-MX' },
    })
    return response.data
  }

  async discoverMoviesByGenre(genreId: number, page = 1): Promise<TMDBResponse<Movie>> {
    const response = await this.api.get('/discover/movie', {
      params: {
        with_genres: genreId,
        page,
        language: 'es-MX',
        sort_by: 'popularity.desc',
      },
    })
    return response.data
  }

  async discoverTVShowsByGenre(genreId: number, page = 1): Promise<TMDBResponse<TVShow>> {
    const response = await this.api.get('/discover/tv', {
      params: {
        with_genres: genreId,
        page,
        language: 'es-MX',
        sort_by: 'popularity.desc',
      },
    })
    return response.data
  }

  // Search
  async searchMulti(query: string, page = 1): Promise<TMDBResponse<Movie | TVShow>> {
    const response = await this.api.get('/search/multi', {
      params: { query, page, language: 'es-MX' },
    })
    return response.data
  }

  async searchMovies(query: string, page = 1): Promise<TMDBResponse<Movie>> {
    const response = await this.api.get('/search/movie', {
      params: { query, page, language: 'es-MX' },
    })
    return response.data
  }

  async searchTVShows(query: string, page = 1): Promise<TMDBResponse<TVShow>> {
    const response = await this.api.get('/search/tv', {
      params: { query, page, language: 'es-MX' },
    })
    return response.data
  }
}

export const tmdbService = new TMDBService()
export default tmdbService

