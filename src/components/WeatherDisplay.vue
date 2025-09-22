<script setup lang="ts">
interface CurrentWeather {
  city: string
  temperature: number
  condition: string
  iconCode: number
}

defineProps<{
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
</script>

<template>
  <div class="p-4 text-terminal-white">
    <!-- Prominent City Name Header -->
    <div class="text-terminal-blue text-xl font-bold mb-2">
      {{ weather.city }}
    </div>
    
    <!-- Temperature with Unit Toggle -->
    <div class="flex items-center gap-3 mb-2">
      <span class="text-2xl">{{ weather.temperature }}{{ tempSymbol }}</span>
      <button 
        class="text-xs text-terminal-blue cursor-pointer transition-colors border border-terminal-blue px-2 py-1 hover:bg-terminal-blue hover:text-terminal-bg self-center"
        @click="handleToggleUnit"
      >
        {{ unitToggleText }}
      </button>
    </div>
    
    <!-- Weather Condition -->
    <div class="text-terminal-white">{{ weather.condition }}</div>
  </div>
</template>
