// ============================================================================
// Extra embed sources (TMDB-id based, no key).
// ----------------------------------------------------------------------------
// Vimeus stays the primary source; PlayLatinSRC is the second one because it is
// the only other provider that serves **Spanish audio** (Latino, Castellano and
// subbed versions selectable inside its own player). The rest are fallbacks for
// when a title is missing or a source is down.
//
// Every template was verified by probing it with a real TMDB id, movie AND tv
// (odd/tasks/continue-watching.md, L12). A provider that did not answer both is
// not here: VidSrc (429 for scripted probes and the human reporting it broken),
// EmbedWave (removed on request), VidLink (unreachable), 2Embed (301 loop),
// VidEasy (redirect to an unreachable host), Stellar and AutoEmbed (tv route 404
// with the documented shape).
// ============================================================================
import type { Media, Stream, StreamSource } from './types'

interface ProviderTemplates {
  id: string
  label: string
  /** Higher runs earlier in the "Fuentes" list; Vimeus is 100. */
  weight: number
  /**
   * Only set when the provider states it or the probe found it. Left undefined
   * rather than guessed: the picker shows nothing instead of a wrong language.
   */
  languageLabel?: string
  movie: (tmdbId: number) => string
  tv: (tmdbId: number, season: number, episode: number) => string
}

const PROVIDERS: ProviderTemplates[] = [
  {
    id: 'playlatinsrc',
    label: 'PlayLatinSRC',
    weight: 95,
    languageLabel: 'Latino · Castellano · Subtitulado',
    movie: (id) => `https://playlatinsrc.co/movie/${id}`,
    // Ruta documentada por ellos: /serial/{id} para la serie entera y
    // /custom/serial/{id}/{s}/{e} para un episodio. Con /tv/... caia en su home.
    tv: (id, season, episode) => `https://playlatinsrc.co/custom/serial/${id}/${season}/${episode}`,
  },
  {
    id: 'vidfast',
    label: 'VidFast',
    weight: 75,
    languageLabel: 'Inglés',
    movie: (id) => `https://vidfast.pro/movie/${id}`,
    tv: (id, season, episode) => `https://vidfast.pro/tv/${id}/${season}/${episode}`,
  },
  {
    id: 'vidnest',
    label: 'VidNest',
    weight: 65,
    languageLabel: 'Subtítulos automáticos',
    movie: (id) => `https://vidnest.pro/movie/${id}`,
    tv: (id, season, episode) => `https://vidnest.pro/tv/${id}/${season}/${episode}`,
  },
]

function build(template: ProviderTemplates, media: Media): Stream {
  const season = media.season ?? 1
  const episode = media.episode ?? 1
  const url =
    media.type === 'movie'
      ? template.movie(media.tmdbId)
      : template.tv(media.tmdbId, season, episode)

  return {
    sourceId: template.id,
    label: template.label,
    kind: 'iframe',
    url,
    playable: true,
    weight: template.weight,
    languageLabel: template.languageLabel,
  }
}

export const embedProviderSources: StreamSource[] = PROVIDERS.map((template) => ({
  id: template.id,
  label: template.label,
  isEnabled: () => true,
  getStreams: async (media: Media) => [build(template, media)],
}))
