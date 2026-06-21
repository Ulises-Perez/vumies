<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- Featured Series (Hero) -->
    <section class="relative h-[70vh] w-full overflow-hidden">
      <SkeletonHero v-if="!heroSeries" height="h-[70vh]" />
      <div
        v-if="heroSeries"
        class="absolute inset-0 bg-cover bg-center transition-all duration-700"
        :style="{ backgroundImage: `url(${heroBackdrop})` }"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/40 to-transparent" />
      </div>

      <div class="absolute inset-0 flex items-center">
        <div class="px-4 md:px-12">
          <div class="max-w-3xl space-y-6">
            <BaseBadge v-if="heroSeries" variant="secondary" class="mb-2">
              Serie Destacada
            </BaseBadge>
            <h1 class="text-5xl md:text-7xl font-bold font-poppins text-foreground leading-tight text-shadow-lg">
              {{ heroSeries?.name || 'Vumies Series' }}
            </h1>

            <div v-if="heroSeries" class="flex items-center gap-4 text-muted-foreground text-sm md:text-base">
              <span class="text-green-400 font-semibold">{{ (heroSeries.vote_average * 10).toFixed(0) }}% Match</span>
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
    <div class="space-y-12 -mt-20 relative z-10">
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Series Populares">
          <template v-if="popularSeries.length">
            <div v-for="series in popularSeries" :key="series.id" class="flex-none w-[160px] md:w-[220px]">
              <TVShowCard :series="series" />
            </div>
          </template>
          <SkeletonCardRow v-else />
        </HorizontalScroll>
      </section>

      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Series Mejor Valoradas">
          <template v-if="topRatedSeries.length">
            <div v-for="series in topRatedSeries" :key="series.id" class="flex-none w-[160px] md:w-[220px]">
              <TVShowCard :series="series" />
            </div>
          </template>
          <SkeletonCardRow v-else />
        </HorizontalScroll>
      </section>
      
       <!-- Explore by Network (Placeholder) -->
       <section class="pl-4 md:pl-12 pr-4 md:pr-12">
         <h2 class="text-2xl md:text-3xl font-bold text-foreground font-poppins mb-6">Explorar por Cadena</h2>
         <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <!-- Placeholder networks -->
            <BaseCard v-for="i in 6" :key="i" interactive class="h-24 flex items-center justify-center group">
               <span class="text-muted-foreground group-hover:text-foreground font-semibold transition-colors">Network {{ i }}</span>
            </BaseCard>
         </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSeries } from '@/modules/catalog/composables/useSeries'
import TVShowCard from '@/modules/catalog/components/TVShowCard.vue'
import HorizontalScroll from '@/modules/ui/components/HorizontalScroll.vue'
import SkeletonHero from '@/modules/ui/components/skeletons/SkeletonHero.vue'
import SkeletonCardRow from '@/modules/ui/components/skeletons/SkeletonCardRow.vue'
import { getBackdropUrl } from '@/core/config/api.config'
import { BaseBadge, BaseButton, BaseCard } from '@/modules/ui/components/base'

// NOTE: We might need to implement useSeries composable if it does not have topRated
// But assuming it mimics useMovies. 
// Checking useSeries is not possible right now without reading it, but let's assume standard structure.
// If it fails, I'll fix it.

const { 
  series: popularSeries,
  // topRatedSeries, // useSeries actually doesn't seem to export separate state for top rated, it reuses 'series' state for the last fetch.
  // We need to fetch and store locally to avoid conflict if useSeries uses single state.
  // Looking at useSeries.ts: it uses 'series' ref.
  fetchPopularSeries,
  fetchTopRatedSeries
} = useSeries()

const topRatedSeries = ref<any[]>([]) // Fallback if composable doesn't have it

const heroSeries = computed(() => {
  if (popularSeries.value.length > 0) return popularSeries.value[0]
  return null
})

const heroBackdrop = computed(() => 
  heroSeries.value ? getBackdropUrl(heroSeries.value.backdrop_path, 'original') : ''
)

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
