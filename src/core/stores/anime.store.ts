import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { API_CONFIG } from '@/core/config/api.config'

/**
 * Store that fetches all anime TMDB IDs from the Vimeus API
 * and provides a lookup method to check if a TMDB ID is an anime.
 * This ensures that TV shows cataloged as anime in Vimeus are
 * correctly routed to /e/anime instead of /e/serie.
 */
export const useAnimeStore = defineStore('anime', () => {
    const animeTmdbIds = ref<Set<number>>(new Set())
    const loaded = ref(false)
    const loading = ref(false)

    const isLoaded = computed(() => loaded.value)

    /**
     * Check if a TMDB ID belongs to an anime according to Vimeus catalog
     */
    function isAnime(tmdbId: number): boolean {
        return animeTmdbIds.value.has(tmdbId)
    }

    /**
     * Fetch all anime TMDB IDs from Vimeus API (paginated)
     */
    async function fetchAnimeIds() {
        if (loaded.value || loading.value) return
        loading.value = true

        const ids = new Set<number>()
        let currentPage = 1
        let totalPages = 1

        try {
            while (currentPage <= totalPages) {
                const response = await fetch(
                    `${API_CONFIG.VIMEUS.BASE_URL}/api/listing/animes?page=${currentPage}`,
                    {
                        headers: {
                            'X-API-Key': API_CONFIG.VIMEUS.API_KEY,
                            'Accept': 'application/json',
                        },
                    }
                )

                if (!response.ok) {
                    console.warn(`Vimeus anime listing failed at page ${currentPage}:`, response.status)
                    break
                }

                const data = await response.json()

                if (data.error || !data.data?.result) {
                    break
                }

                for (const anime of data.data.result) {
                    if (anime.tmdb_id) {
                        ids.add(anime.tmdb_id)
                    }
                }

                // data.pages is the total number of pages (a number)
                totalPages = typeof data.data.pages === 'number' ? data.data.pages : 1
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
