import { ref, computed, type Ref } from 'vue'
import { tmdbService } from '../services/tmdb.service'
import type { TVShow } from '../types/tmdb.types'

export function useAnimes() {
    const animes: Ref<TVShow[]> = ref([])
    const loading = ref(false)
    const error: Ref<string | null> = ref(null)
    const currentPage = ref(1)
    const totalPages = ref(1)

    const hasAnimes = computed(() => animes.value.length > 0)

    async function fetchPopularAnimes(page = 1) {
        loading.value = true
        error.value = null
        try {
            const response = await tmdbService.getPopularAnimes(page)
            animes.value = response.results
            currentPage.value = response.page
            totalPages.value = response.total_pages
            return response
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Error al cargar animes'
            throw err
        } finally {
            loading.value = false
        }
    }

    async function fetchTopRatedAnimes(page = 1) {
        loading.value = true
        error.value = null
        try {
            const response = await tmdbService.getTopRatedAnimes(page)
            animes.value = response.results
            currentPage.value = response.page
            totalPages.value = response.total_pages
            return response
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Error al cargar animes'
            throw err
        } finally {
            loading.value = false
        }
    }

    function clearAnimes() {
        animes.value = []
        error.value = null
    }

    return {
        animes,
        loading,
        error,
        currentPage,
        totalPages,
        hasAnimes,
        fetchPopularAnimes,
        fetchTopRatedAnimes,
        clearAnimes,
    }
}
