// Deno Deploy entry point: serves the built static app and proxies the
// Vimeus listing API with the server-side API key.
//
// - `GET /api/vimeus/listing/:kind` forwards `page`, `tmdb_id`, `season` and
//   `with_cf` to `https://vimeus.net/api/listing/<kind>` with the `X-API-Key`
//   header read from the `VIMEUS_API_KEY` environment variable, and returns
//   the upstream status and JSON body unchanged. The key never reaches the
//   browser bundle: the frontend only calls this same-origin proxy.
// - Every other request serves the static file from `./dist` (`/` maps to
//   `index.html`; a path without a file extension that does not exist falls
//   back to `index.html` so the SPA router works).
// - Text assets are sent gzip-compressed when the client accepts it, and the
//   hashed `assets/*` are marked immutable (measured: the vendor chunk travels
//   as 43 KB instead of 115 KB, and a repeat visit reuses it from disk cache).
// - `GET /healthz` returns `ok`.

const DIST_DIR = './dist'
const UPSTREAM_BASE = 'https://vimeus.net/api/listing'
const LISTING_KINDS = new Set(['movies', 'series', 'animes', 'episodes'])

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
}

function contentTypeFor(path: string): string {
  const dot = path.lastIndexOf('.')
  const ext = dot === -1 ? '' : path.slice(dot).toLowerCase()
  return CONTENT_TYPES[ext] ?? 'application/octet-stream'
}

function hasExtension(path: string): boolean {
  const slash = path.lastIndexOf('/')
  const dot = path.lastIndexOf('.')
  return dot > slash
}

function extensionOf(path: string): string {
  const dot = path.lastIndexOf('.')
  return dot === -1 ? '' : path.slice(dot).toLowerCase()
}

// Text formats where gzip pays for itself. Images are already compressed, so
// running them through `CompressionStream` would only burn CPU.
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.json', '.webmanifest'])
const MIN_COMPRESS_BYTES = 1024

// Vite emits one hashed file per content version, so the same path is served
// forever without revalidation. The HTML is the only unhashed file and the one
// that discovers new assets: it must always be revalidated.
function cacheControlFor(path: string): string {
  const urlPath = path.startsWith(DIST_DIR) ? path.slice(DIST_DIR.length) : path
  if (urlPath.startsWith('/assets/')) return 'public, max-age=31536000, immutable'
  if (extensionOf(path) === '.html') return 'no-cache'
  return 'public, max-age=86400'
}

/** Gzipped copies of the hashed assets: the same path never changes content while
 *  the process is alive. `index.html` is deliberately excluded: it is not hashed, so a
 *  rebuilt deploy would otherwise keep serving the previous HTML (and its deleted
 *  asset hashes) until the process restarted. It is compressed per request instead. */
const gzipCache = new Map<string, Uint8Array<ArrayBuffer>>()

