<template>
  <!-- Barra flotante: no ocupa el flujo de la página, se apoya sobre el contenido.
       En las rutas de reproducción desaparece para no tapar el video. -->
  <header
    v-show="!isPlayerRoute"
    class="pointer-events-none fixed inset-x-0 top-0 z-50 px-2.5 pt-2.5 sm:px-4 sm:pt-3"
  >
    <div
      class="pointer-events-auto mx-auto flex h-12 max-w-[110rem] items-center gap-1 rounded-2xl border border-border/60 bg-popover/70 px-1.5 backdrop-blur-xl sm:h-14 sm:gap-1.5 sm:px-2"
      :class="isOpen ? 'shadow-[0_10px_34px_-16px_rgb(0_0_0/0.85)]' : 'shadow-[0_10px_30px_-20px_rgb(0_0_0/0.8)]'"
    >
      <!-- Único control del menú: pliega y despliega el sidebar (S2). -->
      <button
        :key="isOpen ? 'close' : 'open'"
        type="button"
        class="topbar-control flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:w-10"
        :aria-expanded="isOpen"
        aria-controls="app-sidebar"
        :aria-label="isOpen ? 'Cerrar menú' : 'Abrir menú'"
        @click="toggle"
      >
        <XMarkIcon v-if="isOpen" class="h-5 w-5" />
        <Bars3Icon v-else class="h-5 w-5" />
      </button>

      <router-link
        to="/"
        class="group flex h-10 shrink-0 items-center gap-2 rounded-xl px-1.5 transition-colors duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Vumies — Inicio"
      >
        <span
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-foreground transition-colors duration-200 group-hover:bg-primary-strong group-hover:text-primary-strong-foreground"
          aria-hidden="true"
        >
          V
        </span>
        <span class="hidden text-[15px] font-semibold tracking-tight sm:inline">Vumies</span>
      </router-link>

      <span class="flex-1" aria-hidden="true" />

      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/30 text-sm text-muted-foreground transition-colors duration-200 hover:border-border hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:w-64 md:justify-start md:px-3"
        aria-label="Buscar en el catálogo"
        @click="open"
      >
        <MagnifyingGlassIcon class="h-4 w-4 shrink-0" />
        <span class="hidden flex-1 truncate text-left md:inline">Buscar películas, series...</span>
        <kbd
          class="hidden select-none rounded border border-border bg-background/60 px-1.5 py-0.5 font-mono text-[10px] font-medium md:inline-flex"
        >{{ shortcutLabel }}</kbd>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Bars3Icon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useSidebar } from '../composables/useSidebar'
import { useCommandPalette } from '../composables/useCommandPalette'

const route = useRoute()
const { isOpen, toggle } = useSidebar()
const { open } = useCommandPalette()

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
