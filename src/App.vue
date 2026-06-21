<template>
  <div id="app" class="min-h-screen bg-background">
    <!-- Desktop Side Menu -->
    <SideMenu />

    <!-- Main Content Wrapper -->
    <div class="md:ml-20 lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
      <AppNavbar />
      
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
import AppNavbar from '@/modules/ui/components/AppNavbar.vue'
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
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
