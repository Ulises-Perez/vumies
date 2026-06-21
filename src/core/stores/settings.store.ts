import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Theme = 'dark' | 'light' | 'system'

const THEME_KEY = 'vumies_theme'
const MOTION_KEY = 'vumies_reduced_motion'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<Theme>('dark')
  const reducedMotion = ref(false)

  function systemPrefersDark(): boolean {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
  }

  function applyTheme() {
    const isDark = theme.value === 'dark' || (theme.value === 'system' && systemPrefersDark())
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }

  function applyReducedMotion() {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion.value)
  }

  function setTheme(value: Theme) {
    theme.value = value
    try { localStorage.setItem(THEME_KEY, value) } catch { /* almacenamiento no disponible */ }
    applyTheme()
  }

  function setReducedMotion(value: boolean) {
    reducedMotion.value = value
    try { localStorage.setItem(MOTION_KEY, value ? '1' : '0') } catch { /* almacenamiento no disponible */ }
    applyReducedMotion()
  }

  // Carga preferencias + aplica al DOM. Llamar una vez al arrancar la app.
  function init() {
    try {
      const storedTheme = localStorage.getItem(THEME_KEY)
      if (storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system') {
        theme.value = storedTheme
      }
      reducedMotion.value = localStorage.getItem(MOTION_KEY) === '1'
    } catch { /* almacenamiento no disponible */ }

    applyTheme()
    applyReducedMotion()

    // Si el usuario eligió "Sistema", seguir los cambios del SO en vivo.
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
      if (theme.value === 'system') applyTheme()
    })
  }

  return { theme, reducedMotion, setTheme, setReducedMotion, init }
})
