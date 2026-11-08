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

      <router-link
        to="/favorites"
        class="nav-item"
        :class="{ active: isActive('/favorites') }"
      >
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        <span class="nav-label">Favoritos</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FEATURES } from '@/core/config/features'

const route = useRoute()

const isPlayerRoute = computed(
  () =>
    route.name === 'player' ||
    route.name === 'episode-player' ||
    route.path.startsWith('/player'),
)

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
  gap: 0.5rem;
  padding: 8px 10px;
  background: oklch(var(--popover) / 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid var(--border);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 oklch(1 0 0 / 5%);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  /* Blanco táctil mínimo de 44px en ambos ejes. */
  min-width: 56px;
  min-height: 48px;
  padding: 4px 6px;
  border-radius: 14px;
  color: oklch(var(--muted-foreground));
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    transform 0.15s ease;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.nav-item:hover {
  color: oklch(var(--foreground));
}

.nav-item:active {
  transform: scale(0.96);
}

.nav-item:focus-visible {
  outline: 2px solid oklch(var(--ring));
  outline-offset: 2px;
}

.nav-item.active {
  color: oklch(var(--primary));
  background: oklch(var(--primary) / 0.1);
}

.nav-item.active .nav-icon {
  filter: drop-shadow(0 0 6px oklch(var(--primary) / 0.4));
}

.nav-icon {
  width: 24px;
  height: 24px;
  transition: filter 0.2s ease;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

@media (prefers-reduced-motion: reduce) {
  .nav-item {
    transition: none;
  }

  .nav-item:active {
    transform: none;
  }
}

:global(html.reduce-motion) .nav-item {
  transition: none;
}
</style>
