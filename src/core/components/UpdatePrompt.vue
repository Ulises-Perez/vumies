<template>
  <Transition name="update-pill">
    <div
      v-if="show"
      class="fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 md:bottom-6"
      role="status"
    >
      <!-- Misma receta que la pildora del BottomMenu: superficie de card, blur,
           borde de 1px y sombra con offset. Sin boton de descarte: el aviso se
           va cuando el usuario recarga, no antes. -->
      <div
        class="flex items-center gap-3 rounded-full border border-border bg-card/95 py-1.5 pl-4 pr-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.2)] backdrop-blur-xl"
      >
        <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        <p class="text-[13px] font-medium text-foreground">Nueva versión disponible</p>
        <button
          type="button"
          class="motion-press inline-flex h-8 items-center rounded-full bg-primary-strong px-3.5 text-[13px] font-semibold text-primary-strong-foreground shadow-sm transition-colors hover:bg-primary-strong/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
          @click="reload"
        >
          Recargar
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const updateReady = ref(false)

// El chunk de entrada lleva el hash de la version: si el index.html servido
// apunta a otro, hay un deploy nuevo. En dev el src es /src/main.ts y el regex
// no matchea, asi que el aviso nunca aparece.
const currentAsset = document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src ?? ''

// Nunca sobre el player: un aviso encima del video es ruido, y el usuario lo ve
// igual al salir (updateReady queda pegado).
const show = computed(() => updateReady.value && route.name !== 'player')

async function check() {
  if (!currentAsset || updateReady.value) return
  try {
    const res = await fetch('/', { cache: 'no-store' })
    if (!res.ok) return
    const next = /assets\/index-[A-Za-z0-9_-]+\.js/.exec(await res.text())?.[0]
    if (next && !currentAsset.includes(next)) updateReady.value = true
  } catch {
    // Sin red: se reintenta en el proximo foco o intervalo.
  }
}

function tick() {
  if (document.visibilityState === 'visible') void check()
}

function reload() {
  window.location.reload()
}

// Navegar es el otro momento natural para enterarse: un usuario que recorre el
// catalogo no tiene que esperar al intervalo. Una vez detectado, check() corta.
watch(() => route.fullPath, tick)

let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  document.addEventListener('visibilitychange', tick)
  window.addEventListener('focus', tick)
  // Mismo ritmo que el refresco de datos: una pestaña abierta toda la tarde
  // tambien se entera.
  timer = setInterval(tick, 10 * 60_000)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', tick)
  window.removeEventListener('focus', tick)
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
/* Entrada desde un estado ya visible: sube 10px y aparece. El bloque global de
   prefers-reduced-motion ya neutraliza la transicion. */
.update-pill-enter-active {
  transition:
    opacity 240ms var(--ease-out-quint),
    transform 320ms var(--ease-out-quint);
}

.update-pill-leave-active {
  transition:
    opacity 160ms ease,
    transform 200ms ease;
}

.update-pill-enter-from,
.update-pill-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
