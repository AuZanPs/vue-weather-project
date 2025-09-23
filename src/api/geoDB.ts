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
export const fetchCitySuggestions = async (query: string): Promise<CitySuggestion[]> => {
  if (query.length < 2) return []

  try {
    // Use a simpler approach - trust the API more and filter less
    const url = `${BASE_URL}/cities?minPopulation=50000&namePrefix=${encodeURIComponent(query)}&limit=10`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    })

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
export const fetchCountrySuggestions = async (query: string): Promise<CountrySuggestion[]> => {
  if (query.length < 2) return []

  try {
    const url = `${BASE_URL}/countries?namePrefix=${encodeURIComponent(query)}&limit=5&include=capital`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    })

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
export const fetchExactCityMatch = async (query: string): Promise<CitySuggestion[]> => {
  if (query.length < 2) return []

  try {
    const url = `${BASE_URL}/cities?minPopulation=100000&name=${encodeURIComponent(query)}&limit=8`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    })

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
export const fetchExactCountryMatch = async (query: string): Promise<CountrySuggestion[]> => {
  if (query.length < 2) return []

  try {
    const url = `${BASE_URL}/countries?name=${encodeURIComponent(query)}&limit=5&include=capital`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    })

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