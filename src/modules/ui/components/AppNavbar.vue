<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="[scrolled ? 'glass-dark border-b border-gray-700' : 'gradient-overlay-top']"
  >
    <div class="container-custom">
      <div class="flex items-center justify-between py-4">
        <!-- Logo -->
        <router-link to="/" class="flex items-center space-x-2">
          <div class="text-3xl font-bold text-primary">De</div>
          <span class="text-2xl font-poppins font-bold text-white">Peli</span>
        </router-link>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center space-x-6">
          <router-link
            to="/"
            class="text-sm uppercase text-white hover:text-primary transition-colors duration-200"
            active-class="text-primary"
          >
            Inicio
          </router-link>
          <router-link
            to="/movies"
            class="text-sm uppercase text-white hover:text-primary transition-colors duration-200"
            active-class="text-primary"
          >
            Películas
          </router-link>
          <router-link
            to="/series"
            class="text-sm uppercase text-white hover:text-primary transition-colors duration-200"
            active-class="text-primary"
          >
            Series
          </router-link>
          <router-link
            to="/favorites"
            class="text-sm uppercase text-white hover:text-primary transition-colors duration-200"
            active-class="text-primary"
          >
            Favoritos
          </router-link>
        </div>

        <!-- Search & Mobile Menu -->
        <div class="flex items-center space-x-4">
          <!-- Search Button -->
          <button
            @click="toggleSearch"
            class="text-white hover:text-primary transition-colors duration-200"
            aria-label="Buscar"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                v-if="!isSearchActive"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <!-- Mobile Menu Button -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden text-white hover:text-primary transition-colors duration-200"
            aria-label="Menú"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="!mobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <Transition name="search">
        <div v-if="isSearchActive" class="pb-4">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Buscar películas, series..."
            class="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            @keyup.enter="handleSearch"
            autofocus
          />
        </div>
      </Transition>

      <!-- Mobile Menu -->
      <Transition name="mobile-menu">
        <div v-if="mobileMenuOpen" class="md:hidden pb-4">
          <div class="flex flex-col space-y-3">
            <router-link
              to="/"
              class="text-sm uppercase text-white hover:text-primary transition-colors duration-200 py-2"
              active-class="text-primary"
              @click="mobileMenuOpen = false"
            >
              Inicio
            </router-link>
            <router-link
              to="/movies"
              class="text-sm uppercase text-white hover:text-primary transition-colors duration-200 py-2"
              active-class="text-primary"
              @click="mobileMenuOpen = false"
            >
              Películas
            </router-link>
            <router-link
              to="/series"
              class="text-sm uppercase text-white hover:text-primary transition-colors duration-200 py-2"
              active-class="text-primary"
              @click="mobileMenuOpen = false"
            >
              Series
            </router-link>
            <router-link
              to="/favorites"
              class="text-sm uppercase text-white hover:text-primary transition-colors duration-200 py-2"
              active-class="text-primary"
              @click="mobileMenuOpen = false"
            >
              Favoritos
            </router-link>
          </div>
        </div>
      </Transition>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/core/stores/app.store'

const router = useRouter()
const appStore = useAppStore()

const scrolled = ref(false)
const mobileMenuOpen = ref(false)

const isSearchActive = computed(() => appStore.isSearchActive)
const searchQuery = computed({
  get: () => appStore.searchQuery,
  set: (value) => appStore.setSearchQuery(value),
})

function handleScroll() {
  scrolled.value = window.scrollY > 10
}

function toggleSearch() {
  appStore.toggleSearch()
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({ name: 'search', query: { q: searchQuery.value } })
    mobileMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
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

