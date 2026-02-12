import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Genre } from '@/modules/catalog/types/tmdb.types'
import { tmdbService } from '@/modules/catalog/services/tmdb.service'

export const useAppStore = defineStore('app', () => {
  // State
  const movieGenres = ref<Genre[]>([])
  const tvGenres = ref<Genre[]>([])
  const loading = ref(false)
  const searchQuery = ref('')
  const isSearchActive = ref(false)

  // Computed
  const hasGenres = computed(() => movieGenres.value.length > 0 || tvGenres.value.length > 0)

  // Actions
  async function fetchGenres() {
    if (hasGenres.value) return

    loading.value = true
    try {
      const [movieGenresData, tvGenresData] = await Promise.all([
        tmdbService.getMovieGenres(),
        tmdbService.getTVGenres(),
      ])
      movieGenres.value = movieGenresData.genres
      tvGenres.value = tvGenresData.genres
    } catch (error) {
      console.error('Error al cargar géneros:', error)
    } finally {
      loading.value = false
    }
  }

  function getMovieGenreNames(genreIds: number[]): string[] {
    return genreIds
      .map((id) => movieGenres.value.find((g) => g.id === id)?.name)
      .filter((name): name is string => !!name)
  }

  function getTVGenreNames(genreIds: number[]): string[] {
    return genreIds
      .map((id) => tvGenres.value.find((g) => g.id === id)?.name)
      .filter((name): name is string => !!name)
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function toggleSearch() {
    isSearchActive.value = !isSearchActive.value
    if (!isSearchActive.value) {
      searchQuery.value = ''
    }
  }

  function openSearch() {
    isSearchActive.value = true
  }

  function closeSearch() {
    isSearchActive.value = false
    searchQuery.value = ''
  }

  return {
    // State
    movieGenres,
    tvGenres,
    loading,
    searchQuery,
    isSearchActive,

    // Computed
    hasGenres,

    // Actions
    fetchGenres,
    getMovieGenreNames,
    getTVGenreNames,
    setSearchQuery,
    toggleSearch,
    openSearch,
    closeSearch,
  }
})

