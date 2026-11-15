<template>
  <div
    v-if="show"
    class="fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 md:bottom-6"
    role="status"
  >
    <div
      class="flex items-center gap-3 rounded-full border border-border bg-card/95 py-2 pl-4 pr-2 shadow-lg backdrop-blur"
    >
      <p class="text-sm text-foreground">Hay una versión nueva</p>
      <button
        type="button"
        class="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="reload"
      >
        Recargar
      </button>
      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Descartar aviso"
        @click="dismissed = true"
      >
        <svg
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const updateReady = ref(false)
const dismissed = ref(false)

// El chunk de entrada lleva el hash de la version: si el index.html servido
// apunta a otro, hay un deploy nuevo. En dev el src es /src/main.ts y el regex
// no matchea, asi que el aviso nunca aparece.
const currentAsset = document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src ?? ''

// Nunca sobre el player: un aviso encima del video es ruido, y el usuario lo ve
// igual al salir (updateReady queda pegado).
const show = computed(() => updateReady.value && !dismissed.value && route.name !== 'player')

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
