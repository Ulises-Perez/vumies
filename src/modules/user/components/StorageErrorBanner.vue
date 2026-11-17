<template>
  <p
    v-if="userStore.storageError"
    role="alert"
    class="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground"
  >
    {{ userStore.storageError }} Los cambios de esta sesión se perderán al recargar.
  </p>
</template>

<script setup lang="ts">
import { useUserStore } from '../stores/user.store'

const userStore = useUserStore()
</script>
