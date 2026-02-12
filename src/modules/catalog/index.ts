// Catalog module barrel export
export { tmdbService } from './services/tmdb.service'
export { useMovies } from './composables/useMovies'
export { useSeries } from './composables/useSeries'
export type {
    Movie,
    TVShow,
    MovieDetails,
    TVShowDetails,
    TMDBResponse,
    TMDBGenresResponse,
    Credits,
    Season,
    Episode,
    Genre,
    CastMember,
    CrewMember,
    Video,
    TMDBVideosResponse,
    TMDBImagesResponse,
    Image,
    MediaType,
    TimeWindow,
    ProductionCompany,
    ProductionCountry,
    SpokenLanguage,
    Creator,
    Network,
} from './types/tmdb.types'
