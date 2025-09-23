<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import { getLucideIconNameForCode } from '../utils/weatherIcons'

const props = withDefaults(defineProps<{ iconCode: number; size?: number }>(), {
  size: 28
})
const lucideName = computed(() => getLucideIconNameForCode(props.iconCode))
</script>

<template>
  <Icon :name="lucideName" :size="props.size" :stroke-width="2.5" />
</template>