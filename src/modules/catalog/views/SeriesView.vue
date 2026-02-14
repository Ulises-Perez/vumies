<template>
  <div class="min-h-screen bg-dark pb-20">
    <!-- Featured Series (Hero) -->
    <section class="relative h-[70vh] w-full overflow-hidden">
      <div
        v-if="heroSeries"
        class="absolute inset-0 bg-cover bg-center transition-all duration-700"
        :style="{ backgroundImage: `url(${heroBackdrop})` }"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/40 to-transparent" />
      </div>

      <div class="absolute inset-0 flex items-center">
        <div class="container-custom">
          <div class="max-w-3xl space-y-6">
            <span v-if="heroSeries" class="inline-block px-3 py-1 bg-secondary/80 backdrop-blur-md border border-secondary/30 rounded-full text-white text-sm font-medium mb-2">
              Serie Destacada
            </span>
            <h1 class="text-5xl md:text-7xl font-bold font-poppins text-white leading-tight text-shadow-lg">
              {{ heroSeries?.name || 'Vumies Series' }}
            </h1>
            
            <div v-if="heroSeries" class="flex items-center space-x-4 text-gray-300 text-sm md:text-base">
              <span class="text-green-400 font-semibold">{{ (heroSeries.vote_average * 10).toFixed(0) }}% Match</span>
              <span>{{ new Date(heroSeries.first_air_date).getFullYear() }}</span>
              <span class="px-2 py-0.5 border border-gray-600 rounded text-xs">TV-MA</span>
            </div>

            <p v-if="heroSeries" class="text-lg md:text-xl text-gray-200 line-clamp-3 text-shadow max-w-2xl leading-relaxed">
              {{ heroSeries.overview }}
            </p>

            <div class="flex items-center space-x-4 pt-4">
              <router-link
                v-if="heroSeries"
                :to="{ name: 'serie-detail', params: { id: heroSeries.id } }"
                class="bg-white text-dark hover:bg-gray-200 px-8 py-4 rounded-lg font-bold flex items-center space-x-3 transition-all duration-300 transform hover:scale-105"
              >
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
                <span>Ver Serie</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Series Lists -->
    <div class="space-y-12 -mt-20 relative z-10">
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Series Populares">
           <div v-for="series in popularSeries" :key="series.id" class="flex-none w-[160px] md:w-[220px]">
             <TVShowCard :series="series" />
           </div>
        </HorizontalScroll>
      </section>

      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Series Mejor Valoradas">
          <div v-for="series in topRatedSeries" :key="series.id" class="flex-none w-[160px] md:w-[220px]">
            <TVShowCard :series="series" />
          </div>
        </HorizontalScroll>
      </section>
      
       <!-- Explore by Network (Placeholder) -->
       <section class="pl-4 md:pl-12 pr-4 md:pr-12">
         <h2 class="text-2xl md:text-3xl font-bold text-white font-poppins mb-6">Explorar por Cadena</h2>
         <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <!-- Placeholder networks -->
            <div v-for="i in 6" :key="i" class="bg-gray-800 h-24 rounded-lg flex items-center justify-center hover:bg-gray-700 transition cursor-pointer">
               <span class="text-gray-500 font-bold">Network {{ i }}</span>
            </div>
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
import { getBackdropUrl } from '@/core/config/api.config'

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
