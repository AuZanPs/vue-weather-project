<script setup lang="ts">
import { computed } from 'vue'
import * as LucideIcons from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  name: keyof typeof LucideIcons | string
  size?: number | string
  strokeWidth?: number
  color?: string
}>(), {
  size: 24,
  strokeWidth: 2,
  color: 'currentColor'
})

const IconComponent = computed(() => {
  const comp = (LucideIcons as any)[props.name]
  return comp || (LucideIcons as any).Circle // fallback icon
})
</script>

<template>
  <component
    :is="IconComponent"
    :size="size"
    :stroke-width="strokeWidth"
    :color="color"
    v-bind="$attrs"
  />
</template>
