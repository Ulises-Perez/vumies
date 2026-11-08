import { onUnmounted, ref, watch, type WatchSource } from 'vue'

/**
 * Fuente única del ambilight: la imagen que la vista actual está mostrando.
 * Singleton a nivel de módulo, igual que `useCommandPalette`/`useSidebar`.
 */
const source = ref<string | null>(null)

/**
 * Retardo de limpieza: durante una transición de ruta la vista vieja se desmonta
 * antes de que la nueva publique su arte. Sin este margen el ambilight parpadearía
 * a negro entre pestañas.
 */
const CLEAR_DELAY = 320
let pendingClear: ReturnType<typeof setTimeout> | null = null

function cancelPendingClear() {
  if (pendingClear) {
    clearTimeout(pendingClear)
    pendingClear = null
  }
}

function scheduleClear() {
  if (pendingClear) return
  pendingClear = setTimeout(() => {
    source.value = null
    pendingClear = null
  }, CLEAR_DELAY)
}

/** Publica la imagen de origen. Un `null` programa la limpieza diferida. */
function publish(next: string | null | undefined) {
  cancelPendingClear()
  if (next) source.value = next
  else scheduleClear()
}

export function useAmbience() {
  return { source, publish, clear: scheduleClear }
}

/**
 * Enlaza una vista al ambilight: publica su arte mientras está montada y lo limpia
 * al desmontarse. La fuente se pasa como getter/watch-source, así reacciona cuando
 * los datos del catálogo llegan después del primer render.
 */
export function useAmbienceSource(getSource: WatchSource<string | null | undefined>) {
  watch(getSource, (next) => publish(next), { immediate: true })
  onUnmounted(scheduleClear)
}
