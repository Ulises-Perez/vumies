<template>
  <article class="group motion-card motion-lift relative isolate">
    <div
      v-if="lead && art"
      aria-hidden="true"
      class="ambilight is-static is-full"
      :style="{ backgroundImage: `url(${art})` }"
    />
    <router-link
      :to="to"
      data-media-link
      class="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <figure
        class="relative overflow-hidden rounded-xl bg-muted ring-1 ring-border transition-shadow duration-200 group-hover:shadow-lg group-hover:ring-primary/40"
        :class="lead ? 'aspect-[3/2] md:aspect-[21/9]' : 'aspect-[16/9]'"
      >
        <LazyImage
          v-if="art"
          :src="art"
          :srcset="artSrcSet"
          :sizes="sizes"
          :alt="title"
          class="motion-media h-full w-full object-cover"
          :class="hasBackdrop ? '' : 'object-top'"
        />
        <div v-else class="flex h-full w-full items-center justify-center text-muted-foreground">
          <svg class="h-10 w-10" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clip-rule="evenodd"
            />
          </svg>
        </div>

        <!-- Scrim: el titulo va sobre el arte, asi que necesita fondo propio. -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"
          aria-hidden="true"
        />

        <div class="absolute inset-x-0 bottom-0" :class="lead ? 'p-5 md:p-8' : 'p-4'">
          <h2
            class="text-art font-semibold leading-tight"
            :class="lead ? 'text-2xl md:text-4xl' : 'line-clamp-2 text-base'"
          >
            {{ title }}
          </h2>
          <p class="text-art-muted mt-1" :class="lead ? 'text-sm' : 'text-xs'">{{ meta }}</p>
        </div>
      </figure>
    </router-link>

    <BaseButton
      v-if="removeLabel"
      variant="ghost"
      size="icon"
      class="absolute right-2 top-2 border border-border/70 bg-background/95"
      :aria-label="removeLabel"
      :title="removeLabel"
      @click="$emit('remove')"
    >
      <svg
        v-if="removeIcon === 'heart'"
        class="h-4 w-4 fill-current text-destructive"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </BaseButton>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import {
  getBackdropSrcSet,
  getBackdropUrl,
  getPosterSrcSet,
  getPosterUrl,
} from '@/core/config/api.config'
import { BaseButton } from '@/modules/ui/components/base'
import LazyImage from '@/modules/ui/components/LazyImage.vue'

const props = defineProps<{
  to: RouteLocationRaw
  title: string
  meta: string
  backdrop?: string | null
  poster?: string | null
  /** Tarjeta grande: la mas reciente de la vista. */
  lead?: boolean
  removeLabel?: string
  removeIcon?: 'heart' | 'x'
}>()

defineEmits<{ remove: [] }>()

const hasBackdrop = computed(() => Boolean(props.backdrop))

const art = computed(() => {
  if (props.backdrop) return getBackdropUrl(props.backdrop, props.lead ? 'w1280' : 'w780')
  if (props.poster) return getPosterUrl(props.poster, 'w342')
  return ''
})

const artSrcSet = computed(() => {
  if (props.backdrop) return getBackdropSrcSet(props.backdrop)
  if (props.poster) return getPosterSrcSet(props.poster)
  return undefined
})

const sizes = computed(() =>
  props.lead
    ? '100vw'
    : '(min-width: 1280px) 324px, (min-width: 1024px) 298px, (min-width: 640px) 300px, 100vw'
)
</script>
