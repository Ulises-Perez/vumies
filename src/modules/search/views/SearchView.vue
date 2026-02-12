<template>
  <div class="min-h-screen pt-8">
    <div class="container-custom py-8">
      <h1 v-if="searchQuery" class="text-4xl font-bold text-white font-poppins mb-8">
        Resultados para "{{ searchQuery }}"
      </h1>
      <h1 v-else class="text-4xl font-bold text-white font-poppins mb-8">
        Búsqueda
      </h1>

      <LoadingSpinner v-if="searching" message="Buscando..." />
      <div v-else-if="searchQuery && results.length === 0" class="text-center py-16">
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
      <div v-else-if="searchQuery && results.length > 0">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <component
            v-for="item in results"
            :key="`${item.id}-${item.media_type}`"
            :is="item.media_type === 'movie' ? MovieCard : TVShowCard"
            :movie="item.media_type === 'movie' ? item : undefined"
            :series="item.media_type === 'tv' ? item : undefined"
          />
        </div>
      </div>
      <div v-else class="text-center py-16">
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
        <p class="text-gray-400 text-lg">Escribe en el menú inferior para buscar películas o series</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { tmdbService } from '@/modules/catalog/services/tmdb.service'
import MovieCard from '@/modules/catalog/components/MovieCard.vue'
import TVShowCard from '@/modules/catalog/components/TVShowCard.vue'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'

const route = useRoute()
const searchQuery = ref('')
const results = ref<any[]>([])
const searching = ref(false)
let searchTimeout: number | null = null

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

