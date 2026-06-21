<template>
  <div class="fixed inset-0 bg-black flex flex-col md:flex-row z-50">
    <!-- Player -->
    <div class="flex-1 flex flex-col relative group h-full">
      <!-- Back -->
      <button
        @click="goBack"
        class="absolute top-4 left-4 z-30 bg-background/60 hover:bg-background/80 text-foreground p-2 rounded-full backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 duration-300"
      >
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
      </button>

      <!-- Iframe -->
      <div class="flex-1 bg-black relative w-full h-full">
        <div v-if="loadingEpisode" class="absolute inset-0 flex items-center justify-center text-foreground">
          <LoadingSpinner message="Cargando episodio..." />
        </div>

        <div v-else-if="!activeEmbed" class="absolute inset-0 flex flex-col items-center justify-center text-foreground bg-black/90">
          <h2 class="text-2xl font-bold font-poppins mb-2">Sin reproductor</h2>
          <p class="text-muted-foreground max-w-sm text-center">Este episodio no tiene servidores disponibles por el momento.</p>
        </div>

        <iframe
          v-else
          :key="activeEmbed"
          :src="activeEmbed"
          class="w-full h-full absolute inset-0"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          referrerpolicy="origin"
        />
      </div>

      <!-- Server bar -->
      <div v-if="episodeLinks" class="bg-card border-t border-border p-3 flex flex-wrap items-center gap-2">
        <span class="text-xs text-muted-foreground font-bold uppercase mr-2">Servidores:</span>

        <template v-for="variant in (['SUB', 'DUB'] as const)" :key="variant">
          <template v-if="episodeLinks.servers[variant].length">
            <span class="text-xs text-muted-foreground font-semibold">{{ variant }}:</span>
            <button
              v-for="srv in episodeLinks.servers[variant]"
              :key="variant + srv.server + srv.url"
              @click="activeEmbed = srv.url"
              class="px-3 py-1.5 rounded-md text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="activeEmbed === srv.url ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'"
            >
              {{ srv.server }}
            </button>
          </template>
        </template>

        <!-- Prev/Next (consciente de temporadas) -->
        <div class="flex gap-2 ml-auto">
          <button
            :disabled="!hasPrev"
            @click="goPrev"
            class="px-3 py-1.5 rounded-md text-xs font-bold bg-secondary text-secondary-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            ◀ Anterior
          </button>
          <button
            :disabled="!hasNext"
            @click="goNext"
            class="px-3 py-1.5 rounded-md text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :class="!nextEpisode && nextSeason ? 'bg-primary text-primary-foreground hover:bg-primary/80' : 'bg-secondary text-secondary-foreground hover:bg-accent'"
          >
            {{ !nextEpisode && nextSeason ? 'Siguiente temporada ▶▶' : 'Siguiente ▶' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Sidebar episodios -->
    <div class="w-full md:w-80 bg-card border-l border-border hidden md:flex flex-col md:h-full">
      <div class="p-4 border-b border-border space-y-3">
        <div>
          <h2 class="text-foreground font-bold font-poppins truncate">{{ animeInfo?.title || 'Episodios' }}</h2>
          <p class="text-muted-foreground text-xs mt-1">Episodio {{ currentEpisode }}</p>
        </div>
        <!-- Selector de temporada -->
        <BaseSelect
          v-if="seasons.length > 1"
          :model-value="slug"
          class="w-full"
          @update:model-value="onSeasonSelect($event)"
        >
          <option v-for="(s, idx) in seasons" :key="s.slug" :value="s.slug">
            T{{ idx + 1 }} · {{ s.title }}
          </option>
        </BaseSelect>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        <button
          v-for="ep in episodes"
          :key="ep.id ?? ep.number"
          @click="goToEpisode(ep.number)"
          class="w-full text-left p-2 rounded-lg flex gap-3 transition-all duration-200"
          :class="String(ep.number) === String(currentEpisode) ? 'bg-muted/60 border-l-2 border-primary' : 'hover:bg-accent border-l-2 border-transparent'"
        >
          <div class="relative flex-none w-24 aspect-video bg-card rounded overflow-hidden">
            <img v-if="ep.image" :src="ep.image" alt="" width="160" height="90" class="w-full h-full object-cover" loading="lazy" decoding="async" />
          </div>
          <div class="flex-1 min-w-0 flex items-center">
            <span class="text-sm font-medium" :class="String(ep.number) === String(currentEpisode) ? 'text-primary' : 'text-muted-foreground'">
              Episodio {{ ep.number }}
            </span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAnimeAV1 } from '../composables/useAnimeAV1'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import { BaseSelect } from '@/modules/ui/components/base'

const route = useRoute()
const router = useRouter()
const { animeInfo, franchise, episodeLinks, fetchAnimeInfo, fetchEpisode, fetchFranchise } = useAnimeAV1()

const activeEmbed = ref('')
const loadingEpisode = ref(false)

const slug = computed(() => route.params.slug as string)
const currentEpisode = computed(() => route.params.episode as string)
const episodes = computed(() => animeInfo.value?.episodes || [])
const seasons = computed(() => franchise.value?.seasons || [])

const currentIndex = computed(() =>
  episodes.value.findIndex((e) => String(e.number) === String(currentEpisode.value))
)
const prevEpisode = computed(() => {
  const i = currentIndex.value
  return i > 0 ? episodes.value[i - 1]?.number ?? null : null
})
const nextEpisode = computed(() => {
  const i = currentIndex.value
  return i !== -1 && i < episodes.value.length - 1 ? episodes.value[i + 1]?.number ?? null : null
})

// Temporada actual dentro de la franquicia
const seasonIndex = computed(() => seasons.value.findIndex((s) => s.slug === slug.value))
const nextSeason = computed(() => {
  const i = seasonIndex.value
  return i !== -1 && i < seasons.value.length - 1 ? seasons.value[i + 1] : null
})
const prevSeason = computed(() => {
  const i = seasonIndex.value
  return i > 0 ? seasons.value[i - 1] : null
})

const hasNext = computed(() => nextEpisode.value !== null || nextSeason.value !== null)
const hasPrev = computed(() => prevEpisode.value !== null || prevSeason.value !== null)

function goBack() {
  router.push({ name: 'anime-av1-detail', params: { slug: slug.value } })
}

function goToEpisode(episode: number | string, animeSlug: string = slug.value) {
  if (animeSlug === slug.value && String(episode) === String(currentEpisode.value)) return
  router.push({ name: 'anime-av1-watch', params: { slug: animeSlug, episode: String(episode) } })
}

function goNext() {
  if (nextEpisode.value !== null) {
    goToEpisode(nextEpisode.value)
  } else if (nextSeason.value) {
    // Saltar al primer episodio de la siguiente temporada
    goToEpisode(1, nextSeason.value.slug)
  }
}

function goPrev() {
  if (prevEpisode.value !== null) {
    goToEpisode(prevEpisode.value)
  } else if (prevSeason.value) {
    goToEpisode(1, prevSeason.value.slug)
  }
}

function onSeasonSelect(newSlug: string) {
  if (newSlug && newSlug !== slug.value) {
    goToEpisode(1, newSlug)
  }
}

async function loadEpisode() {
  loadingEpisode.value = true
  activeEmbed.value = ''
  try {
    const data = await fetchEpisode(slug.value, currentEpisode.value)
    activeEmbed.value = data.default_embed
  } catch {
    activeEmbed.value = ''
  } finally {
    loadingEpisode.value = false
  }
}

async function loadSidebarData() {
  if (!animeInfo.value || animeInfo.value.slug !== slug.value) {
    fetchAnimeInfo(slug.value)
  }
  if (!franchise.value || franchise.value.current !== slug.value) {
    fetchFranchise(slug.value)
  }
}

onMounted(async () => {
  loadSidebarData()
  await loadEpisode()
})

watch(() => route.params.episode, () => loadEpisode())
watch(() => route.params.slug, (n) => { if (n) loadSidebarData() })
</script>
