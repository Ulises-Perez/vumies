/** Elementos que pueden recibir foco por Tab dentro de un contenedor. */
export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Mantiene el foco dentro de `panel` mientras está abierto (diálogos y overlays). */
export function trapTab(e: KeyboardEvent, panel: HTMLElement | null) {
  if (!panel) return
  const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null,
  )
  if (!nodes.length) return
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  if (!first || !last) return
  const active = document.activeElement as HTMLElement | null
  const outside = !active || !panel.contains(active)
  if (e.shiftKey) {
    if (outside || active === first) {
      e.preventDefault()
      last.focus()
    }
  } else if (outside || active === last) {
    e.preventDefault()
    first.focus()
  }
}
