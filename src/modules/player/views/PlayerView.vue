<template>
  <div class="fixed inset-0 z-50 bg-black">
    <!-- Fullscreen video area: the Vimeus iframe paints here -->
    <div class="absolute inset-0 w-full bg-black">
      <!-- Error / Coming soon -->
      <div v-if="hasContentError" class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 px-6 text-center text-foreground">
        <svg class="mb-4 h-16 w-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
        <h2 class="mb-2 font-poppins text-2xl font-bold">Próximamente</h2>
        <p class="mb-4 max-w-sm text-muted-foreground">Esta fuente no está disponible por el momento. Prueba con otra fuente.</p>
        <button @click="openSelector" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          Probar otra fuente
        </button>
      </div>

      <!-- Iframe (Vimeus embed) -->
      <iframe
        v-show="activeStream?.kind === 'iframe' && embedUrl && !hasContentError"
        @error="handleIframeError"
        @load="handleIframeLoad"
        :src="embedUrl"
        class="absolute inset-0 h-full w-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        referrerpolicy="origin"
      />

      <!-- Direct video -->
      <video
        v-if="videoUrl && !hasContentError"
        :src="videoUrl"
        class="absolute inset-0 h-full w-full bg-black object-contain"
        controls
        autoplay
        playsinline
        @ended="onMediaEnded"
        @error="handleIframeError"
      />

      <!-- No source selected -->
      <div v-show="!activeStream && !selectorOpen && !hasContentError" class="absolute inset-0 flex flex-col items-center justify-center text-foreground">
        <button @click="openSelector" class="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Squares2X2Icon class="h-5 w-5" />
          Elegir fuente
        </button>
      </div>
    </div>

    <!-- Top chrome (back / episodes / sources) -->
    <div class="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent p-3">
      <button
        @click="goBack"
        class="pointer-events-auto rounded-full bg-black/55 p-2 text-white/90 backdrop-blur-sm ring-1 ring-white/10 transition-colors hover:bg-black/75 hover:text-white"
        aria-label="Volver" title="Volver"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div class="pointer-events-auto flex items-center gap-1.5">
        <!-- Episodio anterior / siguiente: lo que un player de serie necesita a
             mano, sin abrir el panel. Se deshabilitan solos en los extremos. -->
        <template v-if="type === 'tv' || type === 'anime'">
          <button
            @click="prevEpisode"
            :disabled="!canPrevEpisode"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-sm ring-1 ring-white/10 transition-colors hover:bg-black/75 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-black/55"
            aria-label="Episodio anterior"
            title="Episodio anterior"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            @click="nextEpisode"
            :disabled="!canNextEpisode"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-sm ring-1 ring-white/10 transition-colors hover:bg-black/75 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-black/55"
            aria-label="Episodio siguiente"
            title="Episodio siguiente"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </template>
        <button
          v-if="type === 'tv' || type === 'anime'"
          @click="openEpisodes"
          class="flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/10 transition-colors hover:bg-black/75 hover:text-white"
          title="Episodios"
        >
          <QueueListIcon class="h-5 w-5" />
          <span class="hidden sm:inline">Episodios</span>
        </button>
        <button
          @click="openSelector"
          class="flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/10 transition-colors hover:bg-black/75 hover:text-white"
          title="Cambiar fuente"
        >
          <Squares2X2Icon class="h-5 w-5" />
          <span class="hidden sm:inline">Fuentes</span>
        </button>
      </div>
    </div>

    <!-- Episodes overlay -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="episodesOpen" class="absolute inset-0 z-[60] flex">
        <div class="flex-1 bg-black/70 backdrop-blur-sm" @click="closeEpisodes"></div>
        <div class="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
          <div class="flex items-center gap-3 border-b border-border p-4">
            <h2 class="flex-1 font-poppins font-bold text-foreground">Episodios</h2>
            <button @click="closeEpisodes" class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" aria-label="Cerrar">
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>

          <div class="border-b border-border p-4">
            <BaseSelect :model-value="selectedSeasonNumber" class="w-full" @update:model-value="onSeasonSelect($event)">
              <option v-for="s in seasons" :key="s.id" :value="s.season_number">{{ s.name }}</option>
            </BaseSelect>
          </div>

          <div class="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
            <div v-if="loadingEpisodes" class="flex justify-center py-8"><LoadingSpinner /></div>
            <template v-else>
              <button
                v-for="ep in episodes"
                :key="ep.id"
                @click="goToEpisode(ep.episode_number)"
                class="group/item relative flex w-full gap-3 overflow-hidden rounded-lg p-2 text-left transition-all duration-200"
                :class="isCurrentEpisode(ep.episode_number) ? 'border-l-2 border-primary bg-muted/60' : 'border-l-2 border-transparent hover:bg-accent'"
              >
                <div class="relative aspect-video w-28 flex-none overflow-hidden rounded bg-card">
                  <img v-if="ep.still_path" :src="`https://image.tmdb.org/t/p/w300${ep.still_path}`" alt="" class="h-full w-full object-cover opacity-80 transition-opacity group-hover/item:opacity-100" />
                  <div class="absolute inset-0 flex items-center justify-center">
                    <svg class="h-6 w-6 drop-shadow-md" :class="isCurrentEpisode(ep.episode_number) ? 'text-primary' : 'text-foreground opacity-0 group-hover/item:opacity-80'" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
                <div class="flex min-w-0 flex-1 flex-col justify-center">
                  <h3 class="mb-1 truncate pr-1 text-sm font-medium leading-tight" :class="isCurrentEpisode(ep.episode_number) ? 'text-primary' : 'text-muted-foreground group-hover/item:text-foreground'">
                    {{ ep.episode_number }}. {{ ep.name }}
                  </h3>
                  <div class="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{{ ep.runtime ? `${ep.runtime}m` : 'N/A' }}</span>
                    <div v-if="ep.vote_average" class="flex items-center">
                      <svg class="mr-1 h-3 w-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      {{ ep.vote_average.toFixed(1) }}
                    </div>
                  </div>
                  <p class="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">{{ ep.overview }}</p>
                </div>
              </button>
            </template>
          </div>
        </div>
      </div>
    </transition>

    <!-- Source selector (Stremio-style modal) -->
    <StreamSourceModal
      v-if="selectorOpen"
      :loading="sourcesLoading"
      :results="sourceResults"
      @select="selectStream"
      @close="onSelectorClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Squares2X2Icon, QueueListIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { FEATURES } from '@/core/config/features'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import { BaseSelect } from '@/modules/ui/components/base'
