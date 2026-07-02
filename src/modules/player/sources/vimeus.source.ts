// Vimeus como StreamSource. Envuelve el vimeusService existente sin cambiarlo:
// produce un único stream `iframe` (el embed maneja su propio códec). La
// disponibilidad real se verifica al reproducir (el HEAD-check del PlayerView).
import { vimeusService } from '../services/vimeus.service'
import type { Media, Stream, StreamSource } from './types'
import type { VimeusContentType } from '../types/vimeus.types'

const VIMEUS_TYPE: Record<Media['type'], VimeusContentType> = {
  movie: 'movie',
  tv: 'serie',
  anime: 'anime',
}

export const vimeusSource: StreamSource = {
  id: 'vimeus',
  label: 'Vimeus',

  isEnabled() {
    return vimeusService.isConfigured()
  },

  async getStreams(media: Media): Promise<Stream[]> {
    const url = vimeusService.getEmbedUrl(VIMEUS_TYPE[media.type], {
      tmdbId: media.tmdbId,
      imdbId: media.imdbId,
      season: media.season,
      episode: media.episode,
    })

    return [
      {
        sourceId: 'vimeus',
        label: 'Vimeus',
        kind: 'iframe',
        url,
        playable: true,
        weight: 100, // fuente principal por ahora
      },
    ]
  },
}
