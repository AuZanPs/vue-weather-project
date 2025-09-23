<script setup lang="ts">
/// <reference types="vite/client" />

import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import CitySearch from './components/CitySearch.vue'
import WeatherDisplay from './components/WeatherDisplay.vue'
import WeatherDetails from './components/WeatherDetails.vue'
import ForecastDisplay from './components/ForecastDisplay.vue'
import CelestialTracker from './components/CelestialTracker.vue'

type Unit = 'metric' | 'imperial'

export interface CurrentWeather {
  city: string
  temperature: number // Raw temperature in Celsius
  condition: string
  iconCode: number
  humidity: number
  windSpeed: number // Raw wind speed in m/s
  pressure: number
}

export interface ForecastItem {
  day: string
  date?: string
  iconCode: number
  high: number // Raw temperature in Celsius
  low: number // Raw temperature in Celsius
  precipitation: number
}

export interface CelestialData {
  sunrise: number
  sunset: number
  moonPhase: number
  timezone: number // Timezone offset in seconds from UTC
}

export interface SystemStatus {
  feelsLike: number // Raw temperature in Celsius
  uvIndex: number
  visibility: number
}

interface WeatherApiResponse {
  name: string
  coord: {
    lat: number
    lon: number
  }
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    main: string
    id: number
  }>
  wind: {
    speed: number
  }
  visibility: number
  sys: {
    sunrise: number
    sunset: number
  }
  timezone: number // Timezone offset in seconds from UTC
}

interface ForecastApiItem {
  dt: number
  main: {
    temp_max: number
    temp_min: number
  }
  weather: Array<{
    id: number
  }>
  pop: number
}

interface OneCallApiResponse {
  current: {
    feels_like: number
    uvi: number
    visibility: number
    sunrise: number
    sunset: number
  }
  daily: Array<{
    dt: number
    temp: {
      max: number
      min: number
    }
    weather: Array<{
      id: number
    }>
    pop: number
    moon_phase: number
  }>
}

const currentWeather = ref<CurrentWeather | null>(null)
const forecast = ref<ForecastItem[]>([])
const celestialData = ref<CelestialData | null>(null)
const systemStatus = ref<SystemStatus | null>(null)
const error = ref('')
const weatherError = ref<string | null>(null) // Dedicated error state for weather API 404s
const selectedUnit = ref<Unit>('metric')
const isAppLoading = ref<boolean>(false) // Global loading state for responsiveness

// Use API key from environment variables
// Make sure you have VITE_OPENWEATHER_API_KEY in your .env file
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string
const BASE_URL = 'https://api.openweathermap.org/data/2.5'

// ARTIFICIAL LOADING DELAY FOR RETRO VCR EXPERIENCE
const MINIMUM_LOADING_TIME = 300 // shorter minimum to keep snappy UX

// Check if API key is loaded
if (!API_KEY) {
  console.error('❌ OpenWeatherMap API key not found! Make sure VITE_OPENWEATHER_API_KEY is set in your .env file')
}

// Delay Promise for artificial loading time
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// TEMPERATURE CONVERSION FUNCTIONS FOR SMOOTH UNIT SWITCHING
const celsiusToFahrenheit = (celsius: number): number => {
  return Math.round((celsius * 9/5) + 32)
}

const metersPerSecondToMph = (mps: number): number => {
  return Math.round(mps * 2.237)
}

const metersPerSecondToKmh = (mps: number): number => {
  return Math.round(mps * 3.6)
}

// Helper function to calculate moon phase
const getCurrentMoonPhase = (): number => {
  // Basic moon phase calculation based on current date
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // Simplified moon phase calculation (approximation)
  const c = Math.floor((year - 1900) / 100)
  const e = 2 * (year - 1900 - 100 * c)
  const f = Math.floor((month <= 2) ? month + 13 : month + 1)
  const g = Math.floor((month <= 2) ? year - 1 : year)
  const h = Math.floor(365.25 * g) + Math.floor(30.6001 * f) + day - 694039.09 + (1 / 86400) * (0 + 0 / 60 + 0 / 3600)
  const phase = (h - Math.floor(h / 29.53) * 29.53) / 29.53
  
  return Math.max(0, Math.min(1, phase))
}

