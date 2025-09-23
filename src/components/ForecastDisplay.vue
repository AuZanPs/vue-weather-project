<script setup lang="ts">
import WeatherIcon from './WeatherIcon.vue'
interface ForecastItem {
  day: string
  date?: string
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
  <div class="p-3 text-terminal-white">
    <div class="text-terminal-blue mb-1.5 flex items-center gap-2">
      <span>[5-DAY FORECAST]</span>
      <span class="relative group inline-flex items-center" aria-label="Help">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="text-terminal-blue opacity-80">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4" />
          <line x1="12" y1="17" x2="12" y2="17" />
        </svg>
        <div class="absolute top-1/2 -translate-y-1/2 left-6 hidden group-hover:block bg-[#011173] text-terminal-white text-xs border border-[#419bfb] rounded px-2 py-1 whitespace-nowrap z-10">
          PRECiP = chance of precipitation. Bars show probability of rain/snow.
        </div>
      </span>
    </div>
    <!-- Column layout: stacked forecast cards -->
    <div class="grid grid-cols-1 gap-1.5 font-mono text-xs">
      <div v-for="item in forecast" :key="item.day" class="rounded-md px-3 py-1.5 bg-[#011173]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <WeatherIcon :icon-code="item.iconCode" />
            <span class="text-terminal-white font-semibold truncate">
              {{ item.day }}
              <span v-if="item.date" class="text-terminal-blue ml-2">({{ item.date }})</span>
            </span>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-terminal-white">{{ item.high }}{{ tempSymbol }}/{{ item.low }}{{ tempSymbol }}</span>
            <span class="text-terminal-blue">[PRECIP: {{ item.precipitation }}%]</span>
          </div>
        </div>
        <!-- Retro precipitation bar -->
        <div class="mt-1.5">
          <div class="h-1.5 w-full bg-[#06206b] overflow-hidden">
            <div
              class="h-full bg-[#419bfb]"
              :style="{ width: Math.max(0, Math.min(100, item.precipitation)) + '%' }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
