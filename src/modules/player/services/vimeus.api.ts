// Acceso a la API de listado de Vimeus.
//
// La API Key NUNCA vive en el cliente: la documentación de Vimeus exige que se
// use sólo en el backend. Por eso este módulo delega la petición al comando
// nativo `vimeus_listing`, que firma la request con el header `X-API-Key` desde
// Rust y devuelve el JSON ya decodificado.
//
// No existe fallback a `fetch` desde el frontend a propósito: hacerlo volvería a
// exponer la clave en el bundle del webview.

import type {
  VimeusListingKind,
  VimeusListingQuery,
  VimeusListResponse,
} from '../types/vimeus.types'

/** Error de disponibilidad: se usa fuera del runtime de Tauri (p. ej. en un navegador). */
export class VimeusApiUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VimeusApiUnavailableError'
  }
}

/**
 * ¿Estamos dentro del webview de Tauri? (en un navegador no hay comandos nativos).
 */
export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * Consulta un endpoint de listado (`/api/listing/*`) a través del backend Rust.
 *
 * @throws {VimeusApiUnavailableError} fuera del runtime de Tauri.
 * @throws {Error} si el backend no encuentra la API Key o si Vimeus responde error.
 */
export async function fetchVimeusListing<T>(
  kind: VimeusListingKind,
  query: VimeusListingQuery = {}
): Promise<VimeusListResponse<T>> {
  if (!isTauriRuntime()) {
    throw new VimeusApiUnavailableError(
      'La API de listado de Vimeus requiere el runtime de Tauri: la API Key vive en el backend nativo.'
    )
  }

  const { invoke } = await import('@tauri-apps/api/core')

  return invoke<VimeusListResponse<T>>('vimeus_listing', {
    request: {
      kind,
      page: query.page,
      tmdbId: query.tmdbId,
      season: query.season,
      withCf: query.withCf,
    },
  })
}
