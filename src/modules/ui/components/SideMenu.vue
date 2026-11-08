<template>
  <Teleport to="body">
    <!-- Catcher de clics: cierra el panel al tocar fuera.
         En ≥md es transparente para no ensuciar el ambilight; en móvil oscurece
         porque el panel ocupa casi toda la pantalla. -->
    <Transition name="sidebar-scrim">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[60] bg-background/75 md:bg-transparent"
        @click="close"
      />
    </Transition>

    <!-- Panel flotante: no reserva espacio en el layout, se desliza sobre el contenido. -->
    <aside
      id="app-sidebar"
      ref="panelRef"
      class="sidebar-panel fixed inset-y-3 left-3 z-[70] flex w-[17.5rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-3xl border border-sidebar-border bg-sidebar/90 text-sidebar-foreground backdrop-blur-2xl"
      :class="isOpen ? 'is-open' : 'is-closed'"
      :inert="isOpen ? undefined : true"
      :aria-hidden="isOpen ? undefined : 'true'"
      aria-label="Menú principal"
      tabindex="-1"
    >
      <!-- Cabecera: marca + cerrar -->
      <div class="flex items-center gap-2 px-3 pb-1 pt-3">
        <router-link
          to="/"
          class="group flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl px-2 py-1.5 transition-colors duration-200 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label="Vumies — Inicio"
          @click="close"
        >
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-[15px] font-bold text-foreground transition-colors duration-200 group-hover:bg-primary-strong group-hover:text-primary-strong-foreground"
            aria-hidden="true"
          >
            V
          </span>
          <span class="truncate text-[15px] font-semibold tracking-tight">Vumies</span>
        </router-link>

        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label="Cerrar menú"
          @click="close"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <!-- Navegación -->
      <nav
        ref="listRef"
        class="custom-scrollbar relative flex-1 overflow-y-auto overflow-x-hidden px-2 py-2"
        aria-label="Secciones"
      >
        <!-- Indicador del ítem activo: se desliza entre filas (estado, no decoración). -->
        <span
          v-show="indicator.visible"
          class="nav-indicator"
          :style="{ transform: `translateY(${indicator.top}px)`, height: `${indicator.height}px` }"
          aria-hidden="true"
        />

        <router-link
          v-for="(item, index) in items"
          :key="item.path"
          :to="item.path"
          :data-nav-index="index"
          class="nav-row group relative z-10 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          :class="isActive(item.path) ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'"
          :aria-current="isActive(item.path) ? 'page' : undefined"
          @click="close"
        >
          <component
            :is="item.icon"
            class="h-5 w-5 shrink-0 transition-colors duration-200"
            :class="isActive(item.path) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'"
          />
          <span class="truncate">{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- Pie: pista de teclado, no un control nuevo -->
      <p class="border-t border-sidebar-border/60 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <kbd
          class="rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground"
        >⌘K</kbd>
        abre la búsqueda
      </p>
    </aside>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeIcon,
  FilmIcon,
  TvIcon,
  HeartIcon,
  ClockIcon,
  Cog6ToothIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { FEATURES } from '@/core/config/features'
import { useSidebar } from '../composables/useSidebar'
import { useCommandPalette } from '../composables/useCommandPalette'

const route = useRoute()
const { isOpen, close } = useSidebar()
const { isOpen: isPaletteOpen } = useCommandPalette()

const panelRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const indicator = reactive({ top: 0, height: 0, visible: false })

/** Elemento que tenía el foco al abrir, para devolvérselo al cerrar. */
let restoreFocusTo: HTMLElement | null = null

const items = [
  { name: 'Inicio', path: '/', icon: HomeIcon },
  { name: 'Películas', path: '/movies', icon: FilmIcon },
  { name: 'Series', path: '/series', icon: TvIcon },
  // Anime gateado tras FEATURES.anime (reversible)
  ...(FEATURES.anime ? [{ name: 'Anime', path: '/animes', icon: SparklesIcon }] : []),
  { name: 'Favoritos', path: '/favorites', icon: HeartIcon },
  { name: 'Recientes', path: '/recent', icon: ClockIcon },
  { name: 'Ajustes', path: '/settings', icon: Cog6ToothIcon },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const activeIndex = computed(() => items.findIndex((item) => isActive(item.path)))

/**
 * Mide la fila activa en coordenadas del `nav` (mismo sistema que usa el indicador
 * absoluto), sin leer del scroll ni forzar reflow extra: `offsetTop` es local.
 */
function measureIndicator() {
  const host = listRef.value
  const index = activeIndex.value
  if (!host || index < 0) {
    indicator.visible = false
    return
  }
  const row = host.querySelector<HTMLElement>(`[data-nav-index="${index}"]`)
  if (!row) {
    indicator.visible = false
    return
  }
  indicator.top = row.offsetTop
  indicator.height = row.offsetHeight
  indicator.visible = true
}

watch(isOpen, (open) => {
  if (open) {
    restoreFocusTo = document.activeElement as HTMLElement | null
    nextTick(() => {
      measureIndicator()
      panelRef.value?.focus({ preventScroll: true })
    })
  } else {
    const target = restoreFocusTo
    restoreFocusTo = null
    if (target && document.contains(target)) target.focus({ preventScroll: true })
  }
})

// Cualquier navegación cierra el panel: el sidebar nunca queda abierto sobre la
// pantalla siguiente (S1).
watch(() => route.fullPath, close)

watch(() => route.fullPath, () => nextTick(measureIndicator))

/**
 * Escape cierra el panel aunque el foco haya quedado fuera de él. Si el buscador
 * está abierto tiene prioridad: `CommandPalette` resuelve ese Escape y acá no se
 * toca nada.
 */
function onWindowKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !isOpen.value || isPaletteOpen.value) return
  e.preventDefault()
  close()
}

