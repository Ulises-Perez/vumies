<template>
  <div class="pointer-events-auto select-none bg-gradient-to-t from-black via-black/95 to-black/70 px-4 pb-3 pt-6 sm:px-6">
    <!-- Scrubber -->
    <div class="flex items-center gap-3">
      <span class="w-14 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
        {{ fmt(displayTime) }}
      </span>

      <div class="group/seek relative flex-1">
        <!-- pista -->
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
          <div
            class="h-full rounded-full bg-primary"
            :style="{ width: progressPct + '%' }"
          ></div>
        </div>
        <!-- thumb -->
        <div
          class="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-primary shadow-md ring-2 ring-background transition-transform group-hover/seek:scale-110"
          :style="{ left: `calc(${progressPct}% - 7px)` }"
        ></div>
        <!-- input invisible para arrastrar -->
        <input
          type="range"
          min="0"
          :max="Math.max(duration, 1)"
          step="0.1"
          :value="displayTime"
          @input="onScrub"
          @change="onScrubCommit"
          class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Buscar"
        />
      </div>

      <span class="w-14 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
        {{ fmt(duration) }}
      </span>
    </div>

    <!-- Botonera -->
    <div class="mt-1 flex items-center gap-1">
      <!-- Play/Pausa -->
      <button class="rounded-lg p-2 text-foreground hover:bg-white/10 transition-colors" @click="$emit('toggle-pause')" :aria-label="paused ? 'Reproducir' : 'Pausar'" :title="paused ? 'Reproducir' : 'Pausar'">
        <svg v-if="paused" class="h-7 w-7" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        <svg v-else class="h-7 w-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
      </button>

      <!-- -10s -->
      <button class="rounded-lg p-2 text-foreground hover:bg-white/10 transition-colors" @click="$emit('seek', Math.max(0, currentTime - 10))" aria-label="Retroceder 10s" title="Retroceder 10s">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7M20 19l-7-7 7-7" /></svg>
      </button>
      <!-- +10s -->
      <button class="rounded-lg p-2 text-foreground hover:bg-white/10 transition-colors" @click="$emit('seek', currentTime + 10)" aria-label="Avanzar 10s" title="Avanzar 10s">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M4 5l7 7-7 7" /></svg>
      </button>

      <!-- Volumen -->
      <div class="group/vol flex items-center">
        <button class="rounded-lg p-2 text-foreground hover:bg-white/10 transition-colors" @click="toggleMute" :aria-label="isMuted ? 'Activar sonido' : 'Silenciar'" :title="isMuted ? 'Activar sonido' : 'Silenciar'">
          <svg v-if="isMuted" class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
          <svg v-else-if="volume < 50" class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 9v6h4l5 5V4l-5 5H7zm9.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
          <svg v-else class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
        </button>
        <input
          type="range" min="0" max="100" step="1"
          :value="volume"
          @input="onVolume"
          class="vol-slider w-0 cursor-pointer opacity-0 transition-all duration-200 group-hover/vol:w-20 group-hover/vol:opacity-100"
          aria-label="Volumen"
        />
      </div>

      <div class="flex-1"></div>

      <!-- Fullscreen -->
      <button class="rounded-lg p-2 text-foreground hover:bg-white/10 transition-colors" @click="$emit('toggle-fullscreen')" :aria-label="isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'" :title="isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'">
        <svg v-if="!isFullscreen" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" /></svg>
        <svg v-else class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 4v4H4M16 4v4h4M16 20v-4h4M8 20v-4H4" /></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  currentTime: number
  duration: number
  paused: boolean
  volume: number
  isFullscreen?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-pause'): void
  (e: 'seek', seconds: number): void
  (e: 'volume', v: number): void
  (e: 'toggle-fullscreen'): void
}>()

// Mientras se arrastra el scrubber, mostramos el valor local (no el de mpv).
const scrubValue = ref<number | null>(null)
const displayTime = computed(() => scrubValue.value ?? props.currentTime)
const progressPct = computed(() => {
  if (!props.duration) return 0
  return Math.min(100, Math.max(0, (displayTime.value / props.duration) * 100))
})

const lastVolume = ref(100)
const isMuted = computed(() => props.volume <= 0)

function onScrub(e: Event) {
  scrubValue.value = Number((e.target as HTMLInputElement).value)
}
function onScrubCommit(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  emit('seek', v)
  scrubValue.value = null
}
function onVolume(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (v > 0) lastVolume.value = v
  emit('volume', v)
}
function toggleMute() {
  emit('volume', isMuted.value ? lastVolume.value || 100 : 0)
}

function fmt(s: number): string {
  if (!s || s < 0 || !isFinite(s)) return '0:00'
  const total = Math.floor(s)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = total % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return h > 0 ? `${h}:${mm}:${String(sec).padStart(2, '0')}` : `${mm}:${String(sec).padStart(2, '0')}`
}
</script>

<style scoped>
.vol-slider {
  height: 4px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.25);
  -webkit-appearance: none;
  appearance: none;
}
.vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  background: oklch(var(--primary));
  cursor: pointer;
}
</style>
