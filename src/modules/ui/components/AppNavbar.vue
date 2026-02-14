<template>
  <header 
    class="fixed top-0 right-0 left-0 md:left-20 lg:left-64 z-40 transition-all duration-300"
    :class="[scrolled ? 'bg-dark/90 backdrop-blur-md border-b border-white/5 py-2' : 'bg-transparent py-4']"
  >
    <div class="px-6 h-16 flex items-center justify-between">
      <!-- Mobile Menu Button (Only Visible on Mobile) -->
      <button 
        class="md:hidden text-white p-2 -ml-2"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Desktop Search Bar -->
      <div class="flex-1 max-w-xl mx-4 hidden md:block">
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            class="block w-full pl-10 pr-3 py-2.5 bg-gray-800/50 border border-transparent rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-gray-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all sm:text-sm"
            placeholder="Buscar películas, series, actores..."
            @input="handleInput"
            @keyup.enter="handleSearch"
            @focus="showDropdown = suggestions.length > 0"
          />

          <!-- Dropdown Suggestions -->
          <div 
            v-if="showDropdown && suggestions.length > 0" 
            class="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <ul>
              <li 
                v-for="item in suggestions" 
                :key="item.id"
                @click="handleSuggestionClick(item)"
                class="flex items-center p-3 hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-800 last:border-0"
              >
                <img 
                  v-if="item.poster_path" 
                  :src="getPosterUrl(item.poster_path, 'w92')" 
                  :alt="item.title || item.name" 
                  class="w-10 h-14 object-cover rounded-md mr-3"
                >
                <div v-else class="w-10 h-14 bg-gray-700 rounded-md mr-3 flex items-center justify-center">
                   <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                  <h4 class="text-white text-sm font-medium line-clamp-1">{{ item.title || item.name }}</h4>
                  <p class="text-gray-400 text-xs capitalize">{{ item.media_type === 'movie' ? 'Película' : 'Serie' }} • {{ (item.vote_average || 0).toFixed(1) }}</p>
                </div>
              </li>
              <li 
                @click="handleViewAll"
                class="bg-gray-800 p-3 text-center cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <span class="text-primary font-semibold text-sm">Ver todos los resultados ({{ suggestions.length }}+)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Right Actions -->
      <div class="flex items-center space-x-4">
        <!-- Search Icon (Mobile) -->
        <button 
          class="md:hidden text-white p-2"
          @click="toggleSearch"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <!-- Notifications -->
        <button class="relative p-2 text-gray-400 hover:text-white transition-colors">
          <span class="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-dark"></span>
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <!-- Profile Dropdown (Placeholder) -->
        <div class="relative ml-2">
           <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="User" 
            class="w-9 h-9 rounded-full border-2 border-gray-700 cursor-pointer"
          >
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/core/stores/app.store'
import { tmdbService } from '@/modules/catalog/services/tmdb.service'
import { getPosterUrl } from '@/core/config/api.config'

const router = useRouter()
const appStore = useAppStore()

const scrolled = ref(false)
const mobileMenuOpen = ref(false)
const showDropdown = ref(false)
const suggestions = ref<any[]>([])
let searchTimeout: number | null = null

const searchQuery = computed({
  get: () => appStore.searchQuery,
  set: (value) => appStore.setSearchQuery(value),
})

function handleScroll() {
  scrolled.value = window.scrollY > 10
}

async function fetchSuggestions() {
  if (!searchQuery.value.trim()) {
    suggestions.value = []
    return
  }
  
  try {
    const response = await tmdbService.searchMulti(searchQuery.value)
    // Filter for movies and tv shows only, take top 5
    suggestions.value = response.results
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .slice(0, 5)
    
    showDropdown.value = suggestions.value.length > 0
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    suggestions.value = []
  }
}

function handleInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    showDropdown.value = false
    suggestions.value = []
    return
  }
  searchTimeout = window.setTimeout(fetchSuggestions, 300)
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    showDropdown.value = false
    router.push({ name: 'search', query: { q: searchQuery.value } })
    mobileMenuOpen.value = false
  }
}

function handleSuggestionClick(item: any) {
  showDropdown.value = false
  searchQuery.value = '' // Optional: clear search query on selection
  const routeName = item.media_type === 'movie' ? 'movie-detail' : 'serie-detail'
  router.push({ name: routeName, params: { id: item.id } })
}

function handleViewAll() {
  handleSearch()
}

function toggleSearch() {
  // Option 1: Redirect to search page
  router.push('/search')
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.group')) {
    showDropdown.value = false
  }
}


onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.search-enter-active,
.search-leave-active {
  transition: all 0.3s ease;
}

.search-enter-from,
.search-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  max-height: 0;
}

.mobile-menu-enter-to,
.mobile-menu-leave-from {
  opacity: 1;
  max-height: 300px;
}
</style>

