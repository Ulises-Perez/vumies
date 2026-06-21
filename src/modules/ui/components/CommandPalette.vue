<template>
  <Teleport to="body">
    <Transition name="command">
      <div v-if="isOpen" class="fixed inset-0 z-[100]">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close" />

        <!-- Dialog (centrado horizontalmente, anclado un poco arriba como ⌘K de shadcn) -->
        <div class="relative z-10 flex min-h-full items-start justify-center p-4 pt-[12vh] sm:pt-[14vh]">
          <div
            class="command-panel w-full max-w-xl bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Buscar"
            @click.stop
          >
            <!-- Input -->
            <div class="flex items-center gap-2 border-b border-border px-3">
              <svg class="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref="inputRef"
                v-model="query"
                type="text"
                placeholder="Buscar películas, series..."
                class="flex h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                @keydown="onKeydown"
              />
              <kbd class="pointer-events-none hidden sm:inline-flex h-5 select-none items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                Esc
              </kbd>
            </div>

            <!-- Lista -->
            <div ref="listRef" class="max-h-[330px] overflow-y-auto custom-scrollbar p-1">
              <!-- Estado vacío -->
              <div v-if="isEmpty" class="py-10 text-center text-sm text-muted-foreground">
                No se encontraron resultados.
              </div>

              <div v-for="section in sections" :key="section.label" class="mb-1 last:mb-0">
                <div class="px-2 py-1.5 text-xs font-medium text-muted-foreground">{{ section.label }}</div>

                <button
                  v-for="item in section.items"
                  :key="item.id"
                  :data-index="item.index"
                  type="button"
                  @click="run(item)"
                  @mousemove="activeIndex = item.index!"
                  class="flex w-full items-center gap-3 rounded-md px-2 text-left text-sm transition-colors"
                  :class="[
                    item.kind === 'result' ? 'py-1.5' : 'py-2',
                    activeIndex === item.index ? 'bg-accent text-accent-foreground' : 'text-foreground',
                  ]"
                >
                  <!-- Resultado: poster + título + meta -->
                  <template v-if="item.kind === 'result'">
                    <img
                      v-if="item.poster"
                      :src="item.poster"
                      :alt="item.label"
                      class="h-11 w-8 flex-shrink-0 rounded object-cover"
                    >
                    <div v-else class="h-11 w-8 flex-shrink-0 rounded bg-muted flex items-center justify-center">
                      <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate font-medium">{{ item.label }}</p>
                      <p class="truncate text-xs text-muted-foreground">{{ item.subtitle }}</p>
                    </div>
                  </template>

                  <!-- Acción / página: flecha + label -->
                  <template v-else>
                    <svg class="w-4 h-4 flex-shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span class="truncate font-medium">{{ item.label }}</span>
                  </template>
                </button>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
              <div class="flex items-center gap-1.5">
                <kbd class="inline-flex h-5 min-w-[1.25rem] select-none items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[10px]">↵</kbd>
                <span>Ir a la página</span>
              </div>
              <div class="hidden sm:flex items-center gap-1.5">
                <kbd class="inline-flex h-5 min-w-[1.25rem] select-none items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[10px]">↑</kbd>
                <kbd class="inline-flex h-5 min-w-[1.25rem] select-none items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[10px]">↓</kbd>
                <span>Navegar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import { tmdbService } from '@/modules/catalog/services/tmdb.service'
import { getPosterUrl } from '@/core/config/api.config'
import { useAnimeStore } from '@/core/stores/anime.store'
import { FEATURES } from '@/core/config/features'
import { useCommandPalette } from '../composables/useCommandPalette'

interface CmdItem {
  kind: 'action' | 'page' | 'result'
  id: string
  label: string
  subtitle?: string
  poster?: string | null
  to: RouteLocationRaw
  index?: number
}

const router = useRouter()
const animeStore = useAnimeStore()
const { isOpen, open, close } = useCommandPalette()

const query = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const suggestions = ref<any[]>([])
let searchTimeout: number | null = null

const PAGES: { id: string; label: string; to: RouteLocationRaw }[] = [
  { id: 'home', label: 'Inicio', to: '/' },
  { id: 'movies', label: 'Películas', to: '/movies' },
  { id: 'series', label: 'Series', to: '/series' },
  ...(FEATURES.anime ? [{ id: 'animes', label: 'Anime', to: '/animes' }] : []),
  { id: 'favorites', label: 'Favoritos', to: '/favorites' },
  { id: 'recent', label: 'Recientes', to: '/recent' },
]

