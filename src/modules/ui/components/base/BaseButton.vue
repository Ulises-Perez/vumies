<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? disabled : undefined"
    :class="classes"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
type Size = 'sm' | 'default' | 'lg' | 'icon'

interface Props {
  variant?: Variant
  size?: Size
  // Si se pasa `to`, renderiza <router-link>; si `href`, <a>; si no, <button>.
  to?: string | Record<string, unknown>
  href?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  type: 'button',
  disabled: false,
})

const tag = computed(() => {
  if (props.to) return 'router-link'
  if (props.href) return 'a'
  return 'button'
})

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0'

const variants: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
  link: 'text-primary underline-offset-4 hover:underline',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  default: 'h-9 px-4 py-2',
  lg: 'h-11 px-8 text-base',
  icon: 'h-9 w-9',
}

const classes = computed(() => [base, variants[props.variant], sizes[props.size]])
</script>
