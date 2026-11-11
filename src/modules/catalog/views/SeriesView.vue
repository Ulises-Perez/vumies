<template>
  <div class="min-h-screen pb-20">
    <!-- Featured Series (Hero) -->
    <section class="relative flex min-h-[var(--hero-md)] w-full items-center overflow-hidden">
      <SkeletonHero v-if="!heroSeries" height="h-[var(--hero-md)]" />
      <div
        v-if="heroSeries"
        class="absolute inset-0 bg-cover bg-center transition-all duration-700"
        :style="{ backgroundImage: `url(${heroBackdrop})` }"
      >
        <div class="absolute inset-0 scrim-b" />
        <div class="absolute inset-0 scrim-r" />
      </div>

      <div class="relative w-full py-16 md:py-20">
        <div class="container-app">
          <div class="max-w-3xl space-y-6">
            <h1 class="text-5xl md:text-7xl font-bold font-poppins text-foreground leading-tight text-shadow-lg">
              {{ heroSeries?.name || 'Vumies Series' }}
            </h1>

            <div v-if="heroSeries" class="flex items-center gap-4 text-muted-foreground text-sm md:text-base">
              <span class="text-primary font-semibold">{{ (heroSeries.vote_average * 10).toFixed(0) }}% Match</span>
              <span>{{ new Date(heroSeries.first_air_date).getFullYear() }}</span>
              <BaseBadge variant="outline">TV-MA</BaseBadge>
            </div>

            <p v-if="heroSeries" class="text-lg md:text-xl text-muted-foreground line-clamp-3 text-shadow max-w-2xl leading-relaxed">
              {{ heroSeries.overview }}
            </p>

            <div class="flex items-center space-x-4 pt-4">
              <BaseButton
                v-if="heroSeries"
                :to="{ name: 'serie-detail', params: { id: heroSeries.id } }"
                size="lg"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
                <span>Ver Serie</span>
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Series Lists -->
    <BaseContainer class="space-y-12 relative z-10">

      <!-- Mosaico: piezas con alto propio; las filas crecen con el contenido
           (auto-rows auto) para que en 2 columnas de movil nada se solape. -->
      <section v-if="hasMosaic" aria-label="Destacados" class="grid grid-cols-2 gap-[var(--grid-gap)] md:grid-cols-6 auto-rows-[minmax(0,auto)]">
        <!-- Lead: la mas valorada -->
        <article
          v-if="mosaicLead"
          class="relative overflow-hidden rounded-[var(--radius-container)] ring-1 ring-border col-span-2 md:col-span-4 md:row-span-2 aspect-[4/5] sm:aspect-[16/10] md:aspect-auto md:min-h-[24rem]"
        >
          <img
            v-if="mosaicLead.backdrop_path"
            :src="leadBackdrop"
            :alt="mosaicLead.name"
            class="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div v-else class="absolute inset-0 bg-muted" />
          <div class="absolute inset-0 scrim-b" />
          <div class="absolute inset-0 scrim-r" />
          <div class="absolute inset-x-0 bottom-0 p-5 md:p-7">
            <h2 class="text-3xl md:text-5xl font-bold font-poppins text-foreground leading-tight text-shadow-lg">
              {{ mosaicLead.name }}
            </h2>
            <p class="mt-2 text-sm md:text-base text-muted-foreground">
              <span class="text-primary font-semibold">{{ matchOf(mosaicLead) }}% Match</span>
              <span> · {{ airYearOf(mosaicLead) }}</span>
            </p>
            <div class="mt-4">
              <BaseButton
                :to="{ name: 'serie-detail', params: { id: mosaicLead.id } }"
                size="lg"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
                <span>Ver ahora</span>
              </BaseButton>
            </div>
          </div>
        </article>

        <!-- Tall 1 -->
        <router-link
          v-if="mosaicTallOne"
          :to="{ name: 'serie-detail', params: { id: mosaicTallOne.id } }"
          class="relative block overflow-hidden rounded-[var(--radius-container)] ring-1 ring-border col-span-1 md:row-span-2 aspect-[2/3] md:aspect-auto md:h-full"
        >
          <img
            v-if="mosaicTallOne.poster_path"
            :src="tallPoster(mosaicTallOne)"
            :alt="mosaicTallOne.name"
            class="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div v-else class="absolute inset-0 bg-muted" />
          <div class="absolute inset-0 scrim-b" />
          <div class="absolute inset-x-0 bottom-0 p-3">
            <p class="text-sm font-semibold text-foreground line-clamp-2">{{ mosaicTallOne.name }}</p>
            <p class="mt-1 text-xs text-muted-foreground">{{ airYearOf(mosaicTallOne) }}</p>
          </div>
        </router-link>

        <!-- Tall 2 -->
        <router-link
          v-if="mosaicTallTwo"
          :to="{ name: 'serie-detail', params: { id: mosaicTallTwo.id } }"
          class="relative block overflow-hidden rounded-[var(--radius-container)] ring-1 ring-border col-span-1 md:row-span-2 aspect-[2/3] md:aspect-auto md:h-full"
        >
          <img
            v-if="mosaicTallTwo.poster_path"
            :src="tallPoster(mosaicTallTwo)"
            :alt="mosaicTallTwo.name"
            class="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div v-else class="absolute inset-0 bg-muted" />
          <div class="absolute inset-0 scrim-b" />
          <div class="absolute inset-x-0 bottom-0 p-3">
            <p class="text-sm font-semibold text-foreground line-clamp-2">{{ mosaicTallTwo.name }}</p>
            <p class="mt-1 text-xs text-muted-foreground">{{ airYearOf(mosaicTallTwo) }}</p>
          </div>
        </router-link>

        <!-- Wide: tambien populares (lista de apoyo con datos ya cargados) -->
        <div
          v-if="mosaicWide.length"
          class="col-span-2 rounded-[var(--radius-container)] bg-card p-5 ring-1 ring-border md:col-span-6"
        >
          <h2 class="text-lg font-bold text-foreground font-poppins">También populares</h2>
          <ul class="mt-3 space-y-2">
            <li v-for="show in mosaicWide" :key="show.id">
              <router-link
                :to="{ name: 'serie-detail', params: { id: show.id } }"
                class="flex min-h-[32px] items-center justify-between gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <span class="truncate font-medium">{{ show.name }}</span>
                <span class="shrink-0 text-xs">{{ airYearOf(show) }}</span>
              </router-link>
            </li>
          </ul>
        </div>
      </section>

      <!-- Unico rail horizontal de la pagina (.rail via HorizontalScroll):
           Series Populares, la primera coleccion que la vista ya mostraba. -->
      <section>
        <HorizontalScroll title="Series Populares">
          <template v-if="popularSeries.length">
            <div v-for="series in popularSeries" :key="series.id" class="flex-none w-[160px] md:w-[220px]">
              <TVShowCard :series="series" />
            </div>
          </template>
          <SkeletonCardRow v-else />
        </HorizontalScroll>
      </section>

      <!-- Resto en grilla de posters -->
      <section v-if="topRatedRest.length">
        <h2 class="text-2xl md:text-3xl font-bold text-foreground font-poppins mb-6">Series Mejor Valoradas</h2>
        <div class="grid-posters">
          <TVShowCard v-for="show in topRatedRest" :key="show.id" :series="show" />
        </div>
      </section>

    </BaseContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSeries } from '@/modules/catalog/composables/useSeries'
