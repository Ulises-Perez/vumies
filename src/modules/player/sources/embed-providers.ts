// ============================================================================
// Extra embed sources (TMDB-id based, no key).
// ----------------------------------------------------------------------------
// Vimeus is the primary source: it is the only one that ships a Spanish library
// out of the box. These providers are iframe embeds keyed by the TMDB id we
// already have, so adding one costs a URL template and nothing else. They are
// deliberately ranked BELOW Vimeus: their catalog is English-leaning (with
// multi-language subtitles on most titles), so they act as fallbacks when a
// title is missing or a source is down, not as the default.
//
// Every template here was verified against the provider's own documentation AND
// probed with a real TMDB id (odd/tasks/continue-watching.md, L11):
//   vidfast.pro  -> 200 text/html (movie + tv)          -> shipped
//   vidsrc.io    -> 429 (rate-limits scripted probes;   -> shipped, it throttles
//                   the host answers, browsers work)       curl but serves HTML
//   vidlink.pro  -> 000, unreachable from this network  -> not shipped
//   2embed.*     -> 301 loop between hosts             -> not shipped
// ============================================================================
import type { Media, Stream, StreamSource } from './types'

interface ProviderTemplates {
  id: string
  label: string
  /** Higher runs earlier in the "Fuentes" list; Vimeus is 100. */
  weight: number
  movie: (tmdbId: number) => string
  tv: (tmdbId: number, season: number, episode: number) => string
}

const PROVIDERS: ProviderTemplates[] = [
  {
    id: 'vidsrc',
    label: 'VidSrc',
    weight: 90,
    movie: (id) => `https://vidsrc.io/embed/movie/${id}`,
    tv: (id, season, episode) => `https://vidsrc.io/embed/tv/${id}/${season}/${episode}`,
  },
  {
    id: 'vidfast',
    label: 'VidFast',
    weight: 70,
    movie: (id) => `https://vidfast.pro/movie/${id}`,
    tv: (id, season, episode) => `https://vidfast.pro/tv/${id}/${season}/${episode}`,
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
  }
}

/**
 * One StreamSource per provider. All are always enabled: they need no key and no
 * configuration, and a provider being down only removes itself from the list
 * (fetchAllStreams settles each source independently).
 */
export const embedProviderSources: StreamSource[] = PROVIDERS.map((template) => ({
  id: template.id,
  label: template.label,
  isEnabled: () => true,
  getStreams: async (media: Media) => [build(template, media)],
}))
