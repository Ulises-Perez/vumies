<template>
  <div class="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
    <div
      class="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-card text-card-foreground ring-1 ring-border shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-modal-title"
      aria-describedby="source-modal-summary"
    >
      <header class="flex items-start gap-3 px-5 pb-2 pt-5">
        <div class="min-w-0 flex-1">
          <h2 id="source-modal-title" class="text-base font-semibold text-foreground">Fuentes</h2>
          <p id="source-modal-summary" class="mt-0.5 text-xs text-muted-foreground">{{ summary }}</p>
        </div>
        <button
          ref="closeButton"
          @click="$emit('close')"
          class="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
          aria-label="Cerrar"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
      </header>

      <!-- Una lista, nada mas. El nombre manda; el idioma va detras, en gris.
           Flechas mueven el foco, Inicio/Fin a los extremos, Enter elige. -->
      <div
        class="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-1"
        @keydown.down.prevent="moveFocus(1)"
        @keydown.up.prevent="moveFocus(-1)"
        @keydown.home.prevent="focusIndex(0)"
        @keydown.end.prevent="focusIndex(streams.length - 1)"
      >
        <div v-if="loading && !streams.length" class="flex min-h-[8rem] items-center justify-center">
          <LoadingSpinner message="Buscando fuentes…" />
        </div>

        <ul v-else-if="streams.length">
          <li v-for="(stream, i) in streams" :key="stream.sourceId">
            <button
              :ref="(el) => setItemRef(el as HTMLButtonElement | null, i)"
              @click="$emit('select', stream)"
              class="group flex min-h-[2.75rem] w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              :class="stream.sourceId === activeSourceId ? 'bg-accent' : 'hover:bg-accent/60'"
            >
              <span class="truncate text-sm font-medium text-foreground">{{ stream.label }}</span>
              <span v-if="stream.languageLabel" class="truncate text-xs text-muted-foreground">
                {{ stream.languageLabel }}
              </span>
              <span
                v-if="stream.sourceId === activeSourceId"
                class="ml-auto shrink-0 text-[11px] font-medium text-primary"
              >
                En uso
              </span>
              <svg
                v-else
                class="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                aria-hidden="true"
              ><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </li>
        </ul>

        <p v-else class="px-2 py-10 text-center text-sm text-muted-foreground">
          Ninguna fuente tiene este contenido todavía.
        </p>
      </div>

      <p class="border-t border-border/50 px-5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        Reproductores externos con su propio catálogo y anuncios.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import type { SourceResult, Stream } from '@/modules/player'

const props = defineProps<{
  loading: boolean
  results: SourceResult[]
  /** Fuente que ya está reproduciendo, para marcarla sin duplicar el nombre. */
  activeSourceId?: string | null
}>()

const emit = defineEmits<{
  (e: 'select', stream: Stream): void
  (e: 'close'): void
}>()

const streams = computed<Stream[]>(() =>
  props.results.flatMap((r) => r.streams).filter((s) => s.playable !== false)
)

const items = ref<(HTMLButtonElement | null)[]>([])
const closeButton = ref<HTMLButtonElement | null>(null)

function setItemRef(el: HTMLButtonElement | null, index: number) {
  items.value[index] = el
}

function focusIndex(index: number) {
  const target = items.value[Math.min(Math.max(index, 0), streams.value.length - 1)]
  target?.focus()
}

function moveFocus(delta: number) {
  const current = items.value.findIndex((el) => el === document.activeElement)
  if (current === -1) {
    focusIndex(delta > 0 ? 0 : streams.value.length - 1)
    return
  }
  focusIndex(current + delta)
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
  }
}

onMounted(async () => {
  await nextTick()
  if (streams.value.length) focusIndex(0)
  else closeButton.value?.focus()
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))

const summary = computed(() => {
  const n = streams.value.length
  if (props.loading && !n) return 'Buscando…'
  if (!n) return 'Sin resultados'
  const spanish = streams.value.filter((s) => /latino|castellano|español/i.test(s.languageLabel || '')).length
  const base = n === 1 ? '1 fuente' : `${n} fuentes`
  return spanish ? `${base} · ${spanish} en español` : base
})
</script>
