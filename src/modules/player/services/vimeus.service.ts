import { API_CONFIG } from '@/core/config/api.config'
import type { VimeusEmbedOptions, VimeusContentType } from '../types/vimeus.types'

class VimeusService {
  private embedUrl: string
  private viewKey: string

  // Parámetros por defecto del player
  private defaultPlayerParams = {
    title: 'Vumies',
    theme: 'minimal',
    font: 'v3',
    overlay: 'v5',
    epanel: 'v3',
    splash: 'v3',
  }

  constructor() {
    this.embedUrl = API_CONFIG.VIMEUS.EMBED_URL
    this.viewKey = API_CONFIG.VIMEUS.VIEW_KEY
  }

  /**
   * Agrega parámetros de personalización del player
   */
  private addPlayerParams(params: URLSearchParams, options: VimeusEmbedOptions): void {
    // Agregar título personalizado
    params.append('title', this.defaultPlayerParams.title)

    // Usar tema personalizado o el por defecto
    params.append('theme', options.theme || this.defaultPlayerParams.theme)

    // Agregar parámetros de diseño
    params.append('font', this.defaultPlayerParams.font)
    params.append('overlay', this.defaultPlayerParams.overlay)
    params.append('epanel', this.defaultPlayerParams.epanel)
    params.append('splash', this.defaultPlayerParams.splash)

    // Parámetros opcionales adicionales
    if (options.logoUrl) params.append('logo_url', options.logoUrl)
    if (options.primaryColor) params.append('primary_color', options.primaryColor)
  }

  /**
   * Genera URL de embed para películas
   */
  getMovieEmbedUrl(options: VimeusEmbedOptions): string {
    const params = new URLSearchParams()

    if (options.tmdbId) {
      params.append('tmdb', options.tmdbId.toString())
    } else if (options.imdbId) {
      params.append('imdb', options.imdbId)
    }

    params.append('view_key', this.viewKey)

    // Agregar parámetros de personalización del player
    this.addPlayerParams(params, options)

    return `${this.embedUrl}/movie?${params.toString()}`
  }

  /**
   * Genera URL de embed para series
   */
  getSeriesEmbedUrl(options: VimeusEmbedOptions): string {
    const params = new URLSearchParams()

    if (options.tmdbId) {
      params.append('tmdb', options.tmdbId.toString())
    } else if (options.imdbId) {
      params.append('imdb', options.imdbId)
    }

    // Temporada y episodio específicos
    if (options.season !== undefined) params.append('se', options.season.toString())
    if (options.episode !== undefined) params.append('ep', options.episode.toString())

    params.append('view_key', this.viewKey)

    // Agregar parámetros de personalización del player
    this.addPlayerParams(params, options)

    return `${this.embedUrl}/serie?${params.toString()}`
  }

  /**
   * Genera URL de embed para anime
   */
  getAnimeEmbedUrl(options: VimeusEmbedOptions): string {
    const params = new URLSearchParams()

    if (options.tmdbId) {
      params.append('tmdb', options.tmdbId.toString())
    } else if (options.imdbId) {
      params.append('imdb', options.imdbId)
    }

    // Temporada y episodio específicos
    if (options.season !== undefined) params.append('se', options.season.toString())
    if (options.episode !== undefined) params.append('ep', options.episode.toString())

    params.append('view_key', this.viewKey)

    // Agregar parámetros de personalización del player
    this.addPlayerParams(params, options)

    return `${this.embedUrl}/anime?${params.toString()}`
  }

  /**
   * Método genérico para obtener embed URL según tipo
   */
  getEmbedUrl(type: VimeusContentType, options: VimeusEmbedOptions): string {
    switch (type) {
      case 'movie':
        return this.getMovieEmbedUrl(options)
      case 'serie':
        return this.getSeriesEmbedUrl(options)
      case 'anime':
        return this.getAnimeEmbedUrl(options)
      default:
        throw new Error(`Tipo de contenido no válido: ${type}`)
    }
  }

  /**
   * Valida que tengamos view_key configurada
   */
  isConfigured(): boolean {
    return !!this.viewKey && this.viewKey !== ''
  }
}

export const vimeusService = new VimeusService()
export default vimeusService

