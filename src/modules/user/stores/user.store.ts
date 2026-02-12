import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface FavoriteItem {
  id: number
  type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  addedAt: number
}

interface WatchHistoryItem extends FavoriteItem {
  watchedAt: number
  progress?: number
}

export const useUserStore = defineStore('user', () => {
  // State
  const favorites = ref<FavoriteItem[]>([])
  const watchHistory = ref<WatchHistoryItem[]>([])

  // Computed
  const hasFavorites = computed(() => favorites.value.length > 0)
  const hasHistory = computed(() => watchHistory.value.length > 0)

  // Load from localStorage
  function loadFromStorage() {
    try {
      const storedFavorites = localStorage.getItem('vumies_favorites')
      const storedHistory = localStorage.getItem('vumies_history')

      if (storedFavorites) {
        favorites.value = JSON.parse(storedFavorites)
      }
      if (storedHistory) {
        watchHistory.value = JSON.parse(storedHistory)
      }
    } catch (error) {
      console.error('Error al cargar desde localStorage:', error)
    }
  }

  // Save to localStorage
  function saveToStorage() {
    try {
      localStorage.setItem('vumies_favorites', JSON.stringify(favorites.value))
      localStorage.setItem('vumies_history', JSON.stringify(watchHistory.value))
    } catch (error) {
      console.error('Error al guardar en localStorage:', error)
    }
  }

  // Favorites
  function addToFavorites(item: Omit<FavoriteItem, 'addedAt'>) {
    if (!isFavorite(item.id, item.type)) {
      favorites.value.unshift({ ...item, addedAt: Date.now() })
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
    // Remove if already exists
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

    // Keep only last 50 items
    if (watchHistory.value.length > 50) {
      watchHistory.value = watchHistory.value.slice(0, 50)
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

  // Initialize
  loadFromStorage()

  return {
    // State
    favorites,
    watchHistory,

    // Computed
    hasFavorites,
    hasHistory,

    // Actions
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    addToHistory,
    removeFromHistory,
    clearHistory,
  }
})

