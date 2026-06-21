<template>
  <div v-if="loading" class="min-h-screen pt-20 flex items-center justify-center">
    <LoadingSpinner message="Cargando anime..." />
  </div>

  <div v-else-if="error" class="min-h-screen pt-20">
    <div class="container-custom py-8">
      <ErrorMessage :message="error" title="Error al cargar el anime" />
    </div>
  </div>

  <div v-else-if="animeInfo" class="min-h-screen pb-20">
    <!-- Backdrop Hero -->
    <div class="relative h-[80vh] w-full overflow-hidden bg-center">
      <!-- Backdrop como <img> (LCP) priorizable, en vez de background-image. -->
      <img
        v-if="heroBackdrop"
        :src="heroBackdrop"
        :alt="animeInfo.title"
        class="absolute inset-0 w-full h-full object-cover object-center"
        fetchpriority="high"
        decoding="async"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
      <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/60 to-transparent" />

      <div class="absolute inset-0 flex items-end pb-20">
        <div class="px-4 md:px-12 w-full">
          <div class="flex flex-col md:flex-row gap-8 items-start md:items-end">
            <!-- Poster -->
            <img
              v-if="animeInfo.cover"
              :src="animeInfo.cover"
              :alt="animeInfo.title"
              width="300"
              height="450"
              class="hidden md:block w-48 aspect-poster object-cover rounded-xl shadow-2xl ring-1 ring-border flex-shrink-0"
              loading="lazy"
              decoding="async"
            />

            <div class="max-w-3xl space-y-5">
              <h1 class="text-4xl md:text-6xl font-bold font-poppins text-foreground leading-tight text-shadow-lg">
                {{ animeInfo.title }}
              </h1>
              <p v-if="animeInfo.alt_title" class="text-muted-foreground text-lg -mt-2">{{ animeInfo.alt_title }}</p>

              <div class="flex flex-wrap items-center gap-3 text-muted-foreground text-sm md:text-base">
                <span v-if="animeInfo.rating" class="flex items-center space-x-1 text-yellow-500 font-bold">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  <span>{{ animeInfo.rating }}</span>
                </span>
                <span v-if="animeInfo.year">{{ animeInfo.year }}</span>
                <BaseBadge v-if="animeInfo.type" variant="outline">{{ animeInfo.type }}</BaseBadge>
                <BaseBadge v-if="animeInfo.status" variant="default">{{ animeInfo.status }}</BaseBadge>
                <span v-if="animeInfo.episodes_count">{{ animeInfo.episodes_count }} eps</span>
              </div>

              <!-- Genres -->
              <div v-if="animeInfo.genres.length" class="flex flex-wrap gap-2">
                <BaseBadge v-for="g in animeInfo.genres" :key="g.slug" variant="muted">
                  {{ g.name }}
                </BaseBadge>
              </div>

              <p class="text-muted-foreground line-clamp-3 text-shadow max-w-2xl leading-relaxed">
                {{ animeInfo.description }}
              </p>

              <div class="flex items-center gap-4 pt-2">
                <BaseButton
                  v-if="firstEpisode"
                  size="lg"
                  @click="playEpisode(firstEpisode.number)"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
                  <span>Reproducir</span>
                </BaseButton>
                <BaseButton
                  v-if="animeInfo.trailer"
                  variant="secondary"
                  size="lg"
                  :href="`https://youtube.com/watch?v=${animeInfo.trailer}`"
                  target="_blank"
                  rel="noopener"
                >
                  <span>Trailer</span>
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Episodios -->
    <div class="bg-background relative z-10 px-4 md:px-12 -mt-10">
      <!-- Selector de temporadas (franquicia) -->
      <div v-if="seasons.length > 1" class="mb-10">
        <h2 class="text-2xl font-bold text-foreground font-poppins mb-5">Temporadas</h2>
        <div class="flex flex-wrap gap-3">
          <router-link
            v-for="(season, idx) in seasons"
            :key="season.slug"
            :to="{ name: 'anime-av1-detail', params: { slug: season.slug } }"
            class="px-4 py-3 rounded-xl border transition-all duration-200 flex items-center gap-3"
            :class="season.slug === slug
              ? 'bg-primary/20 border-primary text-foreground'
              : 'bg-muted/40 border-border text-muted-foreground hover:bg-accent'"
          >
            <span class="flex-none w-7 h-7 rounded-full bg-background/70 grid place-content-center text-xs font-bold">{{ idx + 1 }}</span>
            <span class="text-left">
              <span class="block text-sm font-semibold leading-tight">{{ season.title }}</span>
              <span class="block text-[11px] text-muted-foreground">{{ season.year }} · {{ season.episodes_count }} eps</span>
            </span>
          </router-link>
        </div>
      </div>

      <div class="mb-16">
        <h2 class="text-2xl font-bold text-foreground font-poppins mb-8">
          Episodios
          <span v-if="seasons.length > 1" class="text-muted-foreground text-lg font-normal">— {{ animeInfo.title }}</span>
        </h2>

        <div v-if="animeInfo.episodes.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <button
            v-for="ep in animeInfo.episodes"
            :key="ep.id ?? ep.number"
            @click="playEpisode(ep.number)"
            class="group text-left bg-card hover:bg-accent rounded-xl overflow-hidden transition-colors duration-200 border border-border hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div class="relative aspect-video bg-muted">
              <img v-if="ep.image" :src="ep.image" alt="" width="320" height="180" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" decoding="async" />
              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <span class="bg-primary p-3 rounded-full text-primary-foreground">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
                </span>
              </div>
            </div>
            <div class="p-2.5">
              <span class="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">Episodio {{ ep.number }}</span>
            </div>
          </button>
        </div>
        <div v-else class="text-center py-12 text-muted-foreground">No hay episodios disponibles.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAnimeAV1 } from '../composables/useAnimeAV1'
