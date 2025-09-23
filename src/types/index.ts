/**
 * Type definitions for the Weather App
 * Centralized location for all TypeScript interfaces and types
 */

// GeoDB API Response Types
export interface CitySuggestion {
  id: number
  name: string
  country: string
  countryCode: string
  latitude?: number
  longitude?: number
}

export interface CountrySuggestion {
  code: string
  name: string
  capital?: string // Capital city name for validation
}

// Unified Search Types
export interface UnifiedSuggestion {
  id: string
  name: string
  displayName: string
  type: 'city' | 'country'
  country?: string
  countryCode?: string
  lat?: number
  lon?: number
  capital?: string // For country suggestions - used for validation
  // UI-only, background pre-validation state (optional)
  validated?: boolean
  validating?: boolean
}

// Search State Types
export type SearchStatus = 'idle' | 'fetching' | 'success' | 'no_results' | 'error'

// City Selection Event Type
export interface CitySelectedEvent {
  name: string
  displayName: string
  type: string
  country?: string
  countryCode?: string
  lat?: number
  lon?: number
  capital?: string
}