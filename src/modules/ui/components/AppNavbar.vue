<template>
  <header
    class="fixed top-0 right-0 left-0 md:left-20 z-40 transition-all duration-300 hidden md:block"
    :class="[scrolled ? 'bg-background/80 backdrop-blur-md border-b border-border py-2' : 'bg-transparent py-4']"
  >
    <div class="px-4 md:px-12 h-16 grid grid-cols-3 items-center gap-4">

      <!-- Spacer izquierdo (mantiene la búsqueda centrada) -->
      <div aria-hidden="true"></div>

      <!-- Desktop Search Trigger, centrado (abre el command palette ⌘K) -->
      <div class="justify-self-center w-full max-w-md">
        <button
          type="button"
          @click="open"
          class="group flex w-full items-center gap-2 h-9 px-3 rounded-md border border-input bg-card/40 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span class="flex-1 text-left">Buscar películas, series...</span>
          <kbd class="pointer-events-none hidden lg:inline-flex h-5 select-none items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            {{ shortcutLabel }}
          </kbd>
        </button>
      </div>

      <!-- Right Actions -->
      <div class="flex items-center gap-2 justify-self-end">

        <!-- Notifications -->
        <BaseButton variant="ghost" size="icon" class="relative text-muted-foreground">
          <span class="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background"></span>
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </BaseButton>

        <!-- Profile (Placeholder) -->
        <button class="ml-1 rounded-full ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow">
           <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            alt="User"
            class="w-9 h-9 rounded-full border border-border bg-muted hover:border-primary transition-colors"
          >
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { BaseButton } from '@/modules/ui/components/base'
import { useCommandPalette } from '@/modules/ui/composables/useCommandPalette'

const { open } = useCommandPalette()

const scrolled = ref(false)

const isMac = computed(() =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent),
)
const shortcutLabel = computed(() => (isMac.value ? '⌘K' : 'Ctrl K'))

function handleScroll() {
  scrolled.value = window.scrollY > 10
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
