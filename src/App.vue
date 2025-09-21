<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import CitySearch from './components/CitySearch.vue'
import WeatherDisplay from './components/WeatherDisplay.vue'
import WeatherDetails from './components/WeatherDetails.vue'
import ForecastDisplay from './components/ForecastDisplay.vue'

export interface CurrentWeather {
  city: string
  temperature: number
  condition: string
  iconCode: number
  humidity: number
  windSpeed: number
  pressure: number
}

export interface ForecastItem {
  day: string
  iconCode: number
  high: number
  low: number
}

interface WeatherApiResponse {
  name: string
  main: {
    temp: number
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
}

const currentWeather = ref<CurrentWeather | null>(null)
const forecast = ref<ForecastItem[]>([])
const error = ref('')

// Use API key from environment variables
// Make sure you have VITE_OPENWEATHER_API_KEY in your .env file
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5'

// Check if API key is loaded
if (!API_KEY) {
  console.error('❌ OpenWeatherMap API key not found! Make sure VITE_OPENWEATHER_API_KEY is set in your .env file')
}

const getWeather = async (city: string) => {
  try {
    error.value = ''
    
    // Check API key before making requests
    if (!API_KEY) {
      error.value = 'CONFIGURATION ERROR // API KEY MISSING'
      return
    }
    
    const weatherUrl = `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
    const forecastUrl = `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
    
    const weatherResponse = await axios.get<WeatherApiResponse>(weatherUrl)
    const weatherData = weatherResponse.data
    
    currentWeather.value = {
      city: weatherData.name,
      temperature: Math.round(weatherData.main.temp),
      condition: weatherData.weather[0].main,
      iconCode: weatherData.weather[0].id,
      humidity: weatherData.main.humidity,
      windSpeed: Math.round(weatherData.wind.speed * 3.6),
      pressure: weatherData.main.pressure
    }
    
    const forecastResponse = await axios.get<{list: ForecastApiItem[]}>(forecastUrl)
    const forecastData = forecastResponse.data
    const dailyForecasts = forecastData.list.filter((_: ForecastApiItem, index: number) => index % 8 === 4).slice(0, 5)
    
    forecast.value = dailyForecasts.map((item: ForecastApiItem) => ({
      day: new Date(item.dt * 1000).toLocaleDateString('en', { weekday: 'short' }).toUpperCase(),
      iconCode: item.weather[0].id,
      high: Math.round(item.main.temp_max),
      low: Math.round(item.main.temp_min)
    }))
    
  } catch (err: unknown) {
    const error = err as { response?: { status?: number }; code?: string }
    
    if (error.response?.status === 404) {
      error.value = 'ACCESS DENIED // LOCATION UNKNOWN'
    } else if (error.response?.status === 401) {
      error.value = 'SECURITY BREACH // INVALID API CREDENTIALS'
    } else {
      error.value = 'SYSTEM FAILURE // CONNECTION TERMINATED'
    }
  }
}

const handleCitySearch = (city: string) => {
  getWeather(city)
}

onMounted(() => {
  getWeather('Jakarta')
})
</script>

<template>
  <div class="min-h-screen bg-terminal-bg text-terminal-white font-mono">
    <div class="p-4">
      <div class="mb-4">
        <div class="text-xs mb-2 text-terminal-blue">
          WEATHER TERMINAL v2.1
        </div>
        <CitySearch @search-city="handleCitySearch" />
      </div>
      
      <div
        v-if="error"
        class="text-terminal-red text-center py-8"
      >
        {{ error }}
      </div>
      
      <div
        v-else-if="currentWeather"
        class="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <WeatherDisplay :weather="currentWeather" />
        <WeatherDetails :weather="currentWeather" />
      </div>
      
      <div
        v-else
        class="text-terminal-blue text-center py-8"
      >
        INITIALIZING...
      </div>
      
      <div
        v-if="currentWeather && forecast.length"
        class="mt-4"
      >
        <ForecastDisplay :forecast="forecast" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Basic styles */
</style>