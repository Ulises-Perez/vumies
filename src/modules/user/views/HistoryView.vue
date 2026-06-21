<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- Featured History (Hero) -->
    <section class="relative h-[60vh] w-full overflow-hidden">
      <div
        v-if="heroItem"
        class="absolute inset-0 bg-cover bg-center transition-all duration-700"
        :style="{ backgroundImage: `url(${heroBackdrop})` }"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/40 to-transparent" />
      </div>

      <div v-else class="absolute inset-0 bg-card flex items-center justify-center">
         <div class="text-center">
             <h2 class="text-3xl text-muted-foreground font-bold mb-4">No has visto nada aún</h2>
             <BaseButton to="/" variant="link">Explorar contenido</BaseButton>
         </div>
      </div>

      <div v-if="heroItem" class="absolute inset-0 flex items-center">
        <div class="px-4 md:px-12">
          <div class="max-w-3xl space-y-6">
            <BaseBadge variant="secondary" class="mb-2">
              Visto Recientemente
            </BaseBadge>
            <h1 class="text-4xl md:text-6xl font-bold font-poppins text-foreground leading-tight text-shadow-lg">
              {{ heroItem.title }}
            </h1>

            <div class="flex items-center space-x-4 pt-4">
              <BaseButton
                :to="{ name: heroItem.type === 'movie' ? 'movie-detail' : 'serie-detail', params: { id: heroItem.id } }"
                size="lg"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
                <span>Ver de Nuevo</span>
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- History List -->
    <main v-if="hasHistory" class="relative z-10 -mt-10 px-4 md:px-12">
      <div class="container-custom">
         <div class="flex items-center justify-between mb-8">
           <h2 class="text-2xl md:text-3xl font-bold text-foreground font-poppins">Historial</h2>
           <div class="flex items-center space-x-4">
              <span class="text-muted-foreground">{{ history.length }} títulos</span>
              <button @click="clearHistory" class="text-destructive hover:text-destructive/80 text-sm font-semibold transition-colors">Borrar Todo</button>
           </div>
         </div>
         
         <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            <div
              v-for="item in history"
              :key="`${item.id}-${item.type}`"
              class="relative group cursor-pointer"
            >
              <router-link
                :to="{ name: item.type === 'movie' ? 'movie-detail' : 'serie-detail', params: { id: item.id } }"
                class="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div class="aspect-poster rounded-lg overflow-hidden bg-muted ring-1 ring-border mb-3 transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-primary/40">
                  <img
                    v-if="item.poster_path"
                    :src="getPosterUrl(item.poster_path)"
                    :alt="item.title"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 class="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{{ item.title }}</h3>
                <p class="text-xs text-muted-foreground capitalize">{{ item.type === 'movie' ? 'Película' : 'Serie' }}</p>
                 <p class="text-xs text-muted-foreground mt-1">Visto {{ new Date(item.watchedAt).toLocaleDateString() }}</p>
              </router-link>

              <button
                 @click.prevent="removeItem(item.id, item.type)"
                 class="absolute top-2 right-2 bg-background/60 text-foreground hover:bg-destructive hover:text-destructive-foreground rounded-full p-1.5 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                 title="Eliminar del historial"
              >
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
         </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '../stores/user.store'
import { getPosterUrl } from '@/core/config/api.config'
import { BaseBadge, BaseButton } from '@/modules/ui/components/base'

const userStore = useUserStore()
const history = computed(() => userStore.watchHistory)
const hasHistory = computed(() => userStore.hasHistory)

const heroItem = computed(() => history.value.length > 0 ? history.value[0] : null)

// Using poster_path for backdrop since we don't store backdrop_path
const heroBackdrop = computed(() => 
  heroItem.value && heroItem.value.poster_path ? getPosterUrl(heroItem.value.poster_path, 'original') : ''
)

function removeItem(id: number, type: 'movie' | 'tv') {
  userStore.removeFromHistory(id, type)
}

function clearHistory() {
  if (confirm('¿Estás seguro de que quieres borrar todo tu historial?')) {
    userStore.clearHistory()
  }
}
</script>
