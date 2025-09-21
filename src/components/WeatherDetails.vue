<script setup lang="ts">
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
}>()
</script>

<template>
  <div class="p-4 text-terminal-white">
    <div class="text-terminal-blue mb-2">
      ATMOSPHERIC DATA
    </div>
    <div class="space-y-2">
      <div class="flex justify-between">
        <span>Humidity:</span>
        <span>{{ weather.humidity }}%</span>
      </div>
      <div class="flex justify-between">
        <span>Wind Speed:</span>
        <span>{{ weather.windSpeed }} km/h</span>
      </div>
      <div class="flex justify-between">
        <span>Pressure:</span>
        <span>{{ weather.pressure }} hPa</span>
      </div>
    </div>
  </div>
</template>
