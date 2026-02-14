<template>
  <div class="min-h-screen bg-dark pb-20">
    <!-- Hero Section -->
    <section ref="heroSection" class="relative h-[85vh] w-full overflow-hidden group/hero">
      
      <!-- Background Image (Always present, revealed when video ends) -->
      <div
        v-if="featuredMovie"
        class="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        :class="showTrailer ? 'opacity-0' : 'opacity-100'"
        :style="{ backgroundImage: `url(${featuredBackdrop})` }"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/60 to-transparent" />
      </div>

      <!-- Background Video Trailer -->
      <div 
        v-if="showTrailer && trailerKey" 
        class="absolute inset-0 w-full h-full overflow-hidden transition-opacity duration-1000"
        :class="showTrailer ? 'opacity-100' : 'opacity-0'"
      >
         <!-- 
           ASPECT RATIO TRICK FOR COVERAGE (16:9)
           Width = 100vw, Height = 56.25vw (16:9)
           Min-Width = 177.78vh (16:9 related to height), Min-Height = 100vh
           Centered absolute positioning
         -->
         <div 
             id="youtube-player"
             ref="playerContainer"
             class="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.78vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none scale-110"
         ></div>
         
         <!-- Overlay to darken video slightly -->
         <div class="absolute inset-0 bg-black/20"></div>
         <div class="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent" />
         <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/40 to-transparent" />

         <!-- Mute/Unmute Button -->
         <button 
           v-if="showTrailer"
           @click="toggleMute"
           class="absolute bottom-32 right-8 md:right-12 z-40 p-3 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all border border-white/10 hover:border-white/30 group"
           aria-label="Toggle Mute"
         >
           <svg v-if="isMuted" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd" />
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
           </svg>
           <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
           </svg>
         </button>
      </div>

      <!-- Content Overlay -->
      <div class="absolute inset-0 flex items-center">
        <div class="container-custom relative z-20 w-full">
          <div class="max-w-2xl space-y-6 mx-auto md:mx-0 px-12 md:px-0">
             <transition name="fade" appear>
              <div v-if="featuredMovie">
                <h1 class="text-5xl md:text-7xl font-bold font-poppins text-white leading-tight text-shadow-lg drop-shadow-md">
                  {{ featuredMovie?.title }}
                </h1>
                <div class="flex items-center space-x-4 text-gray-300 text-lg mt-4">
                   <span v-if="featuredMovie?.release_date" class="bg-white/20 px-2 py-0.5 rounded text-sm font-semibold text-white">{{ new Date(featuredMovie.release_date).getFullYear() }}</span>
                   <span class="text-green-400 font-semibold flex items-center gap-1">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      {{ featuredMovie?.vote_average ? (featuredMovie.vote_average).toFixed(1) : 0 }}
                   </span>
                   <span class="text-gray-300 text-sm" v-if="trailerKey && !showTrailer">Trailer finalizado</span>
                </div>
                <p class="text-lg text-gray-200 line-clamp-3 text-shadow-sm max-w-xl leading-relaxed mt-4 drop-shadow-md">
                  {{ featuredMovie?.overview }}
                </p>
                
                <div class="flex items-center space-x-4 pt-8">
                  <router-link
                    v-if="featuredMovie"
                    :to="{ name: 'movie-detail', params: { id: featuredMovie.id } }"
                    class="bg-white text-dark hover:bg-gray-200 px-8 py-3.5 rounded-lg font-bold flex items-center space-x-3 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-white/10"
                  >
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                    </svg>
                    <span>Ver Ahora</span>
                  </router-link>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </section>

    <!-- Content Sections -->
    <div class="space-y-12 -mt-20 relative z-20">

      <!-- Trending Movies -->
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Tendencias" link="/movies">
           <div v-for="movie in localTrendingMovies" :key="movie.id" class="flex-none w-[160px] md:w-[220px]">
             <MovieCard :movie="movie" />
           </div>
        </HorizontalScroll>
      </section>

      <!-- Recently Added -->
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Recientemente Agregadas" link="/movies">
          <div v-for="movie in animeMovies" :key="movie.id" class="flex-none w-[160px] md:w-[220px]">
            <MovieCard :movie="movie" />
          </div>
        </HorizontalScroll>
      </section>

       <!-- Upcoming -->
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Próximamente" link="/movies">
          <div v-for="localMovie in localUpcomingMovies" :key="localMovie.id" class="flex-none w-[160px] md:w-[220px]">
            <MovieCard :movie="localMovie" />
          </div>
        </HorizontalScroll>
      </section>

      <!-- Popular Series -->
      <section class="pl-4 md:pl-12">
        <HorizontalScroll title="Series Populares" link="/series">
          <div v-for="series in popularSeries" :key="series.id" class="flex-none w-[160px] md:w-[220px]">
            <TVShowCard :series="series" />
          </div>
        </HorizontalScroll>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick } from 'vue'
import { useMovies } from '../composables/useMovies'
import { useSeries } from '../composables/useSeries'
import { getBackdropUrl } from '@/core/config/api.config'

import MovieCard from '../components/MovieCard.vue'
import TVShowCard from '../components/TVShowCard.vue'
import HorizontalScroll from '@/modules/ui/components/HorizontalScroll.vue'
import type { Movie } from '../types/tmdb.types'

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void
    YT: any
  }
}

const animeMovies = ref<Movie[]>([])

const {
  fetchTrendingMovies,
  fetchUpcomingMovies,
  fetchMoviesByGenre,
  fetchMovieVideos
} = useMovies()

const localTrendingMovies = ref<Movie[]>([])
const localUpcomingMovies = ref<Movie[]>([])

const {
  series: popularSeries,
  fetchPopularSeries
} = useSeries()

