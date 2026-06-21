<template>
  <router-link
    :to="{ name: 'anime-av1-detail', params: { slug: anime.slug } }"
    class="group cursor-pointer relative block"
  >
    <figure class="relative aspect-poster rounded-lg overflow-hidden bg-muted ring-1 ring-border transition-[transform,box-shadow] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-primary/40 will-change-transform">
      <img
        v-if="anime.image"
        :src="anime.image"
        :alt="anime.title"
        class="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
        <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
        </svg>
      </div>

      <!-- Type badge -->
      <BaseBadge v-if="anime.type" variant="outline" class="absolute top-2 left-2 bg-background/70 backdrop-blur-sm border-border/60">
        {{ anime.type }}
      </BaseBadge>

      <!-- Episode badge -->
      <BaseBadge v-if="episode" variant="default" class="absolute bottom-2 left-2">
        Ep {{ episode }}
      </BaseBadge>
    </figure>

    <div class="mt-3 px-0.5">
      <h3 class="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
        {{ anime.title }}
      </h3>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import type { AV1AnimeCard } from '../types/animeav1.types'
import { BaseBadge } from '@/modules/ui/components/base'

interface Props {
  anime: AV1AnimeCard
  episode?: number | string
}

defineProps<Props>()
</script>
