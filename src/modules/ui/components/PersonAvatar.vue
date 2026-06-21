<template>
  <div class="aspect-square w-full overflow-hidden rounded-full border-2 border-transparent bg-muted transition-colors group-hover:border-primary flex items-center justify-center">
    <img
      v-if="path && !failed"
      :src="src"
      :alt="name"
      class="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
      @error="failed = true"
    >
    <!-- Placeholder cuando no hay foto (o la imagen falla): silueta de persona -->
    <svg v-else class="h-1/2 w-1/2 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2.5c-4.142 0-7.5 2.015-7.5 4.5V21h15v-2c0-2.485-3.358-4.5-7.5-4.5z" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getProfileUrl } from '@/core/config/api.config'

const props = defineProps<{ path?: string | null; name?: string }>()

const failed = ref(false)
const src = computed(() => getProfileUrl(props.path ?? null))
</script>
