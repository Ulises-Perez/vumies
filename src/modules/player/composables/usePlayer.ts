import { ref, computed } from 'vue'
import { vimeusService } from '../services/vimeus.service'
import type { VimeusEmbedOptions, VimeusContentType } from '../types/vimeus.types'

export function usePlayer() {
  const currentEmbedUrl = ref<string>('')
  const isPlayerVisible = ref(false)
  const playerType = ref<VimeusContentType>('movie')

  const hasPlayer = computed(() => currentEmbedUrl.value !== '')

  function generateMovieUrl(tmdbId: number, options: Partial<VimeusEmbedOptions> = {}) {
    const embedUrl = vimeusService.getMovieEmbedUrl({
      tmdbId,
      ...options,
    })
    currentEmbedUrl.value = embedUrl
    playerType.value = 'movie'
    return embedUrl
  }

  function generateSeriesUrl(
    tmdbId: number,
    season?: number,
    episode?: number,
    options: Partial<VimeusEmbedOptions> = {}
  ) {
    const embedUrl = vimeusService.getSeriesEmbedUrl({
      tmdbId,
      season,
      episode,
      ...options,
    })
    currentEmbedUrl.value = embedUrl
    playerType.value = 'serie'
    return embedUrl
  }

  function generateAnimeUrl(
    tmdbId: number,
    season?: number,
    episode?: number,
    options: Partial<VimeusEmbedOptions> = {}
  ) {
    const embedUrl = vimeusService.getAnimeEmbedUrl({
      tmdbId,
      season,
      episode,
      ...options,
    })
    currentEmbedUrl.value = embedUrl
    playerType.value = 'anime'
    return embedUrl
  }

  function showPlayer() {
    isPlayerVisible.value = true
  }

  function hidePlayer() {
    isPlayerVisible.value = false
  }

  function togglePlayer() {
    isPlayerVisible.value = !isPlayerVisible.value
  }

  function clearPlayer() {
    currentEmbedUrl.value = ''
    isPlayerVisible.value = false
  }

  function isConfigured() {
    return vimeusService.isConfigured()
  }

  return {
    // State
    currentEmbedUrl,
    isPlayerVisible,
    playerType,

    // Computed
    hasPlayer,

    // Methods
    generateMovieUrl,
    generateSeriesUrl,
    generateEpisodeUrl: generateSeriesUrl,
    generateAnimeUrl,
    showPlayer,
    hidePlayer,
    togglePlayer,
    clearPlayer,
    isConfigured,
  }
}

