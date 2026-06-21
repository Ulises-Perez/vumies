<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  // Cuando es true, añade hover de superficie/borde para grids clicables.
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  interactive: false,
})

const classes = computed(() => [
  'rounded-xl border border-border bg-card text-card-foreground shadow-sm',
  props.interactive
    ? 'transition-colors hover:bg-accent hover:border-primary/40 cursor-pointer'
    : '',
])
</script>
