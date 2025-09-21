<script setup lang="ts">
interface ForecastItem {
  day: string
  iconCode: number
  high: number
  low: number
}

defineProps<{
  forecast: ForecastItem[]
}>()
</script>

<template>
  <div class="p-4 text-terminal-white">
    <div class="text-terminal-blue mb-2">
      5-DAY FORECAST
    </div>
    <div class="grid grid-cols-5 gap-2">
      <div
        v-for="item in forecast"
        :key="item.day"
        class="text-center"
      >
        <div class="text-xs">
          {{ item.day }}
        </div>
        <div class="text-sm">
          {{ item.high }}°/{{ item.low }}°
        </div>
      </div>
    </div>
  </div>
</template>
