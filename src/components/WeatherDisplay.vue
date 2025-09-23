<script setup lang="ts">
import { computed } from 'vue'
import WeatherIcon from './WeatherIcon.vue'
import Icon from './Icon.vue'
interface CurrentWeather {
  city: string
  temperature: number
  condition: string
  iconCode: number
}

const { weather, tempSymbol, unitToggleText } = defineProps<{
  weather: CurrentWeather
  tempSymbol: string
  unitToggleText: string
}>()

const emit = defineEmits<{
  'toggle-unit': []
}>()

const handleToggleUnit = () => {
  emit('toggle-unit')
}

// Derive city and optional country from the display string when available (e.g., "City, Country")
const derivedCity = computed(() => (weather.city?.split(',')[0] || weather.city || '').trim())
const derivedCountry = computed(() => (weather.city?.includes(',') ? weather.city.split(',').slice(1).join(',').trim() : ''))
</script>

<template>
  <div class="p-4 text-terminal-white">
    <!-- Two-column grid to align with details/celestial panels -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
      <!-- Left: City on first line, Country on second; anchored to far left without squeezing -->
      <div class="min-w-0 lg:max-w-[40vw] justify-self-start">
        <div class="text-terminal-blue font-bold tracking-wide leading-tight text-2xl md:text-3xl lg:text-4xl whitespace-nowrap overflow-hidden text-ellipsis">
          {{ derivedCity }}
        </div>
        <div v-if="derivedCountry" class="text-terminal-blue font-bold tracking-wide leading-tight text-base md:text-lg lg:text-xl whitespace-nowrap overflow-hidden text-ellipsis mt-1">
          {{ derivedCountry }}
        </div>
      </div>

      <!-- Right: Temperature cluster aligned to the far right, switch below temperature -->
      <div class="flex flex-col items-end gap-1 w-full justify-self-end">
        <div class="flex items-center gap-3 w-full justify-end">
          <WeatherIcon class="order-1" :icon-code="weather.iconCode" :size="56" />
          <span class="order-2 text-2xl md:text-3xl lg:text-4xl">{{ weather.temperature }}{{ tempSymbol }}</span>
        </div>
        <div class="text-terminal-white">{{ weather.condition }}</div>
        <button
          class="mt-1 text-xs text-terminal-blue cursor-pointer transition-colors border border-terminal-blue px-2 py-1 hover:bg-terminal-blue hover:text-terminal-bg inline-flex items-center gap-1"
          @click="handleToggleUnit"
        >
          <Icon name="ArrowUpDown" :size="14" :stroke-width="2" aria-hidden="true" />
          <span>{{ unitToggleText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
