<template>
  <!-- Search Overlay (Fixed Top) -->
  <Teleport to="body">
    <Transition name="search-overlay">
      <div v-if="showSearchOverlay" class="search-overlay" @click.self="closeSearchOverlay">
        <!-- Search Bar -->
        <div class="search-bar">
          <div class="search-bar-inner">
            <button @click="closeSearchOverlay" class="search-back-btn">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div class="search-input-wrapper">
              <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                placeholder="Buscar películas, series, actores..."
                class="search-input"
                @input="handleSearchInput"
                @keyup.enter="handleSearch"
              />
              <button
                v-if="searchQuery"
                @click="clearSearch"
                class="search-clear-btn"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Suggestions Dropdown -->
        <div class="suggestions-container" v-if="suggestions.length > 0">
          <ul class="suggestions-list">
            <li
              v-for="item in suggestions"
              :key="item.id"
              @click="handleSuggestionClick(item)"
              class="suggestion-item"
            >
              <img
                v-if="item.poster_path"
                :src="getPosterUrl(item.poster_path, 'w92')"
                :alt="item.title || item.name"
                class="suggestion-poster"
              >
              <div v-else class="suggestion-poster-placeholder">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="suggestion-info">
                <h4 class="suggestion-title">{{ item.title || item.name }}</h4>
                <p class="suggestion-meta">
                  {{ item.media_type === 'movie' ? 'Película' : 'Serie' }} • {{ (item.vote_average || 0).toFixed(1) }}
                </p>
              </div>
            </li>
          </ul>
          <button @click="handleViewAll" class="view-all-btn">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Ver todos los resultados</span>
          </button>
        </div>

        <!-- Empty state while typing -->
        <div v-else-if="searchQuery && !isSearching" class="suggestions-container">
          <div class="empty-suggestions">
            <p class="text-gray-400 text-sm">No se encontraron sugerencias</p>
          </div>
        </div>

        <!-- Loading state -->
        <div v-else-if="isSearching" class="suggestions-container">
          <div class="empty-suggestions">
            <div class="loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Bottom Navigation Bar -->
  <nav class="bottom-nav md:hidden" v-show="!isPlayerRoute">
    <div class="bottom-nav-inner">
      <router-link
        to="/"
        class="nav-item"
        :class="{ active: isActive('/') }"
        @click="closeSearchOverlay"
      >
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="nav-label">Inicio</span>
      </router-link>

      <router-link
        to="/movies"
        class="nav-item"
        :class="{ active: isActive('/movies') }"
        @click="closeSearchOverlay"
      >
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
        <span class="nav-label">Películas</span>
      </router-link>

      <router-link
        to="/series"
        class="nav-item"
        :class="{ active: isActive('/series') }"
        @click="closeSearchOverlay"
      >
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span class="nav-label">Series</span>
      </router-link>

      <button
        class="nav-item"
        :class="{ active: isActive('/search') || showSearchOverlay }"
        @click="openSearchOverlay"
      >
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span class="nav-label">Buscar</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tmdbService } from '@/modules/catalog/services/tmdb.service'
import { getPosterUrl } from '@/core/config/api.config'

const route = useRoute()
const router = useRouter()

const isPlayerRoute = computed(() => route.name === 'player' || route.path.startsWith('/player'))

const showSearchOverlay = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const suggestions = ref<any[]>([])
const isSearching = ref(false)
let searchTimeout: number | null = null

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function openSearchOverlay() {
  showSearchOverlay.value = true
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

function closeSearchOverlay() {
  showSearchOverlay.value = false
  suggestions.value = []
}

function clearSearch() {
  searchQuery.value = ''
  suggestions.value = []
  searchInputRef.value?.focus()
}

async function fetchSuggestions() {
  if (!searchQuery.value.trim()) {
    suggestions.value = []
    isSearching.value = false
    return
  }

  isSearching.value = true
  try {
    const response = await tmdbService.searchMulti(searchQuery.value)
    suggestions.value = response.results
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .slice(0, 6)
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    suggestions.value = []
  } finally {
    isSearching.value = false
  }
}

function handleSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    suggestions.value = []
    isSearching.value = false
    return
  }
  isSearching.value = true
  searchTimeout = window.setTimeout(fetchSuggestions, 300)
}

