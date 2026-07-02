<template>
  <div class="fixed inset-0 z-50 bg-black">
    <!-- ===== Vídeo a pantalla completa: mpv pinta aquí; uosc dibuja los controles ===== -->
    <div ref="mpvMount" class="absolute inset-0 w-full bg-black">
      <!-- Error / Próximamente -->
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

      <!-- Iframe (embed Vimeus) -->
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

      <!-- Vídeo directo -->
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

      <!-- Pantalla de carga (torrent → mpv): backdrop + LOGO + Cargando -->
      <PlayerLoading
        v-if="showLoading"
        :backdrop="mediaBackdrop"
        :logo="titleLogo"
        :title="headerTitle"
        :subtitle="headerSub"
        :status="loadingStatus"
      />

      <!-- En modo torrent, el vídeo lo pinta mpv (ventana nativa). Los controles
           son HTML y viven en las franjas superior/inferior que mpv no cubre. -->

      <!-- Sin fuente seleccionada -->
      <div v-show="!activeStream && !selectorOpen && !hasContentError" class="absolute inset-0 flex flex-col items-center justify-center text-foreground">
        <button @click="openSelector" class="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Squares2X2Icon class="h-5 w-5" />
          Elegir fuente
        </button>
      </div>
    </div>

    <!-- ===== Chrome superior (volver / audio / episodios / fuentes) ===== -->
    <div v-show="!isTorrentMode || !mpvReady || controlsVisible" class="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent p-3">
      <button
        @click="goBack"
        @mousemove="showControls"
        class="pointer-events-auto rounded-full bg-black/40 p-2 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
        aria-label="Volver" title="Volver"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div class="pointer-events-auto flex items-center gap-1.5" @mousemove="showControls">
        <button
          v-if="isTorrentMode && mpvReady && hasTrackMenu"
          @click="openTracks"
          class="flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
          title="Audio y subtítulos"
        >
          <LanguageIcon class="h-5 w-5" />
          <span class="hidden sm:inline">Audio</span>
        </button>
        <button
          v-if="(type === 'tv' || type === 'anime') && !torrentLoading"
          @click="openEpisodes"
          class="flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
          title="Episodios"
        >
          <QueueListIcon class="h-5 w-5" />
          <span class="hidden sm:inline">Episodios</span>
        </button>
        <button
          v-if="!torrentLoading"
          @click="openSelector"
          class="flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
          title="Cambiar fuente"
        >
          <Squares2X2Icon class="h-5 w-5" />
          <span class="hidden sm:inline">Fuentes</span>
        </button>
      </div>
    </div>

    <!-- ===== Barra de controles HTML (modo torrent) ===== -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="isTorrentMode && mpvReady && controlsVisible && !selectorOpen && !episodesOpen && !tracksOpen && !hasContentError"
        class="absolute inset-x-0 bottom-0 z-40"
        @mousemove="showControls"
      >
        <PlayerControls
          :current-time="currentTime"
          :duration="duration"
          :paused="paused"
          :volume="volume"
          :is-fullscreen="isFullscreen"
          @toggle-pause="mpvSetPause(!paused)"
          @seek="mpvSeekTo"
          @volume="onVolume"
          @toggle-fullscreen="onToggleFullscreen"
        />
      </div>
    </transition>

    <!-- ===== Overlay de episodios ===== -->
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

    <!-- Menú de pistas (audio / subtítulos) -->
    <PlayerTrackMenu
      v-if="tracksOpen"
      :audio-tracks="audioTracks"
      :subtitle-tracks="subtitleTracks"
      @select-audio="selectAudio"
      @select-subtitle="selectSubtitle"
      @close="closeTracks"
    />

    <!-- Selector de fuentes (modal estilo Stremio) -->
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
import { ref, onMounted, computed, watch, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Squares2X2Icon, QueueListIcon, XMarkIcon, LanguageIcon } from '@heroicons/vue/24/outline'
import { getBackdropUrl, getImageUrl } from '@/core/config/api.config'
import { FEATURES } from '@/core/config/features'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import { BaseSelect } from '@/modules/ui/components/base'
import StreamSourceModal from '@/modules/player/components/StreamSourceModal.vue'
import PlayerLoading from '@/modules/player/components/PlayerLoading.vue'
import PlayerControls from '@/modules/player/components/PlayerControls.vue'
import PlayerTrackMenu from '@/modules/player/components/PlayerTrackMenu.vue'
import {
  resolveTorrent, playInMpv, stopMpv, onMpvEnded, setMpvGeometry,
  onMpvProp, mpvCommand, mpvSetPause, mpvSeekTo, mpvSetVolume,
  setAudioTrack, setSubtitleTrack, onMpvActivity, onMpvClick,
  toggleAppFullscreen, type MpvProp, type MpvTrack,
} from '@/modules/player/torrent-engine'
import { useMovies } from '@/modules/catalog/composables/useMovies'
import { useSeries } from '@/modules/catalog/composables/useSeries'
import { useStreamSources } from '@/modules/player'
import { tmdbService } from '@/modules/catalog/services/tmdb.service'
import type { Image } from '@/modules/catalog/types/tmdb.types'
import type { Media, Stream } from '@/modules/player'

