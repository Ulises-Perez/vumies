<template>
  <!-- Hero a sangre completa: sin tarjeta, sin anillo, sin radio. El arte ocupa
       todo el ancho y el texto vive dentro de container-app, el mismo gutter
       que las secciones de abajo: un solo borde optico en la pagina. La seccion
       crece con su contenido sobre un min-h de token; nada absoluto lleva el
       titulo. Texto sobre arte con tokens independientes del tema (text-art*),
       porque los scrims son oscuros en claro y en oscuro. -->
  <section
    aria-labelledby="serie-hero-title"
    class="relative mt-[calc(var(--chrome-top)+var(--spacing-6))] overflow-hidden"
  >
    <img
      v-if="backdropUrl"
      :src="backdropUrl"
      :srcset="backdropSrcSet"
      sizes="(min-width: 768px) 90vw, 100vw"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 h-full w-full object-cover"
      loading="eager"
      fetchpriority="high"
      decoding="async"
    >
    <div v-else aria-hidden="true" class="absolute inset-0 bg-muted" />
    <div aria-hidden="true" class="absolute inset-0 scrim-b" />
    <div aria-hidden="true" class="absolute inset-0 scrim-r" />
    <!-- Fundido inferior al fondo de pagina: el scrim termina en oscuro y en
         tema claro la pagina es blanca, asi que sin esta capa el arte se corta
         en una linea horizontal. from-background sigue al tema. -->
    <div aria-hidden="true" class="absolute inset-x-0 bottom-0 h-[var(--spacing-12)] bg-gradient-to-t from-background to-transparent" />

    <div class="container-app relative">
      <div class="flex min-h-[var(--hero-lg)] max-w-3xl flex-col justify-end space-y-6 pb-[var(--spacing-8)] pt-[var(--spacing-8)]">
        <div>
          <h1
            id="serie-hero-title"
            class="text-3xl md:text-5xl font-bold font-poppins text-art leading-tight text-shadow-lg"
          >
            {{ title }}
          </h1>
          <p v-if="match || year || seasonsLabel" class="mt-2 text-sm md:text-base text-art-muted">
            <span v-if="match" class="text-art-accent font-semibold">{{ match }}</span>
            <span v-if="match && (year || seasonsLabel)"> · </span>
            <span v-if="year">{{ year }}</span>
            <span v-if="year && seasonsLabel"> · </span>
            <span v-if="seasonsLabel">{{ seasonsLabel }}</span>
          </p>
        </div>

        <!-- Sinopsis contenida al lado con scrim: en movil el arte derecho
             queda brillante (el scrim lateral cae hacia la derecha), asi que el
             parrafo se queda en medida de lectura y recupera el ancho completo
             desde sm, donde el scrim ya lo cubre. -->
        <p v-if="overview" class="max-w-[34ch] sm:max-w-2xl text-sm md:text-base text-art-muted line-clamp-3">
          {{ overview }}
        </p>

        <!-- Dos columnas iguales en movil (un solo borde derecho alineado),
             fila natural desde sm. -->
        <div class="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
          <BaseButton size="lg" class="w-full sm:w-auto" @click="$emit('play')">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            <span>Reproducir</span>
          </BaseButton>

          <BaseButton variant="secondary" size="lg" class="w-full sm:w-auto" @click="$emit('toggle-favorite')">
            <svg
              class="w-5 h-5"
              :class="[isFavorite ? 'text-red-500 fill-current' : 'text-secondary-foreground']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>Mi Lista</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { BaseButton } from '@/modules/ui/components/base'

withDefaults(
  defineProps<{
    /** Backdrop ya resuelto; '' cuando la serie no trae: se pinta bg-muted. */
    backdropUrl?: string
    /** Candidatos w780/w1280 del mismo arte. */
    backdropSrcSet?: string
    title: string
    overview?: string
    /** Dato corto real, ej. '78% Match'. '' cuando no aplica. */
    match?: string
    /** Año como texto, '' cuando se desconoce. */
    year?: string
    /** '1 temporada' / 'N temporadas', ya con el plural correcto. */
    seasonsLabel?: string
    isFavorite?: boolean
  }>(),
  {
    backdropUrl: '',
    overview: '',
    match: '',
    year: '',
    seasonsLabel: '',
    isFavorite: false,
  }
)

defineEmits<{
  (e: 'play'): void
  (e: 'toggle-favorite'): void
}>()
</script>
