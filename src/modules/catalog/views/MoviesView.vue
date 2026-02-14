<template>
  <div class="min-h-screen bg-dark pb-20">
    <!-- Featured Movie (Hero) -->
    <section class="relative h-[70vh] w-full overflow-hidden">
      <div
        v-if="heroMovie"
        class="absolute inset-0 bg-cover bg-center transition-all duration-700"
        :style="{ backgroundImage: `url(${heroBackdrop})` }"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/40 to-transparent" />
      </div>

      <div class="absolute inset-0 flex items-center">
        <div class="container-custom">
          <div class="max-w-3xl space-y-6">
            <span v-if="heroMovie" class="inline-block px-3 py-1 bg-primary/80 backdrop-blur-md border border-primary/30 rounded-full text-white text-sm font-medium mb-2">
              Película Destacada
            </span>
            <h1 class="text-5xl md:text-7xl font-bold font-poppins text-white leading-tight text-shadow-lg">
              {{ heroMovie?.title || 'Vumies Movies' }}
            </h1>
            
            <div v-if="heroMovie" class="flex items-center space-x-4 text-gray-300 text-sm md:text-base">
              <span class="text-green-400 font-semibold">{{ (heroMovie.vote_average * 10).toFixed(0) }}% Match</span>
              <span>{{ new Date(heroMovie.release_date).getFullYear() }}</span>
              <span class="px-2 py-0.5 border border-gray-600 rounded text-xs">{{ heroMovie.adult ? '18+' : 'PG-13' }}</span>
            </div>

            <p v-if="heroMovie" class="text-lg md:text-xl text-gray-200 line-clamp-3 text-shadow max-w-2xl leading-relaxed">
              {{ heroMovie.overview }}
            </p>

            <div class="flex items-center space-x-4 pt-4">
              <router-link
                v-if="heroMovie"
                :to="{ name: 'movie-detail', params: { id: heroMovie.id } }"
                class="bg-white text-dark hover:bg-gray-200 px-8 py-4 rounded-lg font-bold flex items-center space-x-3 transition-all duration-300 transform hover:scale-105"
              >
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
                <span>Ver Ahora</span>
              </router-link>
              <button
                v-if="heroMovie"
                @click="toggleHeroFavorite"
                class="bg-gray-600/60 backdrop-blur-md text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-600/80 transition-all duration-300 flex items-center space-x-3"
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

    <!-- Content Sections -->
    <main class="relative z-10 -mt-20 space-y-12">
      
      <!-- Popular Movies -->
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Películas Populares">
          <div v-for="movie in popularMovies" :key="movie.id" class="flex-none w-[160px] md:w-[220px]">
            <MovieCard :movie="movie" />
          </div>
        </HorizontalScroll>
      </section>

      <!-- Top Rated Movies -->
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Mejor Valoradas">
          <div v-for="movie in topRatedMovies" :key="movie.id" class="flex-none w-[160px] md:w-[220px]">
             <MovieCard :movie="movie" />
          </div>
        </HorizontalScroll>
      </section>

      <!-- Upcoming Movies -->
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Próximamente">
          <div v-for="movie in upcomingMovies" :key="movie.id" class="flex-none w-[160px] md:w-[220px]">
             <MovieCard :movie="movie" />
          </div>
        </HorizontalScroll>
      </section>
      
      <!-- Explore by Genre -->
      <section class="pl-4 md:pl-12 pr-4 md:pr-12">
         <h2 class="text-2xl md:text-3xl font-bold text-white font-poppins mb-6">Explorar por Género</h2>
         <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div 
              v-for="genre in genres" 
              :key="genre.id" 
              class="bg-gray-800 h-24 rounded-lg flex items-center justify-center hover:bg-gray-700 transition cursor-pointer group"
            >
              <span class="text-lg font-bold text-gray-400 group-hover:text-white text-center px-2">{{ genre.name }}</span>
            </div>
         </div>
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMovies } from '../composables/useMovies'
import { getBackdropUrl } from '@/core/config/api.config'
import { useUserStore } from '@/modules/user'
import MovieCard from '../components/MovieCard.vue'
import HorizontalScroll from '@/modules/ui/components/HorizontalScroll.vue' // Added import
import type { Movie } from '../types/tmdb.types'

const userStore = useUserStore()
const { fetchPopularMovies } = useMovies()
const { fetchTopRatedMovies } = useMovies()
const { fetchUpcomingMovies } = useMovies()
const { fetchGenres } = useMovies()

const popularMovies = ref<Movie[]>([])
const topRatedMovies = ref<Movie[]>([])
const upcomingMovies = ref<Movie[]>([])
const genres = ref<{ id: number; name: string }[]>([])

const heroMovie = computed(() => popularMovies.value[0] || null)
const heroBackdrop = computed(() =>
  heroMovie.value ? getBackdropUrl(heroMovie.value.backdrop_path, 'original') : ''
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
  const [popularRes, topRatedRes, upcomingRes, genresRes] = await Promise.all([
     fetchPopularMovies(),
     fetchTopRatedMovies(),
     fetchUpcomingMovies(),
     fetchGenres()
  ])

  popularMovies.value = popularRes.results
  topRatedMovies.value = topRatedRes.results
  upcomingMovies.value = upcomingRes.results
  genres.value = genresRes || []
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
