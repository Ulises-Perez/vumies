<template>
  <div class="min-h-screen pt-8">
    <div class="container-custom py-8">
      <h1 class="text-4xl font-bold text-white font-poppins mb-8">Mis Favoritos</h1>

      <div v-if="!hasFavorites" class="text-center py-16">
        <svg
          class="w-24 h-24 mx-auto text-gray-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <p class="text-gray-400 text-lg">No tienes favoritos guardados</p>
        <router-link
          to="/"
          class="mt-4 inline-block bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-semibold"
        >
          Explorar Contenido
        </router-link>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <!-- Render favorites (simplified for now) -->
        <div
          v-for="item in favorites"
          :key="`${item.id}-${item.type}`"
          class="relative group"
        >
          <router-link
            :to="{ name: item.type === 'movie' ? 'movie-detail' : 'serie-detail', params: { id: item.id } }"
          >
            <div class="aspect-poster rounded-xl overflow-hidden bg-gray-800">
              <img
                v-if="item.poster_path"
                :src="getPosterUrl(item.poster_path)"
                :alt="item.title"
                class="w-full h-full object-cover"
              />
            </div>
            <h3 class="text-sm text-white mt-2 truncate">{{ item.title }}</h3>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '../stores/user.store'
import { getPosterUrl } from '@/core/config/api.config'

const userStore = useUserStore()
const favorites = computed(() => userStore.favorites)
const hasFavorites = computed(() => userStore.hasFavorites)
</script>

