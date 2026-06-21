<template>
  <!-- Grid de cards skeleton con las mismas columnas que el grid real de resultados. -->
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
    <SkeletonCard v-for="n in count" :key="n" />
  </div>
</template>

<script setup lang="ts">
import SkeletonCard from './SkeletonCard.vue'

withDefaults(defineProps<{ count?: number }>(), { count: 12 })
</script>