function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (searchQuery.value.trim()) {
    closeSearchOverlay()
    router.push({ path: '/search', query: { q: searchQuery.value } })
  }
}

function handleSuggestionClick(item: any) {
  closeSearchOverlay()
  searchQuery.value = ''
  const routeName = item.media_type === 'movie' ? 'movie-detail' : 'serie-detail'
  router.push({ name: routeName, params: { id: item.id } })
}

function handleViewAll() {
  handleSearch()
}

// Sync input with route query when already on search page
watch(
  () => route.query.q,
  (newQuery) => {
    if (newQuery) {
      searchQuery.value = newQuery as string
    }
  }
)

// Close overlay when navigating away
watch(
  () => route.path,
  () => {
    closeSearchOverlay()
  }
)

onMounted(() => {
  if (route.path === '/search' && route.query.q) {
    searchQuery.value = route.query.q as string
  }
})
</script>

<style scoped>
/* ===== Bottom Navigation ===== */
.bottom-nav {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: auto;
  max-width: calc(100vw - 2rem);
}

.bottom-nav-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 14px 28px;
  background: rgba(29, 29, 29, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
}

.nav-item:hover,
.nav-item.active {
  color: var(--color-primary, #EE5E53);
}

.nav-item.active .nav-icon {
  filter: drop-shadow(0 0 6px rgba(238, 94, 83, 0.4));
}

.nav-icon {
  width: 26px;
  height: 26px;
  transition: filter 0.2s ease;
}

.nav-label {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.85;
  letter-spacing: 0.02em;
}

/* ===== Search Overlay ===== */
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: transparent;
}

.search-bar {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top));
  background: rgba(29, 29, 29, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.search-bar-inner {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-back-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.06);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.35);
  pointer-events: none;
  transition: color 0.2s ease;
}

.search-input-wrapper:focus-within .search-icon {
  color: var(--color-primary, #EE5E53);
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: white;
  font-size: 15px;
  outline: none;
  transition: all 0.2s ease;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.search-input:focus {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(238, 94, 83, 0.4);
  box-shadow: 0 0 0 3px rgba(238, 94, 83, 0.1);
}

.search-clear-btn {
  position: absolute;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-clear-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

/* ===== Suggestions ===== */
.suggestions-container {
  margin: 8px 16px;
  background: rgba(29, 29, 29, 0.96);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.suggestions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item:active {
  background: rgba(255, 255, 255, 0.06);
}

.suggestion-poster {
  width: 40px;
  height: 56px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 14px;
  flex-shrink: 0;
}

.suggestion-poster-placeholder {
  width: 40px;
  height: 56px;
  border-radius: 8px;
  margin-right: 14px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.suggestion-info {
  flex: 1;
  min-width: 0;
}

.suggestion-title {
  color: white;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-meta {
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
  margin-top: 2px;
  text-transform: capitalize;
}

.view-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  color: var(--color-primary, #EE5E53);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.view-all-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.empty-suggestions {
  padding: 24px;
  text-align: center;
}

/* ===== Loading Dots ===== */
.loading-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: dots 1.2s ease-in-out infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.15s; }
.loading-dots span:nth-child(3) { animation-delay: 0.3s; }

@keyframes dots {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1.2); }
}

/* ===== Overlay Transitions ===== */
.search-overlay-enter-active {
  transition: opacity 0.25s ease;
}
.search-overlay-enter-active .search-bar {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-overlay-leave-active {
  transition: opacity 0.2s ease;
}
.search-overlay-leave-active .search-bar {
  transition: transform 0.2s ease;
}

.search-overlay-enter-from {
  opacity: 0;
}
.search-overlay-enter-from .search-bar {
  transform: translateY(-100%);
}

.search-overlay-leave-to {
  opacity: 0;
}
.search-overlay-leave-to .search-bar {
  transform: translateY(-100%);
}
</style>
