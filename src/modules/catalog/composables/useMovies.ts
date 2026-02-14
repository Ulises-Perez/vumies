import { ref, computed, type Ref } from 'vue'
import { tmdbService } from '../services/tmdb.service'
import type { Movie, MovieDetails, Credits } from '../types/tmdb.types'

export function useMovies() {
  const movies: Ref<Movie[]> = ref([])
  const movieDetails: Ref<MovieDetails | null> = ref(null)
  const credits: Ref<Credits | null> = ref(null)
  const recommendations: Ref<Movie[]> = ref([])
  const similar: Ref<Movie[]> = ref([])
  const loading = ref(false)
  const error: Ref<string | null> = ref(null)
  const currentPage = ref(1)
  const totalPages = ref(1)

  const genres: Ref<{ id: number; name: string }[]> = ref([])

  const hasMovies = computed(() => movies.value.length > 0)
  const hasRecommendations = computed(() => recommendations.value.length > 0)
  const hasSimilar = computed(() => similar.value.length > 0)
  const hasGenres = computed(() => genres.value.length > 0)

  async function fetchTrendingMovies(timeWindow: 'day' | 'week' = 'day', page = 1) {
    loading.value = true
    error.value = null
    try {
      const response = await tmdbService.getTrendingMovies(timeWindow, page)
      movies.value = response.results
      currentPage.value = response.page
      totalPages.value = response.total_pages
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar películas'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchPopularMovies(page = 1) {
    loading.value = true
    error.value = null
    try {
      const response = await tmdbService.getPopularMovies(page)
      movies.value = response.results
      currentPage.value = response.page
      totalPages.value = response.total_pages
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar películas'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchNowPlayingMovies(page = 1) {
    loading.value = true
    error.value = null
    try {
      const response = await tmdbService.getNowPlayingMovies(page)
      movies.value = response.results
      currentPage.value = response.page
      totalPages.value = response.total_pages
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar películas'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchUpcomingMovies(page = 1) {
    loading.value = true
    error.value = null
    try {
      const response = await tmdbService.getUpcomingMovies(page)
      movies.value = response.results
      currentPage.value = response.page
      totalPages.value = response.total_pages
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar películas'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTopRatedMovies(page = 1) {
    loading.value = true
    error.value = null
    try {
      const response = await tmdbService.getTopRatedMovies(page)
      movies.value = response.results
      currentPage.value = response.page
      totalPages.value = response.total_pages
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar películas'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchMovieDetails(movieId: number) {
    loading.value = true
    error.value = null
    try {
      const [details, creditsData] = await Promise.all([
        tmdbService.getMovieDetails(movieId),
        tmdbService.getMovieCredits(movieId),
      ])
      movieDetails.value = details
      credits.value = creditsData
      return details
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar detalles'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchMovieRecommendations(movieId: number, page = 1) {
    try {
      const response = await tmdbService.getMovieRecommendations(movieId, page)
      recommendations.value = response.results
      return response
    } catch (err) {
      console.error('Error al cargar recomendaciones:', err)
      return null
    }
  }

  async function fetchSimilarMovies(movieId: number, page = 1) {
    try {
      const response = await tmdbService.getSimilarMovies(movieId, page)
      similar.value = response.results
      return response
    } catch (err) {
      console.error('Error al cargar similares:', err)
      return null
    }
  }

  async function fetchMovieVideos(movieId: number) {
    try {
      const response = await tmdbService.getMovieVideos(movieId)
      return response.results
    } catch (err) {
      console.error('Error al cargar videos:', err)
      return []
    }
  }

  async function fetchGenres() {
    try {
      const response = await tmdbService.getMovieGenres()
      genres.value = response.genres
      return response.genres
    } catch (err) {
      console.error('Error al cargar géneros:', err)
      return []
    }
  }

  async function searchMovies(query: string, page = 1) {
    loading.value = true
    error.value = null
    try {
      const response = await tmdbService.searchMovies(query, page)
      movies.value = response.results
      currentPage.value = response.page
      totalPages.value = response.total_pages
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al buscar películas'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearMovies() {
    movies.value = []
    movieDetails.value = null
    credits.value = null
    recommendations.value = []
    similar.value = []
    error.value = null
  }

  return {
    // State
    movies,
    movieDetails,
    credits,
    recommendations,
    similar,
    loading,
    error,
    currentPage,
    totalPages,

    // Computed
    hasMovies,
    hasRecommendations,
    hasSimilar,

    // Methods
    fetchTrendingMovies,
    fetchPopularMovies,
    fetchNowPlayingMovies,
    fetchUpcomingMovies,
    fetchTopRatedMovies,
    fetchMovieDetails,
    fetchMovieRecommendations,
    fetchSimilarMovies,
    fetchMovieVideos,
    fetchMoviesByGenre: async (genreId: number, page = 1) => {
      try {
        const response = await tmdbService.discoverMoviesByGenre(genreId, page)
        return response.results
      } catch (err) {
        console.error('Error al cargar películas por género:', err)
        return []
      }
    },
    hasGenres,
    genres,
    fetchGenres,
    searchMovies,
    clearMovies,
  }
}

