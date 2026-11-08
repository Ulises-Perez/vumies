import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchVimeusListing } from '@/modules/player/services/vimeus.api'
import type { VimeusAnime } from '@/modules/player/types/vimeus.types'

/**
 * Store que obtiene los TMDB IDs de todo el catálogo de anime de Vimeus
 * (`GET /api/listing/animes`) y permite saber si un ID de TMDB corresponde a un
 * anime. Así las series catalogadas como anime se enrutan a `/e/anime` en lugar
 * de `/e/serie`.
 *
 * The request goes through the Deno server proxy (`/api/vimeus/listing/*`):
 * the API Key never reaches the client.
 */

/** Tope defensivo de páginas: evita un bucle infinito si la API miente en `total_pages`. */
const MAX_PAGES = 200

export const useAnimeStore = defineStore('anime', () => {
    const animeTmdbIds = ref<Set<number>>(new Set())
    const loaded = ref(false)
    const loading = ref(false)

    const isLoaded = computed(() => loaded.value)

    /**
     * ¿Este TMDB ID pertenece al catálogo de anime de Vimeus?
     */
    function isAnime(tmdbId: number): boolean {
        return animeTmdbIds.value.has(tmdbId)
    }

    /**
     * Descarga el catálogo completo de anime (paginado, 50 por página).
     */
    async function fetchAnimeIds() {
        if (loaded.value || loading.value) return
        loading.value = true

        const ids = new Set<number>()
        let currentPage = 1
        let totalPages = 1

        try {
            while (currentPage <= totalPages && currentPage <= MAX_PAGES) {
                const response = await fetchVimeusListing<VimeusAnime>('animes', {
                    page: currentPage,
                })

                if (response.error) {
                    console.warn(`Vimeus anime listing failed at page ${currentPage}: ${response.message}`)
                    break
                }

                for (const anime of response.data?.animes ?? []) {
                    if (anime.tmdb_id) {
                        ids.add(anime.tmdb_id)
                    }
                }

                const reportedPages = response.data?.pagination?.total_pages
                totalPages = typeof reportedPages === 'number' && reportedPages > 0
                    ? Math.min(reportedPages, MAX_PAGES)
                    : 1
                currentPage++
            }

            animeTmdbIds.value = ids
            loaded.value = true
            console.log(`[AnimeStore] Loaded ${ids.size} anime TMDB IDs from Vimeus`)
        } catch (error) {
            console.error('[AnimeStore] Error fetching anime IDs:', error)
        } finally {
            loading.value = false
        }
    }

    return {
        animeTmdbIds,
        loaded,
        loading,
        isLoaded,
        isAnime,
        fetchAnimeIds,
    }
})
