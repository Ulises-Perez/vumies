import { createRouter, createWebHistory } from 'vue-router'
import { scrollBehavior as motionScrollBehavior } from '@/core/utils/motion'

// Rutas del módulo de anime. Aisladas para poder activar/desactivar TODO el anime
// con FEATURES.anime sin borrar nada (reversible). Los componentes siguen en el repo;
// con el flag en false ni siquiera se incluyen en el bundle (Vite no los empaqueta).
const animeRoutes = [
  {
    path: '/animes',
    name: 'animes',
    component: () => import('@/modules/catalog/views/AnimeView.vue'),
    meta: { title: 'Animes - Vumies' },
  },
  {
    // AnimeAV1 (fuente principal de animes): detalle por slug
    path: '/anime/:slug',
    name: 'anime-av1-detail',
    component: () => import('@/modules/catalog/views/AnimeDetailView.vue'),
    meta: { title: 'Anime - Vumies' },
  },
  {
    // AnimeAV1: reproductor de episodio
    path: '/ver-anime/:slug/:episode',
    name: 'anime-av1-watch',
    component: () => import('@/modules/catalog/views/AnimeWatchView.vue'),
    meta: { title: 'Reproductor - Vumies' },
  },
  {
    // Segundo plano: animes de Vimeus/TMDB (tratados como series TV)
    path: '/anime-tmdb/:id',
    name: 'anime-detail',
    component: () => import('@/modules/catalog/views/SerieDetailView.vue'),
    meta: { title: 'Anime - Vumies' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/modules/catalog/views/HomeView.vue'),
      meta: { title: 'Vumies - Películas y Series Online' },
    },
    {
      path: '/movies',
      name: 'movies',
      component: () => import('@/modules/catalog/views/MoviesView.vue'),
      meta: { title: 'Películas - Vumies' },
    },
    {
      path: '/movie/:id',
      name: 'movie-detail',
      component: () => import('@/modules/catalog/views/MovieDetailView.vue'),
      meta: { title: 'Película - Vumies' },
    },
    {
      path: '/series',
      name: 'series',
      component: () => import('@/modules/catalog/views/SeriesView.vue'),
      meta: { title: 'Series - Vumies' },
    },
    {
      path: '/serie/:id',
      name: 'serie-detail',
      component: () => import('@/modules/catalog/views/SerieDetailView.vue'),
      meta: { title: 'Serie - Vumies' },
    },

    // Anime (gateado tras __ANIME_ENABLED__; con false Rollup elimina estas rutas
    // y sus chunks del bundle). Reactivar => poner __ANIME_ENABLED__ en true.
    ...(__ANIME_ENABLED__ ? animeRoutes : []),

    {
      path: '/player/:type/:id/:season?/:episode?',
      name: 'player',
      component: () => import('@/modules/player/views/PlayerView.vue'),
      meta: { title: 'Reproductor - Vumies' },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/modules/search/views/SearchView.vue'),
      meta: { title: 'Buscar - Vumies' },
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/modules/user/views/FavoritesView.vue'),
      meta: { title: 'Mis Favoritos - Vumies' },
    },
    {
      path: '/recent',
      name: 'recent',
      component: () => import('@/modules/user/views/HistoryView.vue'),
      meta: { title: 'Historial - Vumies' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/modules/user/views/SettingsView.vue'),
      meta: { title: 'Ajustes - Vumies' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/modules/ui/components/NotFoundView.vue'),
      meta: { title: '404 - Vumies' },
    },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      // 'smooth' en cada navegación, salvo que el usuario pida reducir movimiento.
      return { top: 0, behavior: motionScrollBehavior() }
    }
  },
})

// Navigation guards
router.beforeEach((to, _from, next) => {
  // Update document title
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  next()
})

export default router
