<template>
  <div class="min-h-screen px-4 md:px-12 pt-20 md:pt-24 pb-24">
    <div class="max-w-3xl mx-auto space-y-8">
      <!-- Header -->
      <header>
        <h1 class="text-3xl md:text-4xl font-bold font-poppins text-foreground">Ajustes</h1>
        <p class="text-muted-foreground mt-1">Personaliza la apariencia y gestiona tus datos.</p>
      </header>

      <!-- Apariencia -->
      <section>
        <h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Apariencia</h2>
        <BaseCard class="p-5 md:p-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p class="font-medium text-foreground">Tema</p>
              <p class="text-sm text-muted-foreground">Elige entre claro, oscuro o seguir el sistema.</p>
            </div>
            <div class="inline-flex rounded-lg border border-border bg-muted/40 p-1 self-start sm:self-auto">
              <button
                v-for="opt in themeOptions"
                :key="opt.value"
                type="button"
                @click="settings.setTheme(opt.value)"
                class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :class="settings.theme === opt.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
              >
                <component :is="opt.icon" class="w-4 h-4" />
                <span>{{ opt.label }}</span>
              </button>
            </div>
          </div>
        </BaseCard>
      </section>

      <!-- Accesibilidad -->
      <section>
        <h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Accesibilidad</h2>
        <BaseCard class="p-5 md:p-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="font-medium text-foreground">Reducir movimiento</p>
              <p class="text-sm text-muted-foreground">Minimiza animaciones y transiciones.</p>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="settings.reducedMotion"
              @click="settings.setReducedMotion(!settings.reducedMotion)"
              class="inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              :class="settings.reducedMotion ? 'bg-primary' : 'bg-input'"
            >
              <span
                class="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform"
                :class="settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>
        </BaseCard>
      </section>

      <!-- Biblioteca -->
      <section>
        <h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Biblioteca</h2>
        <BaseCard class="p-5 md:p-6">
          <div class="divide-y divide-border">
            <div class="flex items-center justify-between gap-4 pb-4">
              <div>
                <p class="font-medium text-foreground">Favoritos</p>
                <p class="text-sm text-muted-foreground">{{ favoritesCount }} {{ favoritesCount === 1 ? 'título guardado' : 'títulos guardados' }}</p>
              </div>
              <BaseButton variant="outline" size="sm" :disabled="favoritesCount === 0" @click="clearFavorites">
                Borrar
              </BaseButton>
            </div>
            <div class="flex items-center justify-between gap-4 pt-4">
              <div>
                <p class="font-medium text-foreground">Historial</p>
                <p class="text-sm text-muted-foreground">{{ historyCount }} {{ historyCount === 1 ? 'título visto' : 'títulos vistos' }}</p>
              </div>
              <BaseButton variant="outline" size="sm" :disabled="historyCount === 0" @click="clearHistory">
                Borrar
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </section>

      <!-- Acerca de -->
      <section>
        <h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Acerca de</h2>
        <BaseCard class="p-5 md:p-6">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-bold text-lg">V</div>
              <div>
                <p class="font-medium text-foreground">Vumies</p>
                <p class="text-sm text-muted-foreground">Películas y series online</p>
              </div>
            </div>
            <BaseBadge variant="muted">v{{ version }}</BaseBadge>
          </div>
          <p class="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
            Datos de películas y series proporcionados por TMDB. Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
          </p>
        </BaseCard>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MoonIcon, SunIcon, ComputerDesktopIcon } from '@heroicons/vue/24/outline'
import { useSettingsStore, type Theme } from '@/core/stores/settings.store'
import { useUserStore } from '@/modules/user'

const settings = useSettingsStore()
const userStore = useUserStore()

const version = '2.0.3'

const themeOptions: { value: Theme; label: string; icon: typeof MoonIcon }[] = [
  { value: 'light', label: 'Claro', icon: SunIcon },
  { value: 'dark', label: 'Oscuro', icon: MoonIcon },
  { value: 'system', label: 'Sistema', icon: ComputerDesktopIcon },
]

const favoritesCount = computed(() => userStore.favorites.length)
const historyCount = computed(() => userStore.watchHistory.length)

function clearFavorites() {
  if (favoritesCount.value === 0) return
  if (confirm('¿Borrar todos tus favoritos? Esta acción no se puede deshacer.')) {
    userStore.clearFavorites()
  }
}

function clearHistory() {
  if (historyCount.value === 0) return
  if (confirm('¿Borrar todo tu historial? Esta acción no se puede deshacer.')) {
    userStore.clearHistory()
  }
}
</script>
