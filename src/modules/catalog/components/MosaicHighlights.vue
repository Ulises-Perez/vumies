<template>
  <!-- Mosaico de destacados: lead + hasta dos piezas altas + una lista ancha.
       Las filas crecen con el contenido (auto-rows auto) para que en 2 columnas
       de movil nada se solape: cada pieza declara su propio aspect.
       Mientras carga, el mismo grid dibuja su estado de carga (cero CLS); si la
       carga termino y no hay nada, no dibuja nada: las rails de la vista siguen
       siendo la pagina, un esqueleto eterno seria una mentira. -->
  <section
    v-if="loading || lead"
    aria-label="Destacados"
    :aria-busy="loading && !lead"
    class="grid grid-cols-2 gap-[var(--grid-gap)] md:grid-cols-6 auto-rows-[minmax(0,auto)]"
  >
    <template v-if="!lead">
      <div
        class="skeleton col-span-2 md:col-span-4 md:row-span-2 aspect-[4/5] sm:aspect-[16/10] md:aspect-auto md:min-h-[var(--mosaic-lead-min)] rounded-[var(--radius-container)]"
      />
      <div
        class="skeleton col-span-1 md:row-span-2 aspect-[2/3] md:aspect-auto md:h-full rounded-[var(--radius-container)]"
      />
      <div
        class="skeleton col-span-1 md:row-span-2 aspect-[2/3] md:aspect-auto md:h-full rounded-[var(--radius-container)]"
      />
    </template>

    <template v-else>
      <!-- Lead: la pieza editorial principal. Es el LCP en todas las vistas que lo usan.
           Sin badge: el kicker ya dice de que coleccion viene; dos etiquetas para el
           mismo dato en la misma pieza es ruido, no informacion. -->
      <article
        class="relative overflow-hidden rounded-[var(--radius-container)] ring-1 ring-border col-span-2 md:col-span-4 md:row-span-2 aspect-[4/5] sm:aspect-[16/10] md:aspect-auto md:min-h-[var(--mosaic-lead-min)]"
      >
        <img
          v-if="lead.artwork"
          :src="lead.artwork"
          :alt="lead.title"
          class="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
        <div v-else class="absolute inset-0 bg-muted" />
        <div class="absolute inset-0 scrim-b" />
        <div class="absolute inset-0 scrim-r" />
        <div class="absolute inset-x-0 bottom-0 max-w-[560px] p-5 md:p-7">
          <!-- Kicker: la etiqueta pequena que abre la pieza. La regla de 18px
               es del artboard; el texto es real (tendencia, mejor valorada). -->
          <p
            v-if="leadKicker"
            class="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary"
          >
            <span aria-hidden="true" class="h-px w-[18px] bg-current" />
            {{ leadKicker }}
          </p>
          <component
            :is="leadTag"
            class="text-3xl md:text-5xl font-bold font-poppins text-foreground leading-tight text-shadow-lg"
          >
            {{ lead.title }}
          </component>
          <p v-if="lead.meta || lead.year" class="mt-2 text-sm md:text-base text-muted-foreground">
            <span v-if="lead.meta" class="text-primary font-semibold">{{ lead.meta }}</span>
            <span v-if="lead.meta && lead.year"> · </span>
            <span v-if="lead.year">{{ lead.year }}</span>
          </p>
          <p
            v-if="lead.overview"
            class="mt-2 max-w-2xl text-sm md:text-base text-muted-foreground line-clamp-3"
          >
            {{ lead.overview }}
          </p>
          <div class="mt-4">
            <BaseButton :to="lead.to" size="lg">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
              </svg>
              <span>Ver ahora</span>
            </BaseButton>
          </div>
        </div>
      </article>

      <!-- Piezas altas: una columna de ancho, dos filas de alto en desktop. -->
      <router-link
        v-for="tile in tallTiles"
        :key="tile.id"
        :to="tile.to"
        class="relative block overflow-hidden rounded-[var(--radius-container)] ring-1 ring-border col-span-1 md:row-span-2 aspect-[2/3] md:aspect-auto md:h-full transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:ring-primary/50 hover:shadow-lg motion-reduce:hover:translate-y-0"
      >
        <img
          v-if="tile.artwork"
          :src="tile.artwork"
          :alt="tile.title"
          class="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="absolute inset-0 bg-muted" />
        <div class="absolute inset-0 scrim-b" />
        <span
          v-if="tile.badge"
          class="absolute left-3 top-3 rounded-[var(--radius-inner)] bg-primary-strong px-1.5 py-0.5 text-[10px] font-semibold text-primary-strong-foreground"
        >
          {{ tile.badge }}
        </span>
        <div class="absolute inset-x-0 bottom-0 p-3">
          <p class="text-sm font-semibold text-foreground line-clamp-2">{{ tile.title }}</p>
          <p v-if="tile.year" class="mt-1 text-xs text-muted-foreground">{{ tile.year }}</p>
        </div>
      </router-link>

      <!-- Lista ancha: pieza de apoyo a todo el ancho de la grilla. -->
      <div
        v-if="wide.length"
        class="col-span-2 rounded-[var(--radius-container)] bg-card p-5 ring-1 ring-border md:col-span-6"
      >
        <div class="flex items-baseline justify-between gap-3">
          <h2 class="text-lg font-bold text-foreground font-poppins">{{ wideTitle }}</h2>
          <router-link
            v-if="wideTo"
            :to="wideTo"
            class="shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver todo
          </router-link>
        </div>
        <ul class="mt-3 space-y-2">
          <li v-for="item in wide" :key="item.id">
            <router-link
              :to="item.to"
              class="flex min-h-[32px] items-center justify-between gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span class="truncate font-medium">{{ item.title }}</span>
              <span class="flex shrink-0 items-center gap-2 text-xs">
                <span v-if="item.meta" class="text-primary font-semibold">{{ item.meta }}</span>
                <span v-if="item.year">{{ item.year }}</span>
              </span>
            </router-link>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { BaseButton } from '@/modules/ui/components/base'
import type { MosaicTile } from '../types/mosaic.types'

const props = withDefaults(
  defineProps<{
    /** null mientras carga: el componente dibuja su propio esqueleto en el mismo grid. */
    lead: MosaicTile | null
    /** true hasta que la vista sabe si hay datos: distingue "cargando" de "no hay nada". */
    loading?: boolean
    /** Etiqueta sobre el titulo del lead, ej. 'Tendencia de hoy'. */
    leadKicker?: string
    talls?: MosaicTile[]
    wideTitle: string
    wide: MosaicTile[]
    wideTo?: RouteLocationRaw
    leadTag?: 'h1' | 'h2'
  }>(),
  {
    loading: false,
    leadKicker: undefined,
    talls: () => [],
    wideTo: undefined,
    leadTag: 'h2',
  }
)

const tallTiles = computed(() => props.talls.slice(0, 2))
</script>
