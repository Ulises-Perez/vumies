<template>
  <aside
    class="fixed top-0 left-0 h-screen w-20 bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border z-50 flex-col items-center hidden md:flex"
  >
    <!-- Logo -->
    <router-link
      to="/"
      class="flex items-center justify-center w-12 h-12 mt-5 mb-2 bg-primary/15 rounded-xl text-primary font-bold text-xl hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
      aria-label="Vumies — Inicio"
    >
      V
    </router-link>

    <!-- Navigation (rail de iconos) -->
    <nav class="flex-1 w-full flex flex-col items-center gap-5 py-6">
      <router-link
        v-for="item in items"
        :key="item.path"
        :to="item.path"
        class="group relative flex flex-col items-center gap-1.5 focus-visible:outline-none"
        :aria-label="item.name"
      >
        <!-- Icono (cuadro violeta cuando está activo) -->
        <span
          class="flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 group-focus-visible:ring-2 group-focus-visible:ring-sidebar-ring"
          :class="isActive(item.path)
            ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10'
            : 'text-muted-foreground group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground'"
        >
          <component :is="item.icon" class="w-6 h-6" />
        </span>

        <!-- Label: solo en el ítem activo (como en el diseño) -->
        <span
          v-if="isActive(item.path)"
          class="text-[11px] font-semibold text-primary leading-none"
        >
          {{ item.name }}
        </span>

        <!-- Tooltip al pasar el cursor (ítems inactivos) -->
        <span
          v-else
          class="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 rounded-md bg-popover text-popover-foreground border border-border text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-50"
        >
          {{ item.name }}
        </span>
      </router-link>
    </nav>
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
  SparklesIcon,
} from '@heroicons/vue/24/outline'
import { FEATURES } from '@/core/config/features'

const route = useRoute()

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
</script>
