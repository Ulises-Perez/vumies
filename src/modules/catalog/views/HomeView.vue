<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- Hero Section (solo imagen: sin video para máximo rendimiento/LCP) -->
    <section class="relative h-[85vh] w-full overflow-hidden">

      <!-- Skeleton mientras no hay película destacada (evita hero en blanco / CLS) -->
      <SkeletonHero v-if="!featuredMovie" height="h-[85vh]" />

      <!-- Backdrop (LCP): <img> priorizado en lugar de background-image -->
      <template v-else>
        <img
          :src="featuredBackdrop"
          :alt="featuredMovie.title"
          class="absolute inset-0 w-full h-full object-cover object-center"
          fetchpriority="high"
          decoding="async"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/60 to-transparent" />
      </template>

      <!-- Content Overlay -->
      <div class="absolute inset-0 flex items-center">
        <div class="px-4 md:px-12 relative z-20 w-full">
          <div class="max-w-2xl">
            <transition name="fade" appear>
              <div v-if="featuredMovie">
                <h1 class="text-4xl sm:text-5xl md:text-7xl font-bold font-poppins text-foreground leading-tight text-shadow-lg drop-shadow-md">
                  {{ featuredMovie?.title }}
                </h1>
                <div class="flex flex-wrap items-center gap-3 text-muted-foreground text-base sm:text-lg mt-3 sm:mt-4">
                  <BaseBadge v-if="featuredMovie?.release_date" variant="outline" class="bg-background/40 backdrop-blur-sm">{{ new Date(featuredMovie.release_date).getFullYear() }}</BaseBadge>
                  <span class="text-green-400 font-semibold flex items-center gap-1">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    {{ featuredMovie?.vote_average ? (featuredMovie.vote_average).toFixed(1) : 0 }}
                  </span>
                </div>
                <p class="text-base sm:text-lg text-muted-foreground line-clamp-3 text-shadow-sm max-w-xl leading-relaxed mt-3 sm:mt-4 drop-shadow-md">
                  {{ featuredMovie?.overview }}
                </p>

                <div class="flex items-center pt-6 sm:pt-8">
                  <BaseButton
                    v-if="featuredMovie"
                    :to="{ name: 'movie-detail', params: { id: featuredMovie.id } }"
                    size="lg"
                    class="shadow-lg w-full sm:w-auto"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                    </svg>
                    <span>Ver Ahora</span>
                  </BaseButton>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </section>

    <!-- Content Sections -->
    <div class="space-y-12 -mt-8 sm:-mt-16 lg:-mt-20 relative z-20">

      <!-- Trending Movies -->
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Tendencias" link="/movies">
          <template v-if="localTrendingMovies.length">
            <div v-for="movie in localTrendingMovies" :key="movie.id" class="flex-none w-[160px] md:w-[220px]">
              <MovieCard :movie="movie" />
            </div>
          </template>
          <SkeletonCardRow v-else />
        </HorizontalScroll>
      </section>

      <!-- Recently Added (now playing) -->
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Recientemente Agregadas" link="/movies">
          <template v-if="recentlyAddedMovies.length">
            <div v-for="movie in recentlyAddedMovies" :key="movie.id" class="flex-none w-[160px] md:w-[220px]">
              <MovieCard :movie="movie" />
            </div>
          </template>
          <SkeletonCardRow v-else />
        </HorizontalScroll>
      </section>

      <!-- Upcoming -->
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Próximamente" link="/movies">
          <template v-if="localUpcomingMovies.length">
            <div v-for="localMovie in localUpcomingMovies" :key="localMovie.id" class="flex-none w-[160px] md:w-[220px]">
              <MovieCard :movie="localMovie" />
            </div>
          </template>
          <SkeletonCardRow v-else />
        </HorizontalScroll>
      </section>

      <!-- Popular Series -->
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Series Populares" link="/series">
          <template v-if="popularSeries.length">
            <div v-for="series in popularSeries" :key="series.id" class="flex-none w-[160px] md:w-[220px]">
              <TVShowCard :series="series" />
            </div>
          </template>
          <SkeletonCardRow v-else />
        </HorizontalScroll>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMovies } from '../composables/useMovies'
import { useSeries } from '../composables/useSeries'
import { getBackdropUrl } from '@/core/config/api.config'

import MovieCard from '../components/MovieCard.vue'
import TVShowCard from '../components/TVShowCard.vue'
import HorizontalScroll from '@/modules/ui/components/HorizontalScroll.vue'
import SkeletonHero from '@/modules/ui/components/skeletons/SkeletonHero.vue'
import SkeletonCardRow from '@/modules/ui/components/skeletons/SkeletonCardRow.vue'
import { BaseBadge, BaseButton } from '@/modules/ui/components/base'
import type { Movie } from '../types/tmdb.types'

const {
  fetchTrendingMovies,
  fetchUpcomingMovies,
  fetchNowPlayingMovies
} = useMovies()

const localTrendingMovies = ref<Movie[]>([])
const localUpcomingMovies = ref<Movie[]>([])
const recentlyAddedMovies = ref<Movie[]>([])

const {
  series: popularSeries,
  fetchPopularSeries
} = useSeries()

const featuredMovie = computed(() => localTrendingMovies.value[0] || null)

// w1280 basta para un hero a pantalla; 'original' eran varios MB innecesarios en el LCP.
const featuredBackdrop = computed(() =>
  featuredMovie.value ? getBackdropUrl(featuredMovie.value.backdrop_path, 'w1280') : ''
)

onMounted(async () => {
  // 1) Tendencias primero: alimenta el hero (LCP)
  const trendingRes = await fetchTrendingMovies('day')
  localTrendingMovies.value = trendingRes.results

  // 2) Resto de carruseles en paralelo, sin bloquear el hero
  const [upcomingRes, nowPlayingRes] = await Promise.all([
    fetchUpcomingMovies(),
    fetchNowPlayingMovies(),
  ])
  localUpcomingMovies.value = upcomingRes.results
  recentlyAddedMovies.value = nowPlayingRes.results

  await fetchPopularSeries()
})
</script>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
}
</style>
