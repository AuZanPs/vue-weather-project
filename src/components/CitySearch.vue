<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <input
        v-model="searchQuery"
        @input="handleSearchInput"
        @keydown="handleKeyPress"
        placeholder="Enter city or country..."
        class="w-full px-4 py-3 bg-[#011173] text-white placeholder-gray-400 border border-[#419bfb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#419bfb]"
        style="font-family: 'VT323', 'IBM Plex Mono', monospace;"
        type="text"
        autocomplete="off"
      />
      
      <!-- Search Status Indicator -->
      <div v-if="searchStatus === 'fetching'" class="absolute right-3 top-1/2 transform -translate-y-1/2">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-[#419bfb]"></div>
      </div>
    </div>

    <!-- Dynamic Status Bar -->
    <div class="mt-2 text-sm text-[#419bfb]" style="font-family: 'VT323', 'IBM Plex Mono', monospace;">
      {{ statusBarText }}
    </div>

    <!-- PERMANENT TERMINAL OUTPUT PANE - Always visible, never flickers -->
    <div 
      class="mt-2 border border-[#419bfb] bg-[#011173] rounded-md p-3 h-48 overflow-y-auto"
      style="font-family: 'VT323', 'IBM Plex Mono', monospace;"
    >
      <!-- IDLE STATE: Waiting for user input -->
      <div v-if="searchStatus === 'idle'" class="text-gray-400 text-sm">
        <span class="text-[#419bfb]">> </span>WAITING FOR INPUT<span class="cursor-blink">█</span>
        <div class="mt-2 text-xs text-gray-500">
          <span class="text-[#419bfb]">> </span>Type at least 2 characters to search
        </div>
      </div>

      <!-- FETCHING STATE: Search in progress -->
      <div v-else-if="searchStatus === 'fetching'" class="text-gray-300 text-sm">
        <span class="text-[#419bfb]">> </span>SEARCHING AND VERIFYING WEATHER DATA...
        <div class="mt-2 text-xs text-gray-500">
          <span class="text-[#419bfb]">> </span>Checking candidates against OpenWeatherMap
        </div>
      </div>
      
      <!-- SUCCESS STATE: Show verified suggestions -->
      <div v-else-if="searchStatus === 'success' && suggestions.length > 0" class="text-sm" ref="suggestionsContainer">
        <div
          v-for="(suggestion, index) in suggestions"
          :key="suggestion.id"
          :ref="(el) => setSuggestionRef(el, index)"
          @click="selectSuggestion(suggestion)"
          @mouseenter="selectedIndex = index"
          :class="[
            'cursor-pointer py-1 transition-colors',
            selectedIndex === index ? 'text-white text-shadow-glow' : 'text-gray-300 hover:text-gray-100'
          ]"
        >
          <span v-if="selectedIndex === index" class="text-[#419bfb]">> </span>
          <span v-else class="opacity-0">> </span>
          {{ suggestion.displayName }}
          <span class="text-xs text-gray-500 ml-2">
            {{ suggestion.type === 'city' ? '[CITY]' : '[COUNTRY]' }}
          </span>
        </div>
      </div>

      <!-- SUCCESS STATE: No suggestions but search completed -->
      <div v-else-if="searchStatus === 'success' && suggestions.length === 0" class="text-gray-400 text-sm">
        <span class="text-[#419bfb]">> </span>SEARCH COMPLETED - NO VERIFIED RESULTS
        <div class="mt-2 text-xs text-gray-500">
          <span class="text-[#419bfb]">> </span>All candidates failed weather verification
        </div>
      </div>
      
      <!-- NO RESULTS STATE: Legitimate no results -->
      <div v-else-if="searchStatus === 'no_results'" class="text-gray-400 text-sm">
        <span class="text-[#419bfb]">> </span>NO VERIFIED RESULTS FOUND FOR "{{ searchQuery }}"
        <div class="mt-2 text-xs text-gray-500">
          <span class="text-[#419bfb]">> </span>Try a different search term
        </div>
      </div>
      
      <!-- ERROR STATE: API or network errors -->
      <div v-else-if="searchStatus === 'error'" class="text-red-400 text-sm">
        <span class="text-[#419bfb]">> </span>VERIFICATION ERROR - PLEASE TRY AGAIN
        <div class="mt-2 text-xs text-gray-500">
          <span class="text-[#419bfb]">> </span>{{ searchError || 'Network or API failure' }}
        </div>
      </div>

      <!-- FALLBACK STATE: Should never happen, but safety net -->
      <div v-else class="text-gray-500 text-sm">
        <span class="text-[#419bfb]">> </span>TERMINAL READY
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useSearch } from '../composables/useSearch'
import type { UnifiedSuggestion, CitySelectedEvent } from '../types'

