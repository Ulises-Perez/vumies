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
      path: '/serie/:id',
      name: 'serie-detail',
      component: () => import('@/modules/catalog/views/SerieDetailView.vue'),
      meta: { title: 'Serie - Vumies' },
    },
    {
      path: '/serie/:id/season/:season/episode/:episode',
      name: 'episode-player',
      component: () => import('@/modules/player/views/EpisodePlayerView.vue'),
      meta: { title: 'Episodio - Vumies' },
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
