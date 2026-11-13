<template>
  <div class="absolute inset-0 z-[60] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-8">
    <div
      class="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-card text-card-foreground ring-1 ring-border shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-modal-title"
      aria-describedby="source-modal-summary"
    >
      <header class="flex items-start gap-4 px-6 pb-4 pt-6">
        <div class="min-w-0 flex-1">
          <h2 id="source-modal-title" class="font-poppins text-xl font-bold tracking-tight text-foreground">
            Dónde reproducir
          </h2>
          <p id="source-modal-summary" class="mt-1 text-sm text-muted-foreground">{{ summary }}</p>
        </div>
        <button
          ref="closeButton"
          @click="$emit('close')"
          class="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
          aria-label="Cerrar"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </header>

      <!-- Teclado: flechas mueven el foco entre fuentes, Inicio/Fin a los
           extremos, Enter elige y Escape cierra (ver handleKeydown). -->
      <div
        class="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-2"
        @keydown.down.prevent="moveFocus(1)"
        @keydown.up.prevent="moveFocus(-1)"
        @keydown.home.prevent="focusIndex(0)"
        @keydown.end.prevent="focusIndex(streams.length - 1)"
      >
        <div v-if="loading && !streams.length" class="flex min-h-[12rem] items-center justify-center">
          <LoadingSpinner message="Buscando fuentes…" />
        </div>

        <ul v-else-if="streams.length" class="space-y-2">
          <li v-for="(stream, i) in streams" :key="stream.sourceId">
            <button
              :ref="(el) => setItemRef(el as HTMLButtonElement | null, i)"
              @click="$emit('select', stream)"
              class="group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              :class="
                stream.sourceId === activeSourceId
                  ? 'bg-primary/10 ring-1 ring-primary/40'
                  : 'bg-muted/30 ring-1 ring-transparent hover:bg-accent hover:ring-border'
              "
            >
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-bold"
                :class="
                  stream.sourceId === activeSourceId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-primary ring-1 ring-border/60'
                "
                aria-hidden="true"
              >
                {{ initial(stream.label) }}
              </span>

              <span class="min-w-0 flex-1">
                <span class="flex flex-wrap items-center gap-2">
                  <span class="truncate text-base font-semibold text-foreground">{{ stream.label }}</span>
                  <span
                    v-if="stream.sourceId === activeSourceId"
                    class="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground"
                  >
                    En uso
                  </span>
                  <span
                    v-else-if="i === 0 && isSpanish(stream)"
                    class="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                  >
                    Recomendada
                  </span>
                </span>

                <span class="mt-1.5 flex flex-wrap items-center gap-2">
                  <span
                    class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                    :class="
                      isSpanish(stream)
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    "
                  >
                    {{ stream.languageLabel || 'Idioma no declarado' }}
                  </span>
                  <span class="text-xs text-muted-foreground">{{ kindLabel(stream.kind) }}</span>
                </span>
              </span>

              <span
                class="hidden shrink-0 items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary sm:inline-flex"
                aria-hidden="true"
              >
                Abrir
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
              </span>
            </button>
          </li>
        </ul>

        <p v-else class="px-2 py-14 text-center text-sm text-muted-foreground">
          Ninguna fuente tiene este contenido todavía.
        </p>
      </div>

      <footer class="border-t border-border/60 px-6 py-3.5">
        <p class="text-[11px] leading-relaxed text-muted-foreground">
          Cada fuente es un reproductor externo con su propio catálogo, idiomas y anuncios. Si una no
          carga, elegí otra: el contenido y tu progreso de sesión no cambian.
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import type { SourceResult, Stream, StreamKind } from '@/modules/player'

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

/** Una tarjeta por fuente, en el orden de peso que ya trae el registry. */
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

/** Flechas: mueve el foco real, no solo un resaltado, para que Enter funcione. */
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
  // El foco arranca en la primera fuente: sirve para teclado y deja Enter listo.
  if (streams.value.length) focusIndex(0)
  else closeButton.value?.focus()
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))

const summary = computed(() => {
  const n = streams.value.length
  if (props.loading && !n) return 'Buscando…'
  if (!n) return 'Sin fuentes para este contenido'
  const spanish = streams.value.filter(isSpanish).length
  const base = n === 1 ? '1 fuente disponible' : `${n} fuentes disponibles`
  return spanish ? `${base} · ${spanish} en español` : base
})

function isSpanish(stream: Stream): boolean {
  return /latino|castellano|español/i.test(stream.languageLabel || '')
}

function initial(label: string): string {
  return (label || '?').trim().charAt(0).toUpperCase()
}

function kindLabel(kind: StreamKind): string {
  return kind === 'iframe' ? 'Reproductor externo' : 'Enlace directo'
}
</script>