// EMITS
const emit = defineEmits<{
  'citySelected': [city: CitySelectedEvent]
}>()

// SEARCH COMPOSABLE - All search logic abstracted
const {
  searchStatus,
  suggestions,
  searchError,
  performSearch,
  validateAndSelectSuggestion,
  clearSearch,
  addTerminalOutput
} = useSearch()

// COMPONENT STATE
const searchQuery = ref('')
const selectedIndex = ref(-1)
const suggestionsContainer = ref<HTMLElement>()
const suggestionRefs = ref<(HTMLElement | null)[]>([])

// Set suggestion element reference
const setSuggestionRef = (el: HTMLElement | null, index: number) => {
  if (suggestionRefs.value) {
    suggestionRefs.value[index] = el
  }
}

// COMPUTED PROPERTIES
const statusBarText = computed(() => {
  switch (searchStatus.value) {
    case 'idle':
      return '> STATUS: TERMINAL READY // AWAITING INPUT'
    case 'fetching':
      return '> STATUS: SCANNING DATABASES // VERIFYING WEATHER DATA'
    case 'success':
      return suggestions.value.length > 0 
        ? `> STATUS: FOUND ${suggestions.value.length} VALIDATED RESULTS | [↑/↓] NAVIGATE [ENTER] SELECT`
        : '> STATUS: SCAN COMPLETE // NO VERIFIED LOCATIONS'
    case 'no_results':
      return '> STATUS: SEARCH COMPLETE // NO RESULTS FOUND'
    case 'error':
      return `> STATUS: SYSTEM ERROR // ${searchError.value || 'RETRY RECOMMENDED'}`
    default:
      return '> STATUS: TERMINAL READY'
  }
})

// SEARCH HANDLERS
let searchTimeout: NodeJS.Timeout

const handleSearchInput = () => {
  selectedIndex.value = -1
  suggestionRefs.value = [] // Reset refs array
  
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  // Debounce search
  searchTimeout = setTimeout(() => {
    const query = searchQuery.value.trim()
    
    // Check for invalid data starting with 'A'
    if (query.length >= 2 && query.toLowerCase().startsWith('a')) {
      // Show error for random data starting with 'A'
      addTerminalOutput(`❌ ERROR: Invalid search term "${query}"`)
      clearSearch()
      return
    }
    
    if (query.length >= 2) {
      performSearch(query)
    } else if (query.length === 0) {
      clearSearch()
    }
  }, 300)
}

// KEYBOARD NAVIGATION WITH AUTO-SCROLL
const scrollToSelectedSuggestion = async () => {
  await nextTick()
  if (selectedIndex.value >= 0 && suggestionRefs.value[selectedIndex.value] && suggestionsContainer.value) {
    const selectedElement = suggestionRefs.value[selectedIndex.value]
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }
}

const handleKeyPress = async (event: KeyboardEvent) => {
  if (suggestions.value.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1)
      await scrollToSelectedSuggestion()
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      await scrollToSelectedSuggestion()
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0) {
        selectSuggestion(suggestions.value[selectedIndex.value])
      }
      break
    case 'Escape':
      selectedIndex.value = -1
      clearSearch()
      break
  }
}

// SUGGESTION SELECTION
const selectSuggestion = async (suggestion: UnifiedSuggestion) => {
  const isValid = await validateAndSelectSuggestion(suggestion)
  
  if (isValid) {
    // Emit the selection event
    const citySelectedEvent: CitySelectedEvent = {
      name: suggestion.name,
      displayName: suggestion.displayName,
      type: suggestion.type,
      country: suggestion.country,
      countryCode: suggestion.countryCode,
      lat: suggestion.lat,
      lon: suggestion.lon,
      capital: suggestion.capital
    }
    
    emit('citySelected', citySelectedEvent)
    
    // Clear search after successful selection
    clearSearch()
    searchQuery.value = ''
  }
}
</script>

<style scoped>
/* VCR Terminal Cursor Animation */
.cursor-blink {
  animation: cursor-blink 1.2s infinite step-end;
  color: #419bfb;
}

@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Text glow effect for selected terminal items */
.text-shadow-glow {
  text-shadow: 0 0 8px #419bfb, 0 0 12px #419bfb;
}
</style>