import StreamSourceModal from '@/modules/player/components/StreamSourceModal.vue'
import { useMovies } from '@/modules/catalog/composables/useMovies'
import { useSeries } from '@/modules/catalog/composables/useSeries'
import { useStreamSources } from '@/modules/player'
import type { Media, Stream } from '@/modules/player'

const route = useRoute()
const router = useRouter()
const { fetchMovieDetails } = useMovies()
const {
  fetchSeriesDetails,
  fetchSeasonDetails,
  seriesDetails,
  currentSeason,
  loading: loadingEpisodes,
} = useSeries()
const { loading: sourcesLoading, results: sourceResults, streams: sourceStreams, load: loadSources } = useStreamSources()

// ---- State ----
const embedUrl = ref('')
const videoUrl = ref('')

const activeStream = ref<Stream | null>(null)
const selectorOpen = ref(false)
const episodesOpen = ref(false)
const preferredSourceId = ref<string | null>(null)
const selectedSeasonNumber = ref(1)
const hasContentError = ref(false)
let iframeTimeout: number | null = null

// ---- Params ----
const type = computed(() => {
  const t = route.params.type as string
  if (t === 'anime') return 'anime'
  return (t === 'serie' || t === 'tv') ? 'tv' : 'movie'
})
const id = computed(() => Number(route.params.id))
const season = computed(() => Number(route.params.season) || 1)
const episode = computed(() => Number(route.params.episode) || 1)

