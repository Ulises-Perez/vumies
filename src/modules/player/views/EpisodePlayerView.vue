<template>
  <div class="min-h-screen bg-dark">
    <div class="relative w-full aspect-video">
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
      <div v-else class="w-full h-full flex items-center justify-center text-white">
        <p>No hay reproductor disponible</p>
      </div>
    </div>

    <!-- Episode Info & Navigation -->
    <div class="container-custom py-8">
      <div class="flex items-center justify-between mb-4">
        <router-link
          :to="{ name: 'serie-detail', params: { id: seriesId } }"
          class="text-primary hover:text-primary/80 transition-colors"
        >
          ← Volver a la serie
        </router-link>

        <div class="flex items-center space-x-4">
          <button
            v-if="episodeNumber > 1"
            @click="previousEpisode"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            ← Anterior
          </button>
          <button
            @click="nextEpisode"
            class="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            Siguiente →
          </button>
        </div>
      </div>

      <h1 class="text-3xl font-bold text-white mb-2">
        Temporada {{ seasonNumber }} - Episodio {{ episodeNumber }}
      </h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayer } from '../composables/usePlayer'

const route = useRoute()
const router = useRouter()
const { generateSeriesUrl } = usePlayer()

const seriesId = computed(() => Number(route.params.id))
const seasonNumber = computed(() => Number(route.params.season))
const episodeNumber = computed(() => Number(route.params.episode))

const embedUrl = ref('')

function loadEpisode() {
  embedUrl.value = generateSeriesUrl(
    seriesId.value,
    seasonNumber.value,
    episodeNumber.value
  )
}

function previousEpisode() {
  if (episodeNumber.value > 1) {
    router.push({
      name: 'episode-player',
      params: {
        id: seriesId.value,
        season: seasonNumber.value,
        episode: episodeNumber.value - 1,
      },
    })
  }
}

function nextEpisode() {
  router.push({
    name: 'episode-player',
    params: {
      id: seriesId.value,
      season: seasonNumber.value,
      episode: episodeNumber.value + 1,
    },
  })
}

onMounted(() => {
  loadEpisode()
})
</script>

