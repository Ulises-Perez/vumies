<template>
  <div class="min-h-screen pb-20">
    <!-- Sin titulo visible: la vista arranca con el mosaico, como el inicio.
         El h1 queda solo para lectores de pantalla. -->
    <h1 class="sr-only">Buscar</h1>
    <!-- La ruta cambia sin mover el foco: sin esto, quien usa lector de
         pantalla no se entera de que la busqueda termino. -->
    <p class="sr-only" role="status">{{ statusMessage }}</p>

    <BaseContainer class="space-y-12 pt-[var(--chrome-top)]">
      <!-- El mosaico dibuja su esqueleto en su propio grid, asi que no hay salto
           cuando llegan los datos. -->
      <MosaicHighlights
        v-if="searching"
        :lead="null"
        loading
        wide-title="Más resultados"
        :wide="[]"
      />

      <!-- Sin consulta: la vista se abre desde la paleta, pero la URL puede
           llegar vacia. -->
      <section
        v-else-if="!searchQuery"
        class="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-24 text-center"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <MagnifyingGlassIcon class="h-6 w-6 text-muted-foreground" />
        </div>
        <p class="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Abre la búsqueda con Ctrl K y escribe el título que quieras encontrar.
        </p>
      </section>

      <!-- Sin resultados no es lo mismo que un fallo de red. -->
      <section
        v-else-if="!results.length"
        class="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-24 text-center"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <MagnifyingGlassIcon class="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 class="mt-5 text-lg font-semibold text-foreground">
          {{ failed ? 'No pudimos buscar' : 'Sin resultados' }}
        </h2>
        <p class="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {{
            failed
              ? 'Revisa tu conexión e intenta de nuevo.'
              : `No encontramos nada para «${searchQuery}». Prueba con otro título.`
          }}
        </p>
        <BaseButton to="/" class="mt-6">Explorar catálogo</BaseButton>
      </section>

      <template v-else>
        <!-- Mosaico solo con tres resultados o mas: con menos, el lead de cuatro
             columnas dejaria un hueco a la derecha. -->
        <MosaicHighlights
          v-if="useMosaic"
          :lead="leadTile"
          :talls="tallTiles"
          wide-title="Más resultados"
          :wide="[]"
          lead-tag="h2"
        >
          <template #lead-actions>
            <BaseButton
              variant="secondary"
              size="lg"
              :aria-pressed="isLeadFavorite"
              @click="toggleLeadFavorite"
            >
              <svg
                class="h-5 w-5"
                :class="isLeadFavorite ? 'fill-current text-destructive' : 'text-secondary-foreground'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>Mi Lista</span>
            </BaseButton>
          </template>
        </MosaicHighlights>

        <section v-if="gridItems.length">
          <h2
            v-if="useMosaic"
            class="mb-4 text-2xl font-bold font-poppins text-foreground md:text-3xl"
          >
            Más resultados
          </h2>
          <div class="grid-posters">
            <template v-for="item in gridItems" :key="`${item.id}-${item.media_type}`">
              <MovieCard v-if="item.media_type === 'movie'" :movie="item" />
              <TVShowCard v-else :series="item" />
            </template>
          </div>
        </section>
      </template>
    </BaseContainer>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { tmdbService } from '@/modules/catalog/services/tmdb.service'
import { isMultiSearchResult, type MultiSearchResult } from '@/modules/catalog/types/tmdb.types'
import type { MosaicTile } from '@/modules/catalog/types/mosaic.types'
import {
  getBackdropSrcSet,
  getBackdropUrl,
  getPosterSrcSet,
  getPosterUrl,
} from '@/core/config/api.config'
import MovieCard from '@/modules/catalog/components/MovieCard.vue'
import TVShowCard from '@/modules/catalog/components/TVShowCard.vue'
import MosaicHighlights from '@/modules/catalog/components/MosaicHighlights.vue'
import { useUserStore } from '@/modules/user'
import { BaseButton, BaseContainer } from '@/modules/ui/components/base'

const route = useRoute()
const userStore = useUserStore()

const searchQuery = ref('')
const results = ref<MultiSearchResult[]>([])
const searching = ref(false)
const failed = ref(false)
let searchTimeout: number | null = null

// El mosaico necesita dos piezas altas: con menos, el lead de cuatro columnas
// dejaria un hueco a la derecha.
const statusMessage = computed(() => {
  if (searching.value) return 'Buscando…'
  if (!searchQuery.value) return ''
  if (failed.value) return 'La búsqueda falló.'
  if (!results.value.length) return `Sin resultados para «${searchQuery.value}».`
  return `${results.value.length} resultados para «${searchQuery.value}».`
})

const useMosaic = computed(() => results.value.length >= 3)
const leadItem = computed(() => (useMosaic.value ? results.value[0] : null))
const gridItems = computed(() => (useMosaic.value ? results.value.slice(3) : results.value))

function titleOf(item: MultiSearchResult) {
  return item.media_type === 'movie' ? item.title : item.name
}

function dateOf(item: MultiSearchResult) {
  return item.media_type === 'movie' ? item.release_date : item.first_air_date
}

function toTile(item: MultiSearchResult, variant: 'lead' | 'tall'): MosaicTile {
  const backdrop = item.backdrop_path ? getBackdropUrl(item.backdrop_path, 'w1280') : ''
  const poster = item.poster_path ? getPosterUrl(item.poster_path, 'w342') : ''
  const artwork = variant === 'lead' ? backdrop || poster : poster || backdrop
  const date = dateOf(item)
  return {
    id: `${item.id}-${item.media_type}`,
    title: titleOf(item),
    artwork,
    artworkSrcSet:
      artwork === backdrop
        ? getBackdropSrcSet(item.backdrop_path)
        : getPosterSrcSet(item.poster_path),
    year: date ? String(new Date(date).getFullYear()) : '',
    meta: item.vote_average ? `${(item.vote_average * 10).toFixed(0)}% Match` : '',
    overview: item.overview,
    to: {
      name: item.media_type === 'movie' ? 'movie-detail' : 'serie-detail',
      params: { id: item.id },
    },
  }
}

const leadTile = computed(() => (leadItem.value ? toTile(leadItem.value, 'lead') : null))
const tallTiles = computed(() =>
  useMosaic.value ? results.value.slice(1, 3).map((item) => toTile(item, 'tall')) : []
)

const isLeadFavorite = computed(() =>
  leadItem.value ? userStore.isFavorite(leadItem.value.id, leadItem.value.media_type) : false
)

function toggleLeadFavorite() {
  const item = leadItem.value
  if (!item) return
  userStore.toggleFavorite({
    id: item.id,
    type: item.media_type,
    title: titleOf(item),
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
  })
}

async function performSearch() {
  const query = searchQuery.value.trim()
  if (!query) {
    results.value = []
    searching.value = false
    return
  }
  failed.value = false
  try {
    const response = await tmdbService.searchMulti(query)
    results.value = response.results.filter(isMultiSearchResult)
  } catch (error) {
    console.error('Error en búsqueda:', error)
    failed.value = true
    results.value = []
  } finally {
    searching.value = false
  }
}

function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    results.value = []
    searching.value = false
    return
  }
  // El esqueleto entra ya: durante el debounce no se muestran resultados viejos.
  searching.value = true
  searchTimeout = window.setTimeout(performSearch, 500)
}

watch(
  () => route.query.q,
  (newQuery) => {
    searchQuery.value = typeof newQuery === 'string' ? newQuery : ''
    handleSearch()
  },
  { immediate: true }
)

onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
})
</script>
