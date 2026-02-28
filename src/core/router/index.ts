import { createRouter, createWebHistory } from 'vue-router'

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
      path: '/animes',
      name: 'animes',
      component: () => import('@/modules/catalog/views/AnimeView.vue'),
      meta: { title: 'Animes - Vumies' },
    },
    {
      path: '/serie/:id',
      name: 'serie-detail',
      component: () => import('@/modules/catalog/views/SerieDetailView.vue'),
      meta: { title: 'Serie - Vumies' },
    },
    {
      path: '/anime/:id',
      name: 'anime-detail',
      // We can reuse SerieDetailView for Anime since TMDB treats them as TV shows
      component: () => import('@/modules/catalog/views/SerieDetailView.vue'),
      meta: { title: 'Anime - Vumies' },
    },
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
      return { top: 0, behavior: 'smooth' }
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
