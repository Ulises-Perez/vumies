/// <reference types="vite/client" />

// Flag de compilación inyectado por Vite (define). Toggle único del módulo de anime.
// Al ser una constante literal en build, Rollup tree-shakea las rutas/chunks de anime
// cuando vale false. Ver vite.config.ts (define) y src/core/config/features.ts.
declare const __ANIME_ENABLED__: boolean

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}
