<template>
  <div class="min-h-screen bg-dark pb-20">
    <LoadingSpinner v-if="searching" message="Buscando..." />
    
    <div v-else-if="heroItem">
        <!-- Hero Section (Best Match) -->
        <section class="relative h-[60vh] w-full overflow-hidden">
          <div
            class="absolute inset-0 bg-cover bg-center transition-all duration-700"
            :style="{ backgroundImage: `url(${heroBackdrop})` }"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
            <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/40 to-transparent" />
          </div>

          <div class="absolute inset-0 flex items-center">
            <div class="container-custom">
              <div class="max-w-3xl space-y-6">
                <span class="inline-block px-3 py-1 bg-primary/80 backdrop-blur-md border border-primary/30 rounded-full text-white text-sm font-medium mb-2">
                  Mejor Resultado
                </span>
                <h1 class="text-4xl md:text-6xl font-bold font-poppins text-white leading-tight text-shadow-lg">
                  {{ heroItem.title || heroItem.name }}
                </h1>
                
                <div class="flex items-center space-x-4 text-gray-300 text-sm md:text-base">
                   <span class="capitalize">{{ heroItem.media_type === 'movie' ? 'Película' : 'Serie' }}</span>
                   <span v-if="heroItem.vote_average" class="text-green-400 font-semibold">{{ (heroItem.vote_average * 10).toFixed(0) }}% Match</span>
                   <span v-if="heroItem.release_date || heroItem.first_air_date">{{ new Date(heroItem.release_date || heroItem.first_air_date).getFullYear() }}</span>
                </div>

                <p v-if="heroItem.overview" class="text-lg text-gray-200 line-clamp-3 text-shadow max-w-2xl leading-relaxed">
                  {{ heroItem.overview }}
                </p>

                <div class="flex items-center space-x-4 pt-4">
                  <router-link
                    :to="{ name: heroItem.media_type === 'movie' ? 'movie-detail' : 'serie-detail', params: { id: heroItem.id } }"
                    class="bg-white text-dark hover:bg-gray-200 px-8 py-3.5 rounded-lg font-bold flex items-center space-x-3 transition-all duration-300 transform hover:scale-105"
                  >
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                    </svg>
                    <span>Ver Ahora</span>
                  </router-link>
                  <button
                    @click="toggleHeroFavorite"
                    class="bg-gray-600/60 backdrop-blur-md text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-gray-600/80 transition-all duration-300 flex items-center space-x-3"
                  >
                    <svg
                      class="w-6 h-6"
                      :class="[isHeroFavorite ? 'text-red-500 fill-current' : 'text-white']"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span>Mi Lista</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- More Results Grid -->
        <main v-if="gridItems.length > 0" class="relative z-10 -mt-10 px-4 md:px-12">
            <div class="container-custom">
                <div class="flex items-center justify-between mb-8">
                <h2 class="text-2xl md:text-3xl font-bold text-white font-poppins">Más Resultados</h2>
                <span class="text-gray-400">{{ gridItems.length }} resultados adicionales</span>
                </div>
                
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                 <component
                    v-for="item in gridItems"
                    :key="`${item.id}-${item.media_type}`"
                    :is="item.media_type === 'movie' ? MovieCard : TVShowCard"
                    :movie="item.media_type === 'movie' ? item : undefined"
                    :series="item.media_type === 'tv' ? item : undefined"
                />
                </div>
            </div>
        </main>
    </div>

    <!-- Empty State -->
    <div v-else class="min-h-screen flex items-center justify-center pt-20">
      <div v-if="searchQuery" class="text-center">
         <svg
          class="w-24 h-24 mx-auto text-gray-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p class="text-gray-400 text-lg">No se encontraron resultados para "{{ searchQuery }}"</p>
      </div>
       <div v-else class="text-center">
         <svg
          class="w-24 h-24 mx-auto text-gray-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p class="text-gray-400 text-lg">Escribe para buscar...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { tmdbService } from '@/modules/catalog/services/tmdb.service'
import { getBackdropUrl } from '@/core/config/api.config'
import MovieCard from '@/modules/catalog/components/MovieCard.vue'
import TVShowCard from '@/modules/catalog/components/TVShowCard.vue'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import { useUserStore } from '@/modules/user'

const route = useRoute()
const userStore = useUserStore()
const searchQuery = ref('')
const results = ref<any[]>([])
const searching = ref(false)
let searchTimeout: number | null = null

const heroItem = computed(() => results.value.length > 0 ? results.value[0] : null)
const gridItems = computed(() => results.value.slice(1))

const heroBackdrop = computed(() => 
  heroItem.value && heroItem.value.backdrop_path ? getBackdropUrl(heroItem.value.backdrop_path, 'original') : ''
)

// Helper to check favorite for hero item (simplified as it could be movie or tv)
const isHeroFavorite = computed(() => {
  if (!heroItem.value) return false
  return userStore.isFavorite(heroItem.value.id, heroItem.value.media_type)
})

function toggleHeroFavorite() {
  if (heroItem.value) {
    userStore.toggleFavorite({
      id: heroItem.value.id,
      type: heroItem.value.media_type,
      title: heroItem.value.title || heroItem.value.name,
      poster_path: heroItem.value.poster_path,
    })
  }
}

async function performSearch() {
  if (!searchQuery.value.trim()) {
    results.value = []
    return
  }

  searching.value = true
  try {
    const response = await tmdbService.searchMulti(searchQuery.value)
    results.value = response.results.filter(
      (item: any) => item.media_type === 'movie' || item.media_type === 'tv'
    )
  } catch (error) {
    console.error('Error en búsqueda:', error)
  } finally {
    searching.value = false
  }
}

function handleSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = window.setTimeout(performSearch, 500)
}

// Actualizar búsqueda cuando cambie el query de la ruta
watch(
  () => route.query.q,
  (newQuery) => {
    if (newQuery) {
      searchQuery.value = newQuery as string
      handleSearch()
    } else {
      searchQuery.value = ''
      results.value = []
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (route.query.q) {
    searchQuery.value = route.query.q as string
    handleSearch()
  }
})
</script>

