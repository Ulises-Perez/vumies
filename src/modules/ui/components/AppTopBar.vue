<template>
  <!-- Barra cero cromo (03-mosaico): franja de 48px sin fondo propio, sin placa,
       sin borde, sin sombra ni blur. Dos clusters de 32px a los bordes del
       contenedor unico; el vano central es transparente y deja pasar el clic.
       En las rutas de reproduccion desaparece para no tapar el video. -->
  <header
    v-show="!isPlayerRoute"
    class="topbar-shell pointer-events-none fixed inset-x-0 top-[var(--bar-offset)] z-[65] h-[var(--bar-height)]"
    :class="{ 'is-hidden': isHidden }"
    :aria-hidden="isHidden ? 'true' : undefined"
    :inert="isHidden ? true : undefined"
  >
    <div class="container-app pointer-events-none flex h-full items-center justify-between">
      <!-- Cluster izquierdo: toggle del sidebar + wordmark solo texto. -->
      <div class="pointer-events-auto flex items-center gap-1">
        <button
          :key="isOpen ? 'close' : 'open'"
          type="button"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground bg-popover/60 backdrop-blur-md transition-colors duration-200 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
          :aria-expanded="isOpen"
          aria-controls="app-sidebar"
          :aria-label="isOpen ? 'Cerrar menú' : 'Abrir menú'"
          @click="toggle"
        >
          <XMarkIcon v-if="isOpen" class="h-[18px] w-[18px]" />
          <Bars3Icon v-else class="h-[18px] w-[18px]" />
        </button>

        <router-link
          to="/"
          class="hidden h-8 shrink-0 items-center rounded-lg px-2 text-[13px] bg-popover/60 backdrop-blur-md font-semibold uppercase tracking-[0.14em] text-foreground transition-colors duration-200 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 sm:inline-flex"
          aria-label="Vumies — Inicio"
        >
          Vumies
        </router-link>
      </div>

      <!-- Cluster derecho: busqueda icon-only + keycap. Sin theme toggle:
           el control de tema ya vive en el sidebar (L9). -->
      <div class="pointer-events-auto flex items-center gap-1">
        <button
          type="button"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground bg-popover/60 backdrop-blur-md transition-colors duration-200 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
          aria-label="Buscar en el catálogo"
          @click="open"
        >
          <MagnifyingGlassIcon class="h-[18px] w-[18px]" />
        </button>
        <kbd
          class="hidden select-none rounded-md bg-popover/70 px-1.5 py-1 font-mono text-[10px] font-medium text-muted-foreground backdrop-blur-md sm:inline-flex"
          aria-hidden="true"
        >{{ shortcutLabel }}</kbd>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Bars3Icon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useSidebar } from '../composables/useSidebar'
import { useCommandPalette } from '../composables/useCommandPalette'

const route = useRoute()
const { isOpen, toggle } = useSidebar()
const { isOpen: isPaletteOpen, open } = useCommandPalette()
const scrollingDown = ref(false)
let lastScrollY = 0
let ticking = false

// Hide chrome when reading down the page; reveal it on scroll-up or when at top.
function updateScrollDirection() {
  const nextScrollY = window.scrollY
  if (nextScrollY < 80) scrollingDown.value = false
  else if (nextScrollY - lastScrollY > 6) {
    const shell = document.querySelector<HTMLElement>('.topbar-shell')
    if (!shell?.contains(document.activeElement)) scrollingDown.value = true
  } else if (lastScrollY - nextScrollY > 4) scrollingDown.value = false
  lastScrollY = nextScrollY
  ticking = false
}

function onScroll() {
  if (ticking) return
  ticking = true
  window.requestAnimationFrame(updateScrollDirection)
}

onMounted(() => {
  lastScrollY = window.scrollY
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => window.removeEventListener('scroll', onScroll))

watch(() => route.fullPath, () => {
  scrollingDown.value = false
  lastScrollY = 0
})

const isHidden = computed(() => scrollingDown.value && !isOpen.value && !isPaletteOpen.value)

const isPlayerRoute = computed(
  () =>
    route.name === 'player' ||
    route.name === 'episode-player' ||
    route.path.startsWith('/player'),
)

const shortcutLabel = computed(() =>
  /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? '⌘K' : 'Ctrl K',
)
</script>

<style scoped>
.topbar-shell {
  transform: translateY(0);
  opacity: 1;
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 160ms linear;
}

.topbar-shell.is-hidden {
  transform: translateY(calc(-100% - 1rem));
  opacity: 0;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .topbar-shell {
    transition: none;
  }
}

:global(html.reduce-motion) .topbar-shell {
  transition: none;
}
</style>
