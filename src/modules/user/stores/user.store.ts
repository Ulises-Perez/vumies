import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tmdbService } from '@/modules/catalog/services/tmdb.service'

export interface FavoriteItem {
  id: number
  type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  /** Backdrop 16:9 cuando la ficha lo tenia: las tarjetas de Favoritos son 16:9. */
  backdrop_path?: string | null
  addedAt: number
}

export interface WatchHistoryItem extends FavoriteItem {
  watchedAt: number
  /**
   * Backdrop 16:9 cuando la ficha lo tenia. Las tarjetas de "Continuar viendo"
   * son 16:9 y recortar un poster 2:3 decapita al sujeto; con backdrop no hay
   * recorte. Opcional para que el historial ya guardado siga sirviendo.
   */
  backdrop_path?: string | null
  progress?: number
  /**
   * Que se reprodujo exactamente, para poder retomarlo. `kind` solo existe en
   * entradas creadas por un play real: abrir una ficha no es haber visto algo.
   */
  kind?: 'movie' | 'series' | 'anime'
  season?: number
  episode?: number
  /** Anime AV1 se identifica por slug, no por id numerico. */
  slug?: string
}

export const useUserStore = defineStore('user', () => {
  // State
  const favorites = ref<FavoriteItem[]>([])
  const watchHistory = ref<WatchHistoryItem[]>([])

  // Computed
  const hasFavorites = computed(() => favorites.value.length > 0)
  const hasHistory = computed(() => watchHistory.value.length > 0)

  // localStorage es entrada no confiable: otra version, otra pestaña o editada a
  // mano. Un JSON valido con el tipo equivocado (p.ej. "null") rompia hasFavorites
  // y dejaba la vista en blanco, asi que se valida item a item.
  const STORAGE_VERSION = 1
  const MAX_FAVORITES = 200
  const MAX_HISTORY = 50
  const storageError = ref<string | null>(null)

  function isValidItem(value: unknown): value is FavoriteItem {
    if (!value || typeof value !== 'object') return false
    const item = value as Record<string, unknown>
    return (
      typeof item.id === 'number' &&
      (item.type === 'movie' || item.type === 'tv') &&
      typeof item.title === 'string'
    )
  }

  function readList<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return []
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed.filter(isValidItem) as T[]) : []
    } catch {
      return []
    }
  }

  function loadFromStorage() {
    try {
      const version = Number(localStorage.getItem('vumies_user_v') ?? STORAGE_VERSION)
      // Version futura: no la entendemos, mejor arrancar vacio que romper.
      if (version > STORAGE_VERSION) {
        favorites.value = []
        watchHistory.value = []
        return
      }
      favorites.value = readList<FavoriteItem>('vumies_favorites')
      watchHistory.value = readList<WatchHistoryItem>('vumies_history')
    } catch {
      favorites.value = []
      watchHistory.value = []
    }
  }

  // Save to localStorage
  function saveToStorage() {
    try {
      localStorage.setItem('vumies_favorites', JSON.stringify(favorites.value))
      localStorage.setItem('vumies_history', JSON.stringify(watchHistory.value))
      localStorage.setItem('vumies_user_v', String(STORAGE_VERSION))
      storageError.value = null
    } catch (error) {
      storageError.value = 'No se pudo guardar en este navegador.'
      console.error('Error al guardar en localStorage:', error)
    }
  }

  // Favorites
  function addToFavorites(item: Omit<FavoriteItem, 'addedAt'>) {
    if (!isFavorite(item.id, item.type)) {
      favorites.value.unshift({ ...item, addedAt: Date.now() })
      if (favorites.value.length > MAX_FAVORITES) {
        favorites.value = favorites.value.slice(0, MAX_FAVORITES)
      }
      saveToStorage()
    }
  }

  function removeFromFavorites(id: number, type: 'movie' | 'tv') {
    const index = favorites.value.findIndex((f) => f.id === id && f.type === type)
    if (index !== -1) {
      favorites.value.splice(index, 1)
      saveToStorage()
    }
  }

  function toggleFavorite(item: Omit<FavoriteItem, 'addedAt'>) {
    if (isFavorite(item.id, item.type)) {
      removeFromFavorites(item.id, item.type)
    } else {
      addToFavorites(item)
    }
  }

  function isFavorite(id: number, type: 'movie' | 'tv'): boolean {
    return favorites.value.some((f) => f.id === id && f.type === type)
  }

  function clearFavorites() {
    favorites.value = []
    saveToStorage()
  }

  // Watch History
  function addToHistory(item: Omit<WatchHistoryItem, 'addedAt' | 'watchedAt'>) {
    // Una entrada por contenido: abrir el episodio 4 reemplaza al 2 de la misma
    // serie, que es justo lo que "continuar viendo" necesita mostrar.
    const index = watchHistory.value.findIndex((h) => h.id === item.id && h.type === item.type)
    if (index !== -1) {
      watchHistory.value.splice(index, 1)
    }

    // Add to beginning
    const historyItem: WatchHistoryItem = {
      ...item,
      addedAt: Date.now(), // Inherited from FavoriteItem
      watchedAt: Date.now(),
    }
    watchHistory.value.unshift(historyItem)

    if (watchHistory.value.length > MAX_HISTORY) {
      watchHistory.value = watchHistory.value.slice(0, MAX_HISTORY)
    }

    saveToStorage()
  }

  function removeFromHistory(id: number, type: 'movie' | 'tv') {
    const index = watchHistory.value.findIndex((h) => h.id === id && h.type === type)
    if (index !== -1) {
      watchHistory.value.splice(index, 1)
      saveToStorage()
    }
  }

  function clearHistory() {
    watchHistory.value = []
    saveToStorage()
  }

  let backfilling = false

  /**
   * Rellena backdrop_path de lo guardado antes de que existiera el campo: sin el,
   * la tarjeta 16:9 recorta un poster 2:3. En lotes para no saturar TMDB; lo que
   * falle (o se aborte al navegar) se reintenta en la proxima visita.
   */
  async function backfillBackdrops() {
    if (backfilling) return
    const pending = [...favorites.value, ...watchHistory.value].filter((i) => !i.backdrop_path)
    if (!pending.length) return

    backfilling = true
    let changed = false
    try {
      for (let i = 0; i < pending.length; i += 8) {
        const batch = pending.slice(i, i + 8)
        const results = await Promise.allSettled(
          batch.map(async (item) => {
            const details =
              item.type === 'movie'
                ? await tmdbService.getMovieDetails(item.id)
                : await tmdbService.getTVShowDetails(item.id)
            return { id: item.id, type: item.type, backdrop: details.backdrop_path }
          }),
        )
        for (const result of results) {
          if (result.status !== 'fulfilled') continue
          const { id, type, backdrop } = result.value
          if (!backdrop) continue
          for (const list of [favorites.value, watchHistory.value]) {
            const hit = list.find((i) => i.id === id && i.type === type)
            if (hit && !hit.backdrop_path) {
              hit.backdrop_path = backdrop
              changed = true
            }
          }
        }
      }
    } finally {
      backfilling = false
    }
    if (changed) saveToStorage()
  }

  // Initialize
  loadFromStorage()

  // Otra pestaña cambio el estado: recargar en vez de pisarlo en silencio.
  window.addEventListener('storage', (event) => {
    if (event.key === 'vumies_favorites' || event.key === 'vumies_history') {
      loadFromStorage()
    }
  })

  return {
    // State
    favorites,
    watchHistory,

    // Computed
    hasFavorites,
    hasHistory,
    storageError,

    // Actions
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    addToHistory,
    removeFromHistory,
    clearHistory,
    backfillBackdrops,
  }
})

