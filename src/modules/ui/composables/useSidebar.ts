import { ref } from 'vue'

// Estado singleton (a nivel de módulo) del sidebar flotante.
// Cualquier componente que importe el composable comparte el mismo `isOpen`.
// No se persiste a propósito: el sidebar arranca cerrado en cada carga (S1).
const isOpen = ref(false)

export function useSidebar() {
  return {
    isOpen,
    open: () => { isOpen.value = true },
    close: () => { isOpen.value = false },
    toggle: () => { isOpen.value = !isOpen.value },
  }
}
