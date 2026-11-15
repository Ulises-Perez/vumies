<template>
  <!-- Solo lo que se reprodujo de verdad. Abrir una ficha no cuenta: el store
       guarda `kind` unicamente cuando hubo play, y sin play no hay rail.
       Tampoco hay porcentaje: el reproductor vive en otro origen y no expone su
       posicion a esta app (ver odd/tasks/continue-watching.md, L2). Retomar abre
       el mismo contenido, y el propio player ofrece su reanudacion.

       Un solo carril, como el resto del inicio: el arte 16:9 es la tarjeta, y el
       titulo y el tipo van debajo. La cabecera, las flechas y el enlace son los
       de HorizontalScroll, para que esta fila se lea igual que las demas. -->
  <section v-if="items.length">
    <HorizontalScroll title="Continuar viendo" link="/recent">
      <router-link
        v-for="item in items"
        :key="`${item.type}-${item.id}`"
        :to="resumeRoute(item)"
        class="group w-[160px] flex-none focus-visible:outline-none md:w-[220px]"
      >
        <span
          class="relative block aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-container)] bg-muted ring-1 ring-border transition-[box-shadow] duration-200 group-hover:shadow-lg group-hover:ring-primary/50 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-primary"
        >
          <!-- Backdrop 16:9 si existe: el marco es 16:9 y recortar un poster 2:3
               corta cabezas, elija el anclaje que elija. El poster queda como
               respaldo, anclado arriba, que es donde esta la cara. -->
          <img
            v-if="item.backdrop_path || item.poster_path"
            :src="frameUrl(item)"
            :alt="item.title"
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
            :class="item.backdrop_path ? '' : 'object-top'"
            loading="lazy"
            decoding="async"
          />
        </span>
        <span
          class="mt-2 block truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary md:text-base"
        >
          {{ item.title }}
        </span>
        <span class="block truncate text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground">
          {{ describe(item) }}
        </span>
      </router-link>
    </HorizontalScroll>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { getBackdropUrl, getPosterUrl } from '@/core/config/api.config'
import HorizontalScroll from '@/modules/ui/components/HorizontalScroll.vue'
import { useUserStore } from '@/modules/user'

/** 16:9 backdrop at the card's real width, poster only when there is no backdrop.
 *  shortcut: un solo ancho (w300); en pantallas 2x/3x se ve blando. Si molesta,
 *  pasar a un srcset w300/w780 con `sizes` fijo, para que el navegador no
 *  re-seleccione candidato a mitad del hover (L16). */
function frameUrl(item: ResumeItem): string {
  return item.backdrop_path ? getBackdropUrl(item.backdrop_path, 'w300') : getPosterUrl(item.poster_path, 'w342')
}

interface ResumeItem {
  id: number
  type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  /** 16:9 art when the ficha had one; the card frame is 16:9. */
  backdrop_path?: string | null
  kind?: 'movie' | 'series' | 'anime'
  season?: number
  episode?: number
  slug?: string
  watchedAt: number
}

const userStore = useUserStore()

const items = computed<ResumeItem[]>(() =>
  (userStore.watchHistory as ResumeItem[]).filter((item) => item.kind).slice(0, 12)
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
