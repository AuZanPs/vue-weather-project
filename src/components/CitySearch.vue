<script setup lang="ts">
import { ref } from 'vue'

const searchQuery = ref('')
const emit = defineEmits<{
  'search-city': [city: string]
}>()

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    emit('search-city', searchQuery.value.trim())
  }
}
</script>

<template>
  <div class="flex gap-2">
    <input 
      v-model="searchQuery"
      placeholder="Enter city name..."
      class="flex-1 bg-terminal-bg border border-terminal-blue text-terminal-white px-2 py-1"
      @keyup.enter="handleSearch"
    >
    <button 
      class="px-4 py-1 border border-terminal-blue text-terminal-blue hover:bg-terminal-blue hover:text-terminal-bg"
      @click="handleSearch"
    >
      SEARCH
    </button>
  </div>
</template>
