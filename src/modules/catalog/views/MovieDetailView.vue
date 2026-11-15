<template>
  <!-- Same recipe as the series view: full-bleed hero with the h1 in normal
       flow below --chrome-top, a single container-app gutter, and bottom
       clearance for the floating pill on mobile. -->
  <div>
  <SkeletonDetail v-if="loading" />

  <div v-else-if="error" class="min-h-screen pt-[var(--chrome-top)]">
    <div class="container-app py-8">
      <ErrorMessage :message="error" title="Error al cargar película" />
    </div>
  </div>

  <div v-else-if="movieDetails" class="min-h-screen pb-[calc(70px+16px+var(--spacing-8))] md:pb-20">
    <SerieHero
      :backdrop-url="heroBackdropUrl"
      :backdrop-src-set="heroBackdropSrcSet"
      :title="movieDetails.title"
      :match="matchLabel"
      :year="releaseYear"
      :runtime-label="runtimeLabel"
      art-position="object-[center_20%]"
      :tags="genreNames"
      :is-favorite="isFavorite"
      @play="playMovie"
      @toggle-favorite="toggleFavorite"
    />
    <div aria-hidden="true" class="h-px w-px" />

    <BaseContainer class="space-y-10 md:space-y-12 pt-[var(--spacing-8)]">
      <!-- Synopsis stacked over a full-width facts strip: no two-column split, no middle chasm. -->
      <section aria-labelledby="movie-sinopsis-title">
        <h2 id="movie-sinopsis-title" class="type-heading-3 font-poppins text-foreground mb-6">Sinopsis</h2>
        <p v-if="movieDetails.overview" class="text-base leading-relaxed text-muted-foreground max-w-[65ch]">
          {{ movieDetails.overview }}
        </p>
        <MovieFacts
          class="mt-8"
          :directors="directorsJoined"
          :writers="writersJoined"
          :studio="studioName"
          :status="movieDetails.status"
          :title="movieDetails.title"
          :original-title="movieDetails.original_title"
          :original-language="movieDetails.original_language"
          :vote-count="movieDetails.vote_count"
        />
      </section>

      <!-- Cast -->
      <section v-if="credits && credits.cast.length" aria-labelledby="movie-reparto-title">
        <h2 id="movie-reparto-title" class="type-heading-3 font-poppins text-foreground mb-6">Reparto</h2>
        <!-- Snap-free rail: tabindex lets keyboard users scroll it. The edge
             fade signals there is more to scroll. -->
        <div
          class="flex gap-[var(--grid-gap)] overflow-x-auto pb-[var(--spacing-4)] pr-4 scrollbar-hide [mask-image:linear-gradient(to_right,#000_92%,transparent)]"
          tabindex="0"
          role="region"
          aria-label="Reparto"
        >
          <div v-for="actor in credits.cast.slice(0, 10)" :key="actor.id" class="flex-none w-24 md:w-28 text-left">
            <PersonAvatar :path="actor.profile_path" :name="actor.name" class="mb-3 ring-1 ring-white/10 [&_img]:object-top" />
            <p class="text-foreground font-medium text-sm line-clamp-2">{{ actor.name }}</p>
            <p class="text-muted-foreground text-xs line-clamp-2">{{ formatCharacter(actor.character) }}</p>
          </div>
        </div>
      </section>

      <!-- Related titles -->
      <section v-if="hasRecommendations" aria-labelledby="movie-relacionados-title">
        <h2 id="movie-relacionados-title" class="type-heading-3 font-poppins text-foreground mb-8">Relacionados</h2>
        <div class="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6 lg:gap-5">
          <MovieCard
            v-for="movie in recommendations.slice(0, 12)"
            :key="movie.id"
            :movie="movie"
          />
        </div>
      </section>
    </BaseContainer>
  </div>

  <div v-else class="min-h-screen" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMovies } from '../composables/useMovies'