// ---- Series data ----
const seasons = computed(() => seriesDetails.value?.seasons.filter(s => s.season_number > 0) || [])
const episodes = computed(() => currentSeason.value?.episodes || [])

function isCurrentEpisode(epNum: number) {
  return epNum === episode.value && selectedSeasonNumber.value === season.value
}

function goBack() {
  if (type.value === 'movie') {
    router.push({ name: 'movie-detail', params: { id: id.value } })
  } else if (type.value === 'anime' && FEATURES.anime) {
    router.push({ name: 'anime-detail', params: { id: id.value } })
  } else {
    router.push({ name: 'serie-detail', params: { id: id.value } })
  }
}

function buildMedia(): Media {
  return {
    type: type.value as Media['type'],
    tmdbId: id.value,
    season: type.value === 'movie' ? undefined : season.value,
    episode: type.value === 'movie' ? undefined : episode.value,
  }
}

async function loadContent() {
  hasContentError.value = false
  activeStream.value = null
  embedUrl.value = ''
  videoUrl.value = ''

  selectorOpen.value = true
  const sourcesPromise = loadSources(buildMedia())

  if (type.value === 'movie') {
    fetchMovieDetails(id.value).catch(() => {})
  } else {
    if (!seriesDetails.value || seriesDetails.value.id !== id.value) {
      await fetchSeriesDetails(id.value)
    }
    selectedSeasonNumber.value = season.value
    loadingEpisodes.value = true
    await fetchSeasonDetails(id.value, season.value)
    loadingEpisodes.value = false
  }

  await sourcesPromise
  const preferred = preferredSourceId.value
    ? sourceStreams.value.find((s) => s.sourceId === preferredSourceId.value)
    : null
  if (preferred) {
    selectStream(preferred)
    return
  }
  // Una sola fuente: elegirla es un tramite, no una decision. Con dos o mas el
  // selector sigue abriendose, porque ahi si hay algo que elegir. Si esa unica
  // fuente falla, manda el overlay de error, que es donde se elige otra.
  const only = sourceStreams.value[0]
  if (sourceStreams.value.length === 1 && only) selectStream(only)
}

function selectStream(stream: Stream) {
  activeStream.value = stream
  preferredSourceId.value = stream.sourceId
  selectorOpen.value = false
  episodesOpen.value = false
  hasContentError.value = false
  embedUrl.value = ''
  videoUrl.value = ''

  if (stream.kind === 'iframe') {
    embedUrl.value = stream.url || ''
    if (iframeTimeout) clearTimeout(iframeTimeout)
    checkEmbedUrlStatus(embedUrl.value)
  } else if (stream.kind === 'direct') {
    videoUrl.value = stream.url || ''
  }
}

// ---- Selector / Episodes ----
function openSelector() {
  if (!sourceResults.value.length && !sourcesLoading.value) loadSources(buildMedia())
  selectorOpen.value = true
}
function onSelectorClose() {
  selectorOpen.value = false
}
function openEpisodes() {
  episodesOpen.value = true
}
function closeEpisodes() {
  episodesOpen.value = false
}

async function checkEmbedUrlStatus(url: string) {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    if (!res.ok && res.status === 404) hasContentError.value = true
  } catch (e) {
    console.warn('No se pudo verificar la URL del embed', e)
  }
}
function handleIframeError() { hasContentError.value = true }
function handleIframeLoad() { if (iframeTimeout) clearTimeout(iframeTimeout) }
function onMediaEnded() { if (type.value === 'tv' || type.value === 'anime') nextEpisode() }

