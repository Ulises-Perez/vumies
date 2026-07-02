// Torrentio como StreamSource. Resuelve el imdb_id desde TMDB (con caché),
// consulta el addon y normaliza los resultados a nuestro tipo Stream (kind 'torrent').
import { tmdbService } from '@/modules/catalog/services/tmdb.service'
import { torrentioService } from './torrentio.service'
import type { Media, Stream, StreamSource } from './types'
import type { TorrentioStream } from './torrentio.types'
import { isTauri } from '../torrent-engine'

/** Máximo de streams por contenido para no saturar el selector. */
const MAX_STREAMS = 15

// Caché en memoria del imdb_id por (type, tmdbId) para no repetir la llamada a TMDB.
const imdbCache = new Map<string, string | null>()

async function resolveImdbId(media: Media): Promise<string | null> {
  if (media.imdbId) return media.imdbId
  const key = `${media.type}:${media.tmdbId}`
  if (imdbCache.has(key)) return imdbCache.get(key)!
  try {
    const ext =
      media.type === 'movie'
        ? await tmdbService.getMovieExternalIds(media.tmdbId)
        : await tmdbService.getTVShowExternalIds(media.tmdbId) // tv y anime usan el id de TV
    const imdb = ext.imdb_id || null
    imdbCache.set(key, imdb)
    return imdb
  } catch {
    imdbCache.set(key, null)
    return null
  }
}

function parseQuality(text: string): Stream['quality'] | undefined {
  const t = text.toLowerCase()
  if (/2160p|\b4k\b|uhd/.test(t)) return '4K'
  if (/1080p/.test(t)) return '1080p'
  if (/720p/.test(t)) return '720p'
  if (/480p|\bsd\b|dvdrip/.test(t)) return 'SD'
  return undefined
}

function parseCodec(text: string): string | undefined {
  const t = text.toLowerCase()
  if (/x265|hevc|h\.?265/.test(t)) return 'HEVC'
  if (/x264|avc|h\.?264/.test(t)) return 'H.264'
  if (/av1/.test(t)) return 'AV1'
  return undefined
}

/** Convierte un emoji de bandera (indicadores regionales) a código ISO en minúsculas. */
function emojiToCode(flag: string): string | null {
  const cps = [...flag].map((c) => c.codePointAt(0) ?? 0)
  if (cps.length < 2) return null
  const a = (cps[0] ?? 0) - 0x1f1e6
  const b = (cps[1] ?? 0) - 0x1f1e6
  if (a < 0 || a > 25 || b < 0 || b > 25) return null
  return String.fromCharCode(97 + a) + String.fromCharCode(97 + b)
}

/** Detecta idiomas del nombre del release → códigos de país ISO para mostrar banderas. */
function parseLanguages(text: string): string[] {
  const t = text.toLowerCase()
  const codes = new Set<string>()
  // Banderas que Torrentio ya incluye como emoji en el título.
  const emojis = text.match(/[\u{1F1E6}-\u{1F1FF}]{2}/gu)
  if (emojis) emojis.forEach((e) => { const c = emojiToCode(e); if (c) codes.add(c) })
  // Detección por palabras clave (releases LATINO/CASTELLANO/DUAL/…).
  if (/\blatino\b|latam|\blat\b|dual/.test(t)) codes.add('mx')
  if (/castellano|españa|espa[nñ]ol|spanish|\besp\b|\bspa\b|\bcas\b/.test(t)) codes.add('es')
  if (/english|ingl[eé]s|\beng\b|dual/.test(t)) codes.add('gb')
  if (/fran[cç]ais|french|\bfre\b|\bfra\b/.test(t)) codes.add('fr')
  if (/italiano|italian|\bita\b/.test(t)) codes.add('it')
  if (/deutsch|german|alem[aá]n|\bger\b|\bdeu\b/.test(t)) codes.add('de')
  if (/portugu[eê]s|portuguese|dublado|\bpor\b/.test(t)) codes.add('br')
  if (/japon[eé]s|japanese|\bjpn\b|\bjap\b/.test(t)) codes.add('jp')
  return [...codes].slice(0, 4)
}

const QUALITY_WEIGHT: Record<string, number> = { '4K': 70, '1080p': 60, '720p': 50, SD: 40 }

function toStream(s: TorrentioStream): Stream | null {
  if (!s.infoHash) return null
  const meta = `${s.name ?? ''} ${s.title ?? ''}`
  const quality = parseQuality(meta)
  const codec = parseCodec(meta)
  const languages = parseLanguages(meta)
  // Primera línea del title = nombre del release (informativo).
  const release = (s.title || s.name || '').split('\n')[0]?.trim() || 'Torrent'
  return {
    sourceId: 'torrentio',
    label: release,
    kind: 'torrent',
    infoHash: s.infoHash,
    fileIdx: s.fileIdx,
    quality,
    codec,
    languages,
    // Reproducible vía el motor torrent local (Fase 3). HEVC/mkv plenos en Fase 4 (mpv).
    playable: true,
    weight: quality ? (QUALITY_WEIGHT[quality] ?? 30) : 30,
  }
}

export const torrentioSource: StreamSource = {
  id: 'torrentio',
  label: 'Torrentio',

  isEnabled() {
    // La reproducción de torrents necesita el motor nativo (Tauri).
    return isTauri()
  },

  async getStreams(media: Media): Promise<Stream[]> {
    const imdb = await resolveImdbId(media)
    if (!imdb) return []

    const isSeries = media.type !== 'movie'
    const id = isSeries ? `${imdb}:${media.season ?? 1}:${media.episode ?? 1}` : imdb
    const raw = await torrentioService.getStreams(isSeries ? 'series' : 'movie', id)

    return raw
      .map(toStream)
      .filter((x): x is Stream => x !== null)
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
      .slice(0, MAX_STREAMS)
  },
}
