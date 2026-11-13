<template>
  <div class="min-h-screen pb-20">
    <!-- Featured Movie (Hero) -->
    <section class="relative flex min-h-[var(--hero-md)] w-full items-center overflow-hidden">
      <SkeletonHero v-if="!heroMovie" height="h-[var(--hero-md)]" />
      <div
        v-if="heroMovie"
        class="absolute inset-0 bg-cover bg-center transition-all duration-700"
        :style="{ backgroundImage: `url(${heroBackdrop})` }"
      >
        <div class="absolute inset-0 scrim-b" />
        <div class="absolute inset-0 scrim-r" />
      </div>

      <div class="relative w-full py-16 md:py-20">
        <div class="container-app">
          <div class="max-w-3xl space-y-6">
            <h1 class="text-5xl md:text-7xl font-bold font-poppins text-foreground leading-tight text-shadow-lg">
              {{ heroMovie?.title || 'Vumies Movies' }}
            </h1>

            <div v-if="heroMovie" class="flex items-center gap-4 text-muted-foreground text-sm md:text-base">
              <span class="text-primary font-semibold">{{ (heroMovie.vote_average * 10).toFixed(0) }}% Match</span>
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
    <BaseContainer class="space-y-12 relative z-10">

      <!-- Mosaico: piezas con alto propio; las filas crecen con el contenido
           (auto-rows auto) para que en 2 columnas de movil nada se solape.
           Una sola receta para /movies, /series y /: el componente la define. -->
      <MosaicHighlights
        lead-kicker="Mejor valorada"
        :lead="leadTile"
        :loading="mosaicLoading"
        :talls="tallTiles"
        wide-title="Próximos estrenos"
        :wide="wideTiles"
      />

      <!-- Unico rail horizontal de la pagina (.rail via HorizontalScroll):
           Peliculas Populares, sin la pieza que ya abre el hero. -->
      <section>
        <HorizontalScroll title="Películas Populares">
          <template v-if="popularRest.length">
            <div v-for="movie in popularRest" :key="movie.id" class="flex-none w-[160px] md:w-[220px]">
              <MovieCard :movie="movie" />
            </div>
          </template>
          <SkeletonCardRow v-else />
        </HorizontalScroll>
      </section>

      <!-- Resto en grilla de posters -->
      <section v-if="topRatedRest.length">
        <h2 class="text-2xl md:text-3xl font-bold text-foreground font-poppins mb-6">Mejor Valoradas</h2>
        <div class="grid-posters">
          <MovieCard v-for="movie in topRatedRest" :key="movie.id" :movie="movie" />
        </div>
      </section>

      <section v-if="upcomingRest.length">
        <h2 class="text-2xl md:text-3xl font-bold text-foreground font-poppins mb-6">Más próximos estrenos</h2>
        <div class="grid-posters">
          <MovieCard v-for="movie in upcomingRest" :key="movie.id" :movie="movie" />
        </div>
      </section>

      <!-- Explore by Genre -->
      <section>
         <h2 class="text-2xl md:text-3xl font-bold text-foreground font-poppins mb-6">Explorar por Género</h2>
         <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <template v-if="genres.length">
              <BaseCard
                v-for="genre in genres"
                :key="genre.id"
                interactive
                class="h-24 min-h-[32px] flex items-center justify-center group"
              >
                <span class="text-lg font-semibold text-muted-foreground group-hover:text-foreground text-center px-2 transition-colors">{{ genre.name }}</span>
              </BaseCard>
            </template>
            <template v-else>
              <div v-for="n in 6" :key="n" class="h-24 rounded-xl skeleton"></div>
            </template>
         </div>
      </section>

    </BaseContainer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMovies } from '../composables/useMovies'
import { getBackdropUrl, getPosterUrl } from '@/core/config/api.config'
import { useUserStore } from '@/modules/user'
import MovieCard from '../components/MovieCard.vue'
import MosaicHighlights from '../components/MosaicHighlights.vue'
import type { MosaicTile } from '../types/mosaic.types'
import HorizontalScroll from '@/modules/ui/components/HorizontalScroll.vue' // Added import
import SkeletonHero from '@/modules/ui/components/skeletons/SkeletonHero.vue'
import SkeletonCardRow from '@/modules/ui/components/skeletons/SkeletonCardRow.vue'
import { BaseBadge, BaseButton, BaseCard, BaseContainer } from '@/modules/ui/components/base'
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
const mosaicLoading = ref(true)

const heroMovie = computed(() => popularMovies.value[0] || null)
const heroBackdrop = computed(() =>
  heroMovie.value ? getBackdropUrl(heroMovie.value.backdrop_path, 'original') : ''
)

// Mosaico con los datos que la vista ya trae: lead + talls de topRated,
// lista wide de upcoming. Sin requests nuevos ni titulos inventados.
const mosaicLead = computed(() => topRatedMovies.value[0] ?? null)
const mosaicTallOne = computed(() => topRatedMovies.value[1] ?? null)
const mosaicTallTwo = computed(() => topRatedMovies.value[2] ?? null)
const mosaicWide = computed(() => upcomingMovies.value.slice(0, 3))
const topRatedRest = computed(() => topRatedMovies.value.slice(3))
const upcomingRest = computed(() => upcomingMovies.value.slice(3))
// La rail arranca despues del hero: popular[0] ya es la pieza grande de arriba.
const popularRest = computed(() => popularMovies.value.slice(1))
// El mosaico recibe piezas ya resueltas: ninguna vista filtra campos de TMDB
// al marcado (movie.title vs show.name, release_date vs first_air_date).
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
    badge: variant === 'tall' ? 'Mejor valorada' : undefined,
    to: { name: 'movie-detail', params: { id: movie.id } },
  }
}

const leadTile = computed(() => (mosaicLead.value ? toTile(mosaicLead.value) : null))
const tallTiles = computed(() =>
  [mosaicTallOne.value, mosaicTallTwo.value]
    .filter((movie): movie is Movie => movie !== null)
    .map((movie) => toTile(movie, 'tall'))
)
const wideTiles = computed(() => mosaicWide.value.map((movie) => toTile(movie)))

function releaseYearOf(movie: Movie): string {
  return movie.release_date ? String(new Date(movie.release_date).getFullYear()) : ''
}

function matchOf(movie: Movie): string {
  return (movie.vote_average * 10).toFixed(0)
}

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
  try {
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
  } finally {
    mosaicLoading.value = false
  }
})
</script>
