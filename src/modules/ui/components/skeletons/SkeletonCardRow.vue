<template>
  <!-- Fila de cards skeleton para usar DENTRO de HorizontalScroll (mismos anchos
       que las cards reales: w-[160px] md:w-[220px]) => sin CLS al cargar. -->
  <div
    v-for="n in count"
    :key="n"
    class="flex-none w-[160px] md:w-[220px]"
  >
    <SkeletonCard />
  </div>
</template>

<script setup lang="ts">
import SkeletonCard from './SkeletonCard.vue'

withDefaults(defineProps<{ count?: number }>(), { count: 8 })
</script>
