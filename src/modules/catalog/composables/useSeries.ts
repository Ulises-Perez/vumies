import { ref, computed, type Ref } from 'vue'
import { tmdbService } from '../services/tmdb.service'
import type { TVShow, TVShowDetails, Credits, SeasonDetails } from '../types/tmdb.types'

export function useSeries() {
  const series: Ref<TVShow[]> = ref([])
  const seriesDetails: Ref<TVShowDetails | null> = ref(null)
  const credits: Ref<Credits | null> = ref(null)
  const currentSeason: Ref<SeasonDetails | null> = ref(null)
  const recommendations: Ref<TVShow[]> = ref([])
  const similar: Ref<TVShow[]> = ref([])
  const loading = ref(false)
  const error: Ref<string | null> = ref(null)
  const currentPage = ref(1)
  const totalPages = ref(1)

  const hasSeries = computed(() => series.value.length > 0)
  const hasRecommendations = computed(() => recommendations.value.length > 0)
  const hasSimilar = computed(() => similar.value.length > 0)
  const seasons = computed(() => seriesDetails.value?.seasons || [])

  async function fetchTrendingSeries(timeWindow: 'day' | 'week' = 'day', page = 1) {
    loading.value = true
    error.value = null
    try {
      const response = await tmdbService.getTrendingTVShows(timeWindow, page)
      series.value = response.results
      currentPage.value = response.page
      totalPages.value = response.total_pages
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar series'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchPopularSeries(page = 1) {
    loading.value = true
    error.value = null
    try {
      const response = await tmdbService.getPopularTVShows(page)
      series.value = response.results
      currentPage.value = response.page
      totalPages.value = response.total_pages
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar series'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTopRatedSeries(page = 1) {
    loading.value = true
    error.value = null
    try {
      const response = await tmdbService.getTopRatedTVShows(page)
      series.value = response.results
      currentPage.value = response.page
      totalPages.value = response.total_pages
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar series'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchAiringTodaySeries(page = 1) {
    loading.value = true
    error.value = null
    try {
      const response = await tmdbService.getAiringTodayTVShows(page)
      series.value = response.results
      currentPage.value = response.page
      totalPages.value = response.total_pages
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar series'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchSeriesDetails(tvId: number) {
    loading.value = true
    error.value = null
    try {
      const [details, creditsData] = await Promise.all([
        tmdbService.getTVShowDetails(tvId),
        tmdbService.getTVShowCredits(tvId),
      ])
      seriesDetails.value = details
      credits.value = creditsData
      return details
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar detalles'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchSeasonDetails(tvId: number, seasonNumber: number) {
    loading.value = true
    error.value = null
    try {
      const season = await tmdbService.getSeasonDetails(tvId, seasonNumber)
      currentSeason.value = season as SeasonDetails
      return season as SeasonDetails
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar temporada'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchSeriesRecommendations(tvId: number, page = 1) {
    try {
      const response = await tmdbService.getTVShowRecommendations(tvId, page)
      recommendations.value = response.results
      return response
    } catch (err) {
      console.error('Error al cargar recomendaciones:', err)
      return null
    }
  }

  async function fetchSimilarSeries(tvId: number, page = 1) {
    try {
      const response = await tmdbService.getSimilarTVShows(tvId, page)
      similar.value = response.results
      return response
    } catch (err) {
      console.error('Error al cargar similares:', err)
      return null
    }
  }

  async function searchSeries(query: string, page = 1) {
    loading.value = true
    error.value = null
    try {
      const response = await tmdbService.searchTVShows(query, page)
      series.value = response.results
      currentPage.value = response.page
      totalPages.value = response.total_pages
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al buscar series'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearSeries() {
    series.value = []
    seriesDetails.value = null
    credits.value = null
    currentSeason.value = null
    recommendations.value = []
    similar.value = []
    error.value = null
  }

  return {
    // State
    series,
    seriesDetails,
    credits,
    currentSeason,
    recommendations,
    similar,
    loading,
    error,
    currentPage,
    totalPages,

    // Computed
    hasSeries,
    hasRecommendations,
    hasSimilar,
    seasons,

    // Methods
    fetchTrendingSeries,
    fetchPopularSeries,
    fetchTopRatedSeries,
    fetchAiringTodaySeries,
    fetchSeriesDetails,
    fetchSeasonDetails,
    fetchSeriesRecommendations,
    fetchSimilarSeries,
    searchSeries,
    clearSeries,
  }
}