async function handleSeasonChange() {
  loadingEpisodes.value = true
  await fetchSeasonDetails(id.value, selectedSeasonNumber.value)
  loadingEpisodes.value = false
}
function onSeasonSelect(value: string) {
  selectedSeasonNumber.value = Number(value)
  handleSeasonChange()
}

function goToEpisode(epNum: number) {
  episodesOpen.value = false
  if (epNum === episode.value && selectedSeasonNumber.value === season.value) return
  router.push({
    name: 'player',
    params: {
      type: type.value === 'anime' ? 'anime' : 'serie',
      id: id.value,
      season: selectedSeasonNumber.value,
      episode: epNum,
    },
  })
}

const canPrevEpisode = computed(() => {
  if (type.value === 'movie') return false
  const idx = episodes.value.findIndex((e) => e.episode_number === episode.value)
  if (idx > 0) return true
  const seasonIdx = seasons.value.findIndex((s) => s.season_number === season.value)
  return seasonIdx > 0
})

const canNextEpisode = computed(() => {
  if (type.value === 'movie') return false
  const idx = episodes.value.findIndex((e) => e.episode_number === episode.value)
  if (idx !== -1 && idx < episodes.value.length - 1) return true
  const seasonIdx = seasons.value.findIndex((s) => s.season_number === season.value)
  return seasonIdx !== -1 && seasonIdx < seasons.value.length - 1
})

function prevEpisode() {
  if (type.value === 'movie' || !canPrevEpisode.value) return
  const currentEpIndex = episodes.value.findIndex((e) => e.episode_number === episode.value)
  if (currentEpIndex > 0) {
    const prev = episodes.value[currentEpIndex - 1]
    if (prev) goToEpisode(prev.episode_number)
    return
  }
  const currentSeasonIndex = seasons.value.findIndex((s) => s.season_number === season.value)
  if (currentSeasonIndex > 0) {
    const prevSeason = seasons.value[currentSeasonIndex - 1]
    if (!prevSeason) return
    // Al retroceder de temporada se cae en su ultimo episodio, no en el primero.
    router.push({
      name: 'player',
      params: { type: type.value === 'anime' ? 'anime' : 'serie', id: id.value, season: prevSeason.season_number, episode: prevSeason.episode_count || 1 },
    })
  }
}

function nextEpisode() {
  if (type.value === 'movie') return
  const currentEpIndex = episodes.value.findIndex(e => e.episode_number === episode.value)
  if (currentEpIndex !== -1 && currentEpIndex < episodes.value.length - 1) {
    const nextEp = episodes.value[currentEpIndex + 1]
    if (nextEp) goToEpisode(nextEp.episode_number)
    return
  }
  const currentSeasonIndex = seasons.value.findIndex(s => s.season_number === season.value)
  if (currentSeasonIndex !== -1 && currentSeasonIndex < seasons.value.length - 1) {
    const nextSeason = seasons.value[currentSeasonIndex + 1]
    if (!nextSeason) return
    router.push({
      name: 'player',
      params: {
        type: type.value === 'anime' ? 'anime' : 'serie',
        id: id.value,
        season: nextSeason.season_number,
        episode: 1,
      },
    })
  }
}

function handleMessage(event: MessageEvent) {
  if (event.data === 'ended' || event.data?.event === 'ended') {
    if (type.value === 'tv' || type.value === 'anime') nextEpisode()
  }
  if (event.data === 'error' || event.data?.event === 'error' || event.data?.status === 404) {
    hasContentError.value = true
  }
}

function handleKeydown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
  if (e.key === 'Escape') {
    if (episodesOpen.value) { closeEpisodes(); return }
    if (selectorOpen.value) { onSelectorClose(); return }
    goBack()
  }
}

onMounted(() => {
  loadContent()
  window.addEventListener('message', handleMessage)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
  window.removeEventListener('keydown', handleKeydown)
  if (iframeTimeout) clearTimeout(iframeTimeout)
})

watch(() => route.params, () => { loadContent() })
</script>
