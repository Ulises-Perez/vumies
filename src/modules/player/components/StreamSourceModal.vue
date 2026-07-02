<template>
  <div class="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
    <div class="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 class="text-lg font-bold text-foreground font-poppins">Elige una fuente</h2>
          <p class="text-xs text-muted-foreground">Selecciona dónde reproducir el contenido</p>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Cerrar"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        <!-- Loading -->
        <div v-if="loading" class="py-10">
          <LoadingSpinner message="Buscando fuentes disponibles…" />
        </div>

        <!-- Lista de fuentes -->
        <template v-else-if="groups.length">
          <div v-for="group in groups" :key="group.sourceId">
            <h3 class="px-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {{ group.label }}
            </h3>
            <ul class="space-y-1">
              <li v-for="(stream, i) in group.streams" :key="`${group.sourceId}-${i}`">
                <button
                  @click="$emit('select', stream)"
                  class="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent text-left transition-colors hover:bg-accent hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
                >
                  <!-- Badge del tipo de stream -->
                  <span
                    class="flex-none px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
                    :class="kindBadgeClass(stream.kind)"
                  >
                    {{ kindLabel(stream.kind) }}
                  </span>

                  <!-- Info -->
                  <span class="flex-1 min-w-0">
                    <span class="block text-sm font-medium text-foreground truncate">{{ stream.label }}</span>
                    <span class="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span v-if="stream.quality || stream.codec">
                        {{ [stream.quality, stream.codec].filter(Boolean).join(' · ') }}
                      </span>
                      <span v-if="stream.languages?.length" class="flex items-center gap-1">
                        <img
                          v-for="code in stream.languages"
                          :key="code"
                          :src="`https://flagcdn.com/20x15/${code}.png`"
                          :alt="code"
                          class="h-3.5 w-auto rounded-[2px] ring-1 ring-border/50"
                          loading="lazy"
                        />
                      </span>
                    </span>
                  </span>

                  <span
                    v-if="stream.playable === false"
                    class="flex-none text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md"
                  >
                    Pronto
                  </span>
                  <PlayIcon class="flex-none w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              </li>
            </ul>
          </div>
        </template>

        <!-- Vacío -->
        <div v-else class="py-10 text-center">
          <p class="text-sm text-muted-foreground">No hay fuentes disponibles para este contenido.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PlayIcon } from '@heroicons/vue/24/solid'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import type { SourceResult, StreamKind } from '@/modules/player'

const props = defineProps<{
  loading: boolean
  results: SourceResult[]
}>()

defineEmits<{
  (e: 'select', stream: SourceResult['streams'][number]): void
  (e: 'close'): void
}>()

/** Solo fuentes que aportaron al menos un stream. */
const groups = computed(() => props.results.filter((r) => r.streams.length > 0))

function kindLabel(kind: StreamKind): string {
  return kind === 'iframe' ? 'Embed' : kind === 'direct' ? 'Directo' : 'Torrent'
}

function kindBadgeClass(kind: StreamKind): string {
  return kind === 'iframe'
    ? 'bg-muted text-muted-foreground'
    : 'bg-primary/15 text-primary'
}
</script>
