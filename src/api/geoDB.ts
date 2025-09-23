/**
 * GeoDB API Integration
 * Handles all communication with the GeoDB Cities and Countries API
 * Provides both prefix-based and exact-match search functionality
 */

/// <reference types="vite/client" />

import type { CitySuggestion, CountrySuggestion } from '../types'

// API Configuration
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || 'YOUR_RAPIDAPI_KEY_HERE'
const RAPIDAPI_HOST = 'wft-geo-db.p.rapidapi.com'
const BASE_URL = `https://${RAPIDAPI_HOST}/v1/geo`

// Lightweight rate limiting within this module to avoid burst calls
const lastCallAt = new Map<string, number>()
const MIN_SPACING_MS = 1100
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

let cooldownUntil = 0
const waitForCooldown = async () => {
  const now = Date.now()
  if (now < cooldownUntil) {
    await delay(cooldownUntil - now)
  }
}

const spaceRequests = async (key: string) => {
  const now = Date.now()
  const last = lastCallAt.get(key) || 0
  const delta = now - last
  if (delta < MIN_SPACING_MS) {
    await delay(MIN_SPACING_MS - delta)
  }
  lastCallAt.set(key, Date.now())
}

function rateLimitError(response: Response): Error {
  // Respect Retry-After if present, else RapidAPI reset headers, else fall back
  const retryAfterHeader = response.headers.get('retry-after')
  let retryAfterMs: number | undefined
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10)
    if (!Number.isNaN(seconds)) retryAfterMs = Math.min(seconds * 1000, 5000)
  }
  const resetHeader = response.headers.get('x-ratelimit-requests-reset')
  if (!retryAfterMs && resetHeader) {
    const seconds = parseInt(resetHeader, 10)
    if (!Number.isNaN(seconds)) retryAfterMs = Math.min(seconds * 1000, 5000)
  }
  const err: any = new Error(`GeoDB rate limit (429)`) 
  err.code = 'RATE_LIMIT'
  if (retryAfterMs) err.retryAfterMs = retryAfterMs
  // engage a short global cooldown to reduce pressure
  const cooldown = retryAfterMs ?? 1500
  cooldownUntil = Date.now() + cooldown
  return err
}

/**
 * Common headers for all GeoDB API requests
 */
const getHeaders = () => ({
  'X-RapidAPI-Key': RAPIDAPI_KEY,
  'X-RapidAPI-Host': RAPIDAPI_HOST
})

/**
 * STAGE 1: Fetch city suggestions using namePrefix (partial match)
 * Used for real-time search as user types
 */
export const fetchCitySuggestions = async (query: string, signal?: AbortSignal): Promise<CitySuggestion[]> => {
  if (query.length < 2) return []

  try {
    await waitForCooldown()
    await spaceRequests('geodb')
    await spaceRequests('cities-prefix')
    // Use a simpler approach - trust the API more and filter less
    const url = `${BASE_URL}/cities?minPopulation=50000&namePrefix=${encodeURIComponent(query)}&limit=10`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
      signal
    })

    if (response.status === 429) {
      throw rateLimitError(response)
    }
    if (!response.ok) {
      throw new Error(`Cities API HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.data || []
    
  } catch (error) {
    throw error
  }
}

/**
 * STAGE 2: Fetch country suggestions using namePrefix (partial match)
 * Used when no cities are found matching the query
 */
export const fetchCountrySuggestions = async (query: string, signal?: AbortSignal): Promise<CountrySuggestion[]> => {
  if (query.length < 2) return []

  try {
    await waitForCooldown()
    await spaceRequests('geodb')
    await spaceRequests('countries-prefix')
    const url = `${BASE_URL}/countries?namePrefix=${encodeURIComponent(query)}&limit=5&include=capital`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
      signal
    })

    if (response.status === 429) {
      throw rateLimitError(response)
    }
    if (!response.ok) {
      throw new Error(`Countries API HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.data || []
    
  } catch (error) {
    throw error
  }
}

/**
 * STAGE 3: Fetch exact city match using name parameter
 * Used as fallback when prefix searches don't yield results
 */
export const fetchExactCityMatch = async (query: string, signal?: AbortSignal): Promise<CitySuggestion[]> => {
  if (query.length < 2) return []

  try {
    await waitForCooldown()
    await spaceRequests('geodb')
    await spaceRequests('cities-exact')
    const url = `${BASE_URL}/cities?minPopulation=100000&name=${encodeURIComponent(query)}&limit=8`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
      signal
    })

    if (response.status === 429) {
      throw rateLimitError(response)
    }
    if (!response.ok) {
      throw new Error(`Exact Cities API HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const rawResults = data.data || []
    
    // CLIENT-SIDE FILTERING: Only return cities that match the query exactly or start with it
    const filteredResults = rawResults.filter((city: CitySuggestion) => {
      if (!city.name) return false
      const cityName = city.name.toLowerCase()
      const queryLower = query.toLowerCase()
      // Allow exact match or starts with query
      return cityName === queryLower || cityName.startsWith(queryLower)
    })
    
    return filteredResults.slice(0, 5)
  } catch (error) {
    throw error
  }
}

/**
 * STAGE 4: Fetch exact country match using name parameter
 * Final fallback for comprehensive search coverage
 */
export const fetchExactCountryMatch = async (query: string, signal?: AbortSignal): Promise<CountrySuggestion[]> => {
  if (query.length < 2) return []

  try {
    await waitForCooldown()
    await spaceRequests('geodb')
    await spaceRequests('countries-exact')
    const url = `${BASE_URL}/countries?name=${encodeURIComponent(query)}&limit=5&include=capital`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
      signal
    })

    if (response.status === 429) {
      throw rateLimitError(response)
    }
    if (!response.ok) {
      throw new Error(`Exact Countries API HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const rawResults = data.data || []
    
    // CLIENT-SIDE FILTERING: Only return countries that match the query exactly or start with it
    const filteredResults = rawResults.filter((country: CountrySuggestion) => {
      if (!country.name) return false
      const countryName = country.name.toLowerCase()
      const queryLower = query.toLowerCase()
      // Allow exact match or starts with query
      return countryName === queryLower || countryName.startsWith(queryLower)
    })
    
    return filteredResults.slice(0, 3)
  } catch (error) {
    throw error
  }
}