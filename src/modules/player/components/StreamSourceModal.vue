<template>
  <div class="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
    <div
      class="flex max-h-[82vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card text-card-foreground ring-1 ring-border shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-modal-title"
    >
      <!-- Encabezado: titulo, una linea de contexto con el conteo real y cerrar.
           Sin caja propia: la lista es la que manda. -->
      <div class="flex items-start gap-3 px-4 pb-3 pt-4">
        <div class="min-w-0 flex-1">
          <h2 id="source-modal-title" class="font-poppins text-base font-bold text-foreground">
            Dónde reproducir
          </h2>
          <p class="mt-0.5 text-xs text-muted-foreground">{{ summary }}</p>
        </div>
        <button
          @click="$emit('close')"
          class="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
          aria-label="Cerrar"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <!-- Lista plana: una fuente = una fila. Antes cada fuente renderizaba un
           encabezado con su nombre Y una fila con el mismo nombre otra vez. -->
      <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <div v-if="loading" class="flex min-h-[9rem] items-center justify-center">
          <LoadingSpinner message="Buscando fuentes…" />
        </div>

        <ul v-else-if="streams.length" class="space-y-1">
          <li v-for="stream in streams" :key="stream.sourceId">
            <button
              @click="$emit('select', stream)"
              class="group flex min-h-[3.25rem] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              :class="stream.sourceId === activeSourceId ? 'bg-primary/10 ring-1 ring-primary/40' : ''"
            >
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
                <span class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span v-if="stream.languageLabel">{{ stream.languageLabel }}</span>
                  <span v-if="stream.languageLabel && stream.kind" aria-hidden="true">·</span>
                  <span>{{ kindLabel(stream.kind) }}</span>
                </span>
              </span>

              <PlayIcon
                class="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                aria-hidden="true"
              />
            </button>
          </li>
        </ul>

        <p v-else class="px-2 py-10 text-center text-sm text-muted-foreground">
          Ninguna fuente tiene este contenido todavía.
        </p>
      </div>

      <p class="border-t border-border/60 px-4 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        Cada fuente es un reproductor externo con su propio catálogo, idiomas y anuncios.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PlayIcon } from '@heroicons/vue/24/solid'
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

/** Una fila por fuente, en el orden de peso que ya trae el registry. */
const streams = computed<Stream[]>(() =>
  props.results.flatMap((r) => r.streams).filter((s) => s.playable !== false)
)

const summary = computed(() => {
  const n = streams.value.length
  if (props.loading && !n) return 'Buscando…'
  if (!n) return 'Sin fuentes para este contenido'
  return n === 1 ? '1 fuente disponible' : `${n} fuentes disponibles`
})

function kindLabel(kind: StreamKind): string {
  return kind === 'iframe' ? 'Embed' : 'Directo'
}
</script>
