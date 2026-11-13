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

    <!-- Barra de control unica, arriba a la derecha: el embed dibuja su propio
         control (Servidores) arriba a la IZQUIERDA, asi que este es el unico
         rincon libre. Una sola familia de botones dentro de una pildora, con
         separadores: antes eran circulos y pastillas sueltas de dos tamanios.
         La franja superior existe solo para dar contraste a la barra. -->
    <div class="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-end bg-gradient-to-b from-black/60 via-black/20 to-transparent p-3">
      <div
        class="pointer-events-auto flex items-center gap-0.5 rounded-full bg-black/60 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-1 ring-white/10 backdrop-blur-md"
        role="toolbar"
        aria-label="Controles del reproductor"
      >
        <button
          @click="goBack"
          class="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label="Volver" title="Volver"
        >
          <span>Volver</span>
        </button>

        <span aria-hidden="true" class="mx-0.5 h-5 w-px bg-white/15" />

        <button
          v-if="type === 'tv' || type === 'anime'"
          @click="openEpisodes"
          class="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          :aria-label="`Episodios, temporada ${season} episodio ${episode}`"
          title="Episodios"
        >
          <QueueListIcon class="h-[18px] w-[18px]" />
          <span class="hidden sm:inline">Episodios</span>
          <span class="hidden text-white/45 sm:inline">T{{ season }}·E{{ episode }}</span>
        </button>

        <button
          @click="openSelector"
          class="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label="Cambiar fuente" title="Cambiar fuente"
        >
          <Squares2X2Icon class="h-[18px] w-[18px]" />
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
      <!-- Episodios como modal centrado, con el mismo cuerpo que el de fuentes:
           misma cabecera, misma tarjeta, mismo radio. Antes era un cajon lateral. -->
      <div
        v-if="episodesOpen"
        class="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
        @click.self="closeEpisodes"
      >
        <div
          class="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-card text-card-foreground ring-1 ring-border shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="episodes-title"
        >
          <header class="flex items-start gap-4 px-6 pb-3 pt-6">
            <div class="min-w-0 flex-1">
              <h2 id="episodes-title" class="font-poppins text-xl font-bold tracking-tight text-foreground">
                Episodios
              </h2>
              <p class="mt-1 text-sm text-muted-foreground">
                <span v-if="seasons.length">{{ seasons.length }} {{ seasons.length === 1 ? 'temporada' : 'temporadas' }}</span>
                <span v-else>Sin temporadas</span>
                <template v-if="episodes.length">
                  <span aria-hidden="true"> · </span>{{ episodes.length }} episodios
                </template>
              </p>
            </div>
            <button
              @click="closeEpisodes"
              class="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              aria-label="Cerrar"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </header>

          <!-- Temporadas como chips: un select esconde las opciones; con pocas
               temporadas conviene verlas todas y elegir de un toque. -->
          <div v-if="seasons.length > 1" class="custom-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3">
            <button
              v-for="s in seasons"
              :key="s.id"
              @click="onSeasonSelect(String(s.season_number))"
              class="inline-flex h-8 shrink-0 items-center rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              :class="
                s.season_number === selectedSeasonNumber
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground'
              "
              :aria-pressed="s.season_number === selectedSeasonNumber"
            >
              {{ s.name }}
            </button>
          </div>

          <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            <div v-if="loadingEpisodes" class="flex min-h-[10rem] items-center justify-center"><LoadingSpinner /></div>
            <ul
              v-else
              class="space-y-1"
              @keydown.down.prevent="moveEpisodeFocus(1)"
              @keydown.up.prevent="moveEpisodeFocus(-1)"
              @keydown.home.prevent="focusEpisodeIndex(0)"
              @keydown.end.prevent="focusEpisodeIndex(episodes.length - 1)"
            >
              <li v-for="ep in episodes" :key="ep.id">
                <button
                  :ref="(el) => setEpisodeRef(el as HTMLButtonElement | null, ep.episode_number)"
                  @click="goToEpisode(ep.episode_number)"
                  class="group/item flex w-full items-start gap-3 rounded-2xl p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                  :class="
                    isCurrentEpisode(ep.episode_number)
                      ? 'bg-primary/10 ring-1 ring-primary/40'
                      : 'hover:bg-accent'
                  "
                >
                  <span class="relative aspect-video w-24 flex-none overflow-hidden rounded-xl bg-muted">
                    <img
                      v-if="ep.still_path"
                      :src="`https://image.tmdb.org/t/p/w300${ep.still_path}`"
                      alt=""
                      class="h-full w-full object-cover transition-transform duration-300 group-hover/item:scale-[1.03] motion-reduce:group-hover/item:scale-100"
                      loading="lazy"
                      decoding="async"
                    />
                    <span class="absolute inset-0 flex items-center justify-center">
                      <svg
                        class="h-5 w-5 drop-shadow-md"
                        :class="isCurrentEpisode(ep.episode_number) ? 'text-primary' : 'text-foreground opacity-0 transition-opacity group-hover/item:opacity-90'"
                        fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                      ><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </span>

                  <span class="min-w-0 flex-1 py-0.5">
                    <span
                      class="block truncate text-sm font-semibold leading-snug"
                      :class="isCurrentEpisode(ep.episode_number) ? 'text-primary' : 'text-foreground'"
                    >
                      {{ ep.episode_number }}. {{ ep.name }}
                    </span>
                    <span class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{{ ep.runtime ? `${ep.runtime} min` : 'Duración N/D' }}</span>
                      <template v-if="ep.vote_average">
                        <span aria-hidden="true">·</span>
                        <span class="inline-flex items-center gap-1">
                          <svg class="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          {{ ep.vote_average.toFixed(1) }}
                        </span>
                      </template>
                    </span>
                    <span v-if="ep.overview" class="mt-1 line-clamp-2 block text-[11px] leading-relaxed text-muted-foreground">
                      {{ ep.overview }}
                    </span>
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </transition>

    <!-- Source selector (Stremio-style modal) -->
    <StreamSourceModal
        :active-source-id="activeStream?.sourceId ?? preferredSourceId"
      v-if="selectorOpen"
      :loading="sourcesLoading"
      :results="sourceResults"
      @select="selectStream"
      @close="onSelectorClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Squares2X2Icon, QueueListIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { FEATURES } from '@/core/config/features'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
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

