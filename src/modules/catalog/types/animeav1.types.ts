export interface AV1AnimeCard {
  id: number | string | null
  title: string
  slug: string
  url: string
  image: string
  type: string
  synopsis: string
}

export interface AV1Episode {
  id: number | null
  number: number | string
  url: string
  image: string
}

export interface AV1Genre {
  name: string
  slug: string
}

export interface AV1Relation {
  title: string
  slug: string
  start_date: string
}

export interface AV1Relations {
  prequel: AV1Relation[]
  sequel: AV1Relation[]
  movies: AV1Relation[]
  spinoffs: AV1Relation[]
  other: AV1Relation[]
}

export interface AV1Tmdb {
  tmdb_id: number
  media_type: 'tv' | 'movie'
  season: number | null
}

export interface AV1AnimeInfo {
  id: number | null
  title: string
  alt_title: string
  slug: string
  type: string
  year: string
  start_date: string
  status_code: number | null
  status: string
  genres: AV1Genre[]
  description: string
  cover: string
  backdrop: string
  rating: number | null
  votes: number | null
  mal_id: number | null
  tmdb: AV1Tmdb | null
  trailer: string | null
  episodes_count: number
  episodes: AV1Episode[]
  relations: AV1Relations
  url: string
}

export interface AV1Season {
  slug: string
  title: string
  year: string
  start_date: string
  episodes_count: number
  cover: string
}

export interface AV1Franchise {
  current: string
  seasons: AV1Season[]
}

export interface AV1RecentEpisode {
  title: string
  slug: string
  episode: number | string
  url: string
  image: string
  type: string
}

export interface AV1RecentsResponse {
  recent_episodes: AV1RecentEpisode[]
  recent_anime: AV1AnimeCard[]
}

export interface AV1SearchResponse {
  results: AV1AnimeCard[]
  total: number
}

export interface AV1CatalogResponse {
  results: AV1AnimeCard[]
  page: number
  total_pages: number | null
  total_records: number | null
}

export interface AV1Server {
  server: string
  url: string
}

export interface AV1EpisodeLinks {
  id: number | null
  number: number | string
  title: string
  url: string
  variants: Record<string, number>
  servers: {
    SUB: AV1Server[]
    DUB: AV1Server[]
  }
  default_embed: string
}

export interface AV1ScheduleCard extends AV1AnimeCard {
  latest_episode?: number | string
}

export type AV1Schedule = Record<string, AV1ScheduleCard[]>