async function gzipBytes(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function fileResponse(path: string, acceptEncoding = ''): Promise<Response | null> {
  try {
    const data = await Deno.readFile(path)
    const headers = new Headers({
      'content-type': contentTypeFor(path),
      'cache-control': cacheControlFor(path),
      'x-content-type-options': 'nosniff',
    })

    let body: Uint8Array<ArrayBuffer> = data
    const cacheable = (path.startsWith(DIST_DIR) ? path.slice(DIST_DIR.length) : path).startsWith(
      '/assets/'
    )
    if (
      COMPRESSIBLE.has(extensionOf(path)) &&
      data.byteLength >= MIN_COMPRESS_BYTES &&
      acceptEncoding.includes('gzip')
    ) {
      let gzipped: Uint8Array<ArrayBuffer> | undefined = cacheable ? gzipCache.get(path) : undefined
      if (!gzipped) {
        gzipped = await gzipBytes(data)
        if (cacheable) gzipCache.set(path, gzipped)
      }
      body = gzipped
      headers.set('content-encoding', 'gzip')
      headers.set('vary', 'accept-encoding')
    }

    return new Response(body, { headers })
  } catch {
    return null
  }
}

// Cache corta del listado: el catálogo cambia lento y cada miss gasta cuota de
// la API key. 60 s cubre la navegación normal sin servir datos rancios.
const LISTING_TTL_MS = 60_000
const LISTING_CACHE_MAX = 200
const listingCache = new Map<string, { at: number; status: number; body: string }>()

// Rate limit por IP en memoria del isolate. Deno Deploy reparte requests entre
// varios isolates, así que el límite real es "por isolate", no global: alcanza
// para que un visitante anónimo no queme la cuota de la API key.
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 60
const rateHits = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateHits.get(ip)
  if (!entry || now >= entry.resetAt) {
    if (rateHits.size > 5000) {
      for (const [key, value] of rateHits) if (now >= value.resetAt) rateHits.delete(key)
    }
    rateHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_MAX
}

async function handleListing(req: Request, kind: string, ip: string): Promise<Response> {
  if (!LISTING_KINDS.has(kind)) {
    return Response.json({ error: true, message: 'Unknown listing kind' }, { status: 400 })
  }

  if (isRateLimited(ip)) {
    return Response.json(
      { error: true, message: 'Too many requests' },
      { status: 429, headers: { 'retry-after': '60' } }
    )
  }

  const apiKey = Deno.env.get('VIMEUS_API_KEY')
  if (!apiKey) {
    return Response.json(
      { error: true, message: 'VIMEUS_API_KEY is not configured' },
      { status: 503 }
    )
  }

  const url = new URL(req.url)
  const upstream = new URL(`${UPSTREAM_BASE}/${kind}`)
  for (const key of ['page', 'tmdb_id', 'season', 'with_cf']) {
    const value = url.searchParams.get(key)
    if (value !== null) upstream.searchParams.set(key, value)
  }

  const cacheKey = upstream.toString()
  const cached = listingCache.get(cacheKey)
  if (cached && Date.now() - cached.at < LISTING_TTL_MS) {
    return new Response(cached.body, {
      status: cached.status,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }

  let res: Response
  try {
    res = await fetch(upstream, {
      headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    return Response.json({ error: true, message: 'Upstream unavailable' }, { status: 502 })
  }

  const body = await res.text()
  if (res.ok) {
    if (listingCache.size >= LISTING_CACHE_MAX) {
      const oldest = listingCache.keys().next().value
      if (oldest) listingCache.delete(oldest)
    }
    listingCache.set(cacheKey, { at: Date.now(), status: res.status, body })
  }
  return new Response(body, {
    status: res.status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

async function handleStatic(pathname: string, acceptEncoding: string): Promise<Response> {
  // Defense in depth: `new URL` already normalizes dot segments, but a
  // misbehaving upstream proxy could rewrite the path with `..` — never
  // resolve such a request to disk.
  if (pathname.includes('..')) return new Response('Not found', { status: 404 })
  const path = pathname === '/' ? '/index.html' : pathname
  const direct = await fileResponse(`${DIST_DIR}${path}`, acceptEncoding)
  if (direct) return direct
  // SPA fallback: extensionless routes resolve to index.html.
  if (!hasExtension(path)) {
    const index = await fileResponse(`${DIST_DIR}/index.html`, acceptEncoding)
    if (index) return index
  }
  return new Response('Not found', { status: 404 })
}

Deno.serve((req: Request, info: Deno.ServeHandlerInfo): Promise<Response> => {
  const url = new URL(req.url)
  if (url.pathname === '/healthz') {
    return Promise.resolve(new Response('ok'))
  }
  const listing = /^\/api\/vimeus\/listing\/([^/]+)$/.exec(url.pathname)
  if (listing) {
    const addr = info.remoteAddr
    return handleListing(req, listing[1]!, addr.transport === 'tcp' ? addr.hostname : 'unknown')
  }
  return handleStatic(url.pathname, req.headers.get('accept-encoding') ?? '')
});