// ---- Foco por teclado dentro del modal de episodios ----
// El boton de cada episodio se registra por numero, no por indice: asi el foco
// sobrevive a un cambio de temporada.
const episodeRefs = ref<Map<number, HTMLButtonElement>>(new Map())

function setEpisodeRef(el: HTMLButtonElement | null, episodeNumber: number) {
  if (el) episodeRefs.value.set(episodeNumber, el)
  else episodeRefs.value.delete(episodeNumber)
}

function focusEpisodeIndex(index: number) {
  const target = episodes.value[index]
  if (!target) return
  episodeRefs.value.get(target.episode_number)?.focus()
}

function moveEpisodeFocus(delta: number) {
  const current = episodes.value.findIndex(
    (e) => episodeRefs.value.get(e.episode_number) === document.activeElement
  )
  if (current === -1) {
    focusEpisodeIndex(delta > 0 ? 0 : episodes.value.length - 1)
    return
  }
  focusEpisodeIndex(current + delta)
}

// Abrir el panel lleva el foco y la vista al episodio que se esta viendo: es lo
// que la persona viene a buscar cuando entra aca.
watch(episodesOpen, async (open) => {
  if (!open) return
  await nextTick()
  const current = episodes.value.find((e) => e.episode_number === episode.value)
  const el = current ? episodeRefs.value.get(current.episode_number) : undefined
  if (!el) return
  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  el.focus({ preventScroll: true })
})

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
