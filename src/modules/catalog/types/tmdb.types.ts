// TMDB Types
export interface Movie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  adult: boolean
  genre_ids: number[]
  original_language: string
  video: boolean
}

export interface TVShow {
  id: number
  name: string
  original_name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids: number[]
  original_language: string
  origin_country: string[]
}

export interface MovieDetails extends Omit<Movie, 'genre_ids'> {
  genres: Genre[]
  runtime: number
  budget: number
  revenue: number
  status: string
  tagline: string
  production_companies: ProductionCompany[]
  production_countries: ProductionCountry[]
  spoken_languages: SpokenLanguage[]
  imdb_id: string | null
  homepage: string | null
}

export interface TVShowDetails extends Omit<TVShow, 'genre_ids'> {
  genres: Genre[]
  number_of_seasons: number
  number_of_episodes: number
  seasons: Season[]
  created_by: Creator[]
  episode_run_time: number[]
  in_production: boolean
  last_air_date: string
  networks: Network[]
  production_companies: ProductionCompany[]
  status: string
  tagline: string
  type: string
}

export interface Season {
  id: number
  season_number: number
  name: string
  overview: string
  poster_path: string | null
  air_date: string
  episode_count: number
}

export interface Episode {
  id: number
  episode_number: number
  season_number: number
  name: string
  overview: string
  still_path: string | null
  air_date: string
  vote_average: number
  vote_count: number
  runtime: number
}

export interface Genre {
  id: number
  name: string
}

export interface ProductionCompany {
  id: number
  name: string
  logo_path: string | null
  origin_country: string
}

export interface ProductionCountry {
  iso_3166_1: string
  name: string
}

export interface SpokenLanguage {
  iso_639_1: string
  name: string
  english_name: string
}

export interface Creator {
  id: number
  name: string
  profile_path: string | null
  credit_id: string
}

export interface Network {
  id: number
  name: string
  logo_path: string | null
  origin_country: string
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
  credit_id: string
  cast_id: number
}

export interface CrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
  credit_id: string
}

export interface Credits {
  cast: CastMember[]
  crew: CrewMember[]
}

export interface Video {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
  published_at: string
}

export interface TMDBResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export interface TMDBGenresResponse {
  genres: Genre[]
}

export interface TMDBVideosResponse {
  id: number
  results: Video[]
}

export interface TMDBImagesResponse {
  backdrops: Image[]
  posters: Image[]
  logos: Image[]
}

export interface Image {
  file_path: string
  width: number
  height: number
  aspect_ratio: number
  vote_average: number
  vote_count: number
}

export type MediaType = 'movie' | 'tv' | 'person'
export type TimeWindow = 'day' | 'week'

