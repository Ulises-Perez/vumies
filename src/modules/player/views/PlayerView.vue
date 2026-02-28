<template>
  <div class="fixed inset-0 bg-black flex flex-col md:flex-row z-50">
    <!-- Main Player Area -->
    <div class="flex-1 flex flex-col relative group h-full">
      <!-- Back Button -->
      <button 
        @click="goBack"
        class="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 duration-300"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      <!-- Iframe -->
      <div class="flex-1 bg-black relative w-full h-full">
        <!-- Empty State Preview/Error -->
        <div v-if="hasContentError" class="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/90 z-20">
          <svg class="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <h2 class="text-2xl font-bold font-poppins mb-2 text-white">Próximamente</h2>
          <p class="text-gray-400 max-w-sm text-center">Este contenido no está disponible por el momento. Mientras tanto, puedes explorar otras recomendaciones.</p>
        </div>

        <iframe
          v-show="embedUrl && !hasContentError"
          @error="handleIframeError"
          @load="handleIframeLoad"
          :src="embedUrl"
          class="w-full h-full absolute inset-0"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          referrerpolicy="origin"
        />
        <div v-show="!embedUrl && !hasContentError" class="flex items-center justify-center h-full text-white">
          <LoadingSpinner message="Cargando reproductor..." />
        </div>
      </div>
    </div>

    <!-- Sidebar (Desktop Only) -->
    <div class="w-full md:w-96 bg-gray-900 border-l border-white/5 hidden md:flex flex-col md:h-full">
      
      <!-- SERIES SIDEBAR -->
      <template v-if="(type === 'tv' || type === 'anime') && !hasContentError">
        <!-- Header: Season Selector -->
        <div class="p-4 border-b border-white/5 bg-gray-900 z-10">
          
          <div class="relative">
            <select
              v-model="selectedSeasonNumber"
              @change="handleSeasonChange"
              class="w-full bg-white/10 text-white border border-white/10 rounded-lg py-2.5 px-3 text-sm appearance-none hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer pr-10"
            >
              <option 
                v-for="season in seasons" 
                :key="season.id" 
                :value="season.season_number"
                class="bg-dark text-white"
              >
                {{ season.name }}
              </option>
            </select>
            <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <!-- Episodes List -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          <div v-if="loadingEpisodes" class="flex justify-center py-8">
             <LoadingSpinner />
          </div>

          <template v-else>
            <button
              v-for="ep in episodes"
              :key="ep.id"
              @click="goToEpisode(ep.episode_number)"
              class="w-full text-left p-2 rounded-lg flex gap-3 transition-all duration-200 group relative overflow-hidden group/item"
              :class="isCurrentEpisode(ep.episode_number) ? 'bg-white/10 border-l-2 border-primary' : 'hover:bg-white/5 border-l-2 border-transparent'"
            >
              <!-- Playing Indicator Background -->
              <div 
                 v-if="isCurrentEpisode(ep.episode_number)"
                 class="absolute inset-0 bg-primary/5 pointer-events-none"
              ></div>

              <!-- Thumbnail -->
              <div class="relative flex-none w-28 aspect-video bg-gray-800 rounded overflow-hidden">
                <img 
                  v-if="ep.still_path" 
                  :src="`https://image.tmdb.org/t/p/w300${ep.still_path}`" 
                  alt=""
                  class="w-full h-full object-cover opacity-80 group-hover/item:opacity-100 transition-opacity"
                />
                 <!-- Play Icon Overlay -->
                <div class="absolute inset-0 flex items-center justify-center">
                   <svg 
                      v-if="isCurrentEpisode(ep.episode_number)"
                      class="w-6 h-6 text-primary drop-shadow-md" 
                      fill="currentColor" viewBox="0 0 24 24"
                   >
                     <path d="M8 5v14l11-7z"/>
                   </svg>
                   <svg 
                      v-else
                      class="w-6 h-6 text-white opacity-0 group-hover/item:opacity-80 transition-opacity drop-shadow-md" 
                      fill="currentColor" viewBox="0 0 24 24"
                   >
                     <path d="M8 5v14l11-7z"/>
                   </svg>
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0 flex flex-col justify-center">
                 <h3 
                  class="text-sm font-medium truncate pr-1 transition-colors leading-tight mb-1"
                  :class="isCurrentEpisode(ep.episode_number) ? 'text-primary' : 'text-gray-200 group-hover/item:text-white'"
                 >
                   {{ ep.episode_number }}. {{ ep.name }}
                 </h3>
                <div class="flex items-center text-xs text-gray-500 space-x-2">
                   <span>{{ ep.runtime ? `${ep.runtime}m` : 'N/A' }}</span>
                   <div v-if="ep.vote_average" class="flex items-center text-gray-400">
                      <svg class="w-3 h-3 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      {{ ep.vote_average.toFixed(1) }}
                   </div>
                </div>
                <p class="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                  {{ ep.overview }}
                </p>
              </div>
            </button>
          </template>
        </div>
      </template>

      <!-- MOVIES SIDEBAR & FALLBACK RECOMMENDATIONS -->
      <template v-else>
        <div class="p-4 border-b border-white/5">
          <h2 class="text-white font-bold font-poppins">A continuación</h2>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div v-if="loadingQueue" class="text-center py-4">
             <LoadingSpinner />
          </div>
          <div v-else-if="queue.length > 0">
             <div 
               v-for="item in queue" 
               :key="item.id"
               class="flex space-x-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors group"
               @click="playItem(item)"
             >
               <div class="w-24 aspect-video bg-gray-800 rounded overflow-hidden flex-shrink-0 relative">
                 <img :src="getBackdropUrl(item.backdrop_path, 'w300')" class="w-full h-full object-cover">
                 <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                 </div>
               </div>
               <div class="flex-1 min-w-0">
                 <h4 class="text-white text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">{{ item.title || item.name }}</h4>
                 <p class="text-gray-400 text-xs mt-1">{{ item.vote_average.toFixed(1) }} rating</p>
               </div>
             </div>
          </div>
          <div v-else class="text-gray-500 text-sm text-center">
            No hay elementos en la cola.
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBackdropUrl } from '@/core/config/api.config'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import { useMovies } from '@/modules/catalog/composables/useMovies'
import { useSeries } from '@/modules/catalog/composables/useSeries'
import { usePlayer } from '@/modules/player'

