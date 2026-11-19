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
// - `GET /embed/<provider>/<path>` reverse-proxies a third-party player page
//   (Vimeus, PlayLatinSRC, VidNest, VidFast), strips its advertising and serves
//   it from this origin so the client can frame it with `sandbox="allow-scripts"`.
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

// ---------------------------------------------------------------------------
// Embed proxy: `/embed/<provider>/<path>` fetches a third-party player page
// from our own origin, strips its advertising and serves it back. The client
// frames it with `sandbox="allow-scripts"`, so the document runs in an opaque
// origin: it cannot reach this page, open windows, submit forms or navigate the
// top frame. Everything the player still needs (storage, cookies, its own
// root-relative requests) is shimmed by the script injected below.
// ---------------------------------------------------------------------------

const EMBED_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36'

/** Hosts that exist only to serve ads or analytics. The injected shim rejects
 *  every request to them, which is what kills the VAST tag jwplayer would
 *  otherwise fetch for its preroll. */
const AD_HOSTS = [
  'adangle.online',
  'adsanalytics.org',
  'ggpick.com',
  'animehack.org',
  'horefund.com',
  'ailettefritts.com',
  'googletagmanager.com',
  'google-analytics.com',
  'doubleclick.net',
  'googlesyndication.com',
  'adservice.google.com',
  'anal.vimeos.net',
  'umami.vidfast.vc',
  'llvpn.com',
  'ancillammmm.com',
  'hubeamily.com',
]

/** Players that other providers embed in turn. Their documents go through this
 *  proxy as well, or the ads they carry come back inside the outer embed. */
const NESTED_PLAYERS: Record<string, string> = {
  'dr0pstream.com': 'dr0pstream',
}

type EmbedProvider = {
  /** Origin that serves the player document and its assets. */
  origin: string
  /** Referer the upstream expects; some players answer 403 without it. */
  referer: string
  /** Whole `<script>`/`<link>` tags deleted from the document. */
  dropTags: RegExp[]
  /** Inline `<script>` blocks deleted when their body contains the marker. */
  dropInline: string[]
  /** Extra JS appended to the generic shim. */
  shim?: string
  /** Where to inject `shim`; defaults to just before `</head>`. */
  shimAnchor?: RegExp
  /** Route playlists and segments through this server. Only needed when the
   *  CDN refuses a foreign Referer; it costs the deploy's egress quota. */
  proxyMedia?: boolean
}

const escapeRe = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Matches a whole `<script>` element whose body contains `marker`. */
function scriptContaining(marker: string): RegExp {
  return new RegExp(
    `<script\\b[^>]*>(?:(?!</script>)[\\s\\S])*?${escapeRe(marker)}[\\s\\S]*?</script>`,
    'g'
  )
}

/** jwplayer is a blocking script in the body, so this runs right after it
 *  loads and before the page boots the player. Dropping `advertising` and the
 *  placeholder caption track removes the VAST preroll and the overlay that
 *  track triggers. */
const VIMEUS_SHIM = `
(function () {
  var jw = window.jwplayer;
  if (!jw || jw.__vumies) return;
  jw.__vumies = 1;
  var wrapped = function () {
    var p = jw.apply(this, arguments);
    if (p && !p.__vumies) {
      p.__vumies = 1;
      var setup = p.setup;
      p.setup = function (cfg) {
        try {
          if (cfg) {
            delete cfg.advertising;
            if (cfg.tracks) cfg.tracks = cfg.tracks.filter(function (t) {
              return !/empty/i.test(String((t && t.file) || ''));
            });
          }
        } catch (e) {}
        var result = setup.call(this, cfg);
        try { this.loadAdTag = function () { return this }; } catch (e) {}
        return result;
      };
    }
    return p;
  };
  for (var key in jw) { try { wrapped[key] = jw[key] } catch (e) {} }
  window.jwplayer = wrapped;
})();
`

