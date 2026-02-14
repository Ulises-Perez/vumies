<template>
  <div class="relative group/scroll">
    <!-- Section Header -->
    <div v-if="title" class="flex items-center justify-between mb-4 pr-4 md:pr-12">
      <h2 class="text-2xl md:text-3xl font-bold text-white font-poppins">{{ title }}</h2>
      
      <div class="flex items-center space-x-4">
        <!-- Navigation Arrows -->
        <div class="hidden md:flex items-center space-x-2">
          <button
            @click="scroll('left')"
            class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-gray-600"
            :disabled="!showLeftArrow"
            aria-label="Scroll Left"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            @click="scroll('right')"
            class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-gray-600"
            :disabled="!showRightArrow"
            aria-label="Scroll Right"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- View All Link -->
        <router-link 
          v-if="link" 
          :to="link" 
          class="text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap"
        >
          Ver todo
        </router-link>
      </div>
    </div>

    <!-- Scroll Container -->
    <div
      ref="scrollContainer"
      class="flex space-x-4 overflow-x-auto pb-8 scrollbar-hide px-4 md:px-0 scroll-smooth"
      @scroll="handleScroll"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { RouteLocationRaw } from 'vue-router';

// Props
defineProps<{
  title?: string
  link?: RouteLocationRaw
}>()

const scrollContainer = ref<HTMLElement | null>(null)
const showLeftArrow = ref(false)
const showRightArrow = ref(true)

const checkScroll = () => {
  if (!scrollContainer.value) return
  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value
  showLeftArrow.value = scrollLeft > 10 // buffer
  showRightArrow.value = scrollLeft + clientWidth < scrollWidth - 10
}

const scroll = (direction: 'left' | 'right') => {
  if (!scrollContainer.value) return
  const { scrollLeft, clientWidth } = scrollContainer.value
  const scrollAmount = clientWidth * 0.75
  const targetScroll = direction === 'left' 
    ? scrollLeft - scrollAmount 
    : scrollLeft + scrollAmount
  
  smoothScrollTo(scrollContainer.value, targetScroll, 600) // 600ms duration
}

const smoothScrollTo = (element: HTMLElement, target: number, duration: number) => {
  const start = element.scrollLeft
  const change = target - start
  const startTime = performance.now()

  const animateScroll = (currentTime: number) => {
    const timeElapsed = currentTime - startTime
    if (timeElapsed < duration) {
      // EaseInOutQuad
      let progress = timeElapsed / duration
      progress = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress
      
      element.scrollLeft = start + change * progress
      requestAnimationFrame(animateScroll)
    } else {
      element.scrollLeft = target
      // Trigger update check
      checkScroll()
    }
  }

  requestAnimationFrame(animateScroll)
}

const handleScroll = () => {
  checkScroll()
}

let mutationObserver: MutationObserver | null = null

onMounted(() => {
  checkScroll()
  window.addEventListener('resize', checkScroll)

  if (scrollContainer.value) {
    mutationObserver = new MutationObserver(() => {
      checkScroll()
    })
    mutationObserver.observe(scrollContainer.value, {
      childList: true,
      subtree: true,
      attributes: true, // In case styles/classes change allowing scroll
      characterData: true
    })
    
    // Initial check after a small delay to allow for rendering
    setTimeout(checkScroll, 100)
    setTimeout(checkScroll, 500)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScroll)
  if (mutationObserver) {
    mutationObserver.disconnect()
  }
})

defineExpose({ checkScroll })
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
