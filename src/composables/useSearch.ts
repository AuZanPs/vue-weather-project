/**
 * Search Composable
 * Advanced four-stage search orchestrator with validation
 * Provides unified search functionality across cities and countries.
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

  // Latest-only gating and lightweight caches
  let currentSearchId = 0
  let currentAbortController: AbortController | null = null
  const weatherValidationCache = new Map<string, boolean>() // key: `${type}:${lat},${lon}` or `${type}:${name}`
  const cityApiCache = new Map<string, CitySuggestion[]>()
  const countryApiCache = new Map<string, CountrySuggestion[]>()

  // Add output to terminal
  const addTerminalOutput = (message: string) => {
    terminalOutput.value.push(`[${new Date().toLocaleTimeString()}] ${message}`)
  }

  // Keep [OK] items at the top for faster picking
  const sortByValidation = (arr: UnifiedSuggestion[]): UnifiedSuggestion[] => {
    const weight = (s: UnifiedSuggestion) => (s.validated ? 0 : (s.validating ? 1 : 2))
    return arr.slice().sort((a, b) => {
      const wa = weight(a)
      const wb = weight(b)
      if (wa !== wb) return wa - wb
      // Stable-ish secondary sort by display name
      const an = (a.displayName || a.name).toLowerCase()
      const bn = (b.displayName || b.name).toLowerCase()
      return an.localeCompare(bn)
    })
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
    searchFunction: (query: string, signal?: AbortSignal) => Promise<T[]>,
    query: string,
    apiName: string,
    maxAttempts: number = 3
  ): Promise<{ status: 'success' | 'error'; data: T[]; error?: string }> => {
    addTerminalOutput(`[START] ${apiName}...`)

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        addTerminalOutput(`[RETRY] ${apiName} - Attempt ${attempt}/${maxAttempts}`)
  const results = await searchFunction(query, currentAbortController?.signal)
        addTerminalOutput(`[OK] ${apiName} - Success. Found ${results.length} results`)
        return { status: 'success', data: results }
      } catch (error: any) {
        const msg = error?.message ?? 'unknown error'
        const isRateLimit = error && (error.code === 'RATE_LIMIT' || /429/.test(msg))
        let waitMs: number
        if (isRateLimit) {
          // Prefer server-provided Retry-After if present
          const retryAfterMs = (error && typeof error.retryAfterMs === 'number') ? error.retryAfterMs : undefined
          // Backoff a bit longer on 429 and add jitter
          const base = Math.pow(2, attempt) * 500
          const jitter = Math.floor(Math.random() * 250)
          waitMs = Math.min(retryAfterMs ?? (base + jitter), 5000)
          addTerminalOutput(`[RATE] ${apiName} - Rate limited (429). Cooling down for ${waitMs}ms`)
          addTerminalOutput(`[SYSTEM] To reduce API load, searches are briefly throttled`)
        } else {
          addTerminalOutput(`[ERROR] ${apiName} - Attempt ${attempt} failed: ${msg}`)
          const base = Math.pow(2, attempt) * 300
          const jitter = Math.floor(Math.random() * 150)
          waitMs = Math.min(base + jitter, 3000)
          addTerminalOutput(`[WAIT] ${apiName} - Retrying in ${waitMs}ms...`)
        }

        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, waitMs))
        }
      }
    }

    const errorMsg = `${apiName} failed after ${maxAttempts} attempts`
    addTerminalOutput(`[FAIL] ${errorMsg}`)
    return { status: 'error', data: [], error: errorMsg }
  }

  /**
   * Advanced Four-Stage Search Logic with Weather Pre-Validation
   */
  const performSearch = async (query: string): Promise<void> => {
    if (!query.trim()) {
      suggestions.value = []
      searchStatus.value = 'idle'
      searchError.value = null
      return
    }

    // Pre-validation: Don't waste API calls on unlikely queries
    if (!isValidSearchQuery(query)) {
      suggestions.value = []
      searchStatus.value = 'error'
      searchError.value = 'Invalid search pattern'
      addTerminalOutput(`[BLOCKED] "${query}" - invalid pattern detected`)
      addTerminalOutput(`[SYSTEM] Input validation prevents unnecessary API calls`)
      return
    }

    // Begin latest-only search
    const thisSearchId = ++currentSearchId
    // Cancel previous in-flight validations
    if (currentAbortController) {
      try { currentAbortController.abort() } catch {}
    }
    searchStatus.value = 'fetching'
    searchError.value = null
    const startTime = Date.now()

    try {
      addTerminalOutput(`[SEARCH] Starting 4-stage search for: "${query}"`)
      addTerminalOutput(`[INFO] Suggestions are shown immediately; weather loads on selection`)
      let allSuggestions: UnifiedSuggestion[] = []

      // Local helper to push validated suggestions progressively and respect latest-only gating
      const pushIfLatest = (items: UnifiedSuggestion[]) => {
        if (thisSearchId !== currentSearchId) return // stale
        // De-duplicate by id
        const seen = new Set(allSuggestions.map((s: UnifiedSuggestion) => s.id))
        const newOnes = items.filter((it: UnifiedSuggestion) => !seen.has(it.id))
        if (newOnes.length) {
          allSuggestions = [...allSuggestions, ...newOnes]
          suggestions.value = sortByValidation(allSuggestions)
        }
      }

      // AbortController for this search's validations
      const abortController = new AbortController()
      currentAbortController = abortController

      // === STAGE 1: Prefix Cities with Validation ===
      addTerminalOutput(`[STAGE 1] Prefix Cities search...`)
      // Stage 1: check cache first to reduce latency
      const cachedCities = cityApiCache.get(query)
      const stage1Result = cachedCities
        ? { status: 'success' as const, data: cachedCities }
        : await tryPersistentApiSearch(fetchCitySuggestions, query, 'Stage 1 - Prefix Cities')

      if (stage1Result.status === 'success' && stage1Result.data.length > 0) {
        const stage1Candidates = convertCitiesToUnified(stage1Result.data as CitySuggestion[])
        // Cache raw API response for this query
        if (!cachedCities) cityApiCache.set(query, stage1Result.data as CitySuggestion[])
        addTerminalOutput(`   [INFO] Found ${stage1Candidates.length} city candidates`)
        // Stream and mark as validating; kick off background pre-validation
        const prevalidating = stage1Candidates.map(c => ({ ...c, validating: true }))
        pushIfLatest(prevalidating)
        // Fire-and-forget background check to flip badges
        ;(async () => {
          const validated = await fastValidateBatch(stage1Candidates, abortController.signal)
          if (thisSearchId !== currentSearchId) return
          const validIds = new Set(validated.map(v => v.id))
          suggestions.value = sortByValidation(suggestions.value.map(s =>
            validIds.has(s.id) ? { ...s, validating: false, validated: true } : { ...s, validating: false }
          ))
        })()
      } else {
        addTerminalOutput(`   [NONE] No city candidates found for prefix search`)
      }

      // === STAGE 2: Prefix Countries with Validation ===
      if (allSuggestions.length === 0) {
        addTerminalOutput(`[STAGE 2] Prefix Countries search...`)
        const cachedCountries = countryApiCache.get(query)
        const stage2Result = cachedCountries
          ? { status: 'success' as const, data: cachedCountries }
          : await tryPersistentApiSearch(fetchCountrySuggestions, query, 'Stage 2 - Prefix Countries')

        if (stage2Result.status === 'success' && stage2Result.data.length > 0) {
          const stage2Candidates = convertCountriesToUnified(stage2Result.data as CountrySuggestion[])
          if (!cachedCountries) countryApiCache.set(query, stage2Result.data as CountrySuggestion[])
          addTerminalOutput(`   [INFO] Found ${stage2Candidates.length} country candidates`)
          const prevalidating = stage2Candidates.map(c => ({ ...c, validating: true }))
          pushIfLatest(prevalidating)
          ;(async () => {
            const validated = await fastValidateBatch(stage2Candidates, abortController.signal)
            if (thisSearchId !== currentSearchId) return
            const validIds = new Set(validated.map(v => v.id))
            suggestions.value = sortByValidation(suggestions.value.map(s =>
              validIds.has(s.id) ? { ...s, validating: false, validated: true } : { ...s, validating: false }
            ))
          })()
        } else {
          addTerminalOutput(`   [NONE] No country candidates found for prefix search`)
        }
      }

      // === STAGE 3: Exact Cities (Fallback) with Validation ===
      if (allSuggestions.length === 0) {
        addTerminalOutput(`[STAGE 3] Exact City fallback search...`)
        const stage3Result = await tryPersistentApiSearch(fetchExactCityMatch, query, 'Stage 3 - Exact Cities')

        if (stage3Result.status === 'success' && stage3Result.data.length > 0) {
          const stage3Candidates = convertCitiesToUnified(stage3Result.data as CitySuggestion[])
          addTerminalOutput(`   [INFO] Found ${stage3Candidates.length} exact city matches`)
          const prevalidating = stage3Candidates.map(c => ({ ...c, validating: true }))
          pushIfLatest(prevalidating)
          ;(async () => {
            const validated = await fastValidateBatch(stage3Candidates, abortController.signal)
            if (thisSearchId !== currentSearchId) return
            const validIds = new Set(validated.map(v => v.id))
            suggestions.value = sortByValidation(suggestions.value.map(s =>
              validIds.has(s.id) ? { ...s, validating: false, validated: true } : { ...s, validating: false }
            ))
          })()
        } else {
          addTerminalOutput(`   [NONE] No exact city matches found`)
        }
      }

      // === STAGE 4: Exact Countries (Final Fallback) with Validation ===
      if (allSuggestions.length === 0) {
        addTerminalOutput(`[STAGE 4] Exact Country fallback search...`)
        const stage4Result = await tryPersistentApiSearch(fetchExactCountryMatch, query, 'Stage 4 - Exact Countries')

        if (stage4Result.status === 'success' && stage4Result.data.length > 0) {
          const stage4Candidates = convertCountriesToUnified(stage4Result.data as CountrySuggestion[])
          addTerminalOutput(`   [INFO] Found ${stage4Candidates.length} exact country matches`)
          const prevalidating = stage4Candidates.map(c => ({ ...c, validating: true }))
          pushIfLatest(prevalidating)
          ;(async () => {
            const validated = await fastValidateBatch(stage4Candidates, abortController.signal)
            if (thisSearchId !== currentSearchId) return
            const validIds = new Set(validated.map(v => v.id))
            suggestions.value = sortByValidation(suggestions.value.map(s =>
              validIds.has(s.id) ? { ...s, validating: false, validated: true } : { ...s, validating: false }
            ))
          })()
        } else {
          addTerminalOutput(`   [NONE] No exact country matches found`)
        }
      }

      const searchTime = Date.now() - startTime

      if (thisSearchId !== currentSearchId) return // stale
      if (suggestions.value.length > 0) {
        searchStatus.value = 'success'
        addTerminalOutput(`[DONE] Search completed in ${searchTime}ms - ${suggestions.value.length} suggestions`)
      } else {
        suggestions.value = []
        searchStatus.value = 'no_results'
        addTerminalOutput(`[NONE] No weather-validated results found after 4-stage search (${searchTime}ms)`)
        addTerminalOutput(`[SUGGESTION] Check spelling or try a different location name`)
      }

    } catch (error) {
      if (thisSearchId !== currentSearchId) return
      searchError.value = error instanceof Error ? error.message : 'Search failed'
      searchStatus.value = 'error'
      suggestions.value = []
      addTerminalOutput(`[ERROR] Search error: ${searchError.value}`)
    }
  }

  /**
   * Enhanced pre-validation to prevent invalid searches
   */
  const isValidSearchQuery = (query: string): boolean => {
    // Basic checks
    if (!query || query.length < 2) return false

    // Must contain only valid characters
    if (!/^[a-zA-Z\s\-']+$/.test(query)) return false

    // Gibberish patterns
    const gibberishPatterns = [
      /^[aeiou]{3,}$/i,           // All vowels: "aaa", "eee", "iii"
      /^[bcdfg-np-tv-z]{4,}$/i,  // All consonants: "bbbbb", "zzzzz"
      /(.)\1{2,}/i,              // Repeated chars: "aaa", "111"
      /^([a-z])\1+$/i,           // Single repeated letter: "aaaa", "bbbb"
      /^(qwe|asd|zxc|qaz|wsx|qwer|asdf|zxcv)/i, // Keyboard patterns
      /^(test|asdf|hjkl|poiu|mnbv|tyui)/i, // Common test strings
      /^(.)\1(.)\2+$/i,          // Alternating patterns: "abab", "1212"
      /^[qwertyuiop]+$/i,        // Top keyboard row
      /^[asdfghjkl]+$/i,         // Middle keyboard row
      /^[zxcvbnm]+$/i,           // Bottom keyboard row
      /^[aeiouAEIOU]{2,}$/,
      /^[bcdfg-np-tv-zBCDFG-NP-TV-Z]{3,}$/
    ]

    const isGibberish = gibberishPatterns.some(pattern => pattern.test(query))
    if (isGibberish) return false

    // Must have both vowels and consonants for realistic words (length > 2)
    if (query.length > 2) {
      const hasVowel = /[aeiouAEIOU]/.test(query)
      const hasConsonant = /[bcdfg-np-tv-zBCDFG-NP-TV-Z]/.test(query)
      if (!hasVowel || !hasConsonant) return false
    }

    // Must not start or end with spaces/hyphens
    if (/^[\s\-]|[\s\-]$/.test(query)) return false

    // Length bounds
    if (query.length > 50) return false

    return true
  }

  // Cached batch validator used during progressive streaming
  const fastValidateBatch = async (candidates: UnifiedSuggestion[], signal: AbortSignal): Promise<UnifiedSuggestion[]> => {
    const promises = candidates.map(async (c) => {
      // Build cache key
      const key = c.type === 'city' && c.lat != null && c.lon != null
        ? `city:${c.lat.toFixed(2)},${c.lon.toFixed(2)}`
        : `country:${c.name.toLowerCase()}`

      const cached = weatherValidationCache.get(key)
      if (cached !== undefined) {
        return cached ? c : null
      }

      try {
        const ok = await validateSuggestion(c, signal)
        weatherValidationCache.set(key, ok)
        return ok ? c : null
      } catch {
        return null
      }
    })
    const results = await Promise.all(promises)
    return results.filter((x): x is UnifiedSuggestion => x !== null)
  }

  /**
   * Validates a suggestion using OpenWeatherMap API
   */
  const validateAndSelectSuggestion = async (suggestion: UnifiedSuggestion): Promise<boolean> => {
    addTerminalOutput(`[VALIDATE] ${suggestion.name}...`)

    try {
      const isValid = await validateSuggestion(suggestion)

      if (isValid) {
        addTerminalOutput(`[OK] ${suggestion.name} validated successfully`)
        return true
      } else {
        addTerminalOutput(`[INVALID] ${suggestion.name} failed validation`)
        return false
      }
    } catch (error) {
      addTerminalOutput(`[ERROR] Validation error for ${suggestion.name}: ${error}`)
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