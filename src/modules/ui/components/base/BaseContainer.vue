<template>
  <!-- El unico contenedor de pagina del sistema: gutter + max-width.
       Si una vista necesita otro ancho, no lo resuelve aca. -->
  <component :is="as" class="container-app">
    <slot />
  </component>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ as?: string }>(), { as: 'div' })
</script>
