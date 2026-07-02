// Composable que consulta las fuentes de stream para un contenido y expone el
// estado a la UI (lista "Ver con…", auto-play del mejor, cambio manual).
import { ref } from 'vue'
import type { Media, Stream } from '../sources/types'
import { fetchAllStreams, type SourceResult } from '../sources/registry'

export function useStreamSources() {
  const loading = ref(false)
  /** Resultado por fuente (para mostrar qué fuente aportó qué). */
  const results = ref<SourceResult[]>([])
  /** Lista plana ordenada por preferencia (mejor primero). */
  const streams = ref<Stream[]>([])

  async function load(media: Media) {
    loading.value = true
    results.value = []
    streams.value = []
    try {
      const res = await fetchAllStreams(media)
      results.value = res
      streams.value = res
        .flatMap((r) => r.streams)
        .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    } finally {
      loading.value = false
    }
  }

  return { loading, results, streams, load }
}
