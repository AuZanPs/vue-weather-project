<script setup lang="ts">
import Icon from './Icon.vue'
interface CurrentWeather {
  city: string
  temperature: number
  condition: string
  iconCode: number
  humidity: number
  windSpeed: number
  pressure: number
}

defineProps<{
  weather: CurrentWeather
  tempSymbol: string
}>()
</script>

<template>
  <div class="p-3 sm:p-4 text-terminal-white">
    <div class="text-terminal-blue mb-1.5 sm:mb-2">
      ATMOSPHERIC DATA
    </div>
  <div class="space-y-1 font-mono text-xs sm:text-sm">
      <div class="flex">
        <span class="text-terminal-white flex items-center gap-2">
          <Icon name="Droplets" class="text-terminal-blue" :size="16" :stroke-width="2" aria-hidden="true" />
          HUMIDITY
        </span>
        <span class="flex-1 text-terminal-blue">{{ '.'.repeat(15 - 'HUMIDITY'.length) }}</span>
        <span class="text-terminal-white">{{ weather.humidity }}%</span>
      </div>
      <div class="flex">
        <span class="text-terminal-white flex items-center gap-2">
          <Icon name="Wind" class="text-terminal-blue" :size="16" :stroke-width="2" aria-hidden="true" />
          WIND SPEED
        </span>
        <span class="flex-1 text-terminal-blue">{{ '.'.repeat(15 - 'WIND SPEED'.length) }}</span>
        <span class="text-terminal-white">{{ weather.windSpeed }} km/h</span>
      </div>
      <div class="flex">
        <span class="text-terminal-white flex items-center gap-2">
          <Icon name="Gauge" class="text-terminal-blue" :size="16" :stroke-width="2" aria-hidden="true" />
          PRESSURE
        </span>
        <span class="flex-1 text-terminal-blue">{{ '.'.repeat(15 - 'PRESSURE'.length) }}</span>
        <span class="text-terminal-white">{{ weather.pressure }} hPa</span>
      </div>
    </div>
  </div>
</template>
