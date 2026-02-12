<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="relative h-screen">
      <div
        v-if="heroMovie"
        class="absolute inset-0 bg-cover bg-center"
        :style="{ backgroundImage: `url(${heroBackdrop})` }"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent" />
      </div>

      <div class="relative h-full flex items-center">
        <div class="container-custom">
          <div class="max-w-2xl">
            <h1 class="text-5xl md:text-7xl font-bold font-poppins text-white mb-4 text-shadow">
              {{ heroMovie?.title || 'Vumies' }}
            </h1>
            <p v-if="heroMovie" class="text-lg text-gray-200 mb-8 line-clamp-3 text-shadow">
              {{ heroMovie.overview }}
            </p>
            <div class="flex items-center space-x-4">
              <router-link
                v-if="heroMovie"
                :to="{ name: 'movie-detail', params: { id: heroMovie.id } }"
                class="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full font-semibold flex items-center space-x-2 transition-all duration-300 transform hover:scale-105"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"
                  />
                </svg>
                <span>Reproducir</span>
              </router-link>
              <button
                v-if="heroMovie"
                @click="toggleHeroFavorite"
                class="glass text-white px-6 py-4 rounded-full font-semibold hover:bg-white/20 transition-all duration-300"
              >
                <svg
                  class="w-5 h-5"
                  :class="[isHeroFavorite ? 'fill-current text-red-500' : '']"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll Indicator -->
      <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>

    <!-- Content Sections -->
    <main class="bg-dark py-16">
      <!-- Trending Movies -->
      <section class="mb-16">
        <div class="container-custom">
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-3xl font-bold text-white font-poppins">Películas en Tendencia</h2>
            <router-link
              to="/movies"
              class="text-primary hover:text-primary/80 transition-colors font-semibold"
            >
              Ver todas →
            </router-link>
          </div>

          <LoadingSpinner v-if="loadingTrending" message="Cargando películas..." />
          <ErrorMessage
            v-else-if="errorTrending"
            :message="errorTrending"
            title="Error al cargar películas"
          />
          <div
            v-else
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            <MovieCard
              v-for="movie in trendingMovies.slice(0, 12)"
              :key="movie.id"
              :movie="movie"
            />
          </div>
        </div>
      </section>

      <!-- Popular Series -->
      <section class="mb-16">
        <div class="container-custom">
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-3xl font-bold text-white font-poppins">Series Populares</h2>
            <router-link
              to="/series"
              class="text-primary hover:text-primary/80 transition-colors font-semibold"
            >
              Ver todas →
            </router-link>
          </div>

          <LoadingSpinner v-if="loadingSeries" message="Cargando series..." />
          <ErrorMessage
            v-else-if="errorSeries"
            :message="errorSeries"
            title="Error al cargar series"
          />
          <div
            v-else
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            <TVShowCard
              v-for="series in popularSeries.slice(0, 12)"
              :key="series.id"
              :series="series"
            />
          </div>
        </div>
      </section>

      <!-- Upcoming Movies -->
      <section>
        <div class="container-custom">
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-3xl font-bold text-white font-poppins">Próximos Estrenos</h2>
            <router-link
              to="/movies"
              class="text-primary hover:text-primary/80 transition-colors font-semibold"
            >
              Ver todas →
            </router-link>
          </div>

          <LoadingSpinner v-if="loadingUpcoming" message="Cargando estrenos..." />
          <div
            v-else
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            <MovieCard
              v-for="movie in upcomingMovies.slice(0, 12)"
              :key="movie.id"
              :movie="movie"
            />
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMovies } from '../composables/useMovies'
import { useSeries } from '../composables/useSeries'
import { getBackdropUrl } from '@/core/config/api.config'
import { useUserStore } from '@/modules/user'
import MovieCard from '../components/MovieCard.vue'
import TVShowCard from '../components/TVShowCard.vue'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import ErrorMessage from '@/modules/ui/components/ErrorMessage.vue'

const userStore = useUserStore()
const { 
  movies: trendingMovies,
  loading: loadingTrending,
  error: errorTrending,
  fetchTrendingMovies 
} = useMovies()

const {
  movies: upcomingMovies,
  loading: loadingUpcoming,
  fetchUpcomingMovies
} = useMovies()

const {
  series: popularSeries,
  loading: loadingSeries,
  error: errorSeries,
  fetchPopularSeries
} = useSeries()

const heroMovie = computed(() => trendingMovies.value[0] || null)
const heroBackdrop = computed(() =>
  heroMovie.value ? getBackdropUrl(heroMovie.value.backdrop_path) : ''
)

const isHeroFavorite = computed(() =>
  heroMovie.value ? userStore.isFavorite(heroMovie.value.id, 'movie') : false
)

function toggleHeroFavorite() {
  if (heroMovie.value) {
    userStore.toggleFavorite({
      id: heroMovie.value.id,
      type: 'movie',
      title: heroMovie.value.title,
      poster_path: heroMovie.value.poster_path,
    })
  }
}

onMounted(async () => {
  await Promise.all([
    fetchTrendingMovies('day'),
    fetchPopularSeries(),
    fetchUpcomingMovies(),
  ])
})
</script>