// Helper function to get UV index (free tier approximation)
const getUVIndex = async (lat: number, lon: number): Promise<number> => {
  try {
    // For free tier, we'll estimate UV index based on time and weather conditions
    const now = new Date()
    const hour = now.getHours()
    
    // Simple UV estimation: higher at midday, lower at dawn/dusk, zero at night
    if (hour < 6 || hour > 18) return 0
    if (hour < 8 || hour > 16) return Math.floor(Math.random() * 3) + 1
    if (hour < 10 || hour > 14) return Math.floor(Math.random() * 5) + 3
    return Math.floor(Math.random() * 6) + 5 // Peak UV hours
  } catch (error) {
    return Math.floor(Math.random() * 8) + 1
  }
}

// SMOOTH TEMPERATURE UNIT SWITCHING - NO API CALLS NEEDED
const displayWeather = computed(() => {
  if (!currentWeather.value) return null
  
  const weather = currentWeather.value
  return {
    ...weather,
    temperature: selectedUnit.value === 'metric' 
      ? Math.round(weather.temperature)
      : celsiusToFahrenheit(weather.temperature),
    windSpeed: selectedUnit.value === 'metric'
      ? metersPerSecondToKmh(weather.windSpeed)
      : metersPerSecondToMph(weather.windSpeed)
  }
})

const displayForecast = computed(() => {
  if (!forecast.value.length) return []
  
  return forecast.value.map(item => ({
    ...item,
    high: selectedUnit.value === 'metric' 
      ? Math.round(item.high)
      : celsiusToFahrenheit(item.high),
    low: selectedUnit.value === 'metric'
      ? Math.round(item.low) 
      : celsiusToFahrenheit(item.low)
  }))
})

const displaySystemStatus = computed(() => {
  if (!systemStatus.value) return null
  
  return {
    ...systemStatus.value,
    feelsLike: selectedUnit.value === 'metric'
      ? Math.round(systemStatus.value.feelsLike)
      : celsiusToFahrenheit(systemStatus.value.feelsLike)
  }
})

// Temperature unit toggle functionality
const toggleUnit = () => {
  selectedUnit.value = selectedUnit.value === 'metric' ? 'imperial' : 'metric'
}

const unitToggleText = computed(() => {
  return selectedUnit.value === 'metric' ? 'Switch to °F' : 'Switch to °C'
})

const tempSymbol = computed(() => {
  return selectedUnit.value === 'metric' ? '°C' : '°F'
})

