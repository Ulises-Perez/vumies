// Player module barrel export
export { vimeusService } from './services/vimeus.service'
export { usePlayer } from './composables/usePlayer'

// Abstracción multi-fuente (Fase 1)
export { useStreamSources } from './composables/useStreamSources'
export { STREAM_SOURCES, fetchAllStreams, fetchStreams } from './sources/registry'
export { vimeusSource } from './sources/vimeus.source'
export { torrentioSource } from './sources/torrentio.source'
export { torrentioService } from './sources/torrentio.service'
export type { SourceResult } from './sources/registry'
export type { Media, MediaType, Stream, StreamKind, StreamSource } from './sources/types'
export type {
    VimeusEmbedOptions,
    VimeusContentType,
    VimeusMovie,
    VimeusSeries,
    VimeusAnime,
    VimeusEpisode,
    VimeusPagination,
    VimeusListResponse,
} from './types/vimeus.types'
