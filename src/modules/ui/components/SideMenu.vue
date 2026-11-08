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
      class="sidebar-panel fixed left-3 top-3 z-[70] flex max-h-[calc(100dvh-1.5rem)] w-[17.5rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-3xl border border-sidebar-border bg-sidebar/90 text-sidebar-foreground backdrop-blur-2xl"
      :class="isOpen ? 'is-open' : 'is-closed'"
      :inert="isOpen ? undefined : true"
      :aria-hidden="isOpen ? undefined : 'true'"
      aria-label="Menú principal"
      tabindex="-1"
    >
      <!-- Cabecera: marca + cerrar -->
      <div class="flex items-center gap-2 px-3 pb-2 pt-3">
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

      <!-- Buscador: la entrada más usada del menú, con su atajo a la vista -->
      <div class="px-3 pb-1">
        <button
          type="button"
          class="flex h-11 w-full items-center gap-2.5 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/35 px-3 text-sm text-muted-foreground transition-colors duration-200 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          @click="openSearch"
        >
          <MagnifyingGlassIcon class="h-4 w-4 shrink-0" />
          <span class="flex-1 truncate text-left">Buscar</span>
          <kbd
            class="select-none rounded border border-border bg-background/50 px-1.5 py-0.5 font-mono text-[10px] font-medium"
          >{{ shortcutLabel }}</kbd>
        </button>
      </div>

      <!-- Navegación: grupos con etiqueta, no una lista suelta -->
      <nav
        ref="listRef"
        class="custom-scrollbar relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2"
        aria-label="Secciones"
      >
        <!-- Indicador del ítem activo: se desliza entre filas (estado, no decoración). -->
        <span
          v-show="indicator.visible"
          class="nav-indicator"
          :style="{ transform: `translateY(${indicator.top}px)`, height: `${indicator.height}px` }"
          aria-hidden="true"
        />

        <template v-for="group in groups" :key="group.label">
          <p class="nav-group-label">{{ group.label }}</p>
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            :data-nav-index="indexOf(item.path)"
            class="nav-row group relative z-10 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
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
        </template>

        <!-- Preferencias: cierre del menú, separadas por un divisor. El panel mide
             lo que mide su contenido, así que no queda hueco muerto abajo. -->
        <div class="mt-2 border-t border-sidebar-border/60 pt-1">
          <p class="nav-group-label">{{ pinnedGroup.label }}</p>
          <router-link
            v-for="item in pinnedGroup.items"
            :key="item.path"
            :to="item.path"
            :data-nav-index="indexOf(item.path)"
            class="nav-row group relative z-10 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
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
        </div>
      </nav>
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
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { FEATURES } from '@/core/config/features'
import { useSidebar } from '../composables/useSidebar'
import { useCommandPalette } from '../composables/useCommandPalette'

const route = useRoute()
const { isOpen, close } = useSidebar()
const { isOpen: isPaletteOpen, open: openPalette } = useCommandPalette()

const panelRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const indicator = reactive({ top: 0, height: 0, visible: false })

/** Elemento que tenía el foco al abrir, para devolvérselo al cerrar. */
let restoreFocusTo: HTMLElement | null = null

const groups = [
  {
    label: 'Catálogo',
    items: [
      { name: 'Inicio', path: '/', icon: HomeIcon },
      { name: 'Películas', path: '/movies', icon: FilmIcon },
      { name: 'Series', path: '/series', icon: TvIcon },
      // Anime gateado tras FEATURES.anime (reversible)
      ...(FEATURES.anime ? [{ name: 'Anime', path: '/animes', icon: SparklesIcon }] : []),
    ],
  },
  {
    label: 'Tu biblioteca',
    items: [
      { name: 'Favoritos', path: '/favorites', icon: HeartIcon },
      { name: 'Recientes', path: '/recent', icon: ClockIcon },
    ],
  },
]

/** Grupo anclado al pie del panel. */
const pinnedGroup = {
  label: 'Preferencias',
  items: [{ name: 'Ajustes', path: '/settings', icon: Cog6ToothIcon }],
}

/** Orden plano de todas las filas, para el índice del indicador. */
const flatItems = [...groups.flatMap((group) => group.items), ...pinnedGroup.items]

function indexOf(path: string) {
  return flatItems.findIndex((item) => item.path === path)
}

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const activeIndex = computed(() => flatItems.findIndex((item) => isActive(item.path)))

const shortcutLabel = computed(() =>
  /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? '⌘K' : 'Ctrl K',
)

function openSearch() {
  close()
  openPalette()
}

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

/* ===== Etiquetas de grupo ===== */
.nav-group-label {
  padding: 0.75rem 0.75rem 0.25rem;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: oklch(var(--muted-foreground) / 0.75);
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
    oklch(var(--primary) / 0.16),
    oklch(var(--primary) / 0.05)
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
