<template>
  <footer class="border-t border-gray-700 bg-dark-300">
    <div class="container-custom py-10">
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        <!-- Logo & Info -->
        <div class="col-span-1 md:col-span-3 lg:col-span-1">
          <router-link to="/" class="flex items-center space-x-2 mb-4">
            <div class="text-3xl font-bold text-primary">De</div>
            <span class="text-2xl font-poppins font-bold text-white">Peli</span>
          </router-link>
          <p class="text-sm text-gray-400">
            Tu plataforma favorita para ver películas y series online. Contenido actualizado
            diariamente.
          </p>
        </div>

        <!-- Links -->
        <div>
          <h3 class="text-lg font-semibold text-white mb-4">Navegación</h3>
          <ul class="space-y-2">
            <li>
              <router-link to="/" class="text-gray-400 hover:text-primary transition-colors">
                Inicio
              </router-link>
            </li>
            <li>
              <router-link
                to="/movies"
                class="text-gray-400 hover:text-primary transition-colors"
              >
                Películas
              </router-link>
            </li>
            <li>
              <router-link
                to="/series"
                class="text-gray-400 hover:text-primary transition-colors"
              >
                Series
              </router-link>
            </li>
            <li>
              <router-link
                to="/favorites"
                class="text-gray-400 hover:text-primary transition-colors"
              >
                Favoritos
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Categories -->
        <div>
          <h3 class="text-lg font-semibold text-white mb-4">Categorías</h3>
          <ul class="space-y-2">
            <li>
              <a href="#" class="text-gray-400 hover:text-primary transition-colors">Acción</a>
            </li>
            <li>
              <a href="#" class="text-gray-400 hover:text-primary transition-colors">Comedia</a>
            </li>
            <li>
              <a href="#" class="text-gray-400 hover:text-primary transition-colors">Drama</a>
            </li>
            <li>
              <a href="#" class="text-gray-400 hover:text-primary transition-colors">Terror</a>
            </li>
          </ul>
        </div>

        <!-- Info -->
        <div>
          <h3 class="text-lg font-semibold text-white mb-4">Legal</h3>
          <ul class="space-y-2">
            <li>
              <a href="#" class="text-gray-400 hover:text-primary transition-colors">
                Términos de Uso
              </a>
            </li>
            <li>
              <a href="#" class="text-gray-400 hover:text-primary transition-colors">
                Política de Privacidad
              </a>
            </li>
            <li>
              <a href="#" class="text-gray-400 hover:text-primary transition-colors">DMCA</a>
            </li>
            <li>
              <a href="#" class="text-gray-400 hover:text-primary transition-colors">Contacto</a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Copyright -->
      <div class="border-t border-gray-700 mt-8 pt-8 text-center">
        <p class="text-sm text-gray-400">
          © {{ currentYear }} Vumies. Todos los derechos reservados. Powered by TMDB & Vimeus.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

