<template>
  <div class="relative group/scroll">
    <!-- Section Header -->
    <div v-if="title" class="flex items-center justify-between mb-4">
      <h2 class="text-2xl md:text-3xl font-bold text-foreground font-poppins">{{ title }}</h2>
      
      <div class="flex items-center space-x-4">
        <!-- Navigation Arrows -->
        <div class="hidden md:flex items-center space-x-2">
          <button
            @click="scroll('left')"
            class="motion-press h-9 w-9 md:h-8 md:w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-border"
            :disabled="!showLeftArrow"
            aria-label="Scroll Left"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            @click="scroll('right')"
            class="motion-press h-9 w-9 md:h-8 md:w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-border"
            :disabled="!showRightArrow"
            aria-label="Scroll Right"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- View All Link -->
        <router-link 
          v-if="link" 
          :to="link" 
          class="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          Ver todo
        </router-link>
      </div>
    </div>

    <!-- Scroll Container -->
    <div
      ref="scrollContainer"
      class="rail"
      @scroll="handleScroll"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { RouteLocationRaw } from 'vue-router';
import { prefersReducedMotion } from '@/core/utils/motion'

// Props
defineProps<{
  title?: string
  link?: RouteLocationRaw
}>()

const scrollContainer = ref<HTMLElement | null>(null)
const showLeftArrow = ref(false)
const showRightArrow = ref(true)

// Métricas cacheadas: leer `scrollWidth`/`clientWidth` dentro del handler de
// scroll es una lectura de layout por evento (60+ por segundo durante un
// desplazamiento). Se miden solo cuando cambian de verdad (resize/mutación).
let metrics = { scrollWidth: 0, clientWidth: 0 }

const measure = () => {
  const el = scrollContainer.value
  if (!el) return
  metrics.scrollWidth = el.scrollWidth
  metrics.clientWidth = el.clientWidth
}

const checkScroll = () => {
  const el = scrollContainer.value
  if (!el) return
  const { scrollLeft } = el
  if (!metrics.clientWidth) measure()
  showLeftArrow.value = scrollLeft > 10 // buffer
  showRightArrow.value = scrollLeft + metrics.clientWidth < metrics.scrollWidth - 10
}

// Un solo cálculo por frame como máximo, aunque el navegador emita decenas de
// eventos de scroll durante la animación nativa.
let scheduled = 0
const scheduleCheck = () => {
  if (scheduled) return
  scheduled = requestAnimationFrame(() => {
    scheduled = 0
    checkScroll()
  })
}

/** Paso de una tarjeta (ancho + gap): deja el carrusel alineado sin snap. */
const cardPitch = (el: HTMLElement): number => {
  const first = el.firstElementChild as HTMLElement | null
  if (!first) return 0
  const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 0
  return first.offsetWidth + gap
}

const scroll = (direction: 'left' | 'right') => {
  const el = scrollContainer.value
  if (!el) return
  const { scrollLeft } = el
  const pitch = cardPitch(el)
  // Salto de ~una pantalla, redondeado a tarjetas enteras: cae prolijo sin
  // pagar el costo de fluidez que tenia `scroll-snap`.
  const raw = el.clientWidth * 0.75
  const amount = pitch > 0 ? Math.max(1, Math.round(raw / pitch)) * pitch : raw
  const target = direction === 'left' ? scrollLeft - amount : scrollLeft + amount

  // Movimiento: scroll nativo `smooth`. Antes animabamos con rAF escribiendo
  // `scrollLeft` en cada frame, o sea JS en el hilo principal durante 600ms y un
  // setter que fuerza trabajo de scroll por frame. El navegador hace lo mismo en
  // su propio pipeline y con la misma curva; solo cae al salto instantaneo si la
  // persona pidio menos movimiento.
  if (prefersReducedMotion()) {
    el.scrollLeft = target
    scheduleCheck()
    return
  }
  el.scrollTo({ left: target, behavior: 'smooth' })
}

const handleScroll = () => {
  scheduleCheck()
}

let mutationObserver: MutationObserver | null = null
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  const el = scrollContainer.value
  if (!el) return

  // Primer cálculo tras el primer paint (sustituye a los dos setTimeout).
  measure()
  requestAnimationFrame(checkScroll)

  // Solo el alta/baja de slides (hijos directos del slot), no atributos/texto/subárbol:
  // evita ráfagas de forced-reflow por cada <img> que carga o cada cambio de clase.
  mutationObserver = new MutationObserver(() => {
    measure()
    scheduleCheck()
  })
  mutationObserver.observe(el, { childList: true })

  // Cambios de tamaño del contenedor: más preciso que el listener global de 'resize'.
  resizeObserver = new ResizeObserver(() => {
    measure()
    scheduleCheck()
  })
  resizeObserver.observe(el)
})

onUnmounted(() => {
  mutationObserver?.disconnect()
  resizeObserver?.disconnect()
  if (scheduled) cancelAnimationFrame(scheduled)
})

defineExpose({ checkScroll })
</script>
