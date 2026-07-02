// Registro central de fuentes + agregador. Aquí se enchufarán Torrentio (Fase 2)
// y el motor torrent local (Fase 3) añadiendo más StreamSource a la lista.
import type { Media, Stream, StreamSource } from './types'
import { vimeusSource } from './vimeus.source'
import { torrentioSource } from './torrentio.source'

/** Orden de preferencia base de las fuentes (se afina con `weight` por stream). */
export const STREAM_SOURCES: StreamSource[] = [
  vimeusSource,
  torrentioSource,
  // animeav1Source,    ← futuro
]

export interface SourceResult {
  sourceId: string
  label: string
  streams: Stream[]
  /** Mensaje si la fuente falló (no tumba al resto). */
  error?: string
}

/**
 * Consulta TODAS las fuentes activas en paralelo. Una fuente que falla o tarda
 * no impide que las demás devuelvan resultados (Promise.allSettled).
 */
export async function fetchAllStreams(media: Media): Promise<SourceResult[]> {
  const active = STREAM_SOURCES.filter((s) => s.isEnabled())

  const settled = await Promise.allSettled(
    active.map(
      async (s): Promise<SourceResult> => ({
        sourceId: s.id,
        label: s.label,
        streams: await s.getStreams(media),
      }),
    ),
  )

  return settled.map((r, i): SourceResult => {
    if (r.status === 'fulfilled') return r.value
    const src = active[i]! // i siempre válido: settled tiene la misma longitud que active
    return { sourceId: src.id, label: src.label, streams: [], error: String(r.reason) }
  })
}

/** Lista plana de todos los streams, ordenada por `weight` (mejor primero). */
export async function fetchStreams(media: Media): Promise<Stream[]> {
  const results = await fetchAllStreams(media)
  return results
    .flatMap((r) => r.streams)
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
}
