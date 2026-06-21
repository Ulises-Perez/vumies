<template>
  <input
    ref="inputRef"
    :value="modelValue"
    :class="classes"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  modelValue?: string
  // Reservan espacio para iconos absolutos puestos por el wrapper padre.
  leadingIcon?: boolean
  trailingIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  leadingIcon: false,
  trailingIcon: false,
})

defineEmits<{ 'update:modelValue': [value: string] }>()

const inputRef = ref<HTMLInputElement | null>(null)
defineExpose({ focus: () => inputRef.value?.focus() })

const base =
  'flex h-9 w-full rounded-md border border-input bg-transparent py-1 text-sm shadow-sm ' +
  'transition-colors placeholder:text-muted-foreground ' +
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const padding = computed(() => {
  const pl = props.leadingIcon ? 'pl-9' : 'pl-3'
  const pr = props.trailingIcon ? 'pr-9' : 'pr-3'
  return `${pl} ${pr}`
})

const classes = computed(() => [base, padding.value])
</script>