const EMBED_PROVIDERS: Record<string, EmbedProvider> = {
  vimeus: {
    origin: 'https://vimeos.net',
    referer: 'https://vimeus.net/',
    dropTags: [
      /<script[^>]*disable-devtool[^>]*><\/script>/g,
      /<script[^>]*xd\/xd\.js[^>]*><\/script>/g,
      /<link[^>]*xd\/xd\.css[^>]*>/g,
      /<script[^>]*anal\.vimeos\.net[^>]*><\/script>/g,
      /<script[^>]*cloudflareinsights[^>]*><\/script>/g,
      /<script[^>]*imasdk\.googleapis\.com[^>]*><\/script>/g,
      /<script[^>]*ima-ad-player[^>]*><\/script>/g,
    ],
    dropInline: ['voeSandboxBlocked', 'cdn.animehack.org'],
    shim: VIMEUS_SHIM,
    shimAnchor: /(<script\b[^>]*jwplayer\.js[^>]*>\s*<\/script>)/i,
  },
  playlatinsrc: {
    origin: 'https://playlatinsrc.co',
    referer: 'https://playlatinsrc.co/',
    dropTags: [/<script[^>]*googletagmanager\.com[^>]*><\/script>/g],
    dropInline: [],
  },
  vidnest: {
    origin: 'https://vidnest.pro',
    referer: 'https://vidnest.pro/',
    dropTags: [
      /<script[^>]*horefund\.com[^>]*><\/script>/g,
      /<script[^>]*ailettefritts\.com[^>]*><\/script>/g,
      /<script[^>]*cloudflareinsights[^>]*><\/script>/g,
    ],
    dropInline: [],
  },
  // PlayLatinSRC only renders a poster grid; the actual player is this Vimeos
  // clone on another host, which the shim rewrites into the proxy.
  dr0pstream: {
    origin: 'https://dr0pstream.com',
    referer: 'https://dr0pstream.com/',
    dropTags: [
      /<script[^>]*ancillammmm\.com[^>]*><\/script>/g,
      /<script[^>]*hubeamily\.com[^>]*><\/script>/g,
      /<script[^>]*cloudflareinsights[^>]*><\/script>/g,
    ],
    dropInline: ['llvpn.com'],
    // dropcdn answers 403 unless the request carries the provider's Referer.
    proxyMedia: true,
    shim: VIMEUS_SHIM,
    shimAnchor: /(<script\b[^>]*jwplayer\.js[^>]*>\s*<\/script>)/i,
  },
  vidfast: {
    origin: 'https://vidfast.vc',
    referer: 'https://vidfast.vc/',
    dropTags: [
      /<script[^>]*googletagmanager\.com[^>]*><\/script>/g,
      /<script[^>]*umami\.vidfast\.vc[^>]*><\/script>/g,
    ],
    dropInline: [],
  },
}

