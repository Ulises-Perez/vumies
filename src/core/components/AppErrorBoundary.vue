<template>
  <slot v-if="!failed" />
  <div v-else class="flex min-h-[60vh] items-center justify-center px-6">
    <div class="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center">
      <p class="text-lg font-semibold text-foreground">Algo falló al mostrar esta pantalla</p>
      <p class="mt-2 text-sm text-muted-foreground">
        El resto de la app sigue funcionando: podés navegar a otra sección o recargar.
      </p>
      <button
        type="button"
        class="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="reload"
      >
        Recargar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onErrorCaptured, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const failed = ref(false)

// Un error de render no debe tumbar el shell: se muestra el fallback y se corta
// la propagación. Navegar a otra ruta vuelve a intentar.
onErrorCaptured((error) => {
  console.error('[AppErrorBoundary]', error)
  failed.value = true
  return false
})

watch(
  () => route.fullPath,
  () => {
    failed.value = false
  }
)

function reload() {
  window.location.reload()
}
</script>
