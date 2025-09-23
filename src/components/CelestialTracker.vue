<script setup lang="ts">
import { computed } from 'vue'
import { formatTimezoneOffset } from '../utils/formatters'
import Icon from './Icon.vue'

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
  // OpenWeather sunrise/sunset are in UTC seconds.
  // Apply the provided timezone offset (in seconds), then render in UTC to avoid
  // the browser re-applying the local timezone.
  const shifted = new Date((timestamp + props.celestial.timezone) * 1000)
  return shifted.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC'
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
        <span class="text-terminal-white flex items-center gap-2">
          <Icon name="Sunrise" class="text-terminal-blue" :size="16" :stroke-width="2" aria-hidden="true" />
          SUNRISE
        </span>
        <span class="flex-1 text-terminal-blue">{{ '.'.repeat(15 - 'SUNRISE'.length) }}</span>
        <span class="text-terminal-white">{{ formatTime(celestial.sunrise) }} ({{ timezoneAbbreviation }})</span>
      </div>
      <div class="flex">
        <span class="text-terminal-white flex items-center gap-2">
          <Icon name="Sunset" class="text-terminal-blue" :size="16" :stroke-width="2" aria-hidden="true" />
          SUNSET
        </span>
        <span class="flex-1 text-terminal-blue">{{ '.'.repeat(15 - 'SUNSET'.length) }}</span>
        <span class="text-terminal-white">{{ formatTime(celestial.sunset) }} ({{ timezoneAbbreviation }})</span>
      </div>
      <div class="flex">
        <span class="text-terminal-white flex items-center gap-2">
          <Icon name="Moon" class="text-terminal-blue" :size="16" :stroke-width="2" aria-hidden="true" />
          MOON PHASE
        </span>
        <span class="flex-1 text-terminal-blue">{{ '.'.repeat(15 - 'MOON PHASE'.length) }}</span>
        <span class="text-terminal-white">{{ getMoonPhaseDisplay(celestial.moonPhase).icon }} {{ getMoonPhaseDisplay(celestial.moonPhase).description }}</span>
      </div>
    </div>
  </div>
</template>