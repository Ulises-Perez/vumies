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

async function fileResponse(path: string): Promise<Response | null> {
  try {
    const data = await Deno.readFile(path)
    return new Response(data, {
      headers: { 'content-type': contentTypeFor(path) },
    })
  } catch {
    return null
  }
}

async function handleListing(req: Request, kind: string): Promise<Response> {
  if (!LISTING_KINDS.has(kind)) {
    return Response.json({ error: true, message: 'Unknown listing kind' }, { status: 400 })
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

  const res = await fetch(upstream, {
    headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
  })
  const body = await res.text()
  return new Response(body, {
    status: res.status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

async function handleStatic(pathname: string): Promise<Response> {
  // Defense in depth: `new URL` already normalizes dot segments, but a
  // misbehaving upstream proxy could rewrite the path with `..` — never
  // resolve such a request to disk.
  if (pathname.includes('..')) return new Response('Not found', { status: 404 })
  const path = pathname === '/' ? '/index.html' : pathname
  const direct = await fileResponse(`${DIST_DIR}${path}`)
  if (direct) return direct
  // SPA fallback: extensionless routes resolve to index.html.
  if (!hasExtension(path)) {
    const index = await fileResponse(`${DIST_DIR}/index.html`)
    if (index) return index
  }
  return new Response('Not found', { status: 404 })
}

Deno.serve((req: Request): Promise<Response> => {
  const url = new URL(req.url)
  if (url.pathname === '/healthz') {
    return Promise.resolve(new Response('ok'))
  }
  const listing = /^\/api\/vimeus\/listing\/([^/]+)$/.exec(url.pathname)
  if (listing) {
    return handleListing(req, listing[1]!)
  }
  return handleStatic(url.pathname)
});
