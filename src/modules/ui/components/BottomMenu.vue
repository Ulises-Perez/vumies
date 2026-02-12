<template>
  <nav class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-auto">
    <div class="bg-dark rounded-2xl shadow-2xl border border-gray-800/50 backdrop-blur-lg">
      <div class="flex items-center justify-center px-6 py-3.5">
        <div class="flex items-center space-x-10">
          <!-- Inicio -->
          <router-link
            to="/"
            class="flex flex-col items-center space-y-1 transition-all duration-200"
            :class="isActive('/') ? 'text-primary' : 'text-white'"
            @click="closeSearchInput"
          >
            <svg
              class="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span class="text-xs font-light opacity-80">Inicio</span>
          </router-link>

          <!-- Películas -->
          <router-link
            to="/movies"
            class="flex flex-col items-center space-y-1 transition-all duration-200"
            :class="isActive('/movies') ? 'text-primary' : 'text-white'"
            @click="closeSearchInput"
          >
            <svg
              class="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
            <span class="text-xs font-light opacity-80">Películas</span>
          </router-link>

          <!-- Series -->
          <router-link
            to="/series"
            class="flex flex-col items-center space-y-1 transition-all duration-200"
            :class="isActive('/series') ? 'text-primary' : 'text-white'"
            @click="closeSearchInput"
          >
            <svg
              class="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span class="text-xs font-light opacity-80">Series</span>
          </router-link>

          <!-- Búsqueda -->
          <div class="flex items-center space-x-3">
            <button
              @click="toggleSearchInput"
              class="flex flex-col items-center space-y-1 transition-all duration-200"
              :class="isActive('/search') || showSearchInput ? 'text-primary' : 'text-white'"
            >
              <svg
                class="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span class="text-xs font-light opacity-80">Buscar</span>
            </button>

            <!-- Search Input -->
            <Transition name="search-input">
              <div v-if="showSearchInput" class="flex items-center">
                <input
                  ref="searchInputRef"
                  v-model="searchQuery"
                  type="text"
                  placeholder="Buscar..."
                  class="bg-black/40 backdrop-blur-md rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 border border-gray-700/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all duration-200 shadow-inner"
                  style="width: 220px; min-width: 220px;"
                  @input="handleSearchInput"
                  @keyup.enter="handleSearch"
                />
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const showSearchInput = ref(false)
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
let searchTimeout: number | null = null

function isActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

function toggleSearchInput() {
  showSearchInput.value = !showSearchInput.value
  
  if (showSearchInput.value) {
    // Solo mostrar el input, no navegar todavía
    // Enfocar el input después de que aparezca
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  } else {
    // Si se cierra el input y no hay texto, volver al inicio
    if (!searchQuery.value.trim()) {
      if (route.path === '/search') {
        router.push('/')
      }
      searchQuery.value = ''
    }
  }
}

function closeSearchInput() {
  showSearchInput.value = false
  
  // Si no hay texto, volver al inicio
  if (!searchQuery.value.trim()) {
    if (route.path === '/search') {
      router.push('/')
    }
    searchQuery.value = ''
  }
}

function handleSearchInput() {
  // Debounce: actualizar la ruta con el query después de un delay solo si hay texto
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = window.setTimeout(() => {
    if (searchQuery.value.trim()) {
      // Solo navegar a /search si hay texto
      router.push({ 
        path: '/search', 
        query: { q: searchQuery.value } 
      })
    } else {
      // Si no hay texto y estamos en /search, volver al inicio
      if (route.path === '/search') {
        router.push('/')
      }
    }
  }, 500)
}

function handleSearch() {
  // Limpiar timeout y ejecutar búsqueda inmediatamente al presionar Enter
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (searchQuery.value.trim()) {
    router.push({ 
      path: '/search', 
      query: { q: searchQuery.value } 
    })
  }
}

// Sincronizar el input con la ruta cuando cambie (solo cuando hay query)
watch(
  () => route.query.q,
  (newQuery) => {
    if (newQuery) {
      searchQuery.value = newQuery as string
      // Mostrar el input si hay un query en la ruta
      if (!showSearchInput.value && route.path === '/search') {
        showSearchInput.value = true
      }
    } else {
      // Si se limpia el query y estamos en /search, mantener el input abierto pero vacío
      if (route.path === '/search') {
        searchQuery.value = ''
      }
    }
  }
)

// Si salimos de la página de búsqueda, cerrar el input
watch(
  () => route.path,
  (newPath) => {
    if (newPath !== '/search') {
      showSearchInput.value = false
      searchQuery.value = ''
    } else if (newPath === '/search' && route.query.q) {
      // Si estamos en /search y hay query, mostrar el input
      showSearchInput.value = true
      searchQuery.value = route.query.q as string
    }
  }
)

onMounted(() => {
  // Si estamos en la página de búsqueda con query, mostrar el input
  if (route.path === '/search' && route.query.q) {
    showSearchInput.value = true
    searchQuery.value = route.query.q as string
  }
})
</script>

<style scoped>
nav {
  max-width: calc(100vw - 2rem);
}

.search-input-enter-active,
.search-input-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.search-input-enter-from {
  opacity: 0;
  width: 0;
  margin-left: 0;
  transform: translateX(-10px);
}

.search-input-enter-to {
  opacity: 1;
  width: 220px;
  margin-left: 0;
  transform: translateX(0);
}

.search-input-leave-from {
  opacity: 1;
  width: 220px;
  margin-left: 0;
  transform: translateX(0);
}

.search-input-leave-to {
  opacity: 0;
  width: 0;
  margin-left: 0;
  transform: translateX(-10px);
}
</style>
