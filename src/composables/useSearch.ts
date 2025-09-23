/**
 * Search Composable
 * Advanced four-stage search orchestrator with validation
 * Provides unified search functionality across cities and countries
 */

import { ref } from 'vue'
import type { UnifiedSuggestion, SearchStatus, CitySuggestion, CountrySuggestion } from '../types'
import { 
  fetchCitySuggestions, 
  fetchCountrySuggestions, 
  fetchExactCityMatch, 
  fetchExactCountryMatch 
} from '../api/geoDB'
import { validateSuggestion } from '../api/openWeather'

export function useSearch() {
  // Reactive state
  const searchStatus = ref<SearchStatus>('idle')
  const suggestions = ref<UnifiedSuggestion[]>([])
  const searchError = ref<string | null>(null)
  const terminalOutput = ref<string[]>([])

  // Add output to terminal
  const addTerminalOutput = (message: string) => {
    terminalOutput.value.push(`[${new Date().toLocaleTimeString()}] ${message}`)
  }

  // Convert raw API responses to UnifiedSuggestion format
  const convertCitiesToUnified = (cities: CitySuggestion[]): UnifiedSuggestion[] => {
    return cities.map(city => ({
      id: `city-${city.id}`,
      name: city.name,
      displayName: `${city.name}, ${city.country}`,
      type: 'city' as const,
      country: city.country,
      countryCode: city.countryCode,
      lat: city.latitude,
      lon: city.longitude
    }))
  }

  const convertCountriesToUnified = (countries: CountrySuggestion[]): UnifiedSuggestion[] => {
    return countries.map(country => ({
      id: `country-${country.code}`,
      name: country.name,
      displayName: country.name,
      type: 'country' as const,
      countryCode: country.code,
      capital: country.capital
    }))
  }

  // Persistent API search with retry logic
  const tryPersistentApiSearch = async <T>(
    searchFunction: (query: string) => Promise<T[]>,
    query: string,
    apiName: string,
    maxAttempts: number = 3
  ): Promise<{ status: 'success' | 'error'; data: T[]; error?: string }> => {
    addTerminalOutput(`🔄 Starting ${apiName}...`)
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        addTerminalOutput(`📡 ${apiName} - Attempt ${attempt}/${maxAttempts}`)
        const results = await searchFunction(query)
        addTerminalOutput(`✅ ${apiName} - Success! Found ${results.length} results`)
        return { status: 'success', data: results }
      } catch (error: any) {
        addTerminalOutput(`❌ ${apiName} - Attempt ${attempt} failed: ${error.message}`)
        
        if (attempt < maxAttempts) {
          const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
          addTerminalOutput(`⏳ ${apiName} - Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    const errorMsg = `${apiName} failed after ${maxAttempts} attempts`
    addTerminalOutput(`💀 ${errorMsg}`)
    return { status: 'error', data: [], error: errorMsg }
  }

  /**
   * Advanced Four-Stage Search Logic
   * Stage 1: Prefix Cities - Fast search for city name prefixes
   * Stage 2: Prefix Countries - Search for country name prefixes  
   * Stage 3: Exact Cities - Fallback exact city match
   * Stage 4: Exact Countries - Fallback exact country match
   */
  const performSearch = async (query: string): Promise<void> => {
    if (!query.trim()) {
      suggestions.value = []
      searchStatus.value = 'idle'
      searchError.value = null
      return
    }

    searchStatus.value = 'fetching'
    searchError.value = null
    const startTime = Date.now()

    try {
      addTerminalOutput(`🔍 Starting 4-stage search for: "${query}"`)
      let allSuggestions: UnifiedSuggestion[] = []

      // === STAGE 1: Prefix Cities ===
      addTerminalOutput(`🏙️  Stage 1: Prefix Cities search...`)
      const stage1Result = await tryPersistentApiSearch(fetchCitySuggestions, query, 'Stage 1 - Prefix Cities')
      
      if (stage1Result.status === 'success' && stage1Result.data.length > 0) {
        const stage1Candidates = convertCitiesToUnified(stage1Result.data)
        allSuggestions.push(...stage1Candidates)
        addTerminalOutput(`   ✓ Found ${stage1Candidates.length} city suggestions`)
      }

      // === STAGE 2: Prefix Countries ===
      addTerminalOutput(`🌍 Stage 2: Prefix Countries search...`)
      const stage2Result = await tryPersistentApiSearch(fetchCountrySuggestions, query, 'Stage 2 - Prefix Countries')
      
      if (stage2Result.status === 'success' && stage2Result.data.length > 0) {
        const stage2Candidates = convertCountriesToUnified(stage2Result.data)
        allSuggestions.push(...stage2Candidates)
        addTerminalOutput(`   ✓ Found ${stage2Candidates.length} country suggestions`)
      }

      // === STAGE 3: Exact Cities (Fallback) ===
      if (allSuggestions.length === 0) {
        addTerminalOutput(`🔍 Stage 3: Exact City fallback search...`)
        const stage3Result = await tryPersistentApiSearch(fetchExactCityMatch, query, 'Stage 3 - Exact Cities')
        
        if (stage3Result.status === 'success' && stage3Result.data.length > 0) {
          const stage3Candidates = convertCitiesToUnified(stage3Result.data)
          allSuggestions.push(...stage3Candidates)
          addTerminalOutput(`   ✓ Found ${stage3Candidates.length} exact city matches`)
        }
      }

      // === STAGE 4: Exact Countries (Final Fallback) ===
      if (allSuggestions.length === 0) {
        addTerminalOutput(`🌐 Stage 4: Exact Country fallback search...`)
        const stage4Result = await tryPersistentApiSearch(fetchExactCountryMatch, query, 'Stage 4 - Exact Countries')
        
        if (stage4Result.status === 'success' && stage4Result.data.length > 0) {
          const stage4Candidates = convertCountriesToUnified(stage4Result.data)
          allSuggestions.push(...stage4Candidates)
          addTerminalOutput(`   ✓ Found ${stage4Candidates.length} exact country matches`)
        }
      }

      const searchTime = Date.now() - startTime

      if (allSuggestions.length > 0) {
        suggestions.value = allSuggestions
        searchStatus.value = 'success'
        addTerminalOutput(`✅ Search completed in ${searchTime}ms - ${allSuggestions.length} results`)
      } else {
        suggestions.value = []
        searchStatus.value = 'no_results'
        addTerminalOutput(`❌ No results found after 4-stage search (${searchTime}ms)`)
      }

    } catch (error) {
      searchError.value = error instanceof Error ? error.message : 'Search failed'
      searchStatus.value = 'error'
      suggestions.value = []
      addTerminalOutput(`🚫 Search error: ${searchError.value}`)
    }
  }

  /**
   * Validates a suggestion using OpenWeatherMap API
   * Ensures the location actually exists and has weather data
   */
  const validateAndSelectSuggestion = async (suggestion: UnifiedSuggestion): Promise<boolean> => {
    addTerminalOutput(`🔍 Validating ${suggestion.name}...`)
    
    try {
      const isValid = await validateSuggestion(suggestion)
      
      if (isValid) {
        addTerminalOutput(`✅ ${suggestion.name} validated successfully`)
        return true
      } else {
        addTerminalOutput(`❌ ${suggestion.name} failed validation`)
        return false
      }
    } catch (error) {
      addTerminalOutput(`🚫 Validation error for ${suggestion.name}: ${error}`)
      return false
    }
  }

  /**
   * Clears all search results and terminal output
   */
  const clearSearch = () => {
    suggestions.value = []
    searchStatus.value = 'idle'
    searchError.value = null
    terminalOutput.value = []
  }

  /**
   * Clears only terminal output
   */
  const clearTerminal = () => {
    terminalOutput.value = []
  }

  return {
    // State
    searchStatus,
    suggestions,
    searchError,
    terminalOutput,
    
    // Actions
    performSearch,
    validateAndSelectSuggestion,
    clearSearch,
    clearTerminal,
    addTerminalOutput
  }
}