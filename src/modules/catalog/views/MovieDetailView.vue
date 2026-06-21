<template>
  <SkeletonDetail v-if="loading" />

  <div v-else-if="error" class="min-h-screen pt-20">
    <div class="container-custom py-8">
      <ErrorMessage :message="error" title="Error al cargar película" />
    </div>
  </div>

  <div v-else-if="movieDetails" class="min-h-screen pb-20">
    <!-- Backdrop Hero -->
    <div
      class="relative h-[85vh] w-full bg-cover bg-center"
      :style="{ backgroundImage: `url(${backdropUrl})` }"
    >
      <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
      <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/60 to-transparent" />
      
      <div class="absolute inset-0 flex items-end pb-20">
        <div class="px-4 md:px-12 w-full">
          <div class="max-w-3xl space-y-6">
            <h1 class="text-5xl md:text-7xl font-bold font-poppins text-foreground leading-tight text-shadow-lg">
              {{ movieDetails.title }}
            </h1>

            <div class="flex items-center gap-4 text-muted-foreground text-sm md:text-base">
              <span class="text-green-400 font-bold">{{ (movieDetails.vote_average * 10).toFixed(0) }}% Match</span>
              <span>{{ releaseYear }}</span>
              <BaseBadge variant="outline">{{ movieDetails.adult ? '18+' : 'PG-13' }}</BaseBadge>
              <span>{{ formatRuntime(movieDetails.runtime) }}</span>
            </div>

            <div class="flex flex-wrap gap-2">
              <span
                v-for="genre in movieDetails.genres"
                :key="genre.id"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {{ genre.name }}<span v-if="genre !== movieDetails.genres[movieDetails.genres.length - 1]" class="mx-1">•</span>
              </span>
            </div>
            
            <div class="flex items-center gap-4 pt-4">
              <BaseButton size="lg" @click="playMovie">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                <span>Reproducir</span>
              </BaseButton>

              <BaseButton variant="secondary" size="lg" @click="toggleFavorite">
                <svg
                  class="w-5 h-5"
                  :class="[isFavorite ? 'text-red-500 fill-current' : 'text-secondary-foreground']"
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
    </div>

    <!-- Details Content -->
    <div class="bg-background relative z-10 px-4 md:px-12 -mt-10">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        <!-- Left Column: Overview and Metadata -->
        <div class="lg:col-span-2 space-y-10">
           <!-- Overview -->
           <div>
              <h3 class="text-xl font-bold text-foreground mb-3 font-poppins">Sinopsis</h3>
              <p class="text-muted-foreground text-lg leading-relaxed">{{ movieDetails.overview }}</p>
           </div>

           <!-- Cast -->
           <div v-if="credits && credits.cast.length">
             <h3 class="text-xl font-bold text-foreground mb-4 font-poppins">Reparto Principal</h3>
             <div class="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
               <div v-for="actor in credits.cast.slice(0, 10)" :key="actor.id" class="flex-none w-32 text-center group">
                 <PersonAvatar :path="actor.profile_path" :name="actor.name" class="mb-3" />
                 <p class="text-foreground font-medium text-sm truncate">{{ actor.name }}</p>
                 <p class="text-muted-foreground text-xs truncate">{{ actor.character }}</p>
               </div>
             </div>
           </div>

           <!-- Awards (Mock) -->
           <div>
             <h3 class="text-xl font-bold text-foreground mb-4 font-poppins">Premios</h3>
             <div class="flex flex-wrap gap-4">
                <BaseCard class="flex items-center gap-3 p-3">
                  <div class="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </div>
                  <div>
                    <p class="text-foreground font-bold text-sm">Oscar Winner</p>
                    <p class="text-muted-foreground text-xs">Best Picture (2024)</p>
                  </div>
                </BaseCard>
                <BaseCard class="flex items-center gap-3 p-3">
                   <div class="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827.954L17.18 5.485l-4.14 1.656.643 1.286 4.137-1.655a1 1 0 01.74 1.854l-4.138 1.655.644 1.288 4.137-1.655a1 1 0 11.74 1.854l-4.138 1.655.644 1.288 4.137-1.655a1 1 0 11.74 1.854l-4.138 1.655.644 1.288 4.137-1.655a1 1 0 11.74 1.854L10 16.098V20a1 1 0 11-2 0v-3.903l-7.442 2.977a1 1 0 01-1.48-.927V4.098a1 1 0 011.082-.996L10 3.323V3a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                  </div>
                  <div>
                    <p class="text-foreground font-bold text-sm">Golden Globe</p>
                    <p class="text-muted-foreground text-xs">Best Director</p>
                  </div>
                </BaseCard>
             </div>
           </div>
        </div>

        <!-- Right Column: Info & Recommendations -->
        <div class="space-y-8">
           <BaseCard class="p-6">
             <h3 class="text-lg font-bold text-foreground mb-4">Información</h3>
             <div class="space-y-4">
               <div v-if="directors.length">
                 <p class="text-muted-foreground text-sm">Director</p>
                 <p class="text-foreground">{{ directors.map(d => d.name).join(', ') }}</p>
               </div>
               <div v-if="writers.length">
                 <p class="text-muted-foreground text-sm">Guión</p>
                 <p class="text-foreground">{{ writers.map(w => w.name).join(', ') }}</p>
               </div>
               <div>
                  <p class="text-muted-foreground text-sm">Estudio</p>
                  <p class="text-foreground">{{ movieDetails.production_companies[0]?.name || 'N/A' }}</p>
               </div>
             </div>
           </BaseCard>

        </div>

      </div>

      <!-- Relacionados (bento grid, a lo ancho — como las recomendaciones de series) -->
      <section v-if="hasRecommendations" class="mt-12 md:mt-16">
        <h2 class="text-2xl md:text-3xl font-bold text-foreground font-poppins mb-8">Relacionados</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 auto-rows-[120px] sm:auto-rows-[140px] lg:auto-rows-[150px] gap-3 md:gap-4">
          <router-link
            v-for="(movie, i) in recommendations.slice(0, 7)"
            :key="movie.id"
            :to="{ name: 'movie-detail', params: { id: movie.id } }"
            :class="bentoSpan(i)"
            class="group relative overflow-hidden rounded-xl ring-1 ring-border transition-[box-shadow] hover:ring-primary/50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <img
              :src="bentoImage(movie, i)"
              :alt="movie.title"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
            <div class="absolute inset-x-0 bottom-0 p-3">
              <h3 class="text-white font-semibold text-sm md:text-base line-clamp-2 leading-tight drop-shadow">{{ movie.title }}</h3>
              <div class="flex items-center gap-2 mt-1 text-[11px] text-white/80">
                <span v-if="movie.vote_average" class="flex items-center gap-0.5 text-yellow-400 font-semibold">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  {{ movie.vote_average.toFixed(1) }}
                </span>
                <span v-if="movie.release_date">{{ new Date(movie.release_date).getFullYear() }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </section>
    </div>

    <!-- Video Player Modal Removed -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMovies } from '../composables/useMovies'
