<template>
  <div id="app" class="min-h-screen bg-dark">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/core/stores/app.store'
import { useAnimeStore } from '@/core/stores/anime.store'
import AppNavbar from '@/modules/ui/components/AppNavbar.vue'
import AppFooter from '@/modules/ui/components/AppFooter.vue'
import BottomMenu from '@/modules/ui/components/BottomMenu.vue'
import SideMenu from '@/modules/ui/components/SideMenu.vue'

const appStore = useAppStore()
const animeStore = useAnimeStore()

onMounted(() => {
  // Load genres on app mount
  appStore.fetchGenres()
  // Pre-fetch anime TMDB IDs from Vimeus
  animeStore.fetchAnimeIds()
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
