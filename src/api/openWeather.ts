/**
 * OpenWeather API Integration
 * Handles coordinate-based validation and weather data fetching
 * Validates cities and countries against actual weather data
 */

import type { CitySuggestion, CountrySuggestion, UnifiedSuggestion } from '../types'

// API Configuration
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'YOUR_OPENWEATHER_API_KEY_HERE'
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

/**
 * Validates a suggestion by attempting to fetch weather data
 * This ensures the location actually exists in OpenWeatherMap's database
 * @param suggestion - The city or country suggestion to validate
 * @returns Promise<boolean> - True if validation successful, false otherwise
 */
export async function validateSuggestion(suggestion: UnifiedSuggestion): Promise<boolean> {
  try {
    let url: string

    if (suggestion.type === 'city') {
      // Use coordinate-based validation for cities
      if (!suggestion.lat || !suggestion.lon) {
        console.warn(`Missing coordinates for city ${suggestion.name}`)
        return false
      }
      url = `${BASE_URL}?lat=${suggestion.lat}&lon=${suggestion.lon}&appid=${OPENWEATHER_API_KEY}`
    } else {
      // Country validation with robust fallback logic
      if (suggestion.capital && suggestion.capital.trim()) {
        // Primary Method: Use capital city for validation (most reliable)
        url = `${BASE_URL}?q=${encodeURIComponent(suggestion.capital)}&appid=${OPENWEATHER_API_KEY}`
      } else {
        // Fallback Method: Use country name directly if capital is missing
        console.warn(`No capital available for ${suggestion.name}, using country name fallback`)
        url = `${BASE_URL}?q=${encodeURIComponent(suggestion.name)}&appid=${OPENWEATHER_API_KEY}`
      }
    }

    const response = await fetch(url)
    
    if (!response.ok) {
      console.warn(`Validation failed for ${suggestion.name}: ${response.status}`)
      return false
    }

    const data = await response.json()
    
    // Additional validation: check if the response contains expected weather data
    if (!data.weather || !Array.isArray(data.weather) || data.weather.length === 0) {
      console.warn(`Invalid weather data for ${suggestion.name}`)
      return false
    }

    console.log(`✓ Validated ${suggestion.name} via OpenWeatherMap`)
    return true

  } catch (error) {
    console.error(`Validation error for ${suggestion.name}:`, error)
    return false
  }
}

/**
 * Fetches current weather data for a validated location
 * @param suggestion - The validated city or country suggestion
 * @returns Promise<any> - Weather data object or null if failed
 */
export async function fetchWeatherData(suggestion: UnifiedSuggestion): Promise<any> {
  try {
    let url: string

    if (suggestion.type === 'city') {
      if (!suggestion.lat || !suggestion.lon) {
        throw new Error(`Missing coordinates for city ${suggestion.name}`)
      }
      url = `${BASE_URL}?lat=${suggestion.lat}&lon=${suggestion.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    } else {
      // Country weather data with robust fallback logic
      if (suggestion.capital && suggestion.capital.trim()) {
        // Primary Method: Use capital city for weather data (most reliable)
        url = `${BASE_URL}?q=${encodeURIComponent(suggestion.capital)}&appid=${OPENWEATHER_API_KEY}&units=metric`
      } else {
        // Fallback Method: Use country name directly if capital is missing
        url = `${BASE_URL}?q=${encodeURIComponent(suggestion.name)}&appid=${OPENWEATHER_API_KEY}&units=metric`
      }
    }

    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Weather API request failed: ${response.status}`)
    }

    return await response.json()

  } catch (error) {
    console.error(`Failed to fetch weather data for ${suggestion.name}:`, error)
    return null
  }
}