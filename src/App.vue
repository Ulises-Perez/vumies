<template>
  <div class="relative min-h-screen bg-background">
    <!-- Barra superior flotante: su único control de menú pliega el sidebar. -->
    <AppTopBar />

    <!-- Sidebar flotante: overlay, no reserva espacio en el layout. -->
    <SideMenu />

    <!-- Contenido de la app. -->
    <div class="relative z-10 flex min-h-screen flex-col">
      <main class="flex-1">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <AppFooter />
    </div>

    <!-- Mobile Bottom Menu -->
    <BottomMenu class="md:hidden" />

    <!-- Command Palette (⌘K) — buscador centrado global -->
    <CommandPalette />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/core/stores/app.store'
import { useAnimeStore } from '@/core/stores/anime.store'
import { FEATURES } from '@/core/config/features'
import AppTopBar from '@/modules/ui/components/AppTopBar.vue'
import AppFooter from '@/modules/ui/components/AppFooter.vue'
import BottomMenu from '@/modules/ui/components/BottomMenu.vue'
import SideMenu from '@/modules/ui/components/SideMenu.vue'
import CommandPalette from '@/modules/ui/components/CommandPalette.vue'

const appStore = useAppStore()
const animeStore = useAnimeStore()

// Ejecuta cb cuando el hilo principal esté libre, fuera del camino del primer render.
function whenIdle(cb: () => void) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    ;(window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback(cb, { timeout: 2000 })
  } else {
    setTimeout(cb, 1000)
  }
}

onMounted(() => {
  // Diferido: ni los géneros ni los IDs de anime se usan en el primer render, así que
  // no deben competir con la descarga de datos/imágenes del LCP. Ambas cargas son
  // idempotentes (guard interno) y requestIdleCallback se dispara en cuanto hay hueco
  // (muy antes de que el usuario busque), por lo que isAnime() sigue listo a tiempo.
  whenIdle(() => {
    appStore.fetchGenres()
    // Solo precargar IDs de anime (fetch paginado a Vimeus) si el módulo está activo.
    if (FEATURES.anime) animeStore.fetchAnimeIds()
  })
})
</script>

<style>
/* Transición de ruta: entrada desde un estado ya visible, sin orquestar la página. */
.page-enter-active,
.page-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translate3d(0, 6px, 0);
}

.page-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }

  .page-enter-from {
    transform: none;
  }
}

html.reduce-motion .page-enter-active,
html.reduce-motion .page-leave-active {
  transition: none;
}

html.reduce-motion .page-enter-from {
  transform: none;
}
</style>
