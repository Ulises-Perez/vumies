export const API_CONFIG = {
  TMDB: {
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
    API_KEY: import.meta.env.VITE_TMDB_API_KEY || '',
    BEARER_TOKEN: import.meta.env.VITE_TMDB_BEARER_TOKEN || '',
  },
  VIMEUS: {
    BASE_URL: 'https://vimeus.com',
    EMBED_URL: 'https://vimeus.com/e',
    VIEW_KEY: import.meta.env.VITE_VIMEUS_VIEW_KEY || '',
    API_KEY: import.meta.env.VITE_VIMEUS_API_KEY || '',
  },
  ANIMEAV1: {
    API_URL: import.meta.env.VITE_ANIMEAV1_API_URL || 'http://localhost:8000',
    SITE_URL: 'https://animeav1.com',
  },
  TORRENTIO: {
    // Base del addon Torrentio. A futuro se puede apuntar a una instancia con
    // configuración/debrid: https://torrentio.strem.fun/<config>
    BASE_URL: 'https://torrentio.strem.fun',
  },
} as const

export const IMAGE_SIZES = {
  POSTER: {
    W92: 'w92',
    W154: 'w154',
    W185: 'w185',
    W342: 'w342',
    W500: 'w500',
    W780: 'w780',
    ORIGINAL: 'original',
  },
  BACKDROP: {
    W300: 'w300',
    W780: 'w780',
    W1280: 'w1280',
    ORIGINAL: 'original',
  },
  PROFILE: {
    W45: 'w45',
    W185: 'w185',
    H632: 'h632',
    ORIGINAL: 'original',
  },
} as const

export const getImageUrl = (
  path: string | null,
  size: string = IMAGE_SIZES.POSTER.W500
): string => {
  if (!path) return '/placeholder.jpg'
  return `${API_CONFIG.TMDB.IMAGE_BASE_URL}/${size}${path}`
}

export const getBackdropUrl = (
  path: string | null,
  size: string = IMAGE_SIZES.BACKDROP.W1280
): string => {
  if (!path) return '/placeholder-backdrop.jpg'
  return `${API_CONFIG.TMDB.IMAGE_BASE_URL}/${size}${path}`
}

export const getPosterUrl = (
  path: string | null,
  size: string = IMAGE_SIZES.POSTER.W500
): string => {
  if (!path) return '/placeholder-poster.jpg'
  return `${API_CONFIG.TMDB.IMAGE_BASE_URL}/${size}${path}`
}

export const getProfileUrl = (
  path: string | null,
  size: string = IMAGE_SIZES.PROFILE.W185
): string => {
  if (!path) return '/placeholder-profile.jpg'
  return `${API_CONFIG.TMDB.IMAGE_BASE_URL}/${size}${path}`
}

