<template>
  <div
    v-if="isPlayerVisible"
    class="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
    @click.self="closePlayer"
  >
    <div class="relative w-full max-w-7xl">
      <!-- Close Button -->
      <button
        @click="closePlayer"
        class="absolute -top-12 right-0 text-white hover:text-primary transition-colors"
        aria-label="Cerrar"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- Player Container -->
      <div class="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          v-if="embedUrl"
          :src="embedUrl"
          class="w-full h-full"
          width="100%"
          height="100%"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          referrerpolicy="origin"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-white">
          <p>No hay reproductor disponible</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  embedUrl: string
  isPlayerVisible: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

function closePlayer() {
  emit('close')
}

// Close on escape key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closePlayer()
  }
}

// Add/remove event listener
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

