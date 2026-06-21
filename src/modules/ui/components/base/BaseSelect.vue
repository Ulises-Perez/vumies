<template>
  <div class="relative inline-flex">
    <select
      :value="modelValue"
      :class="classes"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <slot />
    </select>
    <svg
      class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string | number
}

defineProps<Props>()
defineEmits<{ 'update:modelValue': [value: string] }>()

const classes = computed(() => [
  'h-9 w-full appearance-none rounded-md border border-input bg-transparent pl-3 pr-9 text-sm',
  'shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-popover [&>option]:text-popover-foreground',
])
</script>
