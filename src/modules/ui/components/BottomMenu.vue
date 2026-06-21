<template>
  <!-- Bottom Navigation Bar -->
  <nav class="bottom-nav md:hidden" v-show="!isPlayerRoute">
    <div class="bottom-nav-inner">
      <router-link
        to="/"
        class="nav-item"
        :class="{ active: isActive('/') }"
      >
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="nav-label">Inicio</span>
      </router-link>

      <router-link
        to="/movies"
        class="nav-item"
        :class="{ active: isActive('/movies') }"
      >
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
        <span class="nav-label">Películas</span>
      </router-link>

      <router-link
        to="/series"
        class="nav-item"
        :class="{ active: isActive('/series') }"
      >
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span class="nav-label">Series</span>
      </router-link>

      <router-link
        v-if="FEATURES.anime"
        to="/animes"
        class="nav-item"
        :class="{ active: isActive('/animes') }"
      >
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
        <span class="nav-label">Anime</span>
      </router-link>

      <button
        class="nav-item"
        :class="{ active: isActive('/search') || isOpen }"
        @click="open"
      >
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span class="nav-label">Buscar</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FEATURES } from '@/core/config/features'
import { useCommandPalette } from '@/modules/ui/composables/useCommandPalette'

const route = useRoute()
const { isOpen, open } = useCommandPalette()

const isPlayerRoute = computed(() => route.name === 'player' || route.path.startsWith('/player'))

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style scoped>
/* ===== Bottom Navigation (píldora flotante, tokens shadcn violeta) ===== */
.bottom-nav {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: auto;
  max-width: calc(100vw - 2rem);
}

.bottom-nav-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 14px 28px;
  background: oklch(var(--popover) / 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid var(--border);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: oklch(var(--muted-foreground));
  transition: color 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
}

.nav-item:hover,
.nav-item.active {
  color: oklch(var(--primary));
}

.nav-item.active .nav-icon {
  filter: drop-shadow(0 0 6px oklch(var(--primary) / 0.4));
}

.nav-icon {
  width: 26px;
  height: 26px;
  transition: filter 0.2s ease;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
}
</style>
