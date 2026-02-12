<template>
  <div id="app" class="min-h-screen bg-dark pb-20">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    
    <AppFooter />
    <BottomMenu />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/core/stores/app.store'
import AppFooter from '@/modules/ui/components/AppFooter.vue'
import BottomMenu from '@/modules/ui/components/BottomMenu.vue'

const appStore = useAppStore()

onMounted(() => {
  // Load genres on app mount
  appStore.fetchGenres()
})
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
