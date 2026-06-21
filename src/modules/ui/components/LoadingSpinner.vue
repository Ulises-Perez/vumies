<template>
  <div class="text-center py-10">
    <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    <p v-if="message" class="mt-4 text-muted-foreground">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: 'Cargando...',
})
</script>

