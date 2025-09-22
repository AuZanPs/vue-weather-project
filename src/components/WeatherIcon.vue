<script setup lang="ts">
import { computed } from 'vue'

// Define props
const props = defineProps<{
  iconCode: number
}>()

// Map OpenWeatherMap weather condition codes to icon names
const iconName = computed(() => {
  const code = props.iconCode
  
  // Clear sky
  if (code === 800) {
    return 'fa-sun'
  }
  
  // Few clouds
  if (code >= 801 && code <= 802) {
    return 'fa-cloud-sun'
  }
  
  // Scattered/broken clouds
  if (code >= 803 && code <= 804) {
    return 'fa-cloud'
  }
  
  // Rain
  if (code >= 500 && code <= 531) {
    return 'fa-cloud-rain'
  }
  
  // Thunderstorm
  if (code >= 200 && code <= 232) {
    return 'fa-bolt'
  }
  
  // Snow
  if (code >= 600 && code <= 622) {
    return 'fa-snowflake'
  }
  
  // Atmosphere (mist, smoke, haze, etc.)
  if (code >= 701 && code <= 781) {
    return 'fa-smog'
  }
  
  // Default fallback
  return 'fa-sun'
})
</script>

<template>
  <VIcon 
    :name="iconName" 
    class="text-brand-orange"
    scale="1.5"
  />
</template>