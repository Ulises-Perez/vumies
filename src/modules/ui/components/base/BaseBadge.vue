<template>
  <span :class="classes">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'default' | 'secondary' | 'outline' | 'muted'

interface Props {
  variant?: Variant
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const base =
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors'

const variants: Record<Variant, string> = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  outline: 'border-border text-foreground',
  muted: 'border-transparent bg-muted text-muted-foreground',
}

const classes = computed(() => [base, variants[props.variant]])
</script>
