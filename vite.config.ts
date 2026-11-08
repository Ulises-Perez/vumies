import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv con prefijo '' lee TODAS las entradas del .env, incluidas las que no
  // llevan `VITE_`. El token de TMDB se inyecta en el dev proxy desde Node y no
  // llega nunca al bundle del cliente.
  const env = loadEnv(mode, process.cwd(), '')
  const tmdbToken = env.TMDB_BEARER_TOKEN || env.VITE_TMDB_BEARER_TOKEN

  return {
    plugins: [vue()],
    // Keep the console output and use a fixed port for the Vite dev server.
    clearScreen: false,
    server: {
      port: 5173,
      strictPort: true,
      // Equivalente de desarrollo al proxy `/api/tmdb/*` de `server.ts`: el
      // navegador llama la misma ruta same-origin en ambos entornos y el bearer
      // lo agrega Node acá, jamás el cliente.
      proxy: {
        '/api/tmdb': {
          target: 'https://api.themoviedb.org/3',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/tmdb/, ''),
          headers: tmdbToken ? { Authorization: `Bearer ${tmdbToken}` } : {},
        },
      },
    },
    // ===== TOGGLE ÚNICO DEL MÓDULO DE ANIME =====
    // Cambiar a `true` para REACTIVAR todo el anime (rutas, navegación, búsqueda).
    // Al ser una constante de build, con `false` Rollup elimina del bundle las vistas,
    // el composable y el servicio de anime (tree-shaking). Todo el código sigue en el repo.
    define: {
      __ANIME_ENABLED__: JSON.stringify(false),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Aísla el framework (vue + router + pinia) en un chunk estable: cambiar código
          // de la app no invalida su caché between deploys (~43 kB gzip que el usuario
          // recurrente no vuelve a descargar). Forma de FUNCIÓN para respetar el orden de
          // init de Vue/Pinia (Rollup normaliza los ids a forward-slash en cualquier SO).
          // El resto de node_modules (heroicons, minúsculo y en el shell) se deja en su
          // chunk natural para no emitir chunks vacíos.
          manualChunks(id) {
            if (
              id.includes('node_modules') &&
              (id.includes('/vue/') ||
                id.includes('/@vue/') ||
                id.includes('/vue-router/') ||
                id.includes('/pinia/'))
            ) {
              return 'vendor-vue'
            }
          },
        },
      },
    },
  }
})