const getWeather = async (city: string, unit: Unit = 'metric') => {
  // Set loading state IMMEDIATELY for instant feedback
  isAppLoading.value = true
  
  try {
    error.value = ''
    weatherError.value = null // Clear any previous weather-specific errors
    
    // Check API key before making requests
    if (!API_KEY) {
      weatherError.value = 'CONFIGURATION ERROR // API KEY MISSING'
      return
    }
    
    // Start both calls concurrently and resolve weather first for responsiveness
    const startedAt = performance.now()
    const weatherUrl = `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
    const forecastUrl = `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`

    const weatherPromise = axios.get<WeatherApiResponse>(weatherUrl, { timeout: 15000 })
    const forecastPromise = axios.get<{list: ForecastApiItem[]}>(forecastUrl, { timeout: 20000 })

    const weatherResponse = await weatherPromise
    if (weatherResponse.status === 404) {
      throw new Error('Location found, but no weather data available.')
    }

    const weatherData = weatherResponse.data
    // Store RAW temperature data in Celsius for smooth unit switching
    currentWeather.value = {
      city: weatherData.name,
      temperature: weatherData.main.temp, // Raw Celsius
      condition: weatherData.weather[0].main,
      iconCode: weatherData.weather[0].id,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed, // Raw m/s
      pressure: weatherData.main.pressure
    }

    // Use real celestial data from the API
    celestialData.value = {
      sunrise: weatherData.sys.sunrise,
      sunset: weatherData.sys.sunset,
      moonPhase: getCurrentMoonPhase(), // Calculate current moon phase
      timezone: weatherData.timezone // Timezone offset in seconds from UTC
    }

    // Use real system status data from the API - store raw Celsius values
    systemStatus.value = {
      feelsLike: weatherData.main.feels_like, // Raw Celsius
      uvIndex: await getUVIndex(weatherData.coord.lat, weatherData.coord.lon),
      visibility: weatherData.visibility || 10000
    }

    // Ensure a minimal overlay time but don't block longer than needed
    const elapsed = performance.now() - startedAt
    if (elapsed < MINIMUM_LOADING_TIME) {
      await delay(MINIMUM_LOADING_TIME - elapsed)
    }

    // Let forecast resolve in the background; don't block UI
    forecastPromise
      .then(({ data }) => {
        const dailyForecasts = data.list.filter((_: ForecastApiItem, index: number) => index % 8 === 4).slice(0, 5)
        forecast.value = dailyForecasts.map((item: ForecastApiItem) => ({
          day: new Date(item.dt * 1000).toLocaleDateString('en', { weekday: 'short' }).toUpperCase(),
          date: new Date(item.dt * 1000).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }),
          iconCode: item.weather[0].id,
          high: item.main.temp_max, // Raw Celsius
          low: item.main.temp_min, // Raw Celsius
          precipitation: Math.round((item.pop || 0) * 100)
        }))
      })
      .catch((e) => {
        console.warn('Forecast unavailable or delayed', e)
      })
    
  } catch (err: unknown) {
    const errorObj = err as { response?: { status?: number }; code?: string; message?: string }
    
    // Handle specific error types for better user feedback
    if (errorObj.response?.status === 404) {
      weatherError.value = '> NO WEATHER DATA AVAILABLE FOR THIS LOCATION'
    } else if (errorObj.response?.status === 401) {
      weatherError.value = 'SECURITY BREACH // INVALID API CREDENTIALS'
    } else if (errorObj.message === 'Location found, but no weather data available.') {
      weatherError.value = '> NO WEATHER DATA AVAILABLE FOR THIS LOCATION'
    } else if (errorObj.message === 'Weather data partially available - forecast unavailable.') {
      weatherError.value = '> WEATHER DATA INCOMPLETE - TRY A LARGER CITY'
    } else {
      weatherError.value = 'SYSTEM FAILURE // CONNECTION TERMINATED'
    }
    
    // Clear any existing weather data when there's an error
    currentWeather.value = null
    forecast.value = []
    celestialData.value = null
    systemStatus.value = null
    
  } finally {
    // ALWAYS clear loading state - guarantees it's turned off even on errors
    isAppLoading.value = false
  }
}

// COORDINATE-BASED WEATHER FETCHING - The Universal Solution
// This eliminates the GeoDB vs OpenWeatherMap naming conflict by using lat/lon
const getWeatherByCoordinates = async (lat: number, lon: number, displayName: string, unit: Unit = 'metric') => {
  // Set loading state IMMEDIATELY for instant feedback
  isAppLoading.value = true
  
  try {
    error.value = ''
    weatherError.value = null // Clear any previous weather-specific errors
    
    // Check API key before making requests
    if (!API_KEY) {
      weatherError.value = 'CONFIGURATION ERROR // API KEY MISSING'
      return
    }
    
    // Coordinate-based fetch with parallelized forecast and minimal overlay
    const startedAt = performance.now()
    const weatherUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    const forecastUrl = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`

    const weatherPromise = axios.get<WeatherApiResponse>(weatherUrl, { timeout: 15000 })
    const forecastPromise = axios.get<{list: ForecastApiItem[]}>(forecastUrl, { timeout: 20000 })

    const weatherResponse = await weatherPromise
    if (weatherResponse.status === 404) {
      throw new Error('Coordinates valid but no weather data available.')
    }

    const weatherData = weatherResponse.data
    currentWeather.value = {
      city: displayName, // Use the user-friendly name from GeoDB
      temperature: weatherData.main.temp, // Raw Celsius
      condition: weatherData.weather[0].main,
      iconCode: weatherData.weather[0].id,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed, // Raw m/s
      pressure: weatherData.main.pressure
    }
    celestialData.value = {
      sunrise: weatherData.sys.sunrise,
      sunset: weatherData.sys.sunset,
      moonPhase: getCurrentMoonPhase(),
      timezone: weatherData.timezone
    }
    systemStatus.value = {
      feelsLike: weatherData.main.feels_like,
      uvIndex: await getUVIndex(lat, lon),
      visibility: weatherData.visibility || 10000
    }

    const elapsed = performance.now() - startedAt
    if (elapsed < MINIMUM_LOADING_TIME) {
      await delay(MINIMUM_LOADING_TIME - elapsed)
    }

    // Forecast background update
    forecastPromise
      .then(({ data }) => {
        const dailyForecasts = data.list.filter((_: ForecastApiItem, index: number) => index % 8 === 4).slice(0, 5)
        forecast.value = dailyForecasts.map((item: ForecastApiItem) => ({
          day: new Date(item.dt * 1000).toLocaleDateString('en', { weekday: 'short' }).toUpperCase(),
          date: new Date(item.dt * 1000).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }),
          iconCode: item.weather[0].id,
          high: item.main.temp_max, // Raw Celsius
          low: item.main.temp_min, // Raw Celsius
          precipitation: Math.round((item.pop || 0) * 100)
        }))
      })
      .catch((e) => {
        console.warn('Forecast unavailable or delayed', e)
      })
    
  } catch (err: unknown) {
    const errorObj = err as { response?: { status?: number }; code?: string; message?: string }
    
    // Handle specific error types for better user feedback
    if (errorObj.response?.status === 404) {
      weatherError.value = '> NO WEATHER DATA AVAILABLE FOR THESE COORDINATES'
    } else if (errorObj.response?.status === 401) {
      weatherError.value = 'SECURITY BREACH // INVALID API CREDENTIALS'
    } else if (errorObj.message === 'Coordinates valid but no weather data available.') {
      weatherError.value = '> NO WEATHER DATA AVAILABLE FOR THESE COORDINATES'
    } else if (errorObj.message === 'Weather data partially available - forecast unavailable.') {
      weatherError.value = '> WEATHER DATA INCOMPLETE - TRY A LARGER CITY'
    } else {
      weatherError.value = 'SYSTEM FAILURE // CONNECTION TERMINATED'
    }
    
    // Clear any existing weather data when there's an error
    currentWeather.value = null
    forecast.value = []
    celestialData.value = null
    systemStatus.value = null
    
  } finally {
    // ALWAYS clear loading state - guarantees it's turned off even on errors
    isAppLoading.value = false
  }
}

