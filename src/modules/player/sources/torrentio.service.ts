import { API_CONFIG } from '@/core/config/api.config'
import type { TorrentioResponse, TorrentioStream } from './torrentio.types'

/**
 * Cliente del addon Torrentio. Solo descubre streams (metadata) — la
 * reproducción del torrent la hará el motor local en Fase 3. Torrentio envía
 * CORS `*`, así que se puede llamar directo desde el webview.
 */
class TorrentioService {
  private base = API_CONFIG.TORRENTIO.BASE_URL.replace(/\/$/, '')

  /**
   * @param type 'movie' | 'series'
   * @param id   'tt0111161' (película) o 'tt0944947:1:1' (serie: imdb:temporada:episodio)
   */
  async getStreams(type: 'movie' | 'series', id: string): Promise<TorrentioStream[]> {
    // OJO: los ':' van literales en la ruta (convención de addons Stremio).
    const res = await fetch(`${this.base}/stream/${type}/${id}.json`)
    if (!res.ok) throw new Error(`Torrentio ${res.status} ${res.statusText}`)
    const data = (await res.json()) as TorrentioResponse
    return data.streams || []
  }
}

export const torrentioService = new TorrentioService()
export default torrentioService
