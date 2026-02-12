<template>
  <div class="min-h-screen pt-8">
    <div class="container-custom py-8">
      <h1 class="text-4xl font-bold text-white font-poppins mb-8">Películas Populares</h1>

      <LoadingSpinner v-if="loading" message="Cargando películas..." />
      <ErrorMessage v-else-if="error" :message="error" title="Error al cargar películas" />
      <div v-else>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
          <MovieCard v-for="movie in movies" :key="movie.id" :movie="movie" />
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-center space-x-4">
          <button
            @click="goToPrevPage"
            :disabled="currentPage <= 1"
            class="px-4 py-2 bg-primary rounded-full text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            ← Anterior
          </button>

          <span class="text-white">
            Página <span class="font-bold text-primary">{{ currentPage }}</span> de {{ totalPages }}
          </span>

          <button
            @click="goToNextPage"
            :disabled="currentPage >= totalPages"
            class="px-4 py-2 bg-primary rounded-full text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMovies } from '../composables/useMovies'
import MovieCard from '../components/MovieCard.vue'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import ErrorMessage from '@/modules/ui/components/ErrorMessage.vue'

const route = useRoute()
const router = useRouter()
const { movies, loading, error, currentPage, totalPages, fetchPopularMovies } = useMovies()

async function loadMovies(page: number) {
  await fetchPopularMovies(page)
}

function goToNextPage() {
  if (currentPage.value < totalPages.value) {
    router.push({ query: { page: currentPage.value + 1 } })
  }
}

function goToPrevPage() {
  if (currentPage.value > 1) {
    router.push({ query: { page: currentPage.value - 1 } })
  }
}

watch(
  () => route.query.page,
  (newPage) => {
    const page = Number(newPage) || 1
    loadMovies(page)
  }
)

onMounted(() => {
  const page = Number(route.query.page) || 1
  loadMovies(page)
})
</script>

