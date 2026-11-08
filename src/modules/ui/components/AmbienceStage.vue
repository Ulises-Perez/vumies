<template>
  <!--
    Ambilight: luz ambiente derivada del arte que la pestaña actual está mostrando.
    Vive por debajo del contenido (`z-0`, el contenido va en `z-10`), nunca intercepta
    punteros y se reutiliza la misma URL de imagen que ya carga la vista, así que no
    suma peso de red: solo un decodificado pequeño por capa.
  -->
  <div class="ambience" aria-hidden="true">
    <!-- Piso de marca: mantiene profundidad cuando la ruta todavía no tiene arte. -->
    <div class="ambience__brand" :class="{ 'is-muted': !!source }" />

    <Transition name="ambience-fade">
      <div v-if="source" :key="source" class="ambience__art">
        <span class="ambience__glow ambience__glow--left" :style="artStyle" />
        <span class="ambience__glow ambience__glow--right" :style="artStyle" />
        <span class="ambience__glow ambience__glow--floor" :style="artStyle" />
      </div>
    </Transition>

    <!-- Velo central: protege el contraste del texto sin apagar la luz de los bordes. -->
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

.ambience__glow {
  position: absolute;
  display: block;
  width: clamp(16rem, 34vw, 30rem);
  height: clamp(16rem, 34vw, 30rem);
  border-radius: 50%;
  background-size: cover;
  background-repeat: no-repeat;
  /* El desenfoque es el efecto: se calcula una sola vez por capa y no se anima,
     así que no se re-rasteriza mientras el usuario hace scroll. */
  filter: blur(58px) saturate(1.75);
  opacity: 0.4;
}

.ambience__glow--left {
  left: -8rem;
  top: 26%;
  background-position: 8% 26%;
}

.ambience__glow--right {
  right: -8rem;
  top: 40%;
  background-position: 92% 36%;
}

.ambience__glow--floor {
  left: 50%;
  bottom: -11rem;
  width: clamp(20rem, 60vw, 58rem);
  height: clamp(12rem, 26vh, 22rem);
  margin-left: calc(clamp(20rem, 60vw, 58rem) / -2);
  background-position: 50% 92%;
  filter: blur(64px) saturate(1.6);
  opacity: 0.46;
}

.ambience__veil {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    125% 85% at 50% 42%,
    oklch(var(--background) / 0.55) 0%,
    oklch(var(--background) / 0.3) 52%,
    transparent 100%
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
