<template>
  <!-- Solo lo que se reprodujo de verdad. Abrir una ficha no cuenta: el store
       guarda `kind` unicamente cuando hubo play, y sin play no hay rail.
       Tampoco hay porcentaje: el reproductor vive en otro origen y no expone su
       posicion a esta app (ver odd/tasks/continue-watching.md, L2). Retomar abre
       el mismo contenido, y el propio player ofrece su reanudacion. -->
  <section v-if="items.length" aria-labelledby="continue-watching-title">
    <div class="mb-4 flex items-center justify-between">
      <h2 id="continue-watching-title" class="text-2xl md:text-3xl font-bold text-foreground font-poppins">
        Continuar viendo
      </h2>
      <router-link
        to="/history"
        class="inline-flex min-h-[24px] shrink-0 items-center gap-1 rounded-[var(--radius-inner)] px-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
      >
        Ver historial
        <span aria-hidden="true">→</span>
      </router-link>
    </div>

    <div class="rail">
      <router-link
        v-for="item in items"
        :key="`${item.type}-${item.id}`"
        :to="resumeRoute(item)"
        class="group relative flex-none w-[240px] overflow-hidden rounded-[var(--radius-container)] bg-card text-left ring-1 ring-border transition-shadow duration-200 hover:shadow-lg hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background md:w-[280px]"
      >
        <span class="relative block aspect-[16/9] w-full overflow-hidden bg-muted">
          <img
            v-if="item.poster_path"
            :src="getPosterUrl(item.poster_path, 'w342')"
            :alt="item.title"
            class="absolute inset-0 h-full w-full object-cover object-[50%_18%] transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
            loading="lazy"
            decoding="async"
          />
          <span aria-hidden="true" class="absolute inset-0 scrim-b" />
          <span aria-hidden="true" class="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/15" />
          <span
            class="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm transition-[transform,background-color] duration-200 group-hover:scale-105 group-hover:bg-background/90 motion-reduce:group-hover:scale-100">
              <svg class="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </span>
          </span>
        </span>

        <span class="flex flex-col gap-1 p-3">
          <span class="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {{ item.title }}
          </span>
          <span class="text-xs text-muted-foreground">
            {{ describe(item) }}
          </span>
        </span>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { getPosterUrl } from '@/core/config/api.config'
import { useUserStore } from '@/modules/user'

interface ResumeItem {
  id: number
  type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  kind?: 'movie' | 'series' | 'anime'
  season?: number
  episode?: number
  slug?: string
  watchedAt: number
}

const userStore = useUserStore()

const items = computed<ResumeItem[]>(() =>
  (userStore.watchHistory as ResumeItem[])
    .filter((item) => item.kind)
    .slice(0, 12)
)

function resumeRoute(item: ResumeItem): RouteLocationRaw {
  if (item.kind === 'anime' && item.slug) {
    return { name: 'anime-av1-watch', params: { slug: item.slug, episode: item.episode ?? 1 } }
  }
  if (item.kind === 'series') {
    return {
      name: 'player',
      params: {
        type: 'tv',
        id: item.id,
        season: item.season ?? 1,
        episode: item.episode ?? 1,
      },
    }
  }
  return { name: 'player', params: { type: 'movie', id: item.id } }
}

/** Lo que se puede afirmar sin inventar: tipo y, si es serie, el episodio. */
function describe(item: ResumeItem): string {
  if (item.kind === 'series' || item.kind === 'anime') {
    const season = item.season ?? 1
    const episode = item.episode ?? 1
    return `Temporada ${season} · Episodio ${episode}`
  }
  return 'Película'
}
</script>
