export const API_CONFIG = {
  TMDB: {
    // Las llamadas pasan por el proxy same-origin (`/api/tmdb/*`), servido por
    // `server.ts` en Deno Deploy y por el dev proxy de Vite en local. El token
    // Bearer vive SOLO en el servidor (variable `TMDB_BEARER_TOKEN`): nunca se
    // lee en el cliente ni se serializa al bundle.
    BASE_URL: '/api/tmdb',
    // image.tmdb.org es un CDN público sin autenticación: no requiere token.
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  },
  VIMEUS: {
    // vimeus.net es el único dominio válido para inserciones (embeds) y para
    // la API de listado. vimeus.com queda descartado.
    BASE_URL: 'https://vimeus.net',
    EMBED_URL: 'https://vimeus.net/e',
    // view_key: viaja en la URL del embed y el reproductor la valida contra el
    // dominio de referencia, así que vive en el cliente a propósito.
    VIEW_KEY: import.meta.env.VITE_VIMEUS_VIEW_KEY || '',
    // api_key: never read on the client. Only the Deno server proxy
    // (`server.ts` -> `/api/vimeus/listing/*`) uses it, because the docs require
    // the API Key to never be exposed to the frontend.
  },
  ANIMEAV1: {
    API_URL: import.meta.env.VITE_ANIMEAV1_API_URL || 'http://localhost:8000',
    SITE_URL: 'https://animeav1.com',
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

