<script setup lang="ts">
import { computed } from 'vue'
import { formatTimezoneOffset } from '../utils/formatters'

interface CelestialData {
  sunrise: number
  sunset: number
  moonPhase: number
  timezone: number // Timezone offset in seconds from UTC
}

const props = defineProps<{
  celestial: CelestialData
}>()

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })
}

const timezoneAbbreviation = computed(() => {
  return formatTimezoneOffset(props.celestial.timezone)
})

const getMoonPhaseDisplay = (phase: number): { icon: string, description: string } => {
  // Convert 0.0-1.0 to moon phases
  if (phase >= 0 && phase < 0.125) return { icon: '●', description: 'NEW MOON' }
  if (phase >= 0.125 && phase < 0.25) return { icon: '◐', description: 'WAXING CRESCENT' }
  if (phase >= 0.25 && phase < 0.375) return { icon: '◑', description: 'FIRST QUARTER' }
  if (phase >= 0.375 && phase < 0.5) return { icon: '◒', description: 'WAXING GIBBOUS' }
  if (phase >= 0.5 && phase < 0.625) return { icon: '○', description: 'FULL MOON' }
  if (phase >= 0.625 && phase < 0.75) return { icon: '◓', description: 'WANING GIBBOUS' }
  if (phase >= 0.75 && phase < 0.875) return { icon: '◔', description: 'LAST QUARTER' }
  return { icon: '◕', description: 'WANING CRESCENT' }
}
</script>

<template>
  <div class="p-4 text-terminal-white">
    <div class="text-terminal-blue mb-2">
      [CELESTIAL TRACKER]
    </div>
    <div class="space-y-1 font-mono text-sm">
      <div class="flex">
        <span class="text-terminal-white">SUNRISE</span>
        <span class="flex-1 text-terminal-blue">{{ '.'.repeat(15 - 'SUNRISE'.length) }}</span>
        <span class="text-terminal-white">{{ formatTime(celestial.sunrise) }} ({{ timezoneAbbreviation }})</span>
      </div>
      <div class="flex">
        <span class="text-terminal-white">SUNSET</span>
        <span class="flex-1 text-terminal-blue">{{ '.'.repeat(15 - 'SUNSET'.length) }}</span>
        <span class="text-terminal-white">{{ formatTime(celestial.sunset) }} ({{ timezoneAbbreviation }})</span>
      </div>
      <div class="flex">
        <span class="text-terminal-white">MOON PHASE</span>
        <span class="flex-1 text-terminal-blue">{{ '.'.repeat(15 - 'MOON PHASE'.length) }}</span>
        <span class="text-terminal-white">{{ getMoonPhaseDisplay(celestial.moonPhase).icon }} {{ getMoonPhaseDisplay(celestial.moonPhase).description }}</span>
      </div>
    </div>
  </div>
</template>