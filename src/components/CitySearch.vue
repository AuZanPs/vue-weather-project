<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <!-- Leading search icon -->
      <div class="absolute left-3 top-1/2 -translate-y-1/2 text-[#419bfb] opacity-80 pointer-events-none">
        <Icon name="Search" :size="16" :stroke-width="2" aria-hidden="true" />
      </div>
      <input
        v-model="searchQuery"
        @input="handleSearchInput"
        @keydown="handleKeyPress"
        placeholder="Enter city or country..."
        class="w-full pl-9 pr-10 py-3 bg-[#011173] text-white placeholder-gray-400 border border-[#419bfb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#419bfb]"
  style="font-family: 'VT323', 'IBM Plex Mono', monospace; font-size: 1.05rem;"
        type="text"
        autocomplete="off"
      />
      
      <!-- Search Status Indicator -->
      <div v-if="searchStatus === 'fetching'" class="absolute right-3 top-1/2 transform -translate-y-1/2">
        <!-- Retro CRT loader: pulsing block cursor -->
        <div class="h-5 w-5 flex items-center justify-center" aria-label="loading">
          <span class="text-[#419bfb] crt-pulse" style="font-family: 'VT323', 'IBM Plex Mono', monospace; font-size: 1.1rem;">█</span>
        </div>
      </div>
    </div>

    <!-- Dynamic Status Bar -->
  <div class="mt-2 text-sm text-[#419bfb]" style="font-family: 'VT323', 'IBM Plex Mono', monospace; font-size: 1.05rem;">
      <span>{{ statusBarText }}</span>
    </div>

    <!-- PERMANENT TERMINAL OUTPUT PANE - Always visible, never flickers -->
    <div 
      class="mt-2 border border-[#419bfb] bg-[#011173] rounded-md p-2 h-40 overflow-y-auto"
  style="font-family: 'VT323', 'IBM Plex Mono', monospace; font-size: 1.05rem;"
    >
      <!-- IDLE STATE: Waiting for user input -->
      <div v-if="searchStatus === 'idle'" class="text-gray-400 text-sm">
        <span class="text-[#419bfb]">> </span>WAITING FOR INPUT<span class="cursor-blink">█</span>
        <div class="mt-2 text-xs text-gray-500">
          <span class="text-[#419bfb]">> </span>Type at least 2 characters to search
        </div>
      </div>

      <!-- FETCHING STATE: Search in progress (kept concise to feel faster) -->
      <div v-else-if="searchStatus === 'fetching'" class="text-gray-300 text-sm">
        <span class="text-[#419bfb]">> </span>COMPREHENSIVE SEARCH & VALIDATION IN PROGRESS...
        <div class="mt-2 text-xs text-gray-500">
          <span class="text-[#419bfb]">> </span>Accuracy Mode: Verifying all weather data sources
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
          <!-- Retro pre-validation badge -->
          <span v-if="suggestion.validated" class="text-xs ml-2 text-green-400">[OK]</span>
          <span v-else-if="suggestion.validating" class="text-xs ml-2 text-[#419bfb] opacity-80">[CHK]</span>
          <span v-else class="text-xs ml-2 text-gray-400 opacity-70">[--]</span>
        </div>
      </div>

      <!-- SUCCESS STATE: No suggestions but search completed -->
      <div v-else-if="searchStatus === 'success' && suggestions.length === 0" class="text-gray-400 text-sm">
        <span class="text-[#419bfb]">> </span>COMPREHENSIVE SEARCH COMPLETED
        <div class="mt-2 text-xs text-gray-500">
          <span class="text-[#419bfb]">> </span>No locations found with verified weather data
        </div>
        <div class="mt-1 text-xs text-gray-500">
          <span class="text-[#419bfb]">> </span>System maintains 100% accuracy standards
        </div>
      </div>
      
      <!-- NO RESULTS STATE: Legitimate no results -->
      <div v-else-if="searchStatus === 'no_results'" class="text-gray-400 text-sm">
        <span class="text-[#419bfb]">> </span>NO WEATHER-VERIFIED RESULTS FOR "{{ searchQuery }}"
        <div class="mt-2 text-xs text-gray-500">
          <span class="text-[#419bfb]">> </span>Suggestion: Check spelling or try alternate names
        </div>
        <div class="mt-1 text-xs text-gray-500">
          <span class="text-[#419bfb]">> </span>Example: "New York" instead of "NYC"
        </div>
      </div>
      
      <!-- ERROR STATE: API or network errors -->
      <div v-else-if="searchStatus === 'error'" class="text-red-400 text-sm">
        <span class="text-[#419bfb]">> </span>INPUT VALIDATION ERROR
        <div class="mt-2 text-xs text-gray-500">
          <span class="text-[#419bfb]">> </span>{{ searchError || 'Invalid search pattern detected' }}
        </div>
        <div class="mt-1 text-xs text-gray-500">
          <span class="text-[#419bfb]">> </span>Please enter a valid city or country name
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
import Icon from './Icon.vue'

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
const setSuggestionRef = (el: any, index: number) => {
  if (suggestionRefs.value && el instanceof HTMLElement) {
    suggestionRefs.value[index] = el
  }
}

