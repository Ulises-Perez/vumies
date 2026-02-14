<template>
  <div class="min-h-screen bg-dark h-screen flex flex-col overflow-hidden">
    <!-- Navbar placeholder or back button can go here if distinct from main layout -->
    
    <div class="flex-1 flex overflow-hidden">
      <!-- Main Player Area -->
      <div class="w-full lg:w-3/4 flex flex-col bg-black relative">
        <!-- Back Button Overlay -->
        <router-link
          :to="{ name: 'serie-detail', params: { id: seriesId } }"
          class="absolute top-4 left-4 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7 7-7" />
          </svg>
        </router-link>

        <div class="relative w-full h-full flex items-center justify-center bg-black">
          <iframe
            v-if="embedUrl"
            :src="embedUrl"
            class="w-full h-full"
            width="100%"
            height="100%"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            referrerpolicy="origin"
          />
          <div v-else class="text-white">Cargando reproductor...</div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="hidden lg:flex lg:w-1/4 flex-col bg-dark-200 border-l border-white/5">
        <!-- Header: Season Selector -->
        <div class="p-6 border-b border-white/5">
          <h2 class="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">A continuación</h2>
          
          <div class="relative">
            <select
              v-model="selectedSeasonNumber"
              @change="handleSeasonChange"
              class="w-full bg-white/10 text-white border border-white/10 rounded-lg py-3 px-4 appearance-none hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
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
            <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <!-- Episodes List -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          <div v-if="loadingEpisodes" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>

          <template v-else>
            <button
              v-for="episode in episodes"
              :key="episode.id"
              @click="goToEpisode(episode.episode_number)"
              class="w-full text-left p-3 rounded-lg flex gap-3 transition-all duration-200 group relative overflow-hidden"
              :class="episode.episode_number === episodeNumber && selectedSeasonNumber === seasonNumber ? 'bg-white/10 border-l-4 border-primary' : 'hover:bg-white/5 border-l-4 border-transparent'"
            >
              <!-- Playing Indicator for active episode -->
              <div 
                 v-if="episode.episode_number === episodeNumber && selectedSeasonNumber === seasonNumber"
                 class="absolute inset-0 bg-primary/5 pointer-events-none"
              ></div>

              <!-- Thumbnail (Placeholder or Real if available) -->
              <div class="relative flex-none w-32 aspect-video bg-gray-800 rounded overflow-hidden">
                <img 
                  v-if="episode.still_path" 
                  :src="`https://image.tmdb.org/t/p/w300${episode.still_path}`" 
                  alt=""
                  class="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                />
                 <!-- Play Icon Overlay -->
                <div class="absolute inset-0 flex items-center justify-center">
                   <svg 
                      v-if="episode.episode_number === episodeNumber && selectedSeasonNumber === seasonNumber"
                      class="w-8 h-8 text-primary drop-shadow-md" 
                      fill="currentColor" viewBox="0 0 24 24"
                   >
                     <path d="M8 5v14l11-7z"/>
                   </svg>
                   <svg 
                      v-else
                      class="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-md" 
                      fill="currentColor" viewBox="0 0 24 24"
                   >
                     <path d="M8 5v14l11-7z"/>
                   </svg>
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0 flex flex-col justify-center">
                <div class="flex items-center justify-between mb-1">
                   <h3 
                    class="font-medium truncate pr-2 transition-colors"
                    :class="episode.episode_number === episodeNumber && selectedSeasonNumber === seasonNumber ? 'text-primary' : 'text-gray-200 group-hover:text-white'"
                   >
                     {{ episode.episode_number }}. {{ episode.name }}
                   </h3>
                </div>
                <div class="flex items-center text-xs text-gray-500 space-x-2">
                   <span>{{ episode.runtime ? `${episode.runtime}m` : 'N/A' }}</span>
                   <div v-if="episode.vote_average" class="flex items-center text-gray-400">
                      <svg class="w-3 h-3 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      {{ episode.vote_average.toFixed(1) }}
                   </div>
                </div>
                <p class="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                  {{ episode.overview }}
                </p>
              </div>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayer } from '../composables/usePlayer'
import { useSeries } from '@/modules/catalog/composables/useSeries'
import type { Episode } from '@/modules/catalog/types/tmdb.types'

const route = useRoute()
const router = useRouter()
const { generateSeriesUrl } = usePlayer()
const { 
  fetchSeriesDetails, 
  fetchSeasonDetails, 
  seriesDetails, 
  currentSeason,
  loading: loadingEpisodes 
} = useSeries()

// Params from Route
const seriesId = computed(() => Number(route.params.id))
const seasonNumber = computed(() => Number(route.params.season))
const episodeNumber = computed(() => Number(route.params.episode))

// State
const embedUrl = ref('')
const selectedSeasonNumber = ref(1)

// Computed for UI
const seasons = computed(() => {
  return seriesDetails.value?.seasons.filter(s => s.season_number > 0) || []
})

const episodes = computed(() => {
  return currentSeason.value?.episodes || []
})

// Load Player URL
function loadEmbed() {
  embedUrl.value = generateSeriesUrl(
    seriesId.value,
    seasonNumber.value,
    episodeNumber.value
  )
}

// Initial Data Fetch
async function loadData() {
  // If we haven't successfully loaded the series details yet (or ID changed), fetch them
  if (!seriesDetails.value || seriesDetails.value.id !== seriesId.value) {
     await fetchSeriesDetails(seriesId.value)
  }
  
  // Set selected season to current route season
  selectedSeasonNumber.value = seasonNumber.value
  
  // Fetch episodes for the current season
  await fetchSeasonDetails(seriesId.value, seasonNumber.value)
  
  loadEmbed()
}

// Handle Sidebar Interactions
async function handleSeasonChange() {
  await fetchSeasonDetails(seriesId.value, selectedSeasonNumber.value)
}

function goToEpisode(epNum: number) {
  router.push({
    name: 'episode-player',
    params: {
      id: seriesId.value,
      season: selectedSeasonNumber.value,
      episode: epNum,
    },
  })
}

// Next Episode Logic
function nextEpisode() {
  const currentEpIndex = episodes.value.findIndex(e => e.episode_number === episodeNumber.value)
  
  // 1. Try Next Episode in Current Season
  if (currentEpIndex !== -1 && currentEpIndex < episodes.value.length - 1) {
    const nextEp = episodes.value[currentEpIndex + 1]
    goToEpisode(nextEp.episode_number)
    return
  }
  
  // 2. Try Next Season
  const currentSeasonIndex = seasons.value.findIndex(s => s.season_number === seasonNumber.value)
  if (currentSeasonIndex !== -1 && currentSeasonIndex < seasons.value.length - 1) {
    const nextSeason = seasons.value[currentSeasonIndex + 1]
    // Navigate to Ep 1 of next season
    // NOTE: goToEpisode uses selectedSeasonNumber, so we must manually push route
    router.push({
      name: 'episode-player',
      params: {
        id: seriesId.value,
        season: nextSeason.season_number,
        episode: 1,
      },
    })
  }
}

// Watchers
watch(
  () => [route.params.id, route.params.season, route.params.episode],
  async () => {
     // Reload everything when route changes (internal navigation)
     await loadData()
  }
)

onMounted(() => {
  loadData()
  
  // Experimental Auto-play Listener
  // Listen for messages from iframe if supported (Vimeus/providers might send 'ended')
  window.addEventListener('message', (event) => {
    // console.log('Message Received:', event.data)
    // Common events: 'ended', 'finish', or specific provider structure
    if (event.data === 'ended' || event.data?.event === 'ended') {
      nextEpisode()
    }
  })
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

