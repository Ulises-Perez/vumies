import { ref, computed, type Ref } from 'vue'
import { animeav1Service } from '../services/animeav1.service'
import type {
  AV1AnimeCard,
  AV1AnimeInfo,
  AV1EpisodeLinks,
  AV1Franchise,
  AV1RecentEpisode,
} from '../types/animeav1.types'

/**
 * Composable para consumir la API de animeav1 (scraping propio).
 * Fuente principal de animes en Vumies.
 */
export function useAnimeAV1() {
  const loading = ref(false)
  const error: Ref<string | null> = ref(null)

  const recentEpisodes: Ref<AV1RecentEpisode[]> = ref([])
  const recentAnime: Ref<AV1AnimeCard[]> = ref([])
  const catalog: Ref<AV1AnimeCard[]> = ref([])
  const currentPage = ref(1)
  const totalPages = ref(1)

  const animeInfo: Ref<AV1AnimeInfo | null> = ref(null)
  const episodeLinks: Ref<AV1EpisodeLinks | null> = ref(null)
  const franchise: Ref<AV1Franchise | null> = ref(null)

  const hasCatalog = computed(() => catalog.value.length > 0)

  async function fetchRecents() {
    loading.value = true
    error.value = null
    try {
      const data = await animeav1Service.getRecents()
      recentEpisodes.value = data.recent_episodes
      recentAnime.value = data.recent_anime
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar recientes'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCatalog(page = 1, genre = '') {
    loading.value = true
    error.value = null
    try {
      const data = await animeav1Service.getCatalog(page, genre)
      catalog.value = data.results
      currentPage.value = data.page
      totalPages.value = data.total_pages ?? 1
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar catálogo'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchAnimeInfo(slug: string) {
    loading.value = true
    error.value = null
    animeInfo.value = null
    try {
      const data = await animeav1Service.getAnimeInfoBySlug(slug)
      animeInfo.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar el anime'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchEpisode(slug: string, episode: number | string) {
    loading.value = true
    error.value = null
    episodeLinks.value = null
    try {
      const data = await animeav1Service.getEpisodeBySlug(slug, episode)
      episodeLinks.value = data
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar el episodio'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchFranchise(slug: string) {
    try {
      const data = await animeav1Service.getFranchise(slug)
      franchise.value = data
      return data
    } catch {
      // La franquicia es opcional: si falla, no rompe la vista
      franchise.value = { current: slug, seasons: [] }
      return franchise.value
    }
  }

  async function search(query: string): Promise<AV1AnimeCard[]> {
    loading.value = true
    error.value = null
    try {
      return await animeav1Service.searchAnimes(query)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error en la búsqueda'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    recentEpisodes,
    recentAnime,
    catalog,
    currentPage,
    totalPages,
    hasCatalog,
    animeInfo,
    episodeLinks,
    franchise,
    fetchRecents,
    fetchCatalog,
    fetchAnimeInfo,
    fetchEpisode,
    fetchFranchise,
    search,
  }
}
