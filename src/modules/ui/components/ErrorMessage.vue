<template>
  <div v-if="show" class="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg relative" role="alert">
    <div class="flex items-start">
      <svg class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      <div class="flex-1">
        <strong v-if="title" class="font-bold block mb-1">{{ title }}</strong>
        <span class="block sm:inline">{{ message }}</span>
      </div>
      <button
        v-if="closeable"
        @click="close"
        class="ml-4 text-red-500 hover:text-red-700"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  message: string
  title?: string
  closeable?: boolean
}

withDefaults(defineProps<Props>(), {
  closeable: true,
})

const show = ref(true)

function close() {
  show.value = false
}
</script>

