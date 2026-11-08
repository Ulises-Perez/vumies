# Vumies — Aplicación de escritorio de streaming (Windows + Tauri)

Vumies es un reproductor de películas, series y anime para **Windows**, empaquetado con **Tauri 2**.
Combina el catálogo de **TMDB** (metadatos, imágenes, búsqueda) con el reproductor **Vimeus**
(`vimeus.net`) y un motor propio de torrents + `mpv` para las fuentes que no son embeds.

No hay despliegue web: la app se ejecuta dentro del webview de Tauri y se distribuye como
instalador de Windows.

## 🚀 Características

- ✨ **Interfaz moderna**: Vue 3 + TypeScript + Tailwind CSS, con glassmorphism
- 🎬 **Catálogo completo**: películas, series y anime vía TMDB
- 📺 **Reproductor integrado**: embeds de Vimeus (`/e/movie`, `/e/serie`, `/e/anime`)
- 🧲 **Fuentes torrent**: motor `librqbit` embebido, streaming local por HTTP con Range
- 🎥 **mpv embebido**: reproducción nativa dentro de la ventana, con controles propios (uosc)
- 🔍 **Búsqueda en tiempo real** y ❤️ **favoritos** locales
- 🔐 **Claves fuera del webview**: la API Key de Vimeus vive sólo en el backend Rust
- 📱 **Responsive**: la ventana se adapta desde 800×600

## 📦 Tecnologías

| Capa | Stack |
| --- | --- |
| Frontend | Vue 3 · TypeScript · Vite 7 · Vue Router · Pinia · Tailwind CSS |
| Backend | Rust · Tauri 2 · `reqwest` · `librqbit` · `axum` |
| Reproductor | `mpv` (sidecar con IPC por named pipe en Windows) |
| Datos | TMDB (catálogo) · Vimeus (streaming y listados) |

## 🛠️ Requisitos

- **Windows 10/11** con **WebView2** (viene preinstalado en Windows 11)
- **Node.js 20+** y **pnpm 10+** (el proyecto es pnpm-only: `npm`/`yarn` fallan por `engine-strict`)
- **Rust toolchain** estable (`rustup`), con el target MSVC
- **mpv** instalado y en alguna de estas rutas: `C:\Program Files\MPV Player\mpv.exe`,
  `C:\Program Files\mpv\mpv.exe` o `%LOCALAPPDATA%\Microsoft\WinGet\Links\mpv.exe`

## 🔑 Variables de entorno

Creá un archivo **`.env` en la raíz** (está en `.gitignore`, no se commitea):

```env
# ---- TMDB (obligatorio: catálogo, imágenes y búsqueda) ----
# https://www.themoviedb.org/settings/api
VITE_TMDB_API_KEY=
VITE_TMDB_BEARER_TOKEN=

# ---- Vimeus (reproductor) ----
# https://vimeus.net/settings/general
VITE_VIMEUS_VIEW_KEY=
VIMEUS_API_KEY=
```

Qué expone cada una:

| Variable | Quién la lee | ¿Llega al cliente? | Para qué |
| --- | --- | --- | --- |
| `VITE_TMDB_BEARER_TOKEN` | Vite (build) | Sí | Autoriza las llamadas a la API de TMDB |
| `VITE_TMDB_API_KEY` | Vite (build) | Sí | Reserva para endpoints v3 que usen `api_key` |
| `VITE_VIMEUS_VIEW_KEY` | Vite (build) | Sí, por diseño | Parámetro obligatorio de toda URL de embed; el reproductor la valida por referrer |
| `VIMEUS_API_KEY` | Backend Rust | **No** | Autentica `/api/listing/*` con el header `X-API-Key` |

Vite sólo inyecta en el bundle las variables con prefijo `VITE_`. `VIMEUS_API_KEY` no lo lleva
a propósito: la lee el backend Rust y nunca se serializa al webview.

### Cómo resuelve el backend la API Key de Vimeus

El comando nativo `vimeus_listing` busca la clave, en este orden:

1. Variable de entorno del proceso `VIMEUS_API_KEY`
2. Archivo `.env` junto al ejecutable (build empaquetado)
3. Archivo `.env` en el directorio de configuración de la app
4. Archivo `.env` en la raíz del repositorio (sólo en builds de desarrollo)

