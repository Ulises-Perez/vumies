<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- Featured Movie (Hero) -->
    <section class="relative h-[70vh] w-full overflow-hidden">
      <SkeletonHero v-if="!heroMovie" height="h-[70vh]" />
      <div
        v-if="heroMovie"
        class="absolute inset-0 bg-cover bg-center transition-all duration-700"
        :style="{ backgroundImage: `url(${heroBackdrop})` }"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/40 to-transparent" />
      </div>

      <div class="absolute inset-0 flex items-center">
        <div class="px-4 md:px-12">
          <div class="max-w-3xl space-y-6">
            <BaseBadge v-if="heroMovie" variant="default" class="mb-2">
              Película Destacada
            </BaseBadge>
            <h1 class="text-5xl md:text-7xl font-bold font-poppins text-foreground leading-tight text-shadow-lg">
              {{ heroMovie?.title || 'Vumies Movies' }}
            </h1>

            <div v-if="heroMovie" class="flex items-center gap-4 text-muted-foreground text-sm md:text-base">
              <span class="text-green-400 font-semibold">{{ (heroMovie.vote_average * 10).toFixed(0) }}% Match</span>
              <span>{{ new Date(heroMovie.release_date).getFullYear() }}</span>
              <BaseBadge variant="outline">{{ heroMovie.adult ? '18+' : 'PG-13' }}</BaseBadge>
            </div>

            <p v-if="heroMovie" class="text-lg md:text-xl text-muted-foreground line-clamp-3 text-shadow max-w-2xl leading-relaxed">
              {{ heroMovie.overview }}
            </p>

            <div class="flex items-center gap-4 pt-4">
              <BaseButton
                v-if="heroMovie"
                :to="{ name: 'movie-detail', params: { id: heroMovie.id } }"
                size="lg"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
                <span>Ver Ahora</span>
              </BaseButton>
              <BaseButton
                v-if="heroMovie"
                variant="secondary"
                size="lg"
                @click="toggleHeroFavorite"
              >
                <svg
                  class="w-5 h-5"
                  :class="[isHeroFavorite ? 'text-red-500 fill-current' : 'text-secondary-foreground']"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>Mi Lista</span>
              </BaseButton>
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
          <template v-if="popularMovies.length">
            <div v-for="movie in popularMovies" :key="movie.id" class="flex-none w-[160px] md:w-[220px]">
              <MovieCard :movie="movie" />
            </div>
          </template>
          <SkeletonCardRow v-else />
        </HorizontalScroll>
      </section>

      <!-- Top Rated Movies -->
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Mejor Valoradas">
          <template v-if="topRatedMovies.length">
            <div v-for="movie in topRatedMovies" :key="movie.id" class="flex-none w-[160px] md:w-[220px]">
              <MovieCard :movie="movie" />
            </div>
          </template>
          <SkeletonCardRow v-else />
        </HorizontalScroll>
      </section>

      <!-- Upcoming Movies -->
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Próximamente">
          <template v-if="upcomingMovies.length">
            <div v-for="movie in upcomingMovies" :key="movie.id" class="flex-none w-[160px] md:w-[220px]">
              <MovieCard :movie="movie" />
            </div>
          </template>
          <SkeletonCardRow v-else />
        </HorizontalScroll>
      </section>

      <!-- Explore by Genre -->
      <section class="pl-4 md:pl-12 pr-4 md:pr-12">
         <h2 class="text-2xl md:text-3xl font-bold text-foreground font-poppins mb-6">Explorar por Género</h2>
         <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <template v-if="genres.length">
              <BaseCard
                v-for="genre in genres"
                :key="genre.id"
                interactive
                class="h-24 flex items-center justify-center group"
              >
                <span class="text-lg font-semibold text-muted-foreground group-hover:text-foreground text-center px-2 transition-colors">{{ genre.name }}</span>
              </BaseCard>
            </template>
            <template v-else>
              <div v-for="n in 6" :key="n" class="h-24 rounded-xl skeleton"></div>
            </template>
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
import SkeletonHero from '@/modules/ui/components/skeletons/SkeletonHero.vue'
import SkeletonCardRow from '@/modules/ui/components/skeletons/SkeletonCardRow.vue'
import { BaseBadge, BaseButton, BaseCard } from '@/modules/ui/components/base'
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
