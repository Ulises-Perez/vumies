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
           (auto-rows auto) para que en 2 columnas de movil nada se solape.
           Una sola receta para /movies, /series y /: el componente la define. -->
      <MosaicHighlights
        lead-kicker="Mejor valorada"
        :lead="leadTile"
        :loading="mosaicLoading"
        :talls="tallTiles"
        wide-title="También populares"
        :wide="wideTiles"
      />

      <!-- Unico rail horizontal de la pagina (.rail via HorizontalScroll):
           Series Populares, sin las piezas que ya ocupan hero, mosaico y lista ancha. -->
      <section v-if="popularRest.length">
        <HorizontalScroll title="Series Populares">
          <div v-for="series in popularRest" :key="series.id" class="flex-none w-[160px] md:w-[220px]">
            <TVShowCard :series="series" />
          </div>
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
import MosaicHighlights from '@/modules/catalog/components/MosaicHighlights.vue'
import type { MosaicTile } from '@/modules/catalog/types/mosaic.types'
import HorizontalScroll from '@/modules/ui/components/HorizontalScroll.vue'
import SkeletonHero from '@/modules/ui/components/skeletons/SkeletonHero.vue'
import { getBackdropUrl, getPosterUrl } from '@/core/config/api.config'
import { BaseBadge, BaseButton, BaseContainer } from '@/modules/ui/components/base'
import type { TVShow } from '@/modules/catalog/types/tmdb.types'

// Estado local por coleccion: el composable comparte un unico ref `series`
// entre popular y top-rated (cada fetch lo sobrescribe), asi que se copia
// cada respuesta a su propio ref en vez de aliasar el ref compartido.
const { fetchPopularSeries, fetchTopRatedSeries } = useSeries()

const popularSeries = ref<TVShow[]>([])
const topRatedSeries = ref<TVShow[]>([])
const mosaicLoading = ref(true)

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
// hero=popular[0], lista ancha=popular[1..3]: la rail arranca donde termina eso,
// asi ninguna serie aparece dos veces en la misma pagina.
const popularRest = computed(() => popularSeries.value.slice(4))
// El mosaico recibe piezas ya resueltas: ninguna vista filtra campos de TMDB
// al marcado (movie.title vs show.name, release_date vs first_air_date).
function toTile(show: TVShow, variant: 'lead' | 'tall' = 'lead'): MosaicTile {
  const backdrop = show.backdrop_path ? getBackdropUrl(show.backdrop_path, 'w1280') : ''
  const poster = show.poster_path ? getPosterUrl(show.poster_path, 'w342') : ''
  return {
    id: show.id,
    title: show.name,
    artwork: variant === 'lead' ? backdrop || poster : poster || backdrop,
    year: airYearOf(show),
    meta: `${matchOf(show)}% Match`,
    overview: show.overview,
    badge: variant === 'tall' ? 'Mejor valorada' : undefined,
    to: { name: 'serie-detail', params: { id: show.id } },
  }
}

const leadTile = computed(() => (mosaicLead.value ? toTile(mosaicLead.value) : null))
const tallTiles = computed(() =>
  [mosaicTallOne.value, mosaicTallTwo.value]
    .filter((show): show is TVShow => show !== null)
    .map((show) => toTile(show, 'tall'))
)
const wideTiles = computed(() => mosaicWide.value.map((show) => toTile(show)))

function airYearOf(show: TVShow): string {
  return show.first_air_date ? String(new Date(show.first_air_date).getFullYear()) : ''
}

function matchOf(show: TVShow): string {
  return (show.vote_average * 10).toFixed(0)
}

onMounted(async () => {
  try {
    const popularRes = await fetchPopularSeries()
    popularSeries.value = popularRes.results

    const topRatedRes = await fetchTopRatedSeries()
    topRatedSeries.value = topRatedRes.results
  } finally {
    mosaicLoading.value = false
  }
})
</script>