const route = useRoute()
const router = useRouter()
const { fetchMovieRecommendations, fetchSimilarMovies, fetchTrendingMovies } = useMovies()
const { 
  fetchSeriesDetails, 
  fetchSeasonDetails, 
  seriesDetails, 
  currentSeason, 
  loading: loadingEpisodes
} = useSeries()
const { generateMovieUrl, generateEpisodeUrl, generateAnimeUrl } = usePlayer()

// State
const embedUrl = ref('')
const queue = ref<any[]>([])
const loadingQueue = ref(false)
const selectedSeasonNumber = ref(1)
const hasContentError = ref(false)
let iframeTimeout: number | null = null

// Computed Params
const type = computed(() => {
   const t = route.params.type as string
   // Normalize 'serie' or 'tv', handle 'anime' intentionally
   if (t === 'anime') return 'anime'
   return (t === 'serie' || t === 'tv') ? 'tv' : 'movie'
})
const id = computed(() => Number(route.params.id))
const season = computed(() => Number(route.params.season) || 1)
const episode = computed(() => Number(route.params.episode) || 1)

// Computed Series Data
const seasons = computed(() => {
  return seriesDetails.value?.seasons.filter(s => s.season_number > 0) || []
})

const episodes = computed(() => {
  return currentSeason.value?.episodes || []
})

function isCurrentEpisode(epNum: number) {
  return epNum === episode.value && selectedSeasonNumber.value === season.value
}

function goBack() {
  if (type.value === 'movie') {
    router.push({ name: 'movie-detail', params: { id: id.value } })
  } else if (type.value === 'anime') {
    router.push({ name: 'anime-detail', params: { id: id.value } })
  } else {
    router.push({ name: 'serie-detail', params: { id: id.value } })
  }
}

