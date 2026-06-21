<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-primary font-poppins">404</h1>
      <p class="text-2xl text-muted-foreground mt-4 mb-8">Página no encontrada</p>
      <BaseButton to="/" size="lg">Volver al inicio</BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BaseButton } from '@/modules/ui/components/base'
</script>