import { tmdbService } from '../services/tmdb.service'
import { getBackdropUrl } from '@/core/config/api.config'
import { scrollBehavior } from '@/core/utils/motion'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import ErrorMessage from '@/modules/ui/components/ErrorMessage.vue'
import { BaseBadge, BaseButton } from '@/modules/ui/components/base'

const route = useRoute()
const router = useRouter()
const { animeInfo, franchise, loading, error, fetchAnimeInfo, fetchFranchise } = useAnimeAV1()

const slug = computed(() => route.params.slug as string)
const seasons = computed(() => franchise.value?.seasons || [])
const firstEpisode = computed(() => animeInfo.value?.episodes[0] || null)

// Backdrop enriquecido desde TMDB (si hay match por malId); fallback a animeav1
const tmdbBackdrop = ref('')
const heroBackdrop = computed(
  () => tmdbBackdrop.value || animeInfo.value?.backdrop || animeInfo.value?.cover || ''
)

function playEpisode(episode: number | string) {
  router.push({
    name: 'anime-av1-watch',
    params: { slug: slug.value, episode: String(episode) },
  })
}

async function enrichWithTmdb() {
  tmdbBackdrop.value = ''
  const tmdb = animeInfo.value?.tmdb
  if (!tmdb || tmdb.media_type !== 'tv') return
  try {
    const details = await tmdbService.getTVShowDetails(tmdb.tmdb_id)
    if (details?.backdrop_path) {
      // w1280 basta para un hero a pantalla; 'original' eran varios MB innecesarios.
      tmdbBackdrop.value = getBackdropUrl(details.backdrop_path, 'w1280')
    }
  } catch {
    // Enriquecimiento opcional: si TMDB falla, usamos el backdrop de animeav1
  }
}

async function load() {
  window.scrollTo({ top: 0, behavior: scrollBehavior() })
  // Info + franquicia (temporadas) en paralelo
  await Promise.all([fetchAnimeInfo(slug.value), fetchFranchise(slug.value)])
  enrichWithTmdb()
}

onMounted(load)
watch(() => route.params.slug, (n) => { if (n) load() })
</script>