import { useUserStore } from '@/modules/user'
import { getBackdropUrl, getPosterUrl } from '@/core/config/api.config'
import SkeletonDetail from '@/modules/ui/components/skeletons/SkeletonDetail.vue'
import ErrorMessage from '@/modules/ui/components/ErrorMessage.vue'
import PersonAvatar from '@/modules/ui/components/PersonAvatar.vue'
import { BaseBadge, BaseButton, BaseCard } from '@/modules/ui/components/base'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { movieDetails, credits, loading, error, recommendations, hasRecommendations, fetchMovieDetails, fetchMovieRecommendations } = useMovies()

const backdropUrl = computed(() => 
  movieDetails.value ? getBackdropUrl(movieDetails.value.backdrop_path, 'original') : ''
)

const releaseYear = computed(() => 
  movieDetails.value ? new Date(movieDetails.value.release_date).getFullYear() : ''
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

function formatRuntime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

// Bento grid de "Relacionados": patrón fijo de 7 tiles sobre una rejilla de 4 columnas
// (la primera grande 2x2, dos anchas 2x1, el resto cuadradas 1x1) → llena 4x3 sin huecos.
const wideIndexes = [0, 1, 6]

function bentoSpan(i: number): string {
  if (i === 0) return 'col-span-2 row-span-2'
  if (i === 1 || i === 6) return 'col-span-2'
  return 'col-span-1'
}

function bentoImage(movie: any, i: number): string {
  // Tiles anchas → backdrop (apaisado); cuadradas → poster. Con fallback al otro.
  if (wideIndexes.includes(i)) {
    return movie.backdrop_path ? getBackdropUrl(movie.backdrop_path, 'w780') : getPosterUrl(movie.poster_path, 'w500')
  }
  return movie.poster_path ? getPosterUrl(movie.poster_path, 'w342') : getBackdropUrl(movie.backdrop_path, 'w500')
}

function playMovie() {
  if (movieDetails.value) {
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
  await fetchMovieDetails(id)
  await fetchMovieRecommendations(id)
})

watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      const id = Number(newId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      await fetchMovieDetails(id)
      await fetchMovieRecommendations(id)
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