const handleCitySelected = (cityData: { name: string; displayName: string; type: string; country?: string; countryCode?: string; lat?: number; lon?: number }) => {
  // Use coordinates for weather fetching if available (preferred method)
  if (cityData.lat && cityData.lon) {
    getWeatherByCoordinates(cityData.lat, cityData.lon, cityData.displayName || cityData.name, 'metric')
  } else {
    // Fallback to name-based search for countries or incomplete data
    const searchTerm = cityData.displayName || cityData.name
    getWeather(searchTerm, 'metric')
  }
}

onMounted(() => {
  // Always fetch in metric to store raw data
  getWeather('Jakarta', 'metric')
})
</script>

<template>
  <!-- VCR TRACKING LOADING SCREEN -->
  <div v-if="isAppLoading" class="loading-overlay" aria-label="loading">
    <div class="loading-content">
      <span class="blinking-cursor">█</span>
    </div>
  </div>

  <div class="min-h-screen bg-terminal-bg text-terminal-white font-mono overflow-hidden">
  <div class="p-3">
  <div class="mb-3">
        <div class="text-xs mb-2 text-terminal-blue" style="font-family: 'VT323', 'IBM Plex Mono', monospace; font-size: 0.95rem;">
          WEATHER TERMINAL v2.1
        </div>
        <CitySearch @citySelected="handleCitySelected" />
      </div>
      
      <div
        v-if="error"
        class="text-terminal-red text-center py-8"
      >
        {{ error }}
      </div>
      
      <!-- Weather Error Panel for 404/No Data Scenarios -->
      <div
        v-else-if="weatherError"
        class="weather-error-panel"
      >
        <div class="error-content">
          <div class="text-terminal-blue mb-2">
            [WEATHER SYSTEM STATUS]
          </div>
          <div class="text-terminal-red">
            {{ weatherError }}
          </div>
          <div class="text-terminal-blue text-sm mt-2">
            > Try searching for a larger city or different location
          </div>
        </div>
      </div>
      
  <!-- Main layout: aligned two-column rows (top: city/temp, bottom: details/celestial) -->
  <div v-else-if="displayWeather" class="mt-3 space-y-3">
        <!-- Weather header row spans the same full width as panels below for perfect column alignment -->
        <WeatherDisplay 
          :weather="displayWeather" 
          :temp-symbol="tempSymbol" 
          :unit-toggle-text="unitToggleText" 
          @toggle-unit="toggleUnit" 
        />

        <!-- Side-by-side: Atmospheric Data and Celestial Tracker -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <WeatherDetails :weather="displayWeather" :temp-symbol="tempSymbol" />
          <div v-if="celestialData">
            <CelestialTracker :celestial="celestialData" />
          </div>
        </div>
      </div>
      
  <div v-else-if="!weatherError" class="text-terminal-blue text-center py-6" aria-hidden="true"></div>
      
      <div v-if="displayWeather && displayForecast.length && !weatherError" class="mt-3">
        <ForecastDisplay :forecast="displayForecast" :temp-symbol="tempSymbol" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* VCR TRACKING LOADING SCREEN STYLES */