async function loadContent() {
  // Clear previous state if needed
  hasContentError.value = false
  
  if (type.value === 'movie') {
    embedUrl.value = generateMovieUrl(id.value)
    
    // Load Recommendations for Queue
    loadingQueue.value = true
    let res = await fetchMovieRecommendations(id.value)
    if (!res?.results || res.results.length === 0) {
      res = await fetchSimilarMovies(id.value)
      if (!res?.results || res.results.length === 0) {
        res = await fetchTrendingMovies('day')
      }
    }
    queue.value = res?.results?.filter((m: any) => m.id !== id.value) || []
    loadingQueue.value = false
    
  } else if (type.value === 'anime') {
    // ANIME LOGIC
    embedUrl.value = generateAnimeUrl(id.value, season.value, episode.value)

    if (!seriesDetails.value || seriesDetails.value.id !== id.value) {
       await fetchSeriesDetails(id.value)
    }

    selectedSeasonNumber.value = season.value

    loadingEpisodes.value = true
    await fetchSeasonDetails(id.value, season.value)
    loadingEpisodes.value = false

    let fallbackRes = await fetchMovieRecommendations(id.value) 
    if (!fallbackRes?.results || fallbackRes.results.length === 0) {
      fallbackRes = await fetchSimilarMovies(id.value)
      if (!fallbackRes?.results || fallbackRes.results.length === 0) {
        fallbackRes = await fetchTrendingMovies('day')
      }
    }
    queue.value = fallbackRes?.results?.filter((m: any) => m.id !== id.value) || []
  } else {
    // SERIES LOGIC
    embedUrl.value = generateEpisodeUrl(id.value, season.value, episode.value)
    
    // Ensure Series Details are loaded
    if (!seriesDetails.value || seriesDetails.value.id !== id.value) {
       await fetchSeriesDetails(id.value)
    }
    
    // Set selected season to match URL
    selectedSeasonNumber.value = season.value
    
    // Fetch Episodes for sidebar
    loadingEpisodes.value = true
    await fetchSeasonDetails(id.value, season.value)
    loadingEpisodes.value = false
    
    // Fallback Recommendations for series (if error happens)
    let fallbackRes = await fetchMovieRecommendations(id.value) 
    if (!fallbackRes?.results || fallbackRes.results.length === 0) {
      fallbackRes = await fetchSimilarMovies(id.value)
      if (!fallbackRes?.results || fallbackRes.results.length === 0) {
        fallbackRes = await fetchTrendingMovies('day')
      }
    }
    queue.value = fallbackRes?.results?.filter((m: any) => m.id !== id.value) || []
  }

  // Set a timeout to check if the iframe hasn't loaded (fallback for undetected 404s)
  if (iframeTimeout) clearTimeout(iframeTimeout)
  iframeTimeout = window.setTimeout(() => {
    // If it takes too long and we haven't received any 'ready' or video data
    // we could potentially assume an error, but let's rely on fetch detection first.
  }, 10000)

  // As iframe @error does not always catch 404s from cross-origin, we double check by fetching the URL head
  checkEmbedUrlStatus(embedUrl.value)
}

async function checkEmbedUrlStatus(url: string) {
  try {
     const res = await fetch(url, { method: 'HEAD' })
     if (!res.ok && res.status === 404) {
       hasContentError.value = true
     }
  } catch (e) {
     // Fetch might fail due to CORS. If it does, rely on visual fallback or iframe load error.
     console.warn('Could not verify embed URL status via fetch', e)
  }
}

function handleIframeError() {
  hasContentError.value = true
}

function handleIframeLoad() {
  if (iframeTimeout) clearTimeout(iframeTimeout)
}

async function handleSeasonChange() {
  loadingEpisodes.value = true
  await fetchSeasonDetails(id.value, selectedSeasonNumber.value)
  loadingEpisodes.value = false
}

function goToEpisode(epNum: number) {
  // Check if it's the current one to avoid reload? 
  // Maybe unnecessary, but good for performance. 
  if (epNum === episode.value && selectedSeasonNumber.value === season.value) return;

  router.push({
    name: 'player', // route name
    params: {
      type: type.value === 'anime' ? 'anime' : 'serie', 
      id: id.value,
      season: selectedSeasonNumber.value,
      episode: epNum
    }
  })
}

function nextEpisode() {
  if (type.value === 'movie') return

  const currentEpIndex = episodes.value.findIndex(e => e.episode_number === episode.value)
  
  // 1. Try Next Episode in Current Season (Sidebar List)
  if (currentEpIndex !== -1 && currentEpIndex < episodes.value.length - 1) {
    const nextEp = episodes.value[currentEpIndex + 1]
    if (nextEp) goToEpisode(nextEp.episode_number)
    return
  }
  
  // 2. Try Next Season
  const currentSeasonIndex = seasons.value.findIndex(s => s.season_number === season.value)
  if (currentSeasonIndex !== -1 && currentSeasonIndex < seasons.value.length - 1) {
    const nextSeason = seasons.value[currentSeasonIndex + 1]
    if (!nextSeason) return
    // Navigate manually to next season
    router.push({
      name: 'player',
      params: {
        type: type.value === 'anime' ? 'anime' : 'serie',
        id: id.value,
        season: nextSeason.season_number,
        episode: 1
      }
    })
  }
}

// For Movies Queue Item Click
function playItem(item: any) {
  if (type.value === 'movie') {
    router.push({ name: 'player', params: { type: 'movie', id: item.id } })
  } else {
    router.push({ name: 'serie-detail', params: { id: item.id } }) 
  }
}

// Auto-play Listener
function handleMessage(event: MessageEvent) {
  if (event.data === 'ended' || event.data?.event === 'ended') {
    if (type.value === 'tv' || type.value === 'anime') {
       nextEpisode()
    }
  }
  // Vimeus or other players might send specific errors
  if (event.data === 'error' || event.data?.event === 'error' || event.data?.status === 404) {
    hasContentError.value = true
  }
}

onMounted(() => {
  loadContent()
  window.addEventListener('message', handleMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
  if (iframeTimeout) clearTimeout(iframeTimeout)
})

watch(() => route.params, () => {
  loadContent()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}
</style>
