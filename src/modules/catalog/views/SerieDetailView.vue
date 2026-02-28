<template>
  <div v-if="loading" class="min-h-screen pt-20 flex items-center justify-center">
    <LoadingSpinner message="Cargando serie..." />
  </div>

  <div v-else-if="error" class="min-h-screen pt-20">
    <div class="container-custom py-8">
      <ErrorMessage :message="error" title="Error al cargar serie" />
    </div>
  </div>

  <div v-else-if="seriesDetails" class="min-h-screen pb-20">
    <!-- Backdrop Hero -->
    <div
      class="relative h-[80vh] w-full bg-cover bg-center"
      :style="{ backgroundImage: `url(${backdropUrl})` }"
    >
      <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
      <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/60 to-transparent" />
      
      <div class="absolute inset-0 flex items-end pb-20">
        <div class="container-custom w-full">
          <div class="max-w-3xl space-y-6">
            <h1 class="text-5xl md:text-7xl font-bold font-poppins text-white leading-tight text-shadow-lg">
              {{ seriesDetails.name }}
            </h1>
            
            <div class="flex items-center space-x-4 text-gray-300 text-sm md:text-base">
              <span class="flex items-center space-x-1 text-green-400 font-bold">
                <span>{{ (seriesDetails.vote_average * 10).toFixed(0) }}% Match</span>
              </span>
              <span>{{ firstAirYear }}</span>
              <span class="px-2 py-0.5 border border-gray-600 rounded text-xs">TV-MA</span>
              <span>{{ seriesDetails.number_of_seasons }} Temporadas</span>
            </div>

            <p class="text-lg text-gray-200 line-clamp-3 text-shadow max-w-2xl leading-relaxed">
              {{ seriesDetails.overview }}
            </p>
            
            <div class="flex items-center space-x-4 pt-4">
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

    <!-- Content -->
    <div class="bg-dark relative z-10 px-4 md:px-12 -mt-10">
      
      <!-- Season Selector & Episodes -->
      <div class="mb-16">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-bold text-white font-poppins">Episodios</h2>
          
          <div class="relative">
            <select
              v-model="selectedSeasonNumber"
              class="appearance-none bg-gray-800 text-white px-6 py-3 pr-10 rounded-lg border border-gray-700 focus:outline-none focus:border-primary cursor-pointer font-semibold text-sm"
            >
              <option 
                v-for="season in seriesDetails.seasons" 
                :key="season.id" 
                :value="season.season_number"
              >
                {{ season.name }}
              </option>
            </select>
            <div class="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        <!-- Episode List -->
        <div v-if="currentSeason" class="grid grid-cols-1 gap-4">
          <div 
            v-for="episode in currentSeason.episodes" 
            :key="episode.id" 
            class="group bg-gray-800/30 hover:bg-gray-800/60 rounded-xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 border border-transparent hover:border-white/5"
          >
             <!-- Thumbnail -->
             <div class="md:w-64 h-36 md:h-auto relative flex-shrink-0">
               <img 
                 :src="getBackdropUrl(episode.still_path, 'w300')" 
                 alt="Episode thumbnail" 
                 class="w-full h-full object-cover"
                 loading="lazy"
               >
               <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <button @click="playEpisode(episode.episode_number)" class="bg-primary/90 p-3 rounded-full text-white transform scale-90 group-hover:scale-100 transition-transform">
                   <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                 </button>
               </div>
             </div>

             <!-- Info -->
             <div class="p-6 flex-1 flex flex-col justify-center">
               <div class="flex items-start justify-between mb-2">
                 <div>
                   <h3 class="text-white font-bold text-lg group-hover:text-primary transition-colors">
                     {{ episode.episode_number }}. {{ episode.name }}
                   </h3>
                   <span class="text-gray-400 text-sm">{{ episode.runtime || '45' }} min</span>
                 </div>
               </div>
               <p class="text-gray-400 text-sm line-clamp-2 md:line-clamp-3 leading-relaxed">
                 {{ episode.overview }}
               </p>
             </div>
          </div>
        </div>
        <div v-else class="text-center py-12 text-gray-500">
           Cargando episodios...
        </div>
      </div>

      <!-- Cast -->
      <div v-if="credits && credits.cast.length" class="mb-16">
        <h3 class="text-xl font-bold text-white mb-6 font-poppins">Reparto Principal</h3>
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

      <!-- Recommendations -->
      <div v-if="hasRecommendations">
        <h2 class="text-2xl font-bold text-white font-poppins mb-8">Te Recomendamos</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          <TVShowCard
            v-for="series in recommendations.slice(0, 12)"
            :key="series.id"
            :series="series"
          />
        </div>
      </div>

    </div>

    <!-- Video Player Modal Removed -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSeries } from '../composables/useSeries'
import { useUserStore } from '@/modules/user'
import { getBackdropUrl, getProfileUrl } from '@/core/config/api.config'
import TVShowCard from '../components/TVShowCard.vue'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import ErrorMessage from '@/modules/ui/components/ErrorMessage.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { seriesDetails, currentSeason, credits, loading, error, recommendations, hasRecommendations, fetchSeriesDetails, fetchSeasonDetails, fetchSeriesRecommendations } = useSeries()

const selectedSeasonNumber = ref(1)

const backdropUrl = computed(() => 
  seriesDetails.value ? getBackdropUrl(seriesDetails.value.backdrop_path, 'original') : ''
)

const firstAirYear = computed(() => 
  seriesDetails.value ? new Date(seriesDetails.value.first_air_date).getFullYear() : ''
)

const isFavorite = computed(() => 
  seriesDetails.value ? userStore.isFavorite(seriesDetails.value.id, 'tv') : false
)

function toggleFavorite() {
  if (seriesDetails.value) {
    userStore.toggleFavorite({
      id: seriesDetails.value.id,
      type: 'tv',
      title: seriesDetails.value.name,
      poster_path: seriesDetails.value.poster_path,
    })
  }
}

function playEpisode(episodeNumber: number) {
  if (seriesDetails.value) {
    const isAnimeRoute = route.name === 'anime-detail';
    router.push({
      name: 'player',
      params: { 
        type: isAnimeRoute ? 'anime' : 'tv', 
        id: seriesDetails.value.id,
        season: selectedSeasonNumber.value,
        episode: episodeNumber
      }
    })
  }
}

async function loadSeason(seasonNum: number) {
  if (seriesDetails.value) {
    await fetchSeasonDetails(seriesDetails.value.id, seasonNum)
  }
}

onMounted(async () => {
  const id = Number(route.params.id)
  await fetchSeriesDetails(id)
  await fetchSeriesRecommendations(id)
  
  // Load first season by default or logic related
  if (seriesDetails.value && seriesDetails.value.seasons?.length > 0) {
     const firstSeason = seriesDetails.value.seasons.find(s => s.season_number === 1) || seriesDetails.value.seasons[0]
     if (firstSeason) {
       selectedSeasonNumber.value = firstSeason.season_number
       await loadSeason(selectedSeasonNumber.value)
     }
  }
})

watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      const id = Number(newId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      await fetchSeriesDetails(id)
      await fetchSeriesRecommendations(id)
      if (seriesDetails.value && seriesDetails.value.seasons?.length > 0) {
         const firstSeason = seriesDetails.value.seasons.find(s => s.season_number === 1) || seriesDetails.value.seasons[0]
         if (firstSeason) {
            selectedSeasonNumber.value = firstSeason.season_number
            await loadSeason(selectedSeasonNumber.value)
         }
      }
    }
  }
)

watch(selectedSeasonNumber, async (newVal) => {
  await loadSeason(newVal)
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

