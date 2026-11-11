<template>
  <!-- Grid de cards skeleton con las mismas columnas que el grid real de resultados. -->
  <div class="grid-posters">
    <SkeletonCard v-for="n in count" :key="n" />
  </div>
</template>

<script setup lang="ts">
import SkeletonCard from './SkeletonCard.vue'

withDefaults(defineProps<{ count?: number }>(), { count: 12 })
</script>