import { useUserStore } from '@/modules/user'
import { getBackdropUrl, getBackdropSrcSet } from '@/core/config/api.config'
import SerieHero from '../components/SerieHero.vue'
import MovieCard from '../components/MovieCard.vue'
import MovieFacts from '../components/MovieFacts.vue'
import SkeletonDetail from '@/modules/ui/components/skeletons/SkeletonDetail.vue'
import ErrorMessage from '@/modules/ui/components/ErrorMessage.vue'
import PersonAvatar from '@/modules/ui/components/PersonAvatar.vue'
import { BaseContainer } from '@/modules/ui/components/base'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { movieDetails, credits, loading, error, recommendations, hasRecommendations, fetchMovieDetails, fetchMovieRecommendations } = useMovies()

// Backdrop solo cuando la pelicula trae arte real: '' pinta bg-muted en el hero.
const heroBackdropUrl = computed(() =>
  movieDetails.value?.backdrop_path
    ? getBackdropUrl(movieDetails.value.backdrop_path, 'w780')
    : ''
)

const heroBackdropSrcSet = computed(() =>
  movieDetails.value?.backdrop_path
    ? getBackdropSrcSet(movieDetails.value.backdrop_path)
    : undefined
)

// Puntaje real o nada: sin vote_average no hay dato que mostrar.
const matchLabel = computed(() =>
  movieDetails.value && movieDetails.value.vote_average > 0
    ? `★ ${movieDetails.value.vote_average.toFixed(1)}`
    : ''
)

const releaseYear = computed(() =>
  movieDetails.value?.release_date
    ? String(new Date(movieDetails.value.release_date).getFullYear())
    : ''
)

const runtimeLabel = computed(() => formatRuntime(movieDetails.value?.runtime ?? 0))

const genreNames = computed<string[]>(() =>
  movieDetails.value ? movieDetails.value.genres.map((genre) => genre.name) : []
)

const isFavorite = computed(() =>
  movieDetails.value ? userStore.isFavorite(movieDetails.value.id, 'movie') : false
)

const directors = computed(() =>
  credits.value ? credits.value.crew.filter(c => c.job === 'Director') : []
)

const writers = computed(() =>
  credits.value ? credits.value.crew.filter(c => ['Screenplay', 'Writer', 'Story'].includes(c.job)).slice(0, 2) : []
)

const directorsJoined = computed(() => directors.value.map(d => d.name).join(', '))

const writersJoined = computed(() => writers.value.map(w => w.name).join(', '))

const studioName = computed(() => movieDetails.value?.production_companies[0]?.name ?? '')

function formatRuntime(minutes: number) {
  if (!minutes || minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

// TMDB character strings leak English "(voice)": normalize only that token to
// Spanish, leaving the rest of the string untouched.
function formatCharacter(character: string) {
  if (!character) return character
  return character.replace(/\(voice\)/gi, '(voz)')
}

function playMovie() {
  if (movieDetails.value) {
    // Se registra aca, no al abrir la ficha: "continuar viendo" es lo que se
    // reprodujo, no lo que se miro en una grilla.
    userStore.addToHistory({
      id: movieDetails.value.id,
      type: 'movie',
      title: movieDetails.value.title,
      poster_path: movieDetails.value.poster_path,
      backdrop_path: movieDetails.value.backdrop_path,
      kind: 'movie',
    })
    router.push({
      name: 'player',
      params: { type: 'movie', id: movieDetails.value.id }
    })
  }
}

function toggleFavorite() {
  if (movieDetails.value) {
    userStore.toggleFavorite({
      id: movieDetails.value.id,
      type: 'movie',
      title: movieDetails.value.title,
      poster_path: movieDetails.value.poster_path,
    })
  }
}

onMounted(async () => {
  const id = Number(route.params.id)
  // Ficha y recomendaciones en paralelo: no dependen entre si y antes eran dos
  // round trips encadenados.
  await Promise.allSettled([fetchMovieDetails(id), fetchMovieRecommendations(id)])
})

watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      const id = Number(newId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      await Promise.allSettled([fetchMovieDetails(id), fetchMovieRecommendations(id)])
    }
  }
)
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
