<script setup lang="ts">
interface SystemStatus {
  feelsLike: number
  uvIndex: number
  visibility: number
}

defineProps<{
  status: SystemStatus
  tempSymbol: string
}>()

const getUVProgressBar = (uvIndex: number): string => {
  const filled = Math.min(Math.max(uvIndex, 0), 10)
  const filledBlocks = '█'.repeat(filled)
  const emptyBlocks = '░'.repeat(10 - filled)
  return filledBlocks + emptyBlocks
}

const getUVLevel = (uvIndex: number): string => {
  if (uvIndex <= 2) return 'Low'
  if (uvIndex <= 5) return 'Moderate'
  if (uvIndex <= 7) return 'High'
  if (uvIndex <= 10) return 'Very High'
  return 'Extreme'
}

const getVisibilityStatus = (visibility: number): string => {
  if (visibility >= 10000) return 'CLEAR'
  if (visibility >= 5000) return 'HAZY'
  if (visibility >= 1000) return 'POOR'
  return 'LIMITED'
}
</script>

<template>
  <div class="p-4 text-terminal-white">
    <div class="text-terminal-blue mb-2">
      [SYSTEM STATUS]
    </div>
    <div class="space-y-1 font-mono text-sm">
      <div class="flex">
        <span class="text-terminal-white">PERCEPTION</span>
        <span class="flex-1 text-terminal-blue">{{ '.'.repeat(15 - 'PERCEPTION'.length) }}</span>
        <span class="text-terminal-white">{{ status.feelsLike }}{{ tempSymbol }} (Feels Like)</span>
      </div>
      <div class="flex">
        <span class="text-terminal-white">VISIBILITY</span>
        <span class="flex-1 text-terminal-blue">{{ '.'.repeat(15 - 'VISIBILITY'.length) }}</span>
        <span class="text-terminal-white">{{ status.visibility }}m [{{ getVisibilityStatus(status.visibility) }}]</span>
      </div>
      <div class="flex">
        <span class="text-terminal-white">UV INDEX</span>
        <span class="flex-1 text-terminal-blue">{{ '.'.repeat(15 - 'UV INDEX'.length) }}</span>
        <span class="text-terminal-white">[{{ getUVProgressBar(status.uvIndex) }}] {{ status.uvIndex }}/10 ({{ getUVLevel(status.uvIndex) }})</span>
      </div>
    </div>
  </div>
</template>