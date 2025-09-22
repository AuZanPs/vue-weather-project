<script setup lang="ts">
interface ForecastItem {
  day: string
  iconCode: number
  high: number
  low: number
  precipitation: number
}

defineProps<{
  forecast: ForecastItem[]
  tempSymbol: string
}>()
</script>

<template>
  <div class="p-4 text-terminal-white">
    <div class="text-terminal-blue mb-2">
      [5-DAY FORECAST]
    </div>
    <div class="space-y-1 font-mono text-sm">
      <div
        v-for="item in forecast"
        :key="item.day"
        class="flex"
      >
        <span class="text-terminal-white w-8">{{ item.day }}</span>
        <span class="text-terminal-white ml-4">{{ item.high }}{{ tempSymbol }}/{{ item.low }}{{ tempSymbol }}</span>
        <span class="text-terminal-blue ml-4">[PRECIP: {{ item.precipitation }}%]</span>
      </div>
    </div>
  </div>
</template>
