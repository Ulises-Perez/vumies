import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
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
        // de la app no invalida su caché entre deploys (~43 kB gzip que el usuario
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
})
