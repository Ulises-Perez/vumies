// Access to the Vimeus listing API through the Deno server proxy.
//
// The API key NEVER lives in the client: the Vimeus docs require it to be
// used server-side only. The Deno entry module (`server.ts` at the repo root)
// serves the built static app and proxies `/api/vimeus/listing/*` to
// `vimeus.net` with the `X-API-Key` header, reading the key from the Deno
// environment. The browser only ever calls the same-origin proxy, so the key
// never reaches the bundle. There is intentionally no direct `fetch` to
// `vimeus.net` from the frontend: that would expose the key.

import type {
  VimeusListingKind,
  VimeusListingQuery,
  VimeusListResponse,
} from '../types/vimeus.types'

/**
 * Queries a listing endpoint (`/api/listing/*`) through the same-origin Deno proxy.
 *
 * @throws {Error} when the proxy has no API key configured (HTTP 503) or when
 * Vimeus answers with an error (the provider `message` is carried on the Error).
 */
export async function fetchVimeusListing<T>(
  kind: VimeusListingKind,
  query: VimeusListingQuery = {}
): Promise<VimeusListResponse<T>> {
  const params = new URLSearchParams()
  if (query.page !== undefined) params.set('page', String(query.page))
  if (query.tmdbId !== undefined) params.set('tmdb_id', String(query.tmdbId))
  if (query.season !== undefined) params.set('season', String(query.season))
  if (query.withCf !== undefined) params.set('with_cf', String(query.withCf))

  const qs = params.toString()
  const endpoint = `/api/vimeus/listing/${kind}${qs ? `?${qs}` : ''}`

  // Un reintento para 429/5xx y para un fallo de red. El upstream responde 503
  // con una pagina HTML de Cloudflare: sin esto el cuerpo no es JSON y el
  // consumidor recibia un error de parseo en vez del estado real.
  for (let attempt = 0; ; attempt++) {
    let res: Response
    try {
      res = await fetch(endpoint, { headers: { Accept: 'application/json' } })
    } catch (error) {
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        continue
      }
      throw error
    }

    const text = await res.text()
    let body: (VimeusListResponse<T> & { message?: string }) | null = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = null
    }

    if (!res.ok || !body) {
      // Solo se reintenta lo transitorio (429/5xx, que es donde Cloudflare
      // devuelve su pagina HTML). Un 200 con cuerpo no-JSON no mejora repitiendo.
      const transient = res.status === 429 || res.status >= 500
      if (attempt === 0 && transient) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        continue
      }
      throw new Error(
        typeof body?.message === 'string' && body.message
          ? body.message
          : `Vimeus listing request failed with status ${res.status}`
      )
    }

    return body
  }
}
