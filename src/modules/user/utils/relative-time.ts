const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Etiqueta corta de antigüedad; a partir de una semana, fecha. */
export function relativeTime(at: number): string {
  const age = Date.now() - at
  if (age < MINUTE) return 'ahora'
  if (age < HOUR) return `hace ${Math.floor(age / MINUTE)} min`
  if (age < DAY) return `hace ${Math.floor(age / HOUR)} h`
  if (age < 7 * DAY) return `hace ${Math.floor(age / DAY)} d`
  const date = new Date(at)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}
