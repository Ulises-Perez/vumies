<template>
  <div v-if="loading" class="min-h-screen pt-20 flex items-center justify-center">
    <LoadingSpinner message="Cargando película..." />
  </div>

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
        <div class="container-custom w-full">
          <div class="max-w-3xl space-y-6">
            <h1 class="text-5xl md:text-7xl font-bold font-poppins text-white leading-tight text-shadow-lg">
              {{ movieDetails.title }}
            </h1>
            
            <div class="flex items-center space-x-4 text-gray-300 text-sm md:text-base">
              <span class="flex items-center space-x-1 text-green-400 font-bold">
                <span>{{ (movieDetails.vote_average * 10).toFixed(0) }}% Match</span>
              </span>
              <span>{{ releaseYear }}</span>
              <span class="px-2 py-0.5 border border-gray-600 rounded text-xs">{{ movieDetails.adult ? '18+' : 'PG-13' }}</span>
              <span>{{ formatRuntime(movieDetails.runtime) }}</span>
            </div>

            <div class="flex flex-wrap gap-2">
              <span
                v-for="genre in movieDetails.genres"
                :key="genre.id"
                class="text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                {{ genre.name }}<span v-if="genre !== movieDetails.genres[movieDetails.genres.length - 1]" class="mx-1">•</span>
              </span>
            </div>
            
            <div class="flex items-center space-x-4 pt-4">
              <button
                @click="playMovie"
                class="bg-white text-dark hover:bg-gray-200 px-8 py-3.5 rounded-lg font-bold flex items-center space-x-3 transition-all duration-300 transform hover:scale-105"
              >
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                <span>Reproducir</span>
              </button>
              
              <button
                @click="toggleFavorite"
                class="bg-gray-600/60 backdrop-blur-md text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-gray-600/80 transition-all duration-300 flex items-center space-x-3"
              >
                <svg
                  class="w-6 h-6"
                  :class="[isFavorite ? 'text-red-500 fill-current' : 'text-white']"
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
    </div>

    <!-- Details Content -->
    <div class="bg-dark relative z-10 px-4 md:px-12 -mt-10">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        <!-- Left Column: Overview and Metadata -->
        <div class="lg:col-span-2 space-y-10">
           <!-- Overview -->
           <div>
              <h3 class="text-xl font-bold text-white mb-3 font-poppins">Sinopsis</h3>
              <p class="text-gray-300 text-lg leading-relaxed">{{ movieDetails.overview }}</p>
           </div>

           <!-- Cast -->
           <div v-if="credits && credits.cast.length">
             <h3 class="text-xl font-bold text-white mb-4 font-poppins">Reparto Principal</h3>
             <div class="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
               <div v-for="actor in credits.cast.slice(0, 10)" :key="actor.id" class="flex-none w-32 text-center group">
                 <div class="w-32 h-32 rounded-full overflow-hidden mb-3 border-2 border-transparent group-hover:border-primary transition-all">
                   <img 
                    :src="getProfileUrl(actor.profile_path)" 
                    :alt="actor.name"
                    class="w-full h-full object-cover"
                    loading="lazy"
                   >
                 </div>
                 <p class="text-white font-medium text-sm truncate">{{ actor.name }}</p>
                 <p class="text-gray-400 text-xs truncate">{{ actor.character }}</p>
               </div>
             </div>
           </div>

           <!-- Awards (Mock) -->
           <div>
             <h3 class="text-xl font-bold text-white mb-4 font-poppins">Premios</h3>
             <div class="flex flex-wrap gap-4">
                <div class="flex items-center space-x-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div class="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </div>
                  <div>
                    <p class="text-white font-bold text-sm">Oscar Winner</p>
                    <p class="text-gray-400 text-xs">Best Picture (2024)</p>
                  </div>
                </div>
                <div class="flex items-center space-x-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                   <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827.954L17.18 5.485l-4.14 1.656.643 1.286 4.137-1.655a1 1 0 01.74 1.854l-4.138 1.655.644 1.288 4.137-1.655a1 1 0 11.74 1.854l-4.138 1.655.644 1.288 4.137-1.655a1 1 0 11.74 1.854l-4.138 1.655.644 1.288 4.137-1.655a1 1 0 11.74 1.854L10 16.098V20a1 1 0 11-2 0v-3.903l-7.442 2.977a1 1 0 01-1.48-.927V4.098a1 1 0 011.082-.996L10 3.323V3a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                  </div>
                  <div>
                    <p class="text-white font-bold text-sm">Golden Globe</p>
                    <p class="text-gray-400 text-xs">Best Director</p>
                  </div>
                </div>
             </div>
           </div>
        </div>

        <!-- Right Column: Info & Recommendations -->
        <div class="space-y-8">
           <div class="bg-gray-800/30 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
             <h3 class="text-lg font-bold text-white mb-4">Información</h3>
             <div class="space-y-4">
               <div v-if="directors.length">
                 <p class="text-gray-400 text-sm">Director</p>
                 <p class="text-white">{{ directors.map(d => d.name).join(', ') }}</p>
               </div>
               <div v-if="writers.length">
                 <p class="text-gray-400 text-sm">Guión</p>
                 <p class="text-white">{{ writers.map(w => w.name).join(', ') }}</p>
               </div>
               <div>
                  <p class="text-gray-400 text-sm">Estudio</p>
                  <p class="text-white">{{ movieDetails.production_companies[0]?.name || 'N/A' }}</p>
               </div>
             </div>
           </div>

           <!-- Recommendations (Vertical List for Sidebar feel) -->
           <div v-if="hasRecommendations">
              <h3 class="text-lg font-bold text-white mb-4">Relacionados</h3>
              <div class="grid grid-cols-2 gap-4">
                 <router-link 
                    v-for="movie in recommendations.slice(0, 6)" 
                    :key="movie.id"
                    :to="{ name: 'movie-detail', params: { id: movie.id } }"
                    class="block group"
                 >
                    <div class="aspect-poster rounded-lg overflow-hidden mb-2 bg-gray-800">
                       <img 
                          :src="getPosterUrl(movie.poster_path)" 
                          :alt="movie.title" 
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                       >
                    </div>
                    <p class="text-white text-xs font-medium truncate group-hover:text-primary">{{ movie.title }}</p>
                 </router-link>
              </div>
           </div>
        </div>

      </div>
    </div>

    <!-- Video Player Modal Removed -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMovies } from '../composables/useMovies'
import { useUserStore } from '@/modules/user'
import { getBackdropUrl, getPosterUrl, getProfileUrl } from '@/core/config/api.config'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import ErrorMessage from '@/modules/ui/components/ErrorMessage.vue'

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

