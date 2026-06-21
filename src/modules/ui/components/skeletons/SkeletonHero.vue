<template>
  <!-- Placeholder del hero: misma altura y disposición (badge, título, meta, sinopsis,
       botón) que el hero real, con la misma sangría px-4 md:px-12 => evita CLS al revelar. -->
  <div :class="['relative w-full overflow-hidden', height]">
    <div class="absolute inset-0 skeleton"></div>
    <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
    <div class="absolute inset-0 bg-gradient-to-r from-dark via-dark/60 to-transparent" />

    <div class="absolute inset-0 flex items-center">
      <div class="px-4 md:px-12">
        <div class="max-w-3xl space-y-6">
          <div class="h-6 w-36 rounded-full skeleton"></div>
          <div class="h-12 md:h-16 w-2/3 rounded-lg skeleton"></div>
          <div class="h-4 w-52 rounded skeleton"></div>
          <div class="space-y-2 max-w-xl">
            <div class="h-4 w-full rounded skeleton"></div>
            <div class="h-4 w-5/6 rounded skeleton"></div>
          </div>
          <div class="h-12 w-44 rounded-lg skeleton"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// height: clase Tailwind de altura para igualar el hero de cada vista (70vh/85vh/60vh).
withDefaults(defineProps<{ height?: string }>(), { height: 'h-[70vh]' })
</script>
