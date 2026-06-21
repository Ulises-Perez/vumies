<template>
  <SkeletonDetail v-if="loading" />

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
        <div class="px-4 md:px-12 w-full">
          <div class="max-w-3xl space-y-6">
            <h1 class="text-5xl md:text-7xl font-bold font-poppins text-foreground leading-tight text-shadow-lg">
              {{ seriesDetails.name }}
            </h1>

            <div class="flex items-center gap-4 text-muted-foreground text-sm md:text-base">
              <span class="text-green-400 font-bold">{{ (seriesDetails.vote_average * 10).toFixed(0) }}% Match</span>
              <span>{{ firstAirYear }}</span>
              <BaseBadge variant="outline">TV-MA</BaseBadge>
              <span>{{ seriesDetails.number_of_seasons }} Temporadas</span>
            </div>

            <p class="text-lg text-muted-foreground line-clamp-3 text-shadow max-w-2xl leading-relaxed">
              {{ seriesDetails.overview }}
            </p>

            <div class="flex items-center space-x-4 pt-4">
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

    <!-- Content -->
    <div class="bg-background relative z-10 px-4 md:px-12 -mt-10">

      <!-- Season Selector & Episodes -->
      <div class="mb-16">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-bold text-foreground font-poppins">Episodios</h2>

          <BaseSelect
            :model-value="selectedSeasonNumber"
            class="min-w-[12rem] font-semibold"
            @update:model-value="selectedSeasonNumber = Number($event)"
          >
            <option
              v-for="season in seriesDetails.seasons"
              :key="season.id"
              :value="season.season_number"
            >
              {{ season.name }}
            </option>
          </BaseSelect>
        </div>

        <!-- Episode List -->
        <div v-if="currentSeason" class="space-y-4">
          <button
            v-for="episode in currentSeason.episodes"
            :key="episode.id"
            type="button"
            @click="playEpisode(episode.episode_number)"
            class="group w-full text-left bg-card hover:bg-accent rounded-xl overflow-hidden flex flex-col sm:flex-row border border-border hover:border-primary/40 transition-colors duration-200 sm:min-h-[9rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
             <!-- Thumbnail -->
             <div class="relative w-full sm:w-56 md:w-72 flex-shrink-0 aspect-video sm:aspect-auto bg-muted">
               <img
                 :src="getBackdropUrl(episode.still_path, 'w300')"
                 :alt="episode.name"
                 class="absolute inset-0 w-full h-full object-cover"
                 loading="lazy"
               >
               <!-- Número de episodio -->
               <span class="absolute top-2 left-2 rounded-md bg-background/70 backdrop-blur-sm border border-border/60 px-2 py-0.5 text-xs font-bold text-foreground">
                 E{{ episode.episode_number }}
               </span>
               <!-- Play overlay (afordancia visual; la card entera reproduce) -->
               <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                 <span class="rounded-full bg-primary p-3 text-primary-foreground shadow-lg scale-90 group-hover:scale-100 transition-transform duration-200">
                   <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                 </span>
               </div>
             </div>

             <!-- Info -->
             <div class="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-center gap-2">
               <div class="flex items-start justify-between gap-3">
                 <h3 class="font-semibold text-base md:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                   {{ episode.name }}
                 </h3>
                 <BaseBadge variant="muted" class="flex-shrink-0">{{ episode.runtime || '45' }} min</BaseBadge>
               </div>
               <p class="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                 {{ episode.overview || 'Sin descripción disponible.' }}
               </p>
             </div>
          </button>
        </div>
        <div v-else class="text-center py-12 text-muted-foreground">
           Cargando episodios...
        </div>
      </div>

      <!-- Cast -->
      <div v-if="credits && credits.cast.length" class="mb-16">
        <h3 class="text-xl font-bold text-foreground mb-6 font-poppins">Reparto Principal</h3>
        <div class="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
          <div v-for="actor in credits.cast.slice(0, 10)" :key="actor.id" class="flex-none w-32 text-center group">
            <PersonAvatar :path="actor.profile_path" :name="actor.name" class="mb-3" />
            <p class="text-foreground font-medium text-sm truncate">{{ actor.name }}</p>
            <p class="text-muted-foreground text-xs truncate">{{ actor.character }}</p>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div v-if="hasRecommendations">
        <h2 class="text-2xl font-bold text-foreground font-poppins mb-8">Te Recomendamos</h2>
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
import { getBackdropUrl } from '@/core/config/api.config'
import TVShowCard from '../components/TVShowCard.vue'
import SkeletonDetail from '@/modules/ui/components/skeletons/SkeletonDetail.vue'
import ErrorMessage from '@/modules/ui/components/ErrorMessage.vue'
import PersonAvatar from '@/modules/ui/components/PersonAvatar.vue'
import { BaseBadge, BaseButton, BaseSelect } from '@/modules/ui/components/base'

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

