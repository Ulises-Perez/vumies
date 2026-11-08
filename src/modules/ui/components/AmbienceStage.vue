<template>
  <!--
    Ambilight: luz ambiente derivada del arte que la pestaña actual está mostrando.
    Vive por debajo del contenido (`z-0`, el contenido va en `z-10`), nunca intercepta
    punteros y reutiliza la misma URL de imagen que la vista ya cargó, así que no
    suma peso de red.

    Diseño: dos capas que no forman objeto propio. Una tinta de cuerpo entero muy
    baja (da color a la pestaña sin dibujar una forma) y un derrame suave en el borde
    inferior, enmascarado para que se disuelva antes de tocar el contenido. Sin
    manchas laterales ni bandas: la luz no compite con lo que se lee.
  -->
  <div class="ambience" aria-hidden="true">
    <!-- Piso de marca: mantiene profundidad cuando la ruta todavía no tiene arte. -->
    <div class="ambience__brand" :class="{ 'is-muted': !!source }" />

    <Transition name="ambience-fade">
      <div v-if="source" :key="source" class="ambience__art">
        <span class="ambience__tint" :style="artStyle" />
        <span class="ambience__spill" :style="artStyle" />
      </div>
    </Transition>

    <!-- Velo: unifica el tono y baja la luz donde vive el texto. -->
    <div class="ambience__veil" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAmbience } from '../composables/useAmbience'

const { source } = useAmbience()

const artStyle = computed(() =>
  source.value ? { backgroundImage: `url("${source.value}")` } : undefined,
)
</script>

<style scoped>
.ambience {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  contain: paint;
}

/* ===== Piso de marca ===== */
.ambience__brand {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(70% 55% at 12% 0%, oklch(var(--primary) / 0.16), transparent 72%),
    radial-gradient(60% 50% at 92% 6%, oklch(0.62 0.19 330 / 0.1), transparent 72%);
  transition: opacity 500ms ease;
}

/* Cuando hay arte real la marca pasa a segundo plano. */
.ambience__brand.is-muted {
  opacity: 0.45;
}

/* ===== Capas de arte ===== */
.ambience__art {
  position: absolute;
  inset: 0;
}

/* Tinta de cuerpo entero: el arte estirado y desenfocado a muy baja opacidad.
   No dibuja una forma reconocible, solo tiñe la pestaña. */
.ambience__tint {
  position: absolute;
  inset: -12%;
  display: block;
  background-size: cover;
  background-position: 50% 22%;
  background-repeat: no-repeat;
  filter: blur(80px) saturate(1.5);
  opacity: 0.19;
}

/* Derrame del borde inferior: el único acento, y se disuelve en todas direcciones
   antes de llegar a la columna de contenido. */
.ambience__spill {
  position: absolute;
  left: 50%;
  bottom: -6rem;
  display: block;
  width: min(72rem, 130vw);
  height: clamp(9rem, 24vh, 17rem);
  transform: translateX(-50%);
  border-radius: 50%;
  background-size: cover;
  background-position: 50% 88%;
  background-repeat: no-repeat;
  filter: blur(64px) saturate(1.45);
  opacity: 0.3;
  -webkit-mask-image: radial-gradient(closest-side, #000 18%, transparent 100%);
  mask-image: radial-gradient(closest-side, #000 18%, transparent 100%);
}

/* Velo: lleva el borde inferior hacia el color de página para que la luz no
   termine en una banda con borde propio. */
.ambience__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    oklch(var(--background) / 0.08) 0%,
    oklch(var(--background) / 0.22) 42%,
    oklch(var(--background) / 0.42) 78%,
    oklch(var(--background) / 0.58) 100%
  );
}

/* ===== Cambio de pestaña: fundido cruzado del arte ===== */
.ambience-fade-enter-active,
.ambience-fade-leave-active {
  transition: opacity 640ms ease;
}

.ambience-fade-enter-from,
.ambience-fade-leave-to {
  opacity: 0;
}

/* ===== Movimiento reducido ===== */
@media (prefers-reduced-motion: reduce) {
  .ambience-fade-enter-active,
  .ambience-fade-leave-active,
  .ambience__brand {
    transition: none;
  }
}

html.reduce-motion .ambience-fade-enter-active,
html.reduce-motion .ambience-fade-leave-active,
html.reduce-motion .ambience__brand {
  transition: none;
}
</style>
