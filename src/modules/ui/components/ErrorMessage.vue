<template>
  <div v-if="show" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg relative" role="alert">
    <div class="flex items-start">
      <svg class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      <div class="flex-1">
        <strong v-if="title" class="font-bold block mb-1">{{ title }}</strong>
        <span class="block">{{ friendlyMessage }}</span>
        <!-- Recuperacion: un error sin salida deja al usuario en un callejon. -->
        <router-link
          to="/"
          class="mt-3 inline-flex items-center rounded-md border border-destructive/60 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-destructive/10"
        >
          Volver al inicio
        </router-link>
      </div>
      <button
        v-if="closeable"
        type="button"
        aria-label="Cerrar aviso"
        class="ml-4 text-destructive hover:opacity-80"
        @click="close"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  message: string
  title?: string
  closeable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  closeable: true,
})

const show = ref(true)

// El error crudo del servicio filtra el interno a la interfaz
// ("TMDB 404 @ /movie/999999999"). El detalle queda para el log, no para el usuario.
const INTERNAL_DETAIL = /\bTMDB\b|@\s*\/|\b[45]\d{2}\b/

const friendlyMessage = computed(() =>
  INTERNAL_DETAIL.test(props.message)
    ? 'No pudimos cargar este contenido. Puede que ya no esté disponible.'
    : props.message,
)

function close() {
  show.value = false
}
</script>