const featuredMovie = computed(() => {
  if (localTrendingMovies.value.length === 0) return null
  return localTrendingMovies.value[0] // Always the first one
})

const featuredBackdrop = computed(() =>
  featuredMovie.value ? getBackdropUrl(featuredMovie.value.backdrop_path, 'original') : ''
)

// Trailer Logic
const showTrailer = ref(false)
const trailerKey = ref<string | null>(null)
const heroSection = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
const isMuted = ref(true) // Start muted
let player: any = null
let checkInterval: any = null
let replayTimeout: any = null

const isHeroVisible = ref(false)

async function loadTrailer() {
  if (!featuredMovie.value) return
  
  const videos = await fetchMovieVideos(featuredMovie.value.id)
  if (videos && videos.length > 0) {
    // Try to find official Trailer in Spanish/MX first (API sorts by priority if correctly configured, but we iterate)
    // Actually we just take the first Trailer/Teaser available from the filtered list we get
    const trailer = videos.find((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
    
    if (trailer) {
      trailerKey.value = trailer.key
      showTrailer.value = true
      
      // Load YouTube API if not already loaded
      if (!window.YT) {
        const tag = document.createElement('script')
        tag.src = "https://www.youtube.com/iframe_api"
        const firstScriptTag = document.getElementsByTagName('script')[0]
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
        } else {
          document.head.appendChild(tag)
        }
        
        window.onYouTubeIframeAPIReady = () => {
          initPlayer()
        }
      } else {
        initPlayer()
      }
    }
  }
}

function initPlayer() {
  if (!trailerKey.value) return
  
  // Wait for nextTick to ensure div is in DOM
  nextTick(() => {
    // If player already exists, just load new video
    if (player && typeof player.loadVideoById === 'function') {
        player.loadVideoById(trailerKey.value)
        return
    }

    player = new window.YT.Player('youtube-player', {
      videoId: trailerKey.value,
      playerVars: {
        autoplay: 1,
        controls: 0,
        mute: 1, // Start muted
        loop: 1,
        playlist: trailerKey.value,
        showinfo: 0,
        rel: 0,
        modestbranding: 1
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    })
  })
}

function onPlayerReady(event: any) {
  event.target.playVideo()
  event.target.mute()
  isMuted.value = true
  
  // Start checking time
  startCheckInterval()
}

function onPlayerStateChange(event: any) {
  // If ended or playing, ensure logic holds
}

function startCheckInterval() {
  if (checkInterval) clearInterval(checkInterval)
  
  checkInterval = setInterval(() => {
    if (player && player.getCurrentTime && player.getDuration) {
      const currentTime = player.getCurrentTime()
      const duration = player.getDuration()
      
      // Stop 15 seconds before end
      if (duration > 0 && (duration - currentTime) <= 15) {
        showTrailer.value = false
        stopPlayer()
        startReplayCountdown()
      }
    }
  }, 1000)
}

function stopPlayer() {
  if (checkInterval) clearInterval(checkInterval)
  if (player && player.stopVideo) {
    player.stopVideo()
  }
}

function startReplayCountdown() {
  if (replayTimeout) clearTimeout(replayTimeout)
  
  // Replay after 60 seconds of "background" view
  replayTimeout = setTimeout(() => {
    if (player && player.playVideo) {
       showTrailer.value = true
       player.seekTo(0)
       player.playVideo()
       startCheckInterval()
    }
  }, 60000)
}

function toggleMute() {
  if (!player) return
  
  if (isMuted.value) {
    player.unMute()
    isMuted.value = false
  } else {
    player.mute()
    isMuted.value = true
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    if (player && typeof player.pauseVideo === 'function') {
      player.pauseVideo()
    }
  } else {
    // Resume only if it was supposed to be playing (showTrailer) and is in view
    if (showTrailer.value && isHeroVisible.value && player && typeof player.playVideo === 'function') {
      player.playVideo()
    }
  }
}

function initObserver() {
  if (!heroSection.value) return

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isHeroVisible.value = entry.isIntersecting
      
      if (entry.isIntersecting) {
        // If user comes back, we don't necessarily restart the video if it finished
        // checking standard behavior.
        // If we are waiting for replay (replayTimeout exists), we keep waiting.
        // If video is playing (showTrailer is true), we resume playing.
        if (showTrailer.value && player && typeof player.playVideo === 'function') {
           player.playVideo()
        }
      } else {
        // If user leaves, pause video 
        if (player && typeof player.pauseVideo === 'function') {
           player.pauseVideo()
        }
        
        // And if we were counting down for replay, cancel it because "sin desplazarse"
        if (replayTimeout) {
            clearTimeout(replayTimeout)
            replayTimeout = null
        }
      }
    })
  }, { threshold: 0.1 }) // Trigger when 10% visible
  
  observer.observe(heroSection.value)
}

onMounted(async () => {
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Fetch Trending
  const trendingRes = await fetchTrendingMovies('day')
  localTrendingMovies.value = trendingRes.results

  // Load backend trailer for the featured movie
  if (localTrendingMovies.value.length > 0) {
     await loadTrailer()
  }

  // Fetch Upcoming (Recently Added)
  const upcomingRes = await fetchUpcomingMovies()
  localUpcomingMovies.value = upcomingRes.results

  // Fetch Anime (Genre ID 16)
  const animeList = await fetchMoviesByGenre(16)
  animeMovies.value = animeList

  // Fetch Series
  await fetchPopularSeries()
  
  // Init Intersection Observer
  setTimeout(() => {
     initObserver()
  }, 1000)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (observer) observer.disconnect()
  if (replayTimeout) clearTimeout(replayTimeout)
  if (player && player.destroy) {
    try {
      player.destroy()
    } catch (e) {
      // ignore
    }
  }
})
</script>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
}
</style>