/** Runs inside the proxied document before any of its own scripts. */
function embedShim(providerId: string, proxyMedia: boolean): string {
  return `(function () {
var P = ${JSON.stringify(providerId)};
var PRE = '/embed/' + P;
var PROXY_MEDIA = ${JSON.stringify(proxyMedia)};
var ADS = ${JSON.stringify(AD_HOSTS)};
function isAd(u) {
  try {
    var h = new URL(u, location.href).hostname;
    for (var i = 0; i < ADS.length; i++) {
      var d = ADS[i];
      if (h === d || h.slice(-(d.length + 1)) === '.' + d) return true;
    }
  } catch (e) {}
  return false;
}
// location.origin is "null" in an opaque origin, but host and protocol survive.
var SELF = location.protocol + '//' + location.host;
function fix(u) {
  if (typeof u !== 'string') return u;
  if (u.indexOf(SELF + '/') === 0) u = u.slice(SELF.length);
  if (u.charAt(0) !== '/' || u.charAt(1) === '/') return u;
  return u.indexOf(PRE + '/') === 0 ? u : PRE + u;
}
// PlayLatinSRC builds its real player as a nested iframe on another host.
// Rewrite that src into the proxy, or the ads it carries come back.
var NESTED = ${JSON.stringify(NESTED_PLAYERS)};
function nested(u) {
  if (typeof u !== 'string') return u;
  try {
    var abs = new URL(u, location.href);
    var id = NESTED[abs.hostname];
    if (id) return '/embed/' + id + abs.pathname + abs.search;
  } catch (e) {}
  return u;
}
var iframeSrc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
if (iframeSrc && iframeSrc.set) {
  Object.defineProperty(HTMLIFrameElement.prototype, 'src', {
    configurable: true,
    get: iframeSrc.get,
    set: function (value) { iframeSrc.set.call(this, nested(value)) }
  });
}
var setAttr = Element.prototype.setAttribute;
Element.prototype.setAttribute = function (name, value) {
  if (this instanceof HTMLIFrameElement && String(name).toLowerCase() === 'src') value = nested(value);
  return setAttr.call(this, name, value);
};
// Video bytes stay on the CDN: proxying them spent the deploy's whole egress
// quota (20 GiB/month) after a dozen movies. Only providers whose CDN refuses
// a foreign Referer still come through here.
var MEDIA = /\\.(m3u8|ts|m4s|mp4|key|vtt)(\\?|$)/i;
function media(u) {
  if (!PROXY_MEDIA) return fix(u);
  if (typeof u !== 'string') return u;
  var abs;
  try { abs = new URL(u, location.href) } catch (e) { return fix(u) }
  if (abs.host === location.host) return fix(u);
  if (!MEDIA.test(abs.pathname + abs.search)) return fix(u);
  return PRE + '/__media?u=' + encodeURIComponent(abs.href);
}
// Sandbox detectors ask the frame element whether it carries the attribute.
// A sandboxed frame still gets a live frameElement, so hide it.
try {
  Object.defineProperty(window, 'frameElement', {
    configurable: true,
    get: function () { return null }
  });
} catch (e) {}
// Sandbox detectors probe document.domain and refuse to play when it throws.
try {
  Object.defineProperty(document, 'domain', {
    configurable: true,
    get: function () { return location.hostname },
    set: function () {}
  });
} catch (e) {}
// The last sandbox probe loads a PDF <object> and treats onerror as "sandboxed".
// A sandboxed frame cannot render the PDF plugin, so hide the plugin instead.
try {
  Object.defineProperty(PluginArray.prototype, 'namedItem', {
    configurable: true,
    value: function () { return null }
  });
} catch (e) {}
// Opaque origin: storage and cookies throw. Keep them in memory instead.
function memoryStore() {
  var m = Object.create(null);
  return {
    getItem: function (k) { k = String(k); return k in m ? m[k] : null },
    setItem: function (k, v) { m[String(k)] = String(v) },
    removeItem: function (k) { delete m[String(k)] },
    clear: function () { m = Object.create(null) },
    key: function (i) { var ks = Object.keys(m); return i < ks.length ? ks[i] : null },
    get length() { return Object.keys(m).length }
  };
}
['localStorage', 'sessionStorage'].forEach(function (name) {
  var usable = false;
  try { window[name].getItem('__probe'); usable = true } catch (e) {}
  if (!usable) {
    try { Object.defineProperty(window, name, { configurable: true, value: memoryStore() }) } catch (e) {}
  }
});
try {
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: function () { return '' },
    set: function () {}
  });
} catch (e) {}
// Ad requests die here: the VAST tag, the analytics pings and the popunder
// beacons all go through fetch or XHR.
var nativeFetch = window.fetch;
if (nativeFetch) {
  window.fetch = function (input, init) {
    try {
      if (typeof input === 'string') {
        if (isAd(input)) return Promise.reject(new TypeError('blocked'));
        input = media(input);
      } else if (input && input.url) {
        if (isAd(input.url)) return Promise.reject(new TypeError('blocked'));
        input = new Request(media(input.url), input);
      }
    } catch (e) {}
    return nativeFetch.call(this, input, init);
  };
}
var nativeOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url) {
  try {
    if (isAd(url)) { this.__blocked = true; url = 'about:blank' } else { url = media(url) }
  } catch (e) {}
  return nativeOpen.call(this, method, url);
};
var nativeSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function () {
  if (this.__blocked) {
    var xhr = this;
    setTimeout(function () { try { xhr.dispatchEvent(new Event('error')) } catch (e) {} }, 0);
    return;
  }
  return nativeSend.apply(this, arguments);
};
// Bundlers build lazy-chunk URLs from the origin root ("/_next/static/..."),
// not from the document path, so they would 404 here. Catch them on the way in.
var scriptSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
if (scriptSrc && scriptSrc.set) {
  Object.defineProperty(HTMLScriptElement.prototype, 'src', {
    configurable: true,
    get: scriptSrc.get,
    set: function (value) {
      // Next.js wraps the URL in a TrustedScriptURL, so it is not a string.
      if (value && typeof value !== 'string') { try { value = String(value) } catch (e) {} }
      scriptSrc.set.call(this, fix(value))
    }
  });
}
// A crash inside the proxied app is invisible from the parent (opaque origin),
// so keep the first one where the parent can read it.
window.addEventListener('error', function (e) {
  if (!window.__embedError) window.__embedError = String(e.message) + ' @ ' + String(e.filename) + ':' + e.lineno;
});
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (!window.__embedError) window.__embedError = 'rejection: ' + String(r && (r.stack || r.message) || r);
});
// The parent's 15s watchdog waits for the iframe load event, which a slow
// poster or font can delay past the point where the player is already usable.
try { parent.postMessage({ event: 'ready' }, '*') } catch (e) {}
// Ad containers the player markup ships with.
var style = document.createElement('style');
style.textContent = '.video_ad,.video_ad_fadein,#ad-container,.ad-overlay,#resume-ad-btn,.lm-modal-overlay{display:none!important;visibility:hidden!important;pointer-events:none!important}';
(document.head || document.documentElement).appendChild(style);
})();`
}

