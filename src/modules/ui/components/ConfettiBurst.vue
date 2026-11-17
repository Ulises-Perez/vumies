<template>
  <Teleport to="body">
    <div
      v-if="show"
      ref="dialogRef"
      class="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-background px-6"
      role="dialog"
      aria-modal="true"
      :aria-label="`${title} ${name}`"
      tabindex="-1"
      @click="close"
      @keydown="onKeydown"
    >
      <!-- Confeti: piezas creadas por JS, animadas solo con transform/opacity. -->
      <div ref="confettiRef" class="pointer-events-none absolute inset-0" aria-hidden="true" />

      <div class="relative text-center" @click.stop>
        <h2 class="celebrate-in font-poppins tracking-tight text-foreground">
          <span class="block text-2xl font-semibold md:text-3xl">{{ title }}</span>
          <span class="mt-1 block text-6xl font-bold md:text-8xl">{{ name }}</span>
        </h2>
        <div class="celebrate-in-late">
          <p v-if="note" class="mx-auto mt-5 max-w-sm text-sm text-muted-foreground md:text-base">
            {{ note }}
          </p>
          <BaseButton variant="outline" class="mt-8" @click="close">Cerrar</BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { prefersReducedMotion } from '@/core/utils/motion'
import { trapTab } from '@/core/utils/focusTrap'
import { BaseButton } from './base'

const props = withDefaults(
  defineProps<{ show: boolean; title?: string; name?: string; note?: string }>(),
  {
    title: 'Feliz cumpleaños,',
    name: 'Miranda',
    note: 'Espero te guste.',
  },
)

const emit = defineEmits<{ close: [] }>()

const dialogRef = ref<HTMLElement | null>(null)
const confettiRef = ref<HTMLElement | null>(null)

// Cinco tonos alrededor del violeta de la marca: un arcoiris entero se ve de fiesta ajena.
const COLORS = ['#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b', '#14b8a6'] as const

let lastFocused: HTMLElement | null = null

const rand = (min: number, max: number) => min + Math.random() * (max - min)

function makePiece(still: boolean) {
  const el = document.createElement('span')
  el.className = 'confetti'

  // Tres formas: rectangulo, circulo y cinta.
  const shape = Math.random()
  const ribbon = shape > 0.86
  const dot = shape > 0.7 && !ribbon
  const w = ribbon ? rand(4, 6) : dot ? rand(7, 10) : rand(8, 13)
  const h = ribbon ? rand(18, 28) : dot ? w : rand(10, 17)

  // Tres planos: lejos chico y apagado, cerca grande y opaco.
  const depth = Math.random()
  const scale = depth < 0.34 ? 0.62 : depth < 0.72 ? 0.85 : 1
  const dur = rand(3.2, 6.5)

  el.style.setProperty('--x', `${rand(0, 100).toFixed(1)}%`)
  el.style.setProperty('--w', `${(w * scale).toFixed(1)}px`)
  el.style.setProperty('--h', `${(h * scale).toFixed(1)}px`)
  el.style.setProperty('--c', COLORS[Math.floor(Math.random() * COLORS.length)] ?? COLORS[0])
  el.style.setProperty('--r', ribbon ? '2px' : dot ? '50%' : '1px')
  el.style.setProperty('--o', depth < 0.34 ? '0.55' : depth < 0.72 ? '0.8' : '1')
  el.style.setProperty('--drift', `${rand(-90, 90).toFixed(0)}px`)
  el.style.setProperty('--sway', `${rand(8, 34).toFixed(0)}px`)
  el.style.setProperty('--rot', `${rand(360, 900).toFixed(0)}deg`)
  el.style.setProperty('--ax', rand(0.15, 1).toFixed(2))
  el.style.setProperty('--ay', rand(0.15, 1).toFixed(2))
  el.style.setProperty('--dur', `${dur.toFixed(2)}s`)
  el.style.setProperty('--flutter', `${(dur / rand(3, 6)).toFixed(2)}s`)
  // Desfase negativo: al abrir, la pantalla ya esta llena y nunca se vacia.
  el.style.setProperty('--delay', `${(-Math.random() * dur).toFixed(2)}s`)

  if (still) {
    el.classList.add('is-static')
    el.style.setProperty('--y', `${rand(4, 92).toFixed(1)}vh`)
  }

  const inner = document.createElement('span')
  inner.className = 'confetti__inner'
  el.append(inner)
  return el
}

function spawn() {
  const host = confettiRef.value
  if (!host) return
  host.replaceChildren()
  // Con "Reducir movimiento" el confeti queda repartido y quieto: la celebracion se lee igual.
  const still = prefersReducedMotion()
  const frag = document.createDocumentFragment()
  for (let i = 0; i < (still ? 44 : 72); i++) frag.append(makePiece(still))
  host.append(frag)
}

function close() {
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
    return
  }
  if (e.key === 'Tab') trapTab(e, dialogRef.value)
}

watch(
  () => props.show,
  async (open) => {
    if (open) {
      lastFocused = document.activeElement as HTMLElement | null
      await nextTick()
      dialogRef.value?.focus()
      spawn()
    } else {
      confettiRef.value?.replaceChildren()
      lastFocused?.focus()
      lastFocused = null
    }
  },
  { immediate: true },
)
</script>