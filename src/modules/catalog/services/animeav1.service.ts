import { API_CONFIG } from '@/core/config/api.config'
import type {
  AV1AnimeCard,
  AV1AnimeInfo,
  AV1CatalogResponse,
  AV1EpisodeLinks,
  AV1Franchise,
  AV1RecentsResponse,
  AV1Schedule,
  AV1SearchResponse,
} from '../types/animeav1.types'

class AnimeAV1Service {
  private base: string
  private site: string

  constructor() {
    this.base = API_CONFIG.ANIMEAV1.API_URL
    this.site = API_CONFIG.ANIMEAV1.SITE_URL
  }

  /** Construye la URL del anime en animeav1.com a partir del slug */
  animeUrl(slug: string): string {
    return `${this.site}/media/${slug}`
  }

  /** Construye la URL de un episodio en animeav1.com */
  episodeUrl(slug: string, episode: number | string): string {
    return `${this.site}/media/${slug}/${episode}`
  }

  /** Info de un anime por slug (ej: "one-piece") */
  getAnimeInfoBySlug(slug: string): Promise<AV1AnimeInfo> {
    return this.getAnimeInfo(this.animeUrl(slug))
  }

  /** Links/servidores de un episodio por slug + número */
  getEpisodeBySlug(slug: string, episode: number | string): Promise<AV1EpisodeLinks> {
    return this.getEpisode(this.episodeUrl(slug, episode))
  }

  /** Cadena de temporadas (franquicia) de un anime por slug */
  async getFranchise(slug: string): Promise<AV1Franchise> {
    const res = await fetch(`${this.base}/api/anime/franchise?slug=${encodeURIComponent(slug)}`)
    if (!res.ok) throw new Error('Error al obtener temporadas')
    return res.json()
  }

  async getRecents(): Promise<AV1RecentsResponse> {
    const res = await fetch(`${this.base}/api/recents`)
    if (!res.ok) throw new Error('Error al obtener recientes')
    return res.json()
  }

  async search(query: string): Promise<AV1SearchResponse> {
    const res = await fetch(`${this.base}/api/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error('Error en la búsqueda')
    return res.json()
  }

  async getCatalog(page = 1, genre = ''): Promise<AV1CatalogResponse> {
    const params = new URLSearchParams({ page: String(page) })
    if (genre) params.set('genre', genre)
    const res = await fetch(`${this.base}/api/catalog?${params}`)
    if (!res.ok) throw new Error('Error al obtener catálogo')
    return res.json()
  }

  async getAnimeInfo(animeUrl: string): Promise<AV1AnimeInfo> {
    const res = await fetch(`${this.base}/api/anime/info?url=${encodeURIComponent(animeUrl)}`)
    if (!res.ok) throw new Error('Error al obtener información del anime')
    return res.json()
  }

  async getEpisode(episodeUrl: string): Promise<AV1EpisodeLinks> {
    const res = await fetch(`${this.base}/api/episode?url=${encodeURIComponent(episodeUrl)}`)
    if (!res.ok) throw new Error('Error al obtener el episodio')
    return res.json()
  }

  async getSchedule(): Promise<AV1Schedule> {
    const res = await fetch(`${this.base}/api/schedule`)
    if (!res.ok) throw new Error('Error al obtener horario')
    return res.json()
  }

  async searchAnimes(query: string): Promise<AV1AnimeCard[]> {
    const data = await this.search(query)
    return data.results
  }

  isAvailable(): Promise<boolean> {
    return fetch(`${this.base}/health`)
      .then((r) => r.ok)
      .catch(() => false)
  }
}

export const animeav1Service = new AnimeAV1Service()
export default animeav1Service
