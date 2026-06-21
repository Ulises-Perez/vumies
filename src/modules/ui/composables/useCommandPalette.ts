import { ref } from 'vue'

// Estado singleton (a nivel de módulo) del command palette ⌘K.
// Cualquier componente que importe el composable comparte el mismo `isOpen`.
const isOpen = ref(false)

export function useCommandPalette() {
  return {
    isOpen,
    open: () => { isOpen.value = true },
    close: () => { isOpen.value = false },
    toggle: () => { isOpen.value = !isOpen.value },
  }
}