// COMPUTED PROPERTIES
const statusBarText = computed(() => {
  switch (searchStatus.value) {
    case 'idle':
      return '> STATUS: TERMINAL READY // AWAITING INPUT'
    case 'fetching':
      return '> STATUS: ANALYZING & VALIDATING // ACCURACY MODE ENABLED'
    case 'success':
      return suggestions.value.length > 0 
        ? `> STATUS: ${suggestions.value.length} VALIDATED RESULTS | [↑/↓] NAVIGATE [ENTER] SELECT`
        : '> STATUS: ANALYSIS COMPLETE // NO VALID LOCATIONS FOUND'
    case 'no_results':
      return '> STATUS: SEARCH COMPLETE // NO WEATHER DATA AVAILABLE'
    case 'error':
      return `> STATUS: INPUT ERROR // ${searchError.value || 'PLEASE RETRY'}`
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
    
    // Handle empty query
    if (query.length === 0) {
      clearSearch()
      return
    }
    
    // Enhanced validation and gibberish detection
    if (query.length >= 1) {
      // Comprehensive gibberish detection patterns
      const gibberishPatterns = [
        /^[aeiou]{3,}$/i,           // All vowels: "aaa", "eee", "iii"
        /^[bcdfg-np-tv-z]{4,}$/i,  // All consonants: "bbbbb", "zzzzz"
        /(.)\1{2,}/i,              // Repeated chars: "aaa", "111", "!!!"
        /^[0-9]+$/,                // Pure numbers: "12345", "999"
        /^[!@#$%^&*()_+=\[\]{}|;:,.<>?/\\~`]+$/, // Pure symbols
        /^([a-z])\1+$/i,           // Single repeated letter: "aaaa", "bbbb"
        /^(qwe|asd|zxc|qaz|wsx|qwer|asdf|zxcv)/i, // Keyboard patterns
        /^(test|asdf|hjkl|poiu|mnbv|tyui)/i, // Common test strings
        /^[^a-zA-Z\s\-']{2,}$/,    // Non-letter strings (excluding valid chars)
        /^\s+$/,                   // Only whitespace
        /^(.)\1(.)\2+$/i,          // Alternating patterns: "abab", "1212"
        /^[qwertyuiop]+$/i,        // Top keyboard row
        /^[asdfghjkl]+$/i,         // Middle keyboard row  
        /^[zxcvbnm]+$/i,           // Bottom keyboard row
        /^[aeiou]+[bcdfg-np-tv-z]+$/i, // Vowels then consonants pattern
        /^[bcdfg-np-tv-z]+[aeiou]+$/i, // Consonants then vowels pattern
        /^.{1}$/,                  // Single character (too short)
        /^[aeiouAEIOU]{2,}$/,      // Multiple vowels only
        /^[bcdfg-np-tv-zBCDFG-NP-TV-Z]{3,}$/  // Multiple consonants only
      ]
      
      const isGibberish = gibberishPatterns.some(pattern => pattern.test(query))
      
      // Additional realistic word checks
      const hasVowel = /[aeiouAEIOU]/.test(query)
      const hasConsonant = /[bcdfg-np-tv-zBCDFG-NP-TV-Z]/.test(query)
      const isReasonableLength = query.length >= 2 && query.length <= 50
      const hasValidChars = /^[a-zA-Z\s\-']+$/.test(query)
      
      // Check for unrealistic patterns
      const isUnrealistic = (
        !hasValidChars ||
        !isReasonableLength ||
        (query.length > 2 && !hasVowel) ||
        (query.length > 2 && !hasConsonant) ||
        isGibberish
      )
      
      if (isUnrealistic) {
        // COMPLETELY CLEAR everything for gibberish input
        suggestions.value = []
        searchStatus.value = 'error'
        searchError.value = 'Invalid search pattern'
        
        addTerminalOutput(`❌ INVALID INPUT: "${query}"`)
        addTerminalOutput(`🤖 SYSTEM: Please enter a real city or country name`)
        
        // Do NOT proceed with any search
        return
      }
      
      // Additional length validation for short queries
      if (query.length < 2) {
        suggestions.value = []
        searchStatus.value = 'idle'
        searchError.value = null
        return
      }
      
      // Only proceed with search if input passes ALL validation
      performSearch(query)
    }
  }, 200) // Reduced from 300ms to 200ms for faster response
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