const route = useRoute()
const router = useRouter()
const { movieDetails, fetchMovieDetails } = useMovies()
const {
  fetchSeriesDetails,
  fetchSeasonDetails,
  seriesDetails,
  currentSeason,
  loading: loadingEpisodes,
} = useSeries()
const { loading: sourcesLoading, results: sourceResults, streams: sourceStreams, load: loadSources } = useStreamSources()

// ---- Estado ----
const embedUrl = ref('')
const videoUrl = ref('')
const torrentLoading = ref(false)
const mpvPlaying = ref(false)
const mpvReady = ref(false)
const isFullscreen = ref(false)
const titleLogo = ref<string | null>(null)
let mpvUnlisten: (() => void) | null = null
let mpvPropUnlisten: (() => void) | null = null
let mpvActivityUnlisten: (() => void) | null = null
let mpvClickUnlisten: (() => void) | null = null
const mpvMount = ref<HTMLElement | null>(null)
let resizeObs: ResizeObserver | null = null

const activeStream = ref<Stream | null>(null)
const selectorOpen = ref(false)
const episodesOpen = ref(false)
const preferredSourceId = ref<string | null>(null)
const selectedSeasonNumber = ref(1)
const hasContentError = ref(false)
let iframeTimeout: number | null = null

// Estado de reproducción (de mpv vía 'mpv-prop') que alimenta la barra HTML.
const currentTime = ref(0)
const duration = ref(0)
const paused = ref(false)
const volume = ref(100)
const tracks = ref<MpvTrack[]>([])

// Controles HTML auto-ocultables + menú de pistas (audio/subtítulos).
const controlsVisible = ref(true)
const tracksOpen = ref(false)
let hideTimer: number | null = null

const HIDDEN_GEOM = { x: -32000, y: -32000, width: 320, height: 240 }
// Franjas (px CSS) que mpv NO cubre, para que los controles HTML no queden tapados
// por la ventana nativa (problema "airspace" de WebView2).
const TOP_H = 52
const CONTROLS_H = 104

// ---- Params ----
const type = computed(() => {
  const t = route.params.type as string
  if (t === 'anime') return 'anime'
  return (t === 'serie' || t === 'tv') ? 'tv' : 'movie'
})
const id = computed(() => Number(route.params.id))
const season = computed(() => Number(route.params.season) || 1)
const episode = computed(() => Number(route.params.episode) || 1)
const isTorrentMode = computed(() => activeStream.value?.kind === 'torrent')

// ---- Pistas de audio/subtítulos (de la track-list de mpv) ----
const audioTracks = computed(() => tracks.value.filter(t => t.type === 'audio'))
const subtitleTracks = computed(() => tracks.value.filter(t => t.type === 'sub'))
const hasTrackMenu = computed(() => audioTracks.value.length > 1 || subtitleTracks.value.length > 0)

// ---- Series data ----
const seasons = computed(() => seriesDetails.value?.seasons.filter(s => s.season_number > 0) || [])
const episodes = computed(() => currentSeason.value?.episodes || [])
const currentEpisodeName = computed(() => episodes.value.find(e => e.episode_number === episode.value)?.name || '')

// ---- Encabezado / portada de carga ----
const mediaName = computed(() => type.value === 'movie' ? (movieDetails.value?.title || '') : (seriesDetails.value?.name || ''))
const headerTitle = computed(() => mediaName.value || 'Reproduciendo')
const headerSub = computed(() => {
  if (type.value === 'movie') return movieDetails.value?.release_date?.slice(0, 4) || ''
  const ep = currentEpisodeName.value
  return `T${season.value} · E${episode.value}${ep ? ' · ' + ep : ''}`
})
const mediaBackdrop = computed(() => {
  const p = type.value === 'movie' ? movieDetails.value?.backdrop_path : seriesDetails.value?.backdrop_path
  return p ? getBackdropUrl(p, 'w1280') : null
})
const loadingStatus = computed(() => torrentLoading.value ? 'Conectando al torrent…' : 'Preparando el vídeo…')
const showLoading = computed(() => !hasContentError.value && isTorrentMode.value && (torrentLoading.value || (mpvPlaying.value && !mpvReady.value)))

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

