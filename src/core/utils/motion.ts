/**
 * Devuelve true si el usuario activó "Reducir movimiento": ya sea en su sistema
 * (prefers-reduced-motion) o manualmente en Ajustes (clase .reduce-motion en <html>).
 * Úsalo para que el scroll animado por JS (window.scrollTo / rAF) lo respete,
 * que el CSS por sí solo no puede cubrir (WCAG 2.3.3).
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  const manual = document.documentElement.classList.contains('reduce-motion')
  const system =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return manual || system
}

/** behavior para scroll programático según la preferencia del usuario. */
export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth'
}
