<script setup lang="ts">
interface CurrentWeather {
  city: string
  temperature: number
  condition: string
  iconCode: number
}

defineProps<{
  weather: CurrentWeather
}>()
</script>

<template>
  <div class="p-4 text-terminal-white">
    <div class="text-terminal-blue">
      {{ weather.city }}
    </div>
    <div class="text-2xl">
      {{ weather.temperature }}°C
    </div>
    <div>{{ weather.condition }}</div>
  </div>
</template>