Si no la encuentra, la llamada falla con un mensaje explícito y el resto de la app sigue
funcionando. En un build empaquetado, la opción más simple es definirla a nivel de usuario:

```powershell
setx VIMEUS_API_KEY "tu_api_key"
```

y volver a abrir la aplicación.

## 🧑‍💻 Desarrollo

```bash
pnpm install

# App de escritorio completa (Vite + Tauri, hot reload del frontend)
pnpm tauri:dev

# Sólo el frontend en el navegador (sin comandos nativos: sin mpv, torrents ni listados)
pnpm dev
```

## 📦 Build y distribución

```bash
pnpm tauri:build
```

Genera el instalador **NSIS** en `src-tauri/target/release/bundle/nsis/`.
El target de bundle está fijado a Windows en `src-tauri/tauri.conf.json` (`bundle.targets: ["nsis"]`).

## 🗂️ Estructura del proyecto

```
Vumies/
├── src/                     # Frontend Vue 3
│   ├── core/                # config, router, stores y utilidades transversales
│   │   ├── config/          # API_CONFIG (TMDB, Vimeus, features)
│   │   └── stores/          # Pinia (app, settings, anime)
│   └── modules/
│       ├── catalog/         # catálogo TMDB (películas, series, anime)
│       ├── player/          # reproductor: fuentes, embeds, motor torrent
│       │   ├── services/    # vimeus.service (embeds) · vimeus.api (listados)
│       │   └── sources/     # registry de StreamSource (vimeus, torrentio)
│       └── ...
├── src-tauri/               # Backend Rust
│   ├── src/lib.rs           # builder de Tauri y registro de comandos
│   ├── src/vimeus.rs        # proxy de la API de listado (X-API-Key server-side)
│   ├── src/torrent.rs       # motor librqbit + servidor HTTP local con Range
│   ├── src/mpv.rs           # driver de mpv (IPC por named pipe)
│   └── mpv/                 # configuración y scripts de mpv (uosc)
├── api/                     # API FastAPI opcional para el módulo de anime (desactivado)
└── odd/tasks/               # documentos de trabajo (specs y tareas)
```

## 🎯 APIs utilizadas

### TMDB

- Metadatos de películas y series, imágenes, búsqueda y recomendaciones
- [Documentación TMDB](https://developer.themoviedb.org/docs)

### Vimeus (`vimeus.net`)

- **Embeds** (`view_key` obligatoria): `https://vimeus.net/e/movie`, `/e/serie`, `/e/anime`
  con `imdb` o `tmdb`, más `se`/`ep` opcionales en series y anime
- **Listados** (requieren `X-API-Key`, 50 resultados por página):
  `https://vimeus.net/api/listing/movies`, `/series`, `/animes`, `/episodes`
- Las URLs de `poster`/`backdrop` son rutas relativas de TMDB: concatenar con
  `https://image.tmdb.org/t/p/original`
- Los iframes se insertan siempre con `referrerpolicy="origin"`

`vimeus.com` no es un dominio válido para inserciones: la app usa exclusivamente `vimeus.net`.

## 🌐 Rutas principales

- `/` — Inicio
- `/movies` · `/movie/:id` — Películas
- `/series` · `/serie/:id` — Series
- `/player/:type/:id/:season?/:episode?` — Reproductor
- `/search` — Búsqueda
- `/favorites` · `/recent` — Favoritos y vistos recientemente
- `/settings` — Ajustes

El módulo de anime (`/animes`, `/anime/:slug`, `/ver-anime/:slug/:episode`) está desactivado por
el flag `__ANIME_ENABLED__` de `vite.config.ts`.

## 📝 Scripts

```bash
pnpm dev            # Vite dev server (sólo navegador)
pnpm build          # vue-tsc + build de producción a dist/
pnpm type-check     # Chequeo de tipos sin emitir
pnpm tauri:dev      # App de escritorio en modo desarrollo
pnpm tauri:build    # Instalador NSIS de Windows
```

## 🎨 Paleta de colores

- **Primary**: `#EE5E53` (rojo coral)
- **Dark**: `#1D1D1D`
- **Accent**: variaciones de gris y transparencias

## 📄 Licencia

MIT.
