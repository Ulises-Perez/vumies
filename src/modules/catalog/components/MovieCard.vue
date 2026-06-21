<template>
  <div class="group cursor-pointer relative" @click="handleClick">
    <router-link
      :to="movieLink"
      class="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >

      <!-- Poster -->
      <figure class="relative aspect-poster rounded-lg overflow-hidden bg-muted ring-1 ring-border transition-[transform,box-shadow,outline-color] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-primary/40">

        <!-- Image (carga solo al entrar en viewport) -->
        <LazyImage
          v-if="movie.poster_path"
          :src="posterUrl"
          :alt="movie.title"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-muted-foreground bg-muted"
        >
          <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clip-rule="evenodd"
            />
          </svg>
        </div>

        <!-- Rating Badge (Floating) -->
        <BaseBadge
          v-if="showRating && movie.vote_average > 0"
          variant="outline"
          class="absolute top-2 left-2 bg-background/70 backdrop-blur-sm border-border/60"
        >
          <svg class="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          {{ movie.vote_average.toFixed(1) }}
        </BaseBadge>

        <!-- Favorite Button -->
        <BaseButton
          v-if="showFavorite"
          variant="ghost"
          size="icon"
          class="absolute top-2 right-2 h-8 w-8 bg-background/60 backdrop-blur-sm border border-border/60"
          @click.prevent="toggleFavorite"
        >
          <svg
            class="w-4 h-4 transition-colors"
            :class="[isFavorite ? 'text-red-500 fill-current' : 'text-muted-foreground']"
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
        </BaseButton>
      </figure>

      <!-- Title & Info -->
      <div class="mt-3 px-0.5">
        <h3 class="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {{ movie.title }}
        </h3>
        <div class="flex items-center justify-between mt-1">
          <span v-if="releaseYear" class="text-xs text-muted-foreground">{{ releaseYear }}</span>
          <BaseBadge variant="muted" class="font-medium">Movie</BaseBadge>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Movie } from '../types/tmdb.types'
import { getPosterUrl } from '@/core/config/api.config'
import { useUserStore } from '@/modules/user'
import LazyImage from '@/modules/ui/components/LazyImage.vue'
import { BaseBadge, BaseButton } from '@/modules/ui/components/base'

interface Props {
  movie: Movie
  showRating?: boolean
  showFavorite?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRating: true,
  showFavorite: true,
})

const userStore = useUserStore()

const posterUrl = computed(() => getPosterUrl(props.movie.poster_path, 'w342'))

const releaseYear = computed(() => {
  if (!props.movie.release_date) return null
  return new Date(props.movie.release_date).getFullYear()
})

const movieLink = computed(() => ({
  name: 'movie-detail',
  params: { id: props.movie.id },
}))

const isFavorite = computed(() => userStore.isFavorite(props.movie.id, 'movie'))

function handleClick() {
  // Track in history when clicked
  userStore.addToHistory({
    id: props.movie.id,
    type: 'movie',
    title: props.movie.title,
    poster_path: props.movie.poster_path,
  })
}

function toggleFavorite() {
  userStore.toggleFavorite({
    id: props.movie.id,
    type: 'movie',
    title: props.movie.title,
    poster_path: props.movie.poster_path,
  })
}
</script>

