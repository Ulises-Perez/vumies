<template>
  <div class="movie-card group cursor-pointer relative" @click="handleClick">
    <router-link :to="seriesLink">

      <!-- Main Content Container -->
      <figure class="relative aspect-poster rounded-xl overflow-hidden bg-gray-900 shadow-xl transition-all duration-300 group-hover:-translate-y-1 ring-1 ring-white/10 group-hover:ring-primary/50">
        <!-- Image -->
        <img
          v-if="series.poster_path"
          :src="posterUrl"
          :alt="series.name"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-gray-700 bg-gray-800"
        >
          <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clip-rule="evenodd"
            />
          </svg>
        </div>

        <!-- Gradient Overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>

        <!-- Play Button Overlay -->
        <div
          class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]"
        >
          <button class="play-btn-animate bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-4 text-white transition-all transform scale-75 group-hover:scale-100 hover:scale-110 border border-white/30">
            <svg class="w-8 h-8 fill-current" viewBox="0 0 20 20">
              <path
                d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"
              />
            </svg>
          </button>
        </div>

        <!-- Rating Badge -->
        <div
          v-if="showRating && series.vote_average > 0"
          class="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded-lg px-2 py-1 flex items-center space-x-1 border border-white/10"
        >
          <svg class="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          <span class="text-xs font-bold text-white">
            {{ series.vote_average.toFixed(1) }}
          </span>
        </div>

        <!-- Favorite Button -->
        <button
          v-if="showFavorite"
          @click.prevent="toggleFavorite"
          class="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-full p-2 text-white hover:bg-white/20 transition-all border border-white/10 hover:border-white/30 transform hover:scale-110"
        >
          <svg
            class="w-4 h-4 transition-colors"
            :class="[isFavorite ? 'text-red-500 fill-current' : 'text-gray-200']"
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
        </button>
      </figure>

      <!-- Title & Year -->
      <div class="mt-3 px-1 relative z-10">
        <h3 class="text-sm font-semibold text-gray-100 truncate group-hover:text-primary transition-colors duration-300">
          {{ series.name }}
        </h3>
        <div class="flex items-center justify-between mt-1">
          <span v-if="releaseYear" class="text-xs text-gray-400 font-medium">{{ releaseYear }}</span>
          <span class="text-xs text-gray-500 border border-gray-700 rounded px-1.5 py-0.5">Series</span>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TVShow } from '../types/tmdb.types'
import { getPosterUrl } from '@/core/config/api.config'
import { useUserStore } from '@/modules/user'

interface Props {
  series: TVShow
  showRating?: boolean
  showFavorite?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRating: true,
  showFavorite: true,
})

const userStore = useUserStore()

const posterUrl = computed(() => getPosterUrl(props.series.poster_path, 'w342'))

const releaseYear = computed(() => {
  if (!props.series.first_air_date) return null
  return new Date(props.series.first_air_date).getFullYear()
})

const seriesLink = computed(() => ({
  name: 'serie-detail',
  params: { id: props.series.id },
}))

const isFavorite = computed(() => userStore.isFavorite(props.series.id, 'tv'))

function handleClick() {
  userStore.addToHistory({
    id: props.series.id,
    type: 'tv',
    title: props.series.name,
    poster_path: props.series.poster_path,
  })
}

function toggleFavorite() {
  userStore.toggleFavorite({
    id: props.series.id,
    type: 'tv',
    title: props.series.name,
    poster_path: props.series.poster_path,
  })
}
</script>