function onResize() {
  if (isOpen.value) measureIndicator()
}

onMounted(() => {
  window.addEventListener('keydown', onWindowKeydown)
  window.addEventListener('resize', onResize, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onWindowKeydown)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
/* ===== Panel flotante ===== */
.sidebar-panel {
  transition:
    transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms linear;
  box-shadow:
    0 24px 60px -24px rgb(0 0 0 / 0.65),
    0 2px 10px -4px rgb(0 0 0 / 0.5),
    inset 0 1px 0 oklch(1 0 0 / 6%);
}

.sidebar-panel.is-closed {
  transform: translateX(calc(-100% - 0.75rem));
  opacity: 0;
  pointer-events: none;
}

.sidebar-panel.is-open {
  transform: translateX(0);
  opacity: 1;
}

/* ===== Indicador del ítem activo ===== */
.nav-indicator {
  position: absolute;
  top: 0;
  left: 0.5rem;
  right: 0.5rem;
  border-radius: 1rem;
  background: linear-gradient(
    90deg,
    oklch(var(--sidebar-primary) / 0.16),
    oklch(var(--sidebar-primary) / 0.05)
  );
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 5%);
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    height 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* ===== Fade del catcher de clics ===== */
.sidebar-scrim-enter-active,
.sidebar-scrim-leave-active {
  transition: opacity 180ms linear;
}

.sidebar-scrim-enter-from,
.sidebar-scrim-leave-to {
  opacity: 0;
}

/* ===== Movimiento reducido ===== */
@media (prefers-reduced-motion: reduce) {
  .sidebar-panel,
  .nav-indicator,
  .sidebar-scrim-enter-active,
  .sidebar-scrim-leave-active {
    transition: none;
  }
}

html.reduce-motion .sidebar-panel,
html.reduce-motion .nav-indicator,
html.reduce-motion .sidebar-scrim-enter-active,
html.reduce-motion .sidebar-scrim-leave-active {
  transition: none;
}
</style>
