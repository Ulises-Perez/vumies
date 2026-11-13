<template>
  <div class="min-h-screen pb-20">
    <BaseContainer class="space-y-12 pt-[var(--chrome-top)]">
      <!-- Mosaico: el primer golpe del inicio, la misma receta que /movies y /series.
           El lead lleva el h1, el año, el score, la sinopsis y la accion principal
           que antes cargaba el hero de 480px, asi que no se pierde nada editorial. -->
      <MosaicHighlights
        lead-tag="h1"
        lead-kicker="Tendencia de hoy"
        :lead="leadTile"
        :loading="mosaicLoading"
        :talls="tallTiles"
        wide-title="Próximos estrenos"
        :wide="wideTiles"
        :wide-to="{ name: 'movies' }"
      />

      <!-- Tendencias: sin las tres piezas que ya ocupa el mosaico. -->
      <section v-if="trendingRest.length">
        <HorizontalScroll title="Tendencias" link="/movies">
          <div v-for="movie in trendingRest" :key="movie.id" class="flex-none w-[160px] md:w-[220px]">
            <MovieCard :movie="movie" />
          </div>
        </HorizontalScroll>
      </section>

      <!-- Próximamente: la cola de la coleccion cuyo arranque ocupa la lista ancha
           del mosaico. Sin esta rail, upcoming[3..] se perdia en el camino. -->
      <section v-if="upcomingRest.length">
        <HorizontalScroll title="Próximamente" link="/movies">
          <div v-for="movie in upcomingRest" :key="movie.id" class="flex-none w-[160px] md:w-[220px]">
            <MovieCard :movie="movie" />
          </div>
        </HorizontalScroll>
      </section>

      <!-- Recently Added (now playing) -->
      <section>
        <HorizontalScroll title="Recientemente Agregadas" link="/movies">
          <template v-if="recentlyAddedMovies.length">
            <div v-for="movie in recentlyAddedMovies" :key="movie.id" class="flex-none w-[160px] md:w-[220px]">
              <MovieCard :movie="movie" />
            </div>
          </template>
          <SkeletonCardRow v-else />
        </HorizontalScroll>
      </section>

      <!-- Popular Series -->
      <section>
        <HorizontalScroll title="Series Populares" link="/series">
          <template v-if="popularSeries.length">
            <div v-for="series in popularSeries" :key="series.id" class="flex-none w-[160px] md:w-[220px]">
              <TVShowCard :series="series" />
            </div>
          </template>
          <SkeletonCardRow v-else />
        </HorizontalScroll>
      </section>
    </BaseContainer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMovies } from '../composables/useMovies'
import { useSeries } from '../composables/useSeries'
import { getBackdropUrl, getPosterUrl } from '@/core/config/api.config'

import MovieCard from '../components/MovieCard.vue'
import TVShowCard from '../components/TVShowCard.vue'
import MosaicHighlights from '../components/MosaicHighlights.vue'
import type { MosaicTile } from '../types/mosaic.types'
import HorizontalScroll from '@/modules/ui/components/HorizontalScroll.vue'
import SkeletonCardRow from '@/modules/ui/components/skeletons/SkeletonCardRow.vue'
import { BaseContainer } from '@/modules/ui/components/base'
import type { Movie } from '../types/tmdb.types'

const {
  fetchTrendingMovies,
  fetchUpcomingMovies,
  fetchNowPlayingMovies
} = useMovies()

const localTrendingMovies = ref<Movie[]>([])
const localUpcomingMovies = ref<Movie[]>([])
const recentlyAddedMovies = ref<Movie[]>([])
const mosaicLoading = ref(true)

const {
  series: popularSeries,
  fetchPopularSeries
} = useSeries()

function releaseYearOf(movie: Movie): string {
  return movie.release_date ? String(new Date(movie.release_date).getFullYear()) : ''
}

function matchOf(movie: Movie): string {
  return (movie.vote_average * 10).toFixed(0)
}

// El mosaico recibe piezas ya resueltas: ningun campo de TMDB llega al marcado.
// El badge de las piezas altas no se inventa: sale del endpoint que las alimenta.
function toTile(movie: Movie, variant: 'lead' | 'tall' = 'lead'): MosaicTile {
  const backdrop = movie.backdrop_path ? getBackdropUrl(movie.backdrop_path, 'w1280') : ''
  const poster = movie.poster_path ? getPosterUrl(movie.poster_path, 'w342') : ''
  return {
    id: movie.id,
    title: movie.title,
    artwork: variant === 'lead' ? backdrop || poster : poster || backdrop,
    year: releaseYearOf(movie),
    meta: `${matchOf(movie)}% Match`,
    overview: movie.overview,
    badge: variant === 'tall' ? 'Tendencia' : undefined,
    to: { name: 'movie-detail', params: { id: movie.id } },
  }
}

const leadTile = computed(() =>
  localTrendingMovies.value[0] ? toTile(localTrendingMovies.value[0]) : null
)
const tallTiles = computed(() =>
  localTrendingMovies.value.slice(1, 3).map((movie) => toTile(movie, 'tall'))
)
const trendingRest = computed(() => localTrendingMovies.value.slice(3))
const wideTiles = computed(() =>
  localUpcomingMovies.value.slice(0, 3).map((movie) => toTile(movie))
)
const upcomingRest = computed(() => localUpcomingMovies.value.slice(3))

onMounted(async () => {
  // 1) Tendencias primero: alimenta el mosaico (LCP). El flag se apaga en
  //    finally para que un fallo no deje un esqueleto eterno en el inicio.
  try {
    const trendingRes = await fetchTrendingMovies('day')
    localTrendingMovies.value = trendingRes.results
  } finally {
    mosaicLoading.value = false
  }

  // 2) Resto de carruseles en paralelo, sin bloquear el mosaico
  const [upcomingRes, nowPlayingRes] = await Promise.all([
    fetchUpcomingMovies(),
    fetchNowPlayingMovies(),
  ])
  localUpcomingMovies.value = upcomingRes.results
  recentlyAddedMovies.value = nowPlayingRes.results

  await fetchPopularSeries()
})
</script>