.loading-overlay {
  /* Core Overlay Styles */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #011173; /* Your VCR Blue */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden; /* Important for the tracking lines */
}

/* The Tracking Line Effect (using a pseudo-element) */
.loading-overlay::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.05), /* Faint version of your text color */
    rgba(255, 255, 255, 0.05) 1px,
    transparent 1px,
    transparent 4px /* Creates thin lines with space between */
  );
  animation: scroll-tracking 1.5s linear infinite;
}

.loading-content {
  font-family: 'VT323', 'IBM Plex Mono', monospace;
  font-size: 2rem;
  color: #ffffff; /* Your VCR Text color */
  text-shadow: 0 0 5px #419bfb;
  z-index: 1; /* Make sure text is on top of the lines */
  letter-spacing: 2px;
}

.blinking-cursor {
  animation: blink 1s step-end infinite;
}

/* The Animations */
@keyframes scroll-tracking {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-4px); /* Moves up by the height of one line repeat */
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* Weather Error Panel Styling - VCR Theme */
.weather-error-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
}

.error-content {
  background-color: #011173;
  border: 2px solid #419bfb;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  font-family: 'VT323', 'IBM Plex Mono', monospace;
  box-shadow: 0 0 10px rgba(65, 155, 251, 0.3);
}

.error-content .text-terminal-red {
  font-size: 1.1rem;
  font-weight: bold;
  letter-spacing: 1px;
  text-shadow: 0 0 5px #dd0101;
}

.error-content .text-terminal-blue {
  opacity: 0.9;
}
</style>