<template>
  <div class="absolute inset-0 z-[60] flex">
    <div class="flex-1 bg-black/70 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="flex h-full w-full max-w-sm flex-col border-l border-border bg-card shadow-2xl">
      <!-- Header -->
      <div class="flex items-center gap-3 border-b border-border p-4">
        <h2 class="flex-1 font-poppins font-bold text-foreground">Audio y subtítulos</h2>
        <button @click="$emit('close')" class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" aria-label="Cerrar">
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <div class="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-4">
        <!-- Audio -->
        <section v-if="audioTracks.length">
          <h3 class="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audio</h3>
          <ul class="space-y-1">
            <li v-for="t in audioTracks" :key="`a-${t.id}`">
              <button
                @click="$emit('select-audio', t.id)"
                class="flex w-full items-center gap-3 rounded-lg border-l-2 p-2.5 text-left transition-colors"
                :class="t.selected ? 'border-primary bg-muted/60' : 'border-transparent hover:bg-accent'"
              >
                <img
                  v-if="flag(t.lang)"
                  :src="flag(t.lang)!"
                  alt=""
                  class="h-3.5 w-auto flex-none rounded-[2px] ring-1 ring-border/50"
                  loading="lazy"
                />
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium" :class="t.selected ? 'text-primary' : 'text-foreground'">
                    {{ audioLabel(t) }}
                  </span>
                  <span v-if="audioMeta(t)" class="block truncate text-xs text-muted-foreground">{{ audioMeta(t) }}</span>
                </span>
                <CheckIcon v-if="t.selected" class="h-5 w-5 flex-none text-primary" />
              </button>
            </li>
          </ul>
        </section>

        <!-- Subtítulos -->
        <section>
          <h3 class="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subtítulos</h3>
          <ul class="space-y-1">
            <li>
              <button
                @click="$emit('select-subtitle', 'no')"
                class="flex w-full items-center gap-3 rounded-lg border-l-2 p-2.5 text-left transition-colors"
                :class="noSubsSelected ? 'border-primary bg-muted/60' : 'border-transparent hover:bg-accent'"
              >
                <span class="min-w-0 flex-1 text-sm font-medium" :class="noSubsSelected ? 'text-primary' : 'text-foreground'">Desactivados</span>
                <CheckIcon v-if="noSubsSelected" class="h-5 w-5 flex-none text-primary" />
              </button>
            </li>
            <li v-for="t in subtitleTracks" :key="`s-${t.id}`">
              <button
                @click="$emit('select-subtitle', t.id)"
                class="flex w-full items-center gap-3 rounded-lg border-l-2 p-2.5 text-left transition-colors"
                :class="t.selected ? 'border-primary bg-muted/60' : 'border-transparent hover:bg-accent'"
              >
                <img
                  v-if="flag(t.lang)"
                  :src="flag(t.lang)!"
                  alt=""
                  class="h-3.5 w-auto flex-none rounded-[2px] ring-1 ring-border/50"
                  loading="lazy"
                />
                <span class="min-w-0 flex-1 truncate text-sm font-medium" :class="t.selected ? 'text-primary' : 'text-foreground'">
                  {{ subtitleLabel(t) }}
                </span>
                <CheckIcon v-if="t.selected" class="h-5 w-5 flex-none text-primary" />
              </button>
            </li>
            <li v-if="!subtitleTracks.length" class="px-1 py-2 text-xs text-muted-foreground">
              Este vídeo no trae subtítulos.
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { XMarkIcon, CheckIcon } from '@heroicons/vue/24/outline'
import type { MpvTrack } from '@/modules/player/torrent-engine'

const props = defineProps<{
  audioTracks: MpvTrack[]
  subtitleTracks: MpvTrack[]
}>()

defineEmits<{
  (e: 'select-audio', id: number): void
  (e: 'select-subtitle', id: number | 'no'): void
  (e: 'close'): void
}>()

const noSubsSelected = computed(() => !props.subtitleTracks.some((t) => t.selected))

/** Mapea código de idioma de mpv (es/spa/lat…) a bandera de flagcdn. */
function flag(lang?: string): string | null {
  const c = langToCountry(lang)
  return c ? `https://flagcdn.com/20x15/${c}.png` : null
}

function langToCountry(lang?: string): string | null {
  if (!lang) return null
  const l = lang.toLowerCase()
  const map: Record<string, string> = {
    es: 'es', spa: 'es', cas: 'es', castellano: 'es',
    lat: 'mx', latino: 'mx', 'es-419': 'mx', 'es-la': 'mx',
    en: 'gb', eng: 'gb', english: 'gb',
    ja: 'jp', jpn: 'jp', japanese: 'jp',
    fr: 'fr', fre: 'fr', fra: 'fr',
    de: 'de', ger: 'de', deu: 'de',
    it: 'it', ita: 'it',
    pt: 'pt', por: 'pt', 'pt-br': 'br',
    ru: 'ru', rus: 'ru',
    ko: 'kr', kor: 'kr',
    zh: 'cn', chi: 'cn', zho: 'cn',
  }
  return map[l] ?? (l.length === 2 ? l : null)
}

function audioLabel(t: MpvTrack): string {
  if (t.title) return t.title
  if (t.lang) return t.lang.toUpperCase()
  return `Audio ${t.id}`
}

function subtitleLabel(t: MpvTrack): string {
  const name = t.title || (t.lang ? t.lang.toUpperCase() : `Subtítulo ${t.id}`)
  return t.external ? `${name} (externo)` : name
}

function audioMeta(t: MpvTrack): string {
  const parts: string[] = []
  const ch = t['demux-channel-count']
  if (ch === 6) parts.push('5.1')
  else if (ch === 8) parts.push('7.1')
  else if (ch === 2) parts.push('Estéreo')
  else if (ch === 1) parts.push('Mono')
  if (t.codec) parts.push(t.codec.toUpperCase())
  return parts.join(' · ')
}
</script>
