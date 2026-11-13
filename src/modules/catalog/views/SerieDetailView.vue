<template>
  <!-- Un solo elemento raiz: App.vue envuelve la ruta en
       <transition name="page" mode="out-in"> y `out-in` no monta la ruta
       siguiente hasta que la saliente termina su transicion. Con la cadena de
       condiciones suelta, Vue no tenia un elemento que animar y la navegacion
       quedaba en blanco al salir de esta vista. -->
  <div>
  <SkeletonDetail v-if="loading" />

  <div v-else-if="error" class="min-h-screen pt-[var(--chrome-top)]">
    <div class="container-app py-8">
      <ErrorMessage :message="error" title="Error al cargar serie" />
    </div>
  </div>

  <!-- Despeje inferior para la pildora flotante en movil: la pill ocupa 70px
       de alto (medido) a 16px del borde (BottomMenu), o sea 86px tapados desde
       abajo. pb = alto + offset + un paso de ritmo (--spacing-8, 32px) en movil;
       en md+ no hay pill y se vuelve al pb-20 del resto de vistas. -->
  <div v-else-if="seriesDetails" class="min-h-screen pb-[calc(70px+16px+var(--spacing-8))] md:pb-20">
    <!-- Hero a sangre completa: el arte nace en y=0 y el h1 vive en flujo normal
         bajo --chrome-top mas un paso de ritmo: la colision con la barra es
         imposible por construccion. El centinela marca el TECHO del hero: arriba
         de la pagina no hay superficie (el arte se ve detras, sin costura) y el
         velo solo se enciende cuando el hero ya salio por arriba. Puesto al pie,
         un hero mas alto que el viewport dejaba el velo encendido desde el
         arranque y volvia a cortar el arte. -->
    <SerieHero
      :backdrop-url="heroBackdropUrl"
      :backdrop-src-set="heroBackdropSrcSet"
      :title="seriesDetails.name"
      :overview="seriesDetails.overview"
      :match="matchLabel"
      :year="firstAirYear"
      :seasons-label="seasonsLabel"
      :is-favorite="isFavorite"
      @play="playHero"
      @toggle-favorite="toggleFavorite"
    />
    <div ref="sentinelRef" aria-hidden="true" class="h-px w-px" />

    <BaseContainer class="space-y-12 pt-[var(--spacing-8)]">
      <!-- Episodios -->
      <section aria-labelledby="serie-episodios-title">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h2 id="serie-episodios-title" class="type-heading-1 font-poppins text-foreground">Episodios</h2>

          <BaseSelect
            :model-value="selectedSeasonNumber"
            class="min-w-[12rem] font-semibold"
            @update:model-value="selectedSeasonNumber = Number($event)"
          >
            <option
              v-for="season in seriesDetails.seasons"
              :key="season.id"
              :value="season.season_number"
            >
              {{ season.name }}
            </option>
          </BaseSelect>
        </div>

        <!-- Lista de episodios -->
        <div v-if="currentSeason" class="space-y-4">
          <button
            v-for="episode in currentSeason.episodes"
            :key="episode.id"
            type="button"
            @click="playEpisode(episode.episode_number)"
            class="group w-full text-left bg-card hover:bg-accent rounded-xl overflow-hidden flex flex-col sm:flex-row border border-border hover:border-primary/40 transition-colors duration-200 sm:min-h-[9rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
             <!-- Miniatura: el <img> solo existe cuando hay still real. Sin
                  still, la misma caja queda deliberada: superficie muted con
                  hairline inset y un play tenue centrado (el unico numero
                  sigue siendo el badge de la esquina, sin duplicar). Nunca un
                  <img> sin fuente. -->
             <div class="relative w-full sm:w-56 md:w-72 flex-shrink-0 aspect-video sm:aspect-auto bg-card">
               <img
                 v-if="episode.still_path"
                 :src="getBackdropUrl(episode.still_path, 'w300')"
                 :alt="episode.name"
                 class="absolute inset-0 w-full h-full object-cover"
                 loading="lazy"
               >
               <div v-else aria-hidden="true" class="absolute inset-0 flex items-center justify-center bg-muted shadow-[inset_0_0_0_1px_var(--border)]">
                 <span class="flex h-12 w-12 items-center justify-center rounded-full border border-border text-muted-foreground/40">
                   <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                 </span>
               </div>
               <!-- Número de episodio: el mismo pill oscuro en todas las filas,
                    vaya o no sobre foto. -->
               <span class="absolute top-2 left-2 rounded-md bg-background/70 backdrop-blur-sm border border-border/60 px-2 py-0.5 text-xs font-bold text-foreground">
                 E{{ episode.episode_number }}
               </span>
               <!-- Play overlay (afordancia visual; la card entera reproduce) -->
               <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                 <span class="rounded-full bg-primary p-3 text-primary-foreground shadow-lg scale-90 group-hover:scale-100 transition-transform duration-200">
                   <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                 </span>
               </div>
             </div>

             <!-- Info: titulo siempre arriba (items-start), haya o no
                  descripcion; la meta ocupa el mismo lugar en cada fila. -->
             <div class="flex-1 min-w-0 p-4 sm:p-5 flex flex-col items-start gap-2">
               <div class="flex items-baseline justify-between gap-3 self-stretch">
                 <h3 class="type-heading-4 text-foreground group-hover:text-primary transition-colors line-clamp-1">
                   {{ episode.name }}
                 </h3>
                 <span class="flex-shrink-0">
                   <BaseBadge v-if="episode.runtime" variant="muted">{{ episode.runtime }} min</BaseBadge>
                 </span>
               </div>
               <p v-if="episode.overview" class="type-body text-muted-foreground line-clamp-2">
                 {{ episode.overview }}
               </p>
             </div>
          </button>
        </div>
        <div v-else class="text-center py-12 text-muted-foreground">
           Cargando episodios...
        </div>
      </section>

      <!-- Reparto -->
      <section v-if="credits && credits.cast.length" aria-labelledby="serie-reparto-title">
        <h2 id="serie-reparto-title" class="type-heading-1 font-poppins text-foreground mb-6">Reparto Principal</h2>
        <div class="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
          <div v-for="actor in credits.cast.slice(0, 10)" :key="actor.id" class="flex-none w-32 text-center group">
            <PersonAvatar :path="actor.profile_path" :name="actor.name" class="mb-3" />
            <p class="text-foreground font-medium text-sm truncate">{{ actor.name }}</p>
            <p class="text-muted-foreground text-xs truncate">{{ actor.character }}</p>
          </div>
        </div>
      </section>

      <!-- Recomendaciones -->
      <section v-if="hasRecommendations" aria-labelledby="serie-recomendaciones-title">
        <h2 id="serie-recomendaciones-title" class="type-heading-1 font-poppins text-foreground mb-8">Te Recomendamos</h2>
        <div class="grid-posters">
          <TVShowCard
            v-for="series in recommendations.slice(0, 12)"
            :key="series.id"
            :series="series"
          />
        </div>
      </section>

    </BaseContainer>
  </div>

  <div v-else class="min-h-screen" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSeries } from '../composables/useSeries'
