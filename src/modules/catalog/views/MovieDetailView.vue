<template>
  <div v-if="loading" class="min-h-screen pt-8 flex items-center justify-center">
    <LoadingSpinner message="Cargando película..." />
  </div>

  <div v-else-if="error" class="min-h-screen pt-8">
    <div class="container-custom py-8">
      <ErrorMessage :message="error" title="Error al cargar película" />
    </div>
  </div>

  <div v-else-if="movieDetails" class="min-h-screen">
    <!-- Backdrop Hero -->
    <div
      class="relative h-screen bg-cover bg-center"
      :style="{ backgroundImage: `url(${backdropUrl})` }"
    >
      <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-transparent" />
      
      <div class="relative h-full flex items-end pb-20">
        <div class="container-custom">
          <h1 class="text-5xl md:text-7xl font-bold font-poppins text-white mb-4 text-shadow">
            {{ movieDetails.title }}
          </h1>
          <div class="flex items-center space-x-4 mb-6 text-white">
            <span class="flex items-center space-x-1">
              <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{{ movieDetails.vote_average.toFixed(1) }}</span>
            </span>
            <span>{{ releaseYear }}</span>
            <span>{{ movieDetails.runtime }} min</span>
          </div>
          
          <button
            @click="playMovie"
            class="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full font-semibold flex items-center space-x-2 transition-all duration-300 transform hover:scale-105"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            <span>Reproducir</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Details -->
    <div class="bg-dark py-16">
      <div class="container-custom">
        <p class="text-lg text-gray-300 mb-8">{{ movieDetails.overview }}</p>
        
        <div class="flex flex-wrap gap-2 mb-8">
          <span
            v-for="genre in movieDetails.genres"
            :key="genre.id"
            class="px-4 py-2 bg-primary/20 text-primary rounded-full text-sm"
          >
            {{ genre.name }}
          </span>
        </div>

        <!-- Recommendations -->
        <div v-if="hasRecommendations" class="mt-16">
          <h2 class="text-3xl font-bold text-white font-poppins mb-8">Te Recomendamos</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <MovieCard
              v-for="movie in recommendations.slice(0, 12)"
              :key="movie.id"
              :movie="movie"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Video Player Modal -->
    <VideoPlayer
      :embed-url="playerUrl"
      :is-player-visible="isPlayerVisible"
      @close="isPlayerVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMovies } from '../composables/useMovies'
import { usePlayer } from '@/modules/player'
import { getBackdropUrl } from '@/core/config/api.config'
import MovieCard from '../components/MovieCard.vue'
import VideoPlayer from '@/modules/player/components/VideoPlayer.vue'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import ErrorMessage from '@/modules/ui/components/ErrorMessage.vue'

const route = useRoute()
const { movieDetails, loading, error, recommendations, hasRecommendations, fetchMovieDetails, fetchMovieRecommendations } = useMovies()
const { generateMovieUrl } = usePlayer()

const isPlayerVisible = ref(false)
const playerUrl = ref('')

const backdropUrl = computed(() => 
  movieDetails.value ? getBackdropUrl(movieDetails.value.backdrop_path) : ''
)

const releaseYear = computed(() => 
  movieDetails.value ? new Date(movieDetails.value.release_date).getFullYear() : ''
)

function playMovie() {
  if (movieDetails.value) {
    playerUrl.value = generateMovieUrl(movieDetails.value.id)
    isPlayerVisible.value = true
  }
}

onMounted(async () => {
  const id = Number(route.params.id)
  await fetchMovieDetails(id)
  await fetchMovieRecommendations(id)
})
</script>