const q = computed(() => query.value.trim().toLowerCase())

const actions = computed<CmdItem[]>(() => {
  if (!q.value) return []
  return [{
    kind: 'action',
    id: 'search-all',
    label: `Buscar "${query.value.trim()}"`,
    to: { name: 'search', query: { q: query.value.trim() } },
  }]
})

const pages = computed<CmdItem[]>(() =>
  PAGES
    .filter((p) => !q.value || p.label.toLowerCase().includes(q.value))
    .map((p) => ({ kind: 'page', id: p.id, label: p.label, to: p.to })),
)

function resultRoute(item: any): RouteLocationRaw {
  if (item.media_type === 'movie') return { name: 'movie-detail', params: { id: item.id } }
  // Con anime desactivado, todo TV cae a serie-detail (igual que en el resto de la app).
  const name = FEATURES.anime && animeStore.isAnime(item.id) ? 'anime-detail' : 'serie-detail'
  return { name, params: { id: item.id } }
}

const results = computed<CmdItem[]>(() =>
  suggestions.value.map((item) => ({
    kind: 'result',
    id: `${item.media_type}-${item.id}`,
    label: item.title || item.name,
    subtitle: `${item.media_type === 'movie' ? 'Película' : 'Serie'} • ${(item.vote_average || 0).toFixed(1)}`,
    poster: item.poster_path ? getPosterUrl(item.poster_path, 'w92') : null,
    to: resultRoute(item),
  })),
)

// Construye las secciones asignando un índice global plano a cada item (para teclado).
const sections = computed(() => {
  const raw: { label: string; items: CmdItem[] }[] = []
  if (actions.value.length) raw.push({ label: 'Acciones', items: actions.value })
  if (pages.value.length) raw.push({ label: 'Páginas', items: pages.value })
  if (results.value.length) raw.push({ label: 'Resultados', items: results.value })
  let i = 0
  return raw.map((sec) => ({
    label: sec.label,
    items: sec.items.map((it) => ({ ...it, index: i++ })),
  }))
})

const flatItems = computed<CmdItem[]>(() => sections.value.flatMap((s) => s.items))
const isEmpty = computed(() => flatItems.value.length === 0)

watch(query, () => {
  activeIndex.value = 0
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!query.value.trim()) {
    suggestions.value = []
    return
  }
  searchTimeout = window.setTimeout(fetchSuggestions, 250)
})

watch(flatItems, () => {
  if (activeIndex.value > flatItems.value.length - 1) {
    activeIndex.value = Math.max(0, flatItems.value.length - 1)
  }
})

async function fetchSuggestions() {
  try {
    const res = await tmdbService.searchMulti(query.value.trim())
    suggestions.value = res.results
      .filter((i: any) => i.media_type === 'movie' || i.media_type === 'tv')
      .slice(0, 6)
  } catch {
    suggestions.value = []
  }
}

function run(item: CmdItem) {
  close()
  router.push(item.to)
}

function move(delta: number) {
  const n = flatItems.value.length
  if (!n) return
  activeIndex.value = (activeIndex.value + delta + n) % n
  nextTick(() => {
    listRef.value
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex.value}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  })
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    move(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    move(-1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = flatItems.value[activeIndex.value]
    if (item) run(item)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

watch(isOpen, (val) => {
  if (val) {
    query.value = ''
    suggestions.value = []
    activeIndex.value = 0
    document.body.style.overflow = 'hidden'
    nextTick(() => inputRef.value?.focus())
  } else {
    document.body.style.overflow = ''
  }
})

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    isOpen.value ? close() : open()
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.command-enter-active {
  transition: opacity 0.15s ease;
}
.command-leave-active {
  transition: opacity 0.12s ease;
}
.command-enter-from,
.command-leave-to {
  opacity: 0;
}

.command-enter-active .command-panel {
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}
.command-leave-active .command-panel {
  transition: transform 0.12s ease;
}
.command-enter-from .command-panel,
.command-leave-to .command-panel {
  transform: scale(0.97);
}
</style>
