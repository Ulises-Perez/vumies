<template>
  <div class="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
    <div
      class="flex max-h-[86vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-card text-card-foreground ring-1 ring-border shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-modal-title"
    >
      <!-- Cabecera: un titulo, un dato real, y cerrar. Nada mas. -->
      <header class="flex items-start gap-3 px-5 pb-4 pt-5">
        <div class="min-w-0 flex-1">
          <h2 id="source-modal-title" class="font-poppins text-lg font-bold tracking-tight text-foreground">
            Dónde reproducir
          </h2>
          <p class="mt-1 text-xs text-muted-foreground">{{ summary }}</p>
        </div>
        <button
          @click="$emit('close')"
          class="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
          aria-label="Cerrar"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </header>

      <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <div v-if="loading && !streams.length" class="flex min-h-[10rem] items-center justify-center">
          <LoadingSpinner message="Buscando fuentes…" />
        </div>

        <!-- Tarjetas, dos columnas desde sm. Cada fuente se lee de un vistazo:
             monograma, nombre, idioma y estado. -->
        <ul v-else-if="streams.length" class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <li v-for="stream in streams" :key="stream.sourceId">
            <button
              @click="$emit('select', stream)"
              class="group flex h-full w-full items-start gap-3 rounded-2xl p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              :class="
                stream.sourceId === activeSourceId
                  ? 'bg-primary/10 ring-1 ring-primary/40'
                  : 'bg-muted/40 ring-1 ring-transparent hover:bg-accent hover:ring-border'
              "
            >
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                :class="stream.sourceId === activeSourceId ? 'bg-primary text-primary-foreground' : 'bg-background text-primary'"
                aria-hidden="true"
              >
                {{ initial(stream.label) }}
              </span>

              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2">
                  <span class="truncate text-sm font-semibold text-foreground">{{ stream.label }}</span>
                  <span
                    v-if="stream.sourceId === activeSourceId"
                    class="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground"
                  >
                    En uso
                  </span>
                </span>
                <span class="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {{ stream.languageLabel || 'Idioma no declarado' }}
                </span>
                <span class="mt-0.5 block text-[11px] text-muted-foreground/70">{{ kindLabel(stream.kind) }}</span>
              </span>
            </button>
          </li>
        </ul>

        <p v-else class="px-2 py-12 text-center text-sm text-muted-foreground">
          Ninguna fuente tiene este contenido todavía.
        </p>
      </div>

      <footer class="border-t border-border/60 px-5 py-3">
        <p class="text-[11px] leading-relaxed text-muted-foreground">
          Cada fuente es un reproductor externo con su propio catálogo, idiomas y anuncios.
          Si una no carga, probá con otra.
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import type { SourceResult, Stream, StreamKind } from '@/modules/player'

const props = defineProps<{
  loading: boolean
  results: SourceResult[]
  /** Fuente que ya está reproduciendo, para marcarla sin duplicar el nombre. */
  activeSourceId?: string | null
}>()

defineEmits<{
  (e: 'select', stream: Stream): void
  (e: 'close'): void
}>()

/** Una tarjeta por fuente, en el orden de peso que ya trae el registry. */
const streams = computed<Stream[]>(() =>
  props.results.flatMap((r) => r.streams).filter((s) => s.playable !== false)
)

const summary = computed(() => {
  const n = streams.value.length
  if (props.loading && !n) return 'Buscando…'
  if (!n) return 'Sin fuentes para este contenido'
  const spanish = streams.value.filter((s) => /latino|castellano|español/i.test(s.languageLabel || '')).length
  const base = n === 1 ? '1 fuente disponible' : `${n} fuentes disponibles`
  return spanish ? `${base} · ${spanish} en español` : base
})

function initial(label: string): string {
  return (label || '?').trim().charAt(0).toUpperCase()
}

function kindLabel(kind: StreamKind): string {
  return kind === 'iframe' ? 'Reproductor externo' : 'Enlace directo'
}
</script>
