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
      <!-- La pieza principal lleva su ambilight SIEMPRE, sin hover: es el hero
           de la vista. El arte se reusa del mismo <img> (cero requests nuevas) y
           la capa vive fuera del articulo, que recorta con overflow-hidden. -->
      <div
        class="relative isolate col-span-2 md:col-span-4 md:row-span-2 aspect-[4/5] sm:aspect-[16/10] md:aspect-auto md:min-h-[var(--mosaic-lead-min)]"
      >
        <div
          aria-hidden="true"
          class="ambilight is-static"
          :style="lead.artwork ? { backgroundImage: `url(${lead.artwork})` } : undefined"
        />
        <article
          class="relative h-full w-full overflow-hidden rounded-[var(--radius-container)] ring-1 ring-border"
        >
        <img
          v-if="lead.artwork"
          :src="lead.artwork"
          :srcset="lead.artworkSrcSet"
          sizes="(min-width: 768px) 66vw, 100vw"
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
          <component
            :is="leadTag"
            class="text-3xl md:text-5xl font-bold font-poppins text-art leading-tight text-shadow-lg"
          >
            {{ lead.title }}
          </component>
          <p v-if="lead.meta || lead.year" class="mt-2 text-sm md:text-base text-art-muted">
            <span v-if="lead.meta" class="text-art-accent font-semibold">{{ lead.meta }}</span>
            <span v-if="lead.meta && lead.year"> · </span>
            <span v-if="lead.year">{{ lead.year }}</span>
          </p>
          <p
            v-if="lead.overview"
            class="mt-2 max-w-2xl text-sm md:text-base text-art-muted line-clamp-3"
          >
            {{ lead.overview }}
          </p>
          <div class="mt-4 flex flex-wrap items-center gap-3">
            <BaseButton :to="lead.to" size="lg">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
              </svg>
              <span>Ver ahora</span>
            </BaseButton>
            <!-- Acciones que la vista quiera sumar a la pieza principal (favoritos, etc.). -->
            <slot name="lead-actions" />
          </div>
        </div>
        </article>
      </div>

      <!-- Piezas altas: una columna de ancho, dos filas de alto en desktop. -->
      <router-link
        v-for="tile in tallTiles"
        :key="tile.id"
        :to="tile.to"
        class="relative block overflow-hidden rounded-[var(--radius-container)] ring-1 ring-border col-span-1 md:row-span-2 aspect-[2/3] md:aspect-auto md:h-full transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:ring-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:hover:translate-y-0"
      >
        <img
          v-if="tile.artwork"
          :src="tile.artwork"
          :srcset="tile.artworkSrcSet"
          sizes="(min-width: 768px) 202px, 45vw"
          :alt="tile.title"
          class="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="absolute inset-0 bg-muted" />
        <div class="absolute inset-0 scrim-b" />
        <span
          v-if="tile.badge"
          class="absolute left-3 top-3 rounded-[var(--radius-inner)] bg-primary-strong px-2 py-0.5 text-[11px] font-semibold text-primary-strong-foreground"
        >
          {{ tile.badge }}
        </span>
        <div class="absolute inset-x-0 bottom-0 p-3">
          <p class="text-sm font-semibold text-art line-clamp-2">{{ tile.title }}</p>
          <p v-if="tile.year" class="mt-1 text-xs text-art-muted">{{ tile.year }}</p>
        </div>
      </router-link>

      <!-- Fila de titulo: ocupa las seis columnas, asi su borde izquierdo y su
           accion comparten la linea de la grilla. Sin caja: una placa con
           padding dentro del mosaico rompia la alineacion y sumaba ruido. -->
      <div
        v-if="wide.length"
        class="col-span-2 flex items-center justify-between gap-4 md:col-span-6"
      >
        <h2 class="text-lg font-bold font-poppins text-foreground">{{ wideTitle }}</h2>
        <router-link
          v-if="wideTo"
          :to="wideTo"
          class="inline-flex min-h-[24px] shrink-0 items-center gap-1 rounded-[var(--radius-inner)] px-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
        >
          Ver todo
          <span aria-hidden="true">→</span>
        </router-link>
      </div>

      <!-- Piezas de apoyo: arte real a 16/10, misma familia que las altas pero
           con menos peso. Tres columnas en desktop, ancho completo en movil
           para que ninguna quede sola en su fila. -->
      <router-link
        v-for="item in wide"
        :key="item.id"
        :to="item.to"
        class="relative block overflow-hidden rounded-[var(--radius-container)] ring-1 ring-border col-span-2 md:col-span-2 aspect-[16/10] transition-[box-shadow] duration-200 hover:ring-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <img
          v-if="item.artwork"
          :src="item.artwork"
          :srcset="item.artworkSrcSet"
          sizes="(min-width: 768px) 33vw, 100vw"
          :alt="item.title"
          class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02] motion-reduce:hover:scale-100"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="absolute inset-0 bg-muted" />
        <div class="absolute inset-0 scrim-b" />
        <div class="absolute inset-x-0 bottom-0 p-4">
          <p class="text-sm font-semibold text-art line-clamp-1">{{ item.title }}</p>
          <p v-if="item.meta || item.year" class="mt-0.5 text-xs text-art-muted">
            <span v-if="item.meta" class="text-art-accent font-semibold">{{ item.meta }}</span>
            <span v-if="item.meta && item.year"> · </span>
            <span v-if="item.year">{{ item.year }}</span>
          </p>
        </div>
      </router-link>
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
    talls?: MosaicTile[]
    wideTitle: string
    wide: MosaicTile[]
    wideTo?: RouteLocationRaw
    leadTag?: 'h1' | 'h2'
  }>(),
  {
    loading: false,
    talls: () => [],
    wideTo: undefined,
    leadTag: 'h2',
  }
)

const tallTiles = computed(() => props.talls.slice(0, 2))
</script>
