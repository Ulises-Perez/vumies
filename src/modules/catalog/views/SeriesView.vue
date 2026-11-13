<template>
  <div class="min-h-screen pb-20">
    <!-- La vista abre con el mosaico, como el artboard elegido (03-mosaico):
         no hay hero arriba porque la pieza principal ya es el hero. -->
    <BaseContainer class="space-y-12 pt-[var(--chrome-top)]">

      <!-- Mosaico: piezas con alto propio; las filas crecen con el contenido
           (auto-rows auto) para que en 2 columnas de movil nada se solape.
           Una sola receta para /movies, /series y /: el componente la define. -->
      <MosaicHighlights
        lead-tag="h1"
        lead-kicker="Mejor valorada"
        :lead="leadTile"
        :loading="mosaicLoading"
        :talls="tallTiles"
        wide-title="También populares"
        :wide="wideTiles"
      />

      <!-- Unico rail horizontal de la pagina (.rail via HorizontalScroll):
           Series Populares, sin las piezas que ya ocupan el mosaico y la lista ancha. -->
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
import { getBackdropUrl, getPosterUrl } from '@/core/config/api.config'
import { BaseContainer } from '@/modules/ui/components/base'
import type { TVShow } from '@/modules/catalog/types/tmdb.types'

// Estado local por coleccion: el composable comparte un unico ref `series`
// entre popular y top-rated (cada fetch lo sobrescribe), asi que se copia
// cada respuesta a su propio ref en vez de aliasar el ref compartido.
const { fetchPopularSeries, fetchTopRatedSeries } = useSeries()

const popularSeries = ref<TVShow[]>([])
const topRatedSeries = ref<TVShow[]>([])
const mosaicLoading = ref(true)

// Mosaico con los datos que la vista ya trae: lead + talls de topRated,
// lista wide de popular. Sin requests nuevos ni titulos inventados.
// (La grilla fantasma "Explorar por Cadena" / Network 1..6 no tenia datos
// detras: se elimina en vez de mantener titulos falsos.)
const mosaicLead = computed(() => topRatedSeries.value[0] ?? null)
const mosaicTallOne = computed(() => topRatedSeries.value[1] ?? null)
const mosaicTallTwo = computed(() => topRatedSeries.value[2] ?? null)
const mosaicWide = computed(() => popularSeries.value.slice(0, 3))
const topRatedRest = computed(() => topRatedSeries.value.slice(3))
// La lista ancha ya ocupa popular[0..2]: la rail arranca donde termina eso,
// asi ninguna serie aparece dos veces en la misma pagina.
const popularRest = computed(() => popularSeries.value.slice(3))
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