import { useUserStore } from '@/modules/user'
import { getBackdropUrl, getBackdropSrcSet } from '@/core/config/api.config'
import SerieHero from '../components/SerieHero.vue'
import TVShowCard from '../components/TVShowCard.vue'
import SkeletonDetail from '@/modules/ui/components/skeletons/SkeletonDetail.vue'
import ErrorMessage from '@/modules/ui/components/ErrorMessage.vue'
import PersonAvatar from '@/modules/ui/components/PersonAvatar.vue'
import { BaseBadge, BaseSelect, BaseContainer } from '@/modules/ui/components/base'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { seriesDetails, currentSeason, credits, loading, error, recommendations, hasRecommendations, fetchSeriesDetails, fetchSeasonDetails, fetchSeriesRecommendations } = useSeries()

const selectedSeasonNumber = ref(1)

// Backdrop solo cuando la serie trae arte real: '' pinta bg-muted en el hero.
// Pasar el fallback '/placeholder-backdrop.jpg' (que no existe en public/)
// romperia la imagen igual que los stills nulos de los episodios.
const heroBackdropUrl = computed(() =>
  seriesDetails.value?.backdrop_path
    ? getBackdropUrl(seriesDetails.value.backdrop_path, 'original')
    : ''
)

const heroBackdropSrcSet = computed(() =>
  seriesDetails.value?.backdrop_path
    ? getBackdropSrcSet(seriesDetails.value.backdrop_path)
    : undefined
)