function pickLogo(logos: Image[]): Image | null {
  if (!logos?.length) return null
  const rank = (l: Image) => {
    const lang = l.iso_639_1
    const langScore = lang === 'es' ? 0 : lang === 'en' ? 1 : lang == null ? 2 : 3
    const svgPenalty = l.file_path.endsWith('.svg') ? 1 : 0
    return langScore * 10 + svgPenalty
  }
  return [...logos].sort((a, b) => rank(a) - rank(b) || b.vote_average - a.vote_average)[0] ?? null
}

async function loadTitleLogo() {
  titleLogo.value = null
  try {
    const res = type.value === 'movie'
      ? await tmdbService.getMovieImages(id.value)
      : await tmdbService.getTVImages(id.value)
    const logo = pickLogo(res.logos)
    titleLogo.value = logo ? getImageUrl(logo.file_path, 'w500') : null
  } catch {
    // sin logo: la portada usa el título de texto
  }
}

async function loadContent() {
  hasContentError.value = false
  activeStream.value = null
  embedUrl.value = ''
  videoUrl.value = ''
  mpvReady.value = false

  selectorOpen.value = true
  const sourcesPromise = loadSources(buildMedia())
  loadTitleLogo()

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
  if (preferred) selectStream(preferred)
}

function selectStream(stream: Stream) {
  activeStream.value = stream
  preferredSourceId.value = stream.sourceId
  selectorOpen.value = false
  episodesOpen.value = false
  hasContentError.value = false
  embedUrl.value = ''
  videoUrl.value = ''

  if (mpvPlaying.value && stream.kind !== 'torrent') {
    stopMpv()
    mpvPlaying.value = false
    mpvReady.value = false
  }

  if (stream.kind === 'iframe') {
    embedUrl.value = stream.url || ''
    if (iframeTimeout) clearTimeout(iframeTimeout)
    checkEmbedUrlStatus(embedUrl.value)
  } else if (stream.kind === 'direct') {
    videoUrl.value = stream.url || ''
  } else if (stream.kind === 'torrent') {
    playTorrent(stream)
  }
}

async function playTorrent(stream: Stream) {
  if (!stream.infoHash) {
    hasContentError.value = true
    return
  }
  torrentLoading.value = true
  mpvPlaying.value = false
  mpvReady.value = false
  try {
    const resolved = await resolveTorrent(stream.infoHash)
    if (activeStream.value !== stream) return
    await playInMpv(resolved.streamUrl, HIDDEN_GEOM)
    if (activeStream.value === stream) {
      mpvPlaying.value = true
      if (headerTitle.value) mpvCommand(['set_property', 'force-media-title', headerTitle.value])
    }
  } catch (e) {
    console.error('[torrent] resolve/mpv falló', e)
    if (activeStream.value === stream) hasContentError.value = true
  } finally {
    torrentLoading.value = false
  }
}

// ---- Geometría de mpv ----
// Con los controles visibles, mpv deja libres las franjas superior/inferior (donde
// va el chrome y la barra HTML); ocultos, ocupa toda la ventana (full-bleed).
function measureGeom() {
  const el = mpvMount.value
  if (!el) return { ...HIDDEN_GEOM }
  const r = el.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const reserve = isTorrentMode.value && controlsVisible.value
  const top = reserve ? TOP_H : 0
  const bottom = reserve ? CONTROLS_H : 0
  return {
    x: Math.round(r.left * dpr),
    y: Math.round((r.top + top) * dpr),
    width: Math.round(r.width * dpr),
    height: Math.round((r.height - top - bottom) * dpr),
  }
}

function currentGeom() {
  if (!mpvPlaying.value) return null
  if (selectorOpen.value || episodesOpen.value || tracksOpen.value || !mpvReady.value) return { ...HIDDEN_GEOM }
  return measureGeom()
}

function syncGeom() {
  const g = currentGeom()
  if (g) setMpvGeometry(g)
}

