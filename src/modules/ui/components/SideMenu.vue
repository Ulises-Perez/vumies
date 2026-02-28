<template>
  <aside 
    class="fixed top-0 left-0 h-screen w-20 lg:w-64 bg-dark/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col transition-all duration-300 hidden md:flex"
  >
    <!-- Logo -->
    <div class="h-20 flex items-center justify-center lg:justify-start lg:px-8 border-b border-white/5">
      <router-link to="/" class="flex items-center space-x-2 group">
        <div class="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-bold text-xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
          V
        </div>
        <span class="text-xl font-bold text-white font-poppins hidden lg:block">Vumies</span>
      </router-link>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-8 px-2 lg:px-4 space-y-2 overflow-y-auto custom-scrollbar">
      <div v-for="group in menuGroups" :key="group.title" class="mb-6">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4 hidden lg:block">
          {{ group.title }}
        </h3>
        <ul class="space-y-1">
          <li v-for="item in group.items" :key="item.path">
            <router-link 
              :to="item.path"
              class="flex items-center px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 group relative"
              active-class="bg-primary/10 text-primary hover:bg-primary/20"
            >
              <component :is="item.icon" class="w-6 h-6 flex-shrink-0" />
              <span class="ml-3 font-medium hidden lg:block">{{ item.name }}</span>
              
              <!-- Active Indicator -->
              <div 
                v-if="isActive(item.path)" 
                class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md"
              />
              
              <!-- Tooltip for collapsed state -->
              <div class="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 lg:hidden pointer-events-none transition-opacity whitespace-nowrap z-50">
                {{ item.name }}
              </div>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- User Profile (Bottom) -->
    <div class="p-4 border-t border-white/5">
      <button class="w-full flex items-center p-2 rounded-xl hover:bg-white/5 transition-colors group">
        <img 
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
          alt="User" 
          class="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-primary transition-colors"
        >
        <div class="ml-3 text-left hidden lg:block">
          <p class="text-sm font-semibold text-white">Guest User</p>
          <p class="text-xs text-gray-400">Premium Plan</p>
        </div>
        <svg class="w-5 h-5 text-gray-400 ml-auto hidden lg:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { 
  HomeIcon, 
  FilmIcon, 
  TvIcon, 
  HeartIcon, 
  ClockIcon, 
  Cog6ToothIcon,
  SparklesIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()

const menuGroups = [
  {
    title: 'Menu',
    items: [
      { name: 'Inicio', path: '/', icon: HomeIcon },
      { name: 'Películas', path: '/movies', icon: FilmIcon },
      { name: 'Series', path: '/series', icon: TvIcon },
      { name: 'Anime', path: '/animes', icon: SparklesIcon },
    ]
  },
  {
    title: 'Biblioteca',
    items: [
      { name: 'Favoritos', path: '/favorites', icon: HeartIcon },
      { name: 'Recientes', path: '/recent', icon: ClockIcon },
    ]
  },
  {
    title: 'General',
    items: [
      { name: 'Ajustes', path: '/settings', icon: Cog6ToothIcon },
    ]
  }
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}
</style>
