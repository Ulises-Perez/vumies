<template>
  <Teleport to="body">
    <!-- Catcher de clics: cierra el panel al tocar fuera.
         En ≥md es transparente para no ensuciar el fondo de la página; en móvil oscurece
         porque el panel ocupa casi toda la pantalla. -->
    <Transition name="sidebar-scrim">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[60] bg-background/75 md:bg-transparent"
        @click="close"
      />
    </Transition>

    <!-- Panel flotante a lo largo de toda la pantalla: arranca justo debajo de la
         barra superior (que es la única cabecera del sistema: marca + toggle +
         buscador viven ahí) y baja hasta el pie. No duplica marca ni buscador. -->
    <aside
      id="app-sidebar"
      ref="panelRef"
      class="sidebar-panel fixed bottom-2.5 left-2.5 top-[var(--chrome-top)] z-[70] flex w-[17.5rem] max-w-[calc(100vw-1.25rem)] flex-col overflow-hidden rounded-3xl border border-sidebar-border bg-sidebar/90 text-sidebar-foreground backdrop-blur-2xl sm:bottom-3 sm:left-4"
      :class="isOpen ? 'is-open' : 'is-closed'"
      :inert="isOpen ? undefined : true"
      :aria-hidden="isOpen ? undefined : 'true'"
      aria-label="Menú principal"
      tabindex="-1"
    >
      <!-- Navegación: grupos con etiqueta; el resto del largo es suyo. -->
      <nav
        ref="listRef"
        class="custom-scrollbar relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 pt-2"
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
      </nav>

      <!-- Pie anclado: preferencias siempre a la vista al fondo del panel,
           independientemente de lo largo que sea el listado de secciones. -->
      <div class="shrink-0 border-t border-sidebar-border/60 bg-sidebar/70 px-2 pb-2 pt-1">
        <p class="nav-group-label">{{ pinnedGroup.label }}</p>

        <!-- Tema de la app: claro / oscuro / sistema, un toque cicla. -->
        <button
          type="button"
          class="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-muted-foreground transition-colors duration-200 hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label="Cambiar tema"
          @click="cycleTheme"
        >
          <component
            :is="themeIcon"
            class="h-5 w-5 shrink-0 transition-colors duration-200 group-hover:text-foreground"
          />
          <span class="truncate">Tema: {{ themeLabel }}</span>
        </button>

        <router-link
          v-for="item in pinnedGroup.items"
          :key="item.path"
          :to="item.path"
          class="group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
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
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/vue/24/outline'
import { FEATURES } from '@/core/config/features'
import { useSettingsStore, type Theme } from '@/core/stores/settings.store'
import { useSidebar } from '../composables/useSidebar'
import { useCommandPalette } from '../composables/useCommandPalette'

const route = useRoute()
const { isOpen, close } = useSidebar()
const { isOpen: isPaletteOpen } = useCommandPalette()
const settings = useSettingsStore()

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

/** Grupo anclado al pie del panel, fuera del scroll de secciones. */
const pinnedGroup = {
  label: 'Preferencias',
  items: [{ name: 'Ajustes', path: '/settings', icon: Cog6ToothIcon }],
}

/** Orden plano de las filas navegables, para el índice del indicador. */
const flatItems = groups.flatMap((group) => group.items)

function indexOf(path: string) {
  return flatItems.findIndex((item) => item.path === path)
}

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const activeIndex = computed(() => flatItems.findIndex((item) => isActive(item.path)))

const themeIcons: Record<Theme, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: ComputerDesktopIcon,
}

const themeLabels: Record<Theme, string> = {
  light: 'Claro',
  dark: 'Oscuro',
  system: 'Sistema',
}

const themeIcon = computed(() => themeIcons[settings.theme])
const themeLabel = computed(() => themeLabels[settings.theme])

function cycleTheme() {
  const nextTheme: Record<Theme, Theme> = {
    dark: 'light',
    light: 'system',
    system: 'dark',
  }
  settings.setTheme(nextTheme[settings.theme])
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
