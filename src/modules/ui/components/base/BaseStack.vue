<template>
  <!-- Stack con la escala de spacing de Astryx: gap/padding toman los pasos
       documentados (0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10) y cada paso son 4px,
       salvo 0.5 (2px) y 1.5 (6px), que la multiplicacion resuelve sola. -->
  <component :is="as" :style="style">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** Pasos de spacing de Astryx. `paso * 4` da el px exacto en toda la escala. */
export type SpacingStep = 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10
export type StackAlign = 'start' | 'center' | 'end' | 'stretch'
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'

interface Props {
  as?: string
  direction?: 'row' | 'column'
  gap?: SpacingStep
  padding?: SpacingStep
  align?: StackAlign
  justify?: StackJustify
  wrap?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
  direction: 'column',
  gap: 0,
  padding: 0,
  align: 'stretch',
  justify: 'start',
  wrap: false,
})

const alignMap: Record<StackAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
}

const justifyMap: Record<StackJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
}

const style = computed(() => ({
  display: 'flex',
  flexDirection: props.direction === 'row' ? 'row' : 'column',
  gap: `${props.gap * 4}px`,
  padding: `${props.padding * 4}px`,
  alignItems: alignMap[props.align],
  justifyContent: justifyMap[props.justify],
  flexWrap: props.wrap ? 'wrap' : 'nowrap',
}))
</script>
