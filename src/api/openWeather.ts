/**
 * OpenWeather API Integration
 * Handles coordinate-based validation and weather data fetching
 * Validates cities and countries against actual weather data
 */

/// <reference types="vite/client" />

import type { CitySuggestion, CountrySuggestion, UnifiedSuggestion } from '../types'

// API Configuration
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'YOUR_OPENWEATHER_API_KEY_HERE'
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

/**
 * Enhanced validation with comprehensive weather data verification
 * This ensures the location actually exists in OpenWeatherMap's database
 * and has complete weather data available
 * @param suggestion - The city or country suggestion to validate
 * @returns Promise<boolean> - True if validation successful, false otherwise
 */
export async function validateSuggestion(suggestion: UnifiedSuggestion, signal?: AbortSignal): Promise<boolean> {
  try {
    let url: string

    if (suggestion.type === 'city') {
      // Use coordinate-based validation for cities (most accurate)
      if (!suggestion.lat || !suggestion.lon) {
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
        url = `${BASE_URL}?q=${encodeURIComponent(suggestion.name)}&appid=${OPENWEATHER_API_KEY}`
      }
    }

  const response = await fetch(url, { signal })
    
    if (!response.ok) {
      return false
    }

    const data = await response.json()
    
  // Relaxed-but-strong validation: focus on core availability to reduce false negatives
  const hasWeatherData = data && data.weather && Array.isArray(data.weather) && data.weather.length > 0
  const hasMainTemp = data && data.main && typeof data.main.temp === 'number'
  const hasCoordinates = data && data.coord && typeof data.coord.lat === 'number' && typeof data.coord.lon === 'number'
  const hasName = !!(data && typeof data.name === 'string' && data.name.trim().length > 0)

  // Consider it valid if core weather data exists with coordinates and a name
  const isValid = hasWeatherData && hasMainTemp && hasCoordinates && hasName

    if (isValid && suggestion.type === 'city') {
      // For cities, verify coordinates match (within reasonable tolerance)
      const latDiff = Math.abs(data.coord.lat - suggestion.lat!)
      const lonDiff = Math.abs(data.coord.lon - suggestion.lon!)
      
      // Allow slightly larger coordinate differences (city center vs station)
      if (latDiff > 0.5 || lonDiff > 0.5) {
        return false // Coordinates don't match - wrong location
      }
    }

    return isValid

  } catch (error) {
    return false
  }
}

/**
 * Enhanced weather data fetching with comprehensive error handling
 * @param suggestion - The validated city or country suggestion
 * @returns Promise<any> - Complete weather data object or null if failed
 */
export async function fetchWeatherData(suggestion: UnifiedSuggestion): Promise<any> {
  try {
    let url: string

    if (suggestion.type === 'city') {
      if (!suggestion.lat || !suggestion.lon) {
        throw new Error(`Missing coordinates for city ${suggestion.name}`)
      }
      // Use coordinates for maximum accuracy
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

    const weatherData = await response.json()
    
    // Verify the returned data is complete before returning
    if (!weatherData.main || !weatherData.weather || !weatherData.coord) {
      throw new Error(`Incomplete weather data received for ${suggestion.name}`)
    }

    return weatherData

  } catch (error) {
    return null
  }
}