// ---- mpv: propiedades observadas → barra HTML + ocultar la portada ----
function handleMpvProp(p: MpvProp) {
  switch (p.name) {
    case 'time-pos':
      if (typeof p.data === 'number') {
        currentTime.value = p.data
        if (!mpvReady.value) {
          mpvReady.value = true
          showControls()
          nextTick().then(syncGeom)
        }
      }
      break
    case 'duration':
      if (typeof p.data === 'number') duration.value = p.data
      break
    case 'pause':
      if (typeof p.data === 'boolean') {
        paused.value = p.data
        // Re-arma el timer: en pausa no oculta (lo comprueba showControls); al
        // reanudar, vuelve a ocultarse tras la inactividad.
        showControls()
      }
      break
    case 'volume':
      if (typeof p.data === 'number') volume.value = p.data
      break
    case 'track-list':
      if (Array.isArray(p.data)) tracks.value = p.data as MpvTrack[]
      break
  }
}

// ---- Controles HTML: mostrar y auto-ocultar ----
function showControls() {
  controlsVisible.value = true
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => {
    if (!tracksOpen.value && !selectorOpen.value && !episodesOpen.value && !paused.value) {
      controlsVisible.value = false
    }
  }, 3500)
}

function onVolume(v: number) {
  volume.value = v
  mpvSetVolume(v)
}

// Clic sobre el vídeo (evento nativo del WndProc) → play/pausa estilo Stremio.
function onVideoClick() {
  mpvSetPause(!paused.value)
  showControls()
}

// ---- Menú de pistas (audio/subtítulos) ----
function openTracks() {
  tracksOpen.value = true
}
function closeTracks() {
  tracksOpen.value = false
}
function selectAudio(trackId: number) {
  setAudioTrack(trackId)
}
function selectSubtitle(trackId: number | 'no') {
  setSubtitleTrack(trackId)
}

async function onToggleFullscreen() {
  try {
    isFullscreen.value = await toggleAppFullscreen()
    // Reaplica la geometría (franjas) tras el cambio de tamaño de la ventana.
    await nextTick()
    syncGeom()
  } catch (e) { console.warn('fullscreen', e) }
}

// ---- Selector / Episodios ----
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
    if (tracksOpen.value) { closeTracks(); return }
    if (episodesOpen.value) { closeEpisodes(); return }
    if (selectorOpen.value) { onSelectorClose(); return }
    goBack()
    return
  }
  // Atajos de reproducción para mpv (modo torrent), con el vídeo en primer plano.
  if (!isTorrentMode.value || !mpvPlaying.value || selectorOpen.value || episodesOpen.value || tracksOpen.value) return
  switch (e.key) {
    case ' ':
    case 'k':
      e.preventDefault(); mpvCommand(['cycle', 'pause']); showControls(); break
    case 'ArrowLeft':
      e.preventDefault(); mpvCommand(['seek', -10]); showControls(); break
    case 'ArrowRight':
      e.preventDefault(); mpvCommand(['seek', 10]); showControls(); break
    case 'ArrowUp':
      e.preventDefault(); mpvCommand(['add', 'volume', 5]); showControls(); break
    case 'ArrowDown':
      e.preventDefault(); mpvCommand(['add', 'volume', -5]); showControls(); break
    case 'f':
    case 'F':
      e.preventDefault(); onToggleFullscreen(); break
  }
}

onMounted(() => {
  loadContent()
  window.addEventListener('message', handleMessage)
  window.addEventListener('keydown', handleKeydown)
  onMpvEnded(() => { if (type.value === 'tv' || type.value === 'anime') nextEpisode() }).then((u) => { mpvUnlisten = u })
  onMpvProp(handleMpvProp).then((u) => { mpvPropUnlisten = u })
  onMpvActivity(showControls).then((u) => { mpvActivityUnlisten = u })
  onMpvClick(onVideoClick).then((u) => { mpvClickUnlisten = u })
  if (mpvMount.value) {
    resizeObs = new ResizeObserver(() => syncGeom())
    resizeObs.observe(mpvMount.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
  window.removeEventListener('keydown', handleKeydown)
  if (iframeTimeout) clearTimeout(iframeTimeout)
  if (hideTimer) clearTimeout(hideTimer)
  if (mpvUnlisten) mpvUnlisten()
  if (mpvPropUnlisten) mpvPropUnlisten()
  if (mpvActivityUnlisten) mpvActivityUnlisten()
  if (mpvClickUnlisten) mpvClickUnlisten()
  if (mpvPlaying.value) stopMpv()
  if (resizeObs) resizeObs.disconnect()
})

watch(() => route.params, () => { loadContent() })
watch([selectorOpen, episodesOpen, tracksOpen, controlsVisible], async () => {
  await nextTick()
  syncGeom()
})
watch(headerTitle, (t) => {
  if (mpvPlaying.value && t) mpvCommand(['set_property', 'force-media-title', t])
})
</script>