import TVShowCard from '@/modules/catalog/components/TVShowCard.vue'
import HorizontalScroll from '@/modules/ui/components/HorizontalScroll.vue'
import SkeletonHero from '@/modules/ui/components/skeletons/SkeletonHero.vue'
import SkeletonCardRow from '@/modules/ui/components/skeletons/SkeletonCardRow.vue'
import { getBackdropUrl, getPosterUrl } from '@/core/config/api.config'
import { BaseBadge, BaseButton, BaseContainer } from '@/modules/ui/components/base'
import type { TVShow } from '@/modules/catalog/types/tmdb.types'

// Estado local por coleccion: el composable comparte un unico ref `series`
// entre popular y top-rated (cada fetch lo sobrescribe), asi que se copia
// cada respuesta a su propio ref en vez de aliasar el ref compartido.
const { fetchPopularSeries, fetchTopRatedSeries } = useSeries()

const popularSeries = ref<TVShow[]>([])
const topRatedSeries = ref<TVShow[]>([])

const heroSeries = computed(() => {
  if (popularSeries.value.length > 0) return popularSeries.value[0]
  return null
})

const heroBackdrop = computed(() =>
  heroSeries.value ? getBackdropUrl(heroSeries.value.backdrop_path, 'original') : ''
)

// Mosaico con los datos que la vista ya trae: lead + talls de topRated,
// lista wide de popular. Sin requests nuevos ni titulos inventados.
// (La grilla fantasma "Explorar por Cadena" / Network 1..6 no tenia datos
// detras: se elimina en vez de mantener titulos falsos.)
const mosaicLead = computed(() => topRatedSeries.value[0] ?? null)
const mosaicTallOne = computed(() => topRatedSeries.value[1] ?? null)
const mosaicTallTwo = computed(() => topRatedSeries.value[2] ?? null)
const mosaicWide = computed(() => popularSeries.value.slice(1, 4))
const topRatedRest = computed(() => topRatedSeries.value.slice(3))
const hasMosaic = computed(
  () =>
    mosaicLead.value !== null ||
    mosaicTallOne.value !== null ||
    mosaicTallTwo.value !== null ||
    mosaicWide.value.length > 0
)
const leadBackdrop = computed(() =>
  mosaicLead.value?.backdrop_path ? getBackdropUrl(mosaicLead.value.backdrop_path, 'original') : ''
)

function tallPoster(show: TVShow): string {
  return show.poster_path ? getPosterUrl(show.poster_path, 'w342') : ''
}

function airYearOf(show: TVShow): string {
  return show.first_air_date ? String(new Date(show.first_air_date).getFullYear()) : ''
}

function matchOf(show: TVShow): string {
  return (show.vote_average * 10).toFixed(0)
}

onMounted(async () => {
  const popularRes = await fetchPopularSeries()
  popularSeries.value = popularRes.results

  const topRatedRes = await fetchTopRatedSeries()
  topRatedSeries.value = topRatedRes.results
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
