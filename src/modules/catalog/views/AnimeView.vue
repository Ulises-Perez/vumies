<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- Hero: anime destacado (primer reciente) -->
    <section class="relative h-[70vh] w-full overflow-hidden">
      <template v-if="heroAnime">
        <!-- Hero como <img> real (LCP): fetchpriority='high' lo descarga con prioridad
             máxima en cuanto Vue lo monta, frente a la prioridad 'Low' de un background-image. -->
        <img
          :src="heroAnime.image"
          :alt="heroAnime.title"
          class="absolute inset-0 w-full h-full object-cover object-center"
          fetchpriority="high"
          decoding="async"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/60 to-transparent" />
      </template>

      <div class="absolute inset-0 flex items-center">
        <div class="px-4 md:px-12">
          <div class="max-w-3xl space-y-6">
            <BaseBadge variant="secondary" class="mb-2">
              Anime Destacado
            </BaseBadge>
            <h1 class="text-5xl md:text-7xl font-bold font-poppins text-foreground leading-tight text-shadow-lg">
              {{ heroAnime?.title || 'Vumies Animes' }}
            </h1>

            <div v-if="heroAnime" class="flex items-center gap-4 text-muted-foreground text-sm md:text-base">
              <BaseBadge v-if="heroAnime.type" variant="outline">{{ heroAnime.type }}</BaseBadge>
            </div>

            <p v-if="heroAnime?.synopsis" class="text-lg md:text-xl text-muted-foreground line-clamp-3 text-shadow max-w-2xl leading-relaxed">
              {{ heroAnime.synopsis }}
            </p>

            <div class="flex items-center space-x-4 pt-4">
              <BaseButton
                v-if="heroAnime"
                :to="{ name: 'anime-av1-detail', params: { slug: heroAnime.slug } }"
                size="lg"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
                <span>Ver Anime</span>
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Listas -->
    <div class="space-y-12 -mt-20 relative z-10">
      <!-- Episodios recientes -->
      <section v-if="recentEpisodes.length" class="pl-4 md:pl-12">
        <HorizontalScroll title="Episodios Recientes">
          <div v-for="ep in recentEpisodes" :key="ep.slug + '-' + ep.episode" class="flex-none w-[160px] md:w-[220px]">
            <AnimeCard :anime="episodeToCard(ep)" :episode="ep.episode" />
          </div>
        </HorizontalScroll>
      </section>

      <!-- Recién agregados -->
      <section v-if="recentAnime.length" class="pl-4 md:pl-12">
        <HorizontalScroll title="Recién Agregados">
          <div v-for="anime in recentAnime" :key="anime.id ?? anime.slug" class="flex-none w-[160px] md:w-[220px]">
            <AnimeCard :anime="anime" />
          </div>
        </HorizontalScroll>
      </section>

      <!-- Catálogo -->
      <section class="px-4 md:px-12">
        <h2 class="text-2xl font-bold text-foreground font-poppins mb-8">Catálogo de Animes</h2>

        <div v-if="loading && !catalog.length" class="flex justify-center py-12">
          <LoadingSpinner message="Cargando animes..." />
        </div>

        <ErrorMessage v-else-if="error && !catalog.length" :message="error" title="Error" />

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          <AnimeCard v-for="anime in catalog" :key="anime.id ?? anime.slug" :anime="anime" />
        </div>

        <!-- Paginación -->
        <div v-if="catalog.length" class="flex items-center justify-center gap-4 mt-12">
          <BaseButton
            variant="outline"
            :disabled="currentPage <= 1 || loading"
            @click="goToPage(currentPage - 1)"
          >
            Anterior
          </BaseButton>
          <span class="text-muted-foreground text-sm font-medium">
            Página {{ currentPage }} <span v-if="totalPages > 1">de {{ totalPages }}</span>
          </span>
          <BaseButton
            variant="outline"
            :disabled="currentPage >= totalPages || loading"
            @click="goToPage(currentPage + 1)"
          >
            Siguiente
          </BaseButton>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useAnimeAV1 } from '@/modules/catalog/composables/useAnimeAV1'
import { scrollBehavior } from '@/core/utils/motion'
import type { AV1AnimeCard, AV1RecentEpisode } from '@/modules/catalog/types/animeav1.types'
import AnimeCard from '@/modules/catalog/components/AnimeCard.vue'
import HorizontalScroll from '@/modules/ui/components/HorizontalScroll.vue'
import LoadingSpinner from '@/modules/ui/components/LoadingSpinner.vue'
import ErrorMessage from '@/modules/ui/components/ErrorMessage.vue'
import { BaseBadge, BaseButton } from '@/modules/ui/components/base'

const {
  loading,
  error,
  recentEpisodes,
  recentAnime,
  catalog,
  currentPage,
  totalPages,
  fetchRecents,
  fetchCatalog,
} = useAnimeAV1()

const heroAnime = computed(() => recentAnime.value[0] || null)

function episodeToCard(ep: AV1RecentEpisode): AV1AnimeCard {
  return {
    id: ep.slug,
    title: ep.title,
    slug: ep.slug,
    url: ep.url,
    image: ep.image,
    type: ep.type,
    synopsis: '',
  }
}

async function goToPage(page: number) {
  if (page < 1) return
  await fetchCatalog(page)
  window.scrollTo({ top: 0, behavior: scrollBehavior() })
}

onMounted(async () => {
  await Promise.allSettled([fetchRecents(), fetchCatalog(1)])
})
</script>
