<template>
  <div v-if="loading" class="min-h-screen pt-8 flex items-center justify-center">
    <LoadingSpinner message="Cargando serie..." />
  </div>

  <div v-else-if="error" class="min-h-screen pt-8">
    <div class="container-custom py-8">
      <ErrorMessage :message="error" title="Error al cargar serie" />
    </div>
  </div>

  <div v-else-if="seriesDetails" class="min-h-screen">
    <!-- Backdrop Hero -->
    <div
      class="relative h-96 bg-cover bg-center"
      :style="{ backgroundImage: `url(${backdropUrl})` }"
    >
      <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-transparent" />
      
      <div class="relative h-full flex items-end pb-10">
        <div class="container-custom">
          <h1 class="text-4xl md:text-6xl font-bold font-poppins text-white mb-4 text-shadow">
            {{ seriesDetails.name }}
          </h1>
        </div>
      </div>
    </div>

    <!-- Details & Seasons -->
    <div class="bg-dark py-16">
      <div class="container-custom">
        <p class="text-lg text-gray-300 mb-8">{{ seriesDetails.overview }}</p>

        <!-- Seasons -->
        <div class="mt-12">
          <h2 class="text-3xl font-bold text-white font-poppins mb-6">Temporadas</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <router-link
              v-for="season in filteredSeasons"
              :key="season.id"
              :to="{ name: 'episode-player', params: { id: seriesDetails.id, season: season.season_number, episode: 1 } }"
              class="group"
            >
              <div class="aspect-poster rounded-xl overflow-hidden bg-gray-800 mb-2 group-hover:ring-2 group-hover:ring-primary transition-all">
                <img
                  v-if="season.poster_path"
                  :src="getPosterUrl(season.poster_path)"
                  :alt="season.name"
                  class="w-full h-full object-cover"
                />
              </div>
              <h3 class="text-sm text-white group-hover:text-primary transition-colors">
                {{ season.name }}
              </h3>
              <p class="text-xs text-gray-400">{{ season.episode_count }} episodios</p>
            </router-link>
          </div>
        </div>

        <!-- Recommendations -->
        <div v-if="hasRecommendations" class="mt-16">
          <h2 class="text-3xl font-bold text-white font-poppins mb-8">Te Recomendamos</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <TVShowCard
              v-for="series in recommendations.slice(0, 12)"
              :key="series.id"
              :series="series"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSeries } from '../composables/useSeries'
import { getBackdropUrl, getPosterUrl } from '@/core/config/api.config'
import TVShowCard from '../components/TVShowCard.vue'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import ErrorMessage from '@/modules/ui/components/ErrorMessage.vue'

const route = useRoute()
const { seriesDetails, loading, error, recommendations, hasRecommendations, fetchSeriesDetails, fetchSeriesRecommendations } = useSeries()

const backdropUrl = computed(() => 
  seriesDetails.value ? getBackdropUrl(seriesDetails.value.backdrop_path) : ''
)

const filteredSeasons = computed(() =>
  seriesDetails.value?.seasons.filter(s => s.season_number > 0) || []
)

onMounted(async () => {
  const id = Number(route.params.id)
  await fetchSeriesDetails(id)
  await fetchSeriesRecommendations(id)
})
</script>