// Score real o nada: con vote_average en 0 no hay dato, no un "0% Match".
const matchLabel = computed(() =>
  seriesDetails.value && seriesDetails.value.vote_average > 0
    ? `${(seriesDetails.value.vote_average * 10).toFixed(0)}% Match`
    : ''
)

const firstAirYear = computed(() =>
  seriesDetails.value?.first_air_date
    ? String(new Date(seriesDetails.value.first_air_date).getFullYear())
    : ''
)

// Plural correcto con dato real: "1 temporada" / "N temporadas".
const seasonsLabel = computed(() => {
  const n = seriesDetails.value?.number_of_seasons
  if (n === undefined || n === null) return ''
  return n === 1 ? '1 temporada' : `${n} temporadas`
})

// Superficie condicional del chrome: sin superficie arriba (el arte sangra
// detras del velo y no hay costura ni corte), opaca al pasar el hero. Un
// Primer episodio real de la temporada cargada; 1 cuando aun carga.
const firstEpisodeNumber = computed(() =>
  currentSeason.value?.episodes[0]?.episode_number ?? 1
)

/** Accion principal: reproduce el primer episodio de la temporada elegida. */
function playHero() {
  playEpisode(firstEpisodeNumber.value)
}

const isFavorite = computed(() =>
  seriesDetails.value ? userStore.isFavorite(seriesDetails.value.id, 'tv') : false
)

function toggleFavorite() {
  if (seriesDetails.value) {
    userStore.toggleFavorite({
      id: seriesDetails.value.id,
      type: 'tv',
      title: seriesDetails.value.name,
      poster_path: seriesDetails.value.poster_path,
    })
  }
}

function playEpisode(episodeNumber: number) {
  if (seriesDetails.value) {
    const isAnimeRoute = route.name === 'anime-detail';
    // Temporada y episodio viajan con la entrada: retomar abre ESE episodio.
    userStore.addToHistory({
      id: seriesDetails.value.id,
      type: 'tv',
      title: seriesDetails.value.name,
      poster_path: seriesDetails.value.poster_path,
      backdrop_path: seriesDetails.value.backdrop_path,
      kind: isAnimeRoute ? 'anime' : 'series',
      season: selectedSeasonNumber.value,
      episode: episodeNumber,
    })
    router.push({
      name: 'player',
      params: {
        type: isAnimeRoute ? 'anime' : 'tv',
        id: seriesDetails.value.id,
        season: selectedSeasonNumber.value,
        episode: episodeNumber
      }
    })
  }
}

async function loadSeason(seasonNum: number) {
  if (seriesDetails.value) {
    await fetchSeasonDetails(seriesDetails.value.id, seasonNum)
  }
}

onMounted(async () => {
  const id = Number(route.params.id)
  await fetchSeriesDetails(id)
  await fetchSeriesRecommendations(id)

  // Load first season by default or logic related
  if (seriesDetails.value && seriesDetails.value.seasons?.length > 0) {
     const firstSeason = seriesDetails.value.seasons.find(s => s.season_number === 1) || seriesDetails.value.seasons[0]
     if (firstSeason) {
       selectedSeasonNumber.value = firstSeason.season_number
       await loadSeason(selectedSeasonNumber.value)
     }
  }
})

watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      const id = Number(newId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      await fetchSeriesDetails(id)
      await fetchSeriesRecommendations(id)
      if (seriesDetails.value && seriesDetails.value.seasons?.length > 0) {
         const firstSeason = seriesDetails.value.seasons.find(s => s.season_number === 1) || seriesDetails.value.seasons[0]
         if (firstSeason) {
            selectedSeasonNumber.value = firstSeason.season_number
            await loadSeason(selectedSeasonNumber.value)
         }
      }
    }
  }
)

watch(selectedSeasonNumber, async (newVal) => {
  await loadSeason(newVal)
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
