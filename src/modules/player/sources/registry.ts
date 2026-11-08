// Central stream-source registry and aggregator.
//
// Web-only build: the Vimeus iframe is the single playable source. Native
// sources (local torrent engine, native video driver) cannot run in a browser, so no
// other source is registered here.
import type { Media, Stream, StreamSource } from './types'
import { vimeusSource } from './vimeus.source'

/** Base preference order of the sources (refined with `weight` per stream). */
export const STREAM_SOURCES: StreamSource[] = [
  vimeusSource,
]

export interface SourceResult {
  sourceId: string
  label: string
  streams: Stream[]
  /** Message when the source failed (does not take down the rest). */
  error?: string
}

/**
 * Queries ALL active sources in parallel. A source that fails or is slow
 * does not prevent the others from returning results (Promise.allSettled).
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
    const src = active[i]! // i is always valid: settled has the same length as active
    return { sourceId: src.id, label: src.label, streams: [], error: String(r.reason) }
  })
}

/** Flat list of all streams, ordered by `weight` (best first). */
export async function fetchStreams(media: Media): Promise<Stream[]> {
  const results = await fetchAllStreams(media)
  return results
    .flatMap((r) => r.streams)
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
}
