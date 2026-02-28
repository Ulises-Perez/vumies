<template>
  <div class="min-h-screen bg-dark pb-20">
    <!-- Featured Anime (Hero) -->
    <section class="relative h-[70vh] w-full overflow-hidden">
      <div
        v-if="heroAnime"
        class="absolute inset-0 bg-cover bg-center transition-all duration-700"
        :style="{ backgroundImage: `url(${heroBackdrop})` }"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/40 to-transparent" />
      </div>

      <div class="absolute inset-0 flex items-center">
        <div class="container-custom">
          <div class="max-w-3xl space-y-6">
            <span v-if="heroAnime" class="inline-block px-3 py-1 bg-secondary/80 backdrop-blur-md border border-secondary/30 rounded-full text-white text-sm font-medium mb-2">
              Anime Destacado
            </span>
            <h1 class="text-5xl md:text-7xl font-bold font-poppins text-white leading-tight text-shadow-lg">
              {{ heroAnime?.name || 'Vumies Animes' }}
            </h1>
            
            <div v-if="heroAnime" class="flex items-center space-x-4 text-gray-300 text-sm md:text-base">
              <span class="text-green-400 font-semibold">{{ (heroAnime.vote_average * 10).toFixed(0) }}% Match</span>
              <span>{{ new Date(heroAnime.first_air_date).getFullYear() }}</span>
              <span class="px-2 py-0.5 border border-gray-600 rounded text-xs">TV-14</span>
            </div>

            <p v-if="heroAnime" class="text-lg md:text-xl text-gray-200 line-clamp-3 text-shadow max-w-2xl leading-relaxed">
              {{ heroAnime.overview }}
            </p>

            <div class="flex items-center space-x-4 pt-4">
              <router-link
                v-if="heroAnime"
                :to="{ name: 'anime-detail', params: { id: heroAnime.id } }"
                class="bg-white text-dark hover:bg-gray-200 px-8 py-4 rounded-lg font-bold flex items-center space-x-3 transition-all duration-300 transform hover:scale-105"
              >
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
                <span>Ver Anime</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Anime Lists -->
    <div class="space-y-12 -mt-20 relative z-10">
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Animes Populares">
           <div v-for="anime in popularAnimes" :key="anime.id" class="flex-none w-[160px] md:w-[220px]">
             <TVShowCard :series="anime" contentType="anime" />
           </div>
        </HorizontalScroll>
      </section>

      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Animes Mejor Valorados">
          <div v-for="anime in topRatedAnimes" :key="anime.id" class="flex-none w-[160px] md:w-[220px]">
            <TVShowCard :series="anime" contentType="anime" />
          </div>
        </HorizontalScroll>
      </section>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAnimes } from '@/modules/catalog/composables/useAnimes'
import TVShowCard from '@/modules/catalog/components/TVShowCard.vue'
import HorizontalScroll from '@/modules/ui/components/HorizontalScroll.vue'
import { getBackdropUrl } from '@/core/config/api.config'

const { 
  animes: popularAnimes,
  fetchPopularAnimes,
  fetchTopRatedAnimes
} = useAnimes()

const topRatedAnimes = ref<any[]>([])

const heroAnime = computed(() => {
  if (popularAnimes.value.length > 0) return popularAnimes.value[0]
  return null
})

const heroBackdrop = computed(() => 
  heroAnime.value ? getBackdropUrl(heroAnime.value.backdrop_path, 'original') : ''
)

onMounted(async () => {
  const popularRes = await fetchPopularAnimes()
  popularAnimes.value = popularRes.results
  
  const topRatedRes = await fetchTopRatedAnimes()
  topRatedAnimes.value = topRatedRes.results
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
