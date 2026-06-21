<template>
  <!-- El <img> no recibe `src` hasta que entra (o está a punto de entrar) en el viewport.
       Así NO se descarga ninguna imagen fuera de la vista, ni siquiera en carruseles
       con scroll horizontal (donde loading="lazy" nativo precarga casi toda la fila).
       El contenedor padre aporta el fondo mientras tanto; class/atributos pasan por
       fallthrough al <img> raíz. -->
  <img
    ref="el"
    :src="currentSrc"
    :alt="alt"
    decoding="async"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src: string
    alt?: string
    /** Margen para precargar justo antes de entrar en vista (evita pop-in brusco). */
    rootMargin?: string
  }>(),
  { rootMargin: '200px' }
)

const el = ref<HTMLImageElement | null>(null)
const currentSrc = ref<string | undefined>(undefined)
let io: IntersectionObserver | null = null

function cleanup() {
  io?.disconnect()
  io = null
}

function reveal() {
  currentSrc.value = props.src
  cleanup()
}

onMounted(() => {
  if (!el.value) return
  // Fallback: si no hay IntersectionObserver, carga directa.
  if (typeof IntersectionObserver === 'undefined') {
    reveal()
    return
  }
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) reveal()
    },
    { rootMargin: props.rootMargin }
  )
  io.observe(el.value)
})

// Si la card se recicla en un v-for y cambia el src tras haberse cargado, actualízalo.
watch(
  () => props.src,
  (next) => {
    if (currentSrc.value !== undefined) currentSrc.value = next
  }
)

onBeforeUnmount(cleanup)
</script>