function rewriteEmbed(html: string, providerId: string, provider: EmbedProvider): string {
  let out = html
  for (const pattern of provider.dropTags) out = out.replace(pattern, '')
  for (const marker of provider.dropInline) out = out.replace(scriptContaining(marker), '')
  // Root-relative URLs must come back through this proxy, not the site root.
  // Single quotes matter: jwplayer ships as src='/player/jw8/jwplayer.js'.
  out = out.replace(/(\s(?:src|href)\s*=\s*["'])\/(?!\/)/g, `$1/embed/${providerId}/`)
  out = out.replace(
    /<\/head>/i,
    `<script>${embedShim(providerId, provider.proxyMedia === true)}</script></head>`
  )
  if (provider.shim) {
    const extra = `<script>${provider.shim}</script>`
    out = provider.shimAnchor
      ? out.replace(provider.shimAnchor, (match) => match + extra)
      : out.replace(/<\/head>/i, `${extra}</head>`)
  }
  return out
}

/** Vimeus answers `/e/<kind>` with a shell that carries the real player URL in
 *  an inline JSON payload on a different host. Follow that hop and serve the
 *  player document itself. */
async function resolveVimeusEmbed(rest: string, search: string): Promise<string> {
  try {
    const shell = await fetch(`https://vimeus.net${rest}${search}`, {
      headers: { 'user-agent': EMBED_UA, referer: 'https://vimeus.net/', accept: 'text/html' },
      signal: AbortSignal.timeout(15_000),
    })
    const html = await shell.text()
    const at = html.indexOf('"embeds"')
    const slice = at === -1 ? html : html.slice(at, at + 4000)
    const match = /"url"\s*:\s*"(https?:\/\/[^"]+)"/.exec(slice)
    return match ? match[1]! : ''
  } catch {
    return ''
  }
}

async function handleEmbed(
  req: Request,
  providerId: string,
  rest: string,
  search: string
): Promise<Response> {
  if (Deno.env.get('EMBED_PROXY') === 'off') return new Response('Not found', { status: 404 })
  const provider = EMBED_PROVIDERS[providerId]
  if (!provider) return new Response('Not found', { status: 404 })

  // Path-routed SPAs are served at their own pathname plus this marker, so
  // their router still matches. The provider must never see it.
  if (search.includes('__embed=')) {
    const kept = search.slice(1).split('&').filter((part) => part && !part.startsWith('__embed='))
    search = kept.length ? `?${kept.join('&')}` : ''
  }

  // The frame runs in an opaque origin, so every request it makes is a CORS
  // request. PlayLatinSRC posts its source list, which needs a preflight.
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        // Echo whatever the player asks for: VidNest sends x-player-key, and a
        // preflight that omits it makes the browser drop the request.
        'access-control-allow-headers':
          req.headers.get('access-control-request-headers') ?? 'content-type',
        'access-control-max-age': '86400',
      },
    })
  }

  let target: string
  if (providerId === 'vimeus' && rest.startsWith('/e/')) {
    target = await resolveVimeusEmbed(rest, search)
    if (!target) return new Response('Embed not found', { status: 502 })
  } else {
    target = provider.origin + rest + search
  }

  const method = req.method
  const hasBody = method !== 'GET' && method !== 'HEAD'
  const requestHeaders: Record<string, string> = {
    'user-agent': EMBED_UA,
    accept: req.headers.get('accept') ?? '*/*',
    referer: provider.referer,
    'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
  }
  const requestContentType = req.headers.get('content-type')
  if (requestContentType) requestHeaders['content-type'] = requestContentType
  // VidNest's stream API answers 401 without its player key.
  const playerKey = req.headers.get('x-player-key')
  if (playerKey) requestHeaders['x-player-key'] = playerKey

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method,
      headers: requestHeaders,
      body: hasBody ? await req.arrayBuffer() : undefined,
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    return new Response('Upstream unavailable', { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
  const isHtml = contentType.includes('text/html')
  const headers = new Headers({
    'content-type': contentType,
    'access-control-allow-origin': '*',
    'x-content-type-options': 'nosniff',
    'cache-control': isHtml ? 'no-store' : 'public, max-age=3600',
  })

  if (req.method === 'HEAD') return new Response(null, { status: upstream.status, headers })
  if (!isHtml) return new Response(upstream.body, { status: upstream.status, headers })

  const html = await upstream.text()
  return new Response(rewriteEmbed(html, providerId, provider), {
    status: upstream.status,
    headers,
  })
}

/** Video playlists and segments sit on CDNs that only answer the provider's
 *  own Referer, which a browser cannot forge. Route them through here.
 *  shortcut: every video byte flows through this server; give it its own
 *  egress budget or a dedicated media host if bandwidth becomes the limit. */
async function handleMedia(req: Request, providerId: string, url: URL): Promise<Response> {
  if (Deno.env.get('EMBED_PROXY') === 'off') return new Response('Not found', { status: 404 })
  const provider = EMBED_PROVIDERS[providerId]
  if (!provider) return new Response('Not found', { status: 404 })
  const raw = url.searchParams.get('u')
  if (!raw) return new Response('Bad request', { status: 400 })
  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return new Response('Bad request', { status: 400 })
  }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return new Response('Bad request', { status: 400 })
  }

  // Some CDNs (dropcdn) answer 403 to anything that does not look like a
  // browser fetch from the provider's own page.
  const headers: Record<string, string> = {
    'user-agent': EMBED_UA,
    referer: provider.referer,
    origin: new URL(provider.referer).origin,
    accept: '*/*',
    'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
  }
  const range = req.headers.get('range')
  if (range) headers.range = range

  let upstream: Response
  try {
    upstream = await fetch(target.href, {
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    return new Response('Upstream unavailable', { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
  // Only rewrite a playlist we actually got: a 403 error page also ends in
  // .m3u8, and rewriting it produced a "playlist" of HTML.
  const isPlaylist =
    upstream.ok && (/mpegurl/i.test(contentType) || /\.m3u8(\?|$)/i.test(target.href))

  if (isPlaylist) {
    const text = await upstream.text()
    const base = new URL(upstream.url || target.href)
    // Absolute, not root-relative: some players parse playlists with a bare
    // `new URL(line)` and drop every entry that is not already absolute.
    const proxied = (value: string): string => {
      try {
        return `${url.origin}/embed/${providerId}/__media?u=${encodeURIComponent(new URL(value, base).href)}`
      } catch {
        return value
      }
    }
    const body = text
      .split('\n')
      .map((line) => {
        const trimmed = line.trim()
        if (!trimmed) return line
        if (trimmed.startsWith('#')) {
          return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => `URI="${proxied(uri)}"`)
        }
        return proxied(trimmed)
      })
      .join('\n')
    return new Response(body, {
      status: upstream.status,
      headers: {
        'content-type': 'application/vnd.apple.mpegurl',
        'access-control-allow-origin': '*',
        'cache-control': 'no-store',
      },
    })
  }

  const out = new Headers({
    'content-type': contentType,
    'access-control-allow-origin': '*',
    'cache-control': 'public, max-age=3600',
  })
  for (const name of ['content-length', 'content-range', 'accept-ranges', 'etag']) {
    const value = upstream.headers.get(name)
    if (value) out.set(name, value)
  }
  if (req.method === 'HEAD') return new Response(null, { status: upstream.status, headers: out })
  return new Response(upstream.body, { status: upstream.status, headers: out })
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
  const media = /^\/embed\/([^/]+)\/__media$/.exec(url.pathname)
  if (media) return handleMedia(req, media[1]!, url)
  const embed = /^\/embed\/([^/]+)(\/.*)?$/.exec(url.pathname)
  if (embed) return handleEmbed(req, embed[1]!, embed[2] ?? '/', url.search)
  // Providers whose document routes on location.pathname cannot live under a
  // prefix, so they are served at their own path and marked in the query.
  const embedDoc = url.searchParams.get('__embed')
  if (embedDoc) return handleEmbed(req, embedDoc, url.pathname, url.search)
  return handleStatic(url.pathname, req.headers.get('accept-encoding') ?? '')
});
