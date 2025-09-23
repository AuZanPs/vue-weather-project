# Weather Terminal v2.1 — Technical Specification

## Project Overview

- Application Name: Weather Terminal
- Version: 2.1.0
- Type: Single Page Application (SPA)
- Theme: Retro Terminal (VCR/Teletext-inspired)
- Purpose: Real-time weather with compact, no-scroll UI and robust search/validation

---

## Architecture Overview

### Frontend
- Framework: Vue.js 3.5.18 (Composition API)
- Language: TypeScript (in SFCs via `<script setup lang="ts">`)
- Build Tool: Vite 7.x
- Modules: ESM
- State: Local component state (ref/computed) + in-memory caches

### Design System
- CSS: Tailwind CSS 3.4.x via PostCSS
- Fonts: VT323 (terminal/search); IBM Plex Mono base
- Icons: lucide-vue-next (via `Icon.vue` and `WeatherIcon.vue`)
- Theme Colors:
  - terminal-bg: #011173
  - terminal-blue: #419bfb
  - terminal-white: #ffffff
  - terminal-red: #dd0101

---

## API Integration

### Providers
- OpenWeatherMap (weather/forecast)
- GeoDB Cities via RapidAPI (city/country suggestions)

### OpenWeather Endpoints
- Current (name): `/weather?q={city}&appid={key}&units=metric`
- Forecast (name): `/forecast?q={city}&appid={key}&units=metric`
- Current (coords): `/weather?lat={lat}&lon={lon}&appid={key}&units=metric`
- Forecast (coords): `/forecast?lat={lat}&lon={lon}&appid={key}&units=metric`

### GeoDB Endpoints
- Prefix cities: `/v1/geo/cities?minPopulation=50000&namePrefix={q}&limit=10`
- Prefix countries: `/v1/geo/countries?namePrefix={q}&limit=5&include=capital`
- Exact cities: `/v1/geo/cities?minPopulation=100000&name={q}&limit=8`
- Exact countries: `/v1/geo/countries?name={q}&limit=5&include=capital`

### Environment Variables
- `VITE_OPENWEATHER_API_KEY`
- `VITE_RAPIDAPI_KEY`

---

## Core Modules and Responsibilities

### `src/App.vue`
- Orchestrates fetching and rendering
- Weather fetch by name or coordinates (axios)
- In-memory cache (Map) for last selection; hydrates instantly, refreshes silently
- Unit conversion in UI (C↔F; m/s→km/h or mph) with localStorage persistence
- Live local time label (HH:MM:SS + GMT offset) updating every second
- Error handling (404/401/others) with retro-styled panels
- Retro loading overlay with tracking lines (minimal enforced time ~300ms)

### `src/components/CitySearch.vue`
- Terminal-style search input with permanent output pane
- Debounce (≈300ms) and strong input validation to block gibberish
- Keyboard navigation (↑/↓, Enter, Esc)
- Accessibility: aria-live on status and terminal logs
- Emits `citySelected` with name/coords

### `src/composables/useSearch.ts`
- Four-stage search orchestration:
  1) Prefix city
  2) Prefix country (skipped if cities found)
  3) Exact city (fallback)
  4) Exact country (final fallback)
- Progressive pre-validation via OpenWeather with badges: [--]/[CHK]/[OK]
- Latest-only gating via AbortController; cancels stale validations
- Caches: cityApiCache, countryApiCache, weatherValidationCache
- Retries with exponential backoff + jitter; logs WAIT/OK/ERROR lines
- Handles rate limits: detects 429, respects Retry-After, applies short global cooldown

### `src/api/geoDB.ts`
- Adds lightweight rate limiting:
  - Per-request-family spacing (~1100ms)
  - Global cooldown after any 429
  - Parses Retry-After/x-ratelimit headers
  - Supports AbortSignal in fetch
- Endpoints for cities/countries (prefix and exact)

### `src/api/openWeather.ts`
- `validateSuggestion(suggestion, signal?)`
  - Cities: coordinate-based validation with tolerance (~0.5°)
  - Countries: capital-based validation with fallback to country name
  - Requires core fields (weather, main.temp, coord, name)
- `fetchWeatherData(suggestion)`
  - Returns complete weather JSON or null on failure

### `src/components/WeatherDisplay.vue`
- Left: City (and country), Local time label (per second)
- Right: Icon + temperature; condition; FEELS LIKE; unit toggle
- Emits `toggle-unit` to `App.vue`

### `src/components/WeatherDetails.vue`
- Humidity (%), wind speed, pressure
- Terminal dotted-label style with icons

### `src/components/ForecastDisplay.vue`
- 5 cards with day, date, icon, high/low, precipitation%
- Retro precipitation bar (width based on POP)

### `src/components/CelestialTracker.vue`
- Sunrise/Sunset (timezone corrected), moon phase
- Timezone label via `utils/formatters`

### `src/utils/formatters.ts`
- `formatTimezoneOffset(offsetSeconds)` → `GMT+/-H[:MM]`

### `src/types/index.ts`
- CitySuggestion, CountrySuggestion, UnifiedSuggestion, SearchStatus, CitySelectedEvent

---

## User Experience & Accessibility
- No page scroll; terminal pane can scroll internally
- VT323 for terminal/search areas
- aria-live on status bar and terminal outputs
- Emoji-free, clear system messages
- Loading overlay uses animated tracking lines and blinking cursor

---

## Performance & Reliability
- Debounced input and strong pre-validation reduce wasted calls
- Latest-only search cancels stale work
- Rate-limit aware GeoDB client (spacing, cooldowns, Retry-After)
- Background forecast loading after current weather
- Minimal enforced loading overlay for consistent feel

---

## Build, Lint, and Run
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Lint: `npm run lint` / `npm run lint:check`
- Vite base: `/vue-weather-project/` (configured for GitHub Pages)

---

## Deployment
- Static hosting (GitHub Pages/Netlify/Vercel) supported
- For GitHub Pages, base is already set; publish `dist/`
- CI/CD: ensure repository secrets for `VITE_OPENWEATHER_API_KEY` and `VITE_RAPIDAPI_KEY`

---

## Maintenance & Roadmap
- Regular dependency updates and API key rotation
- Future ideas: geolocation default, alerts, offline mode, URL sharing, basic unit tests

---

## Title and Metadata
- Page title is set in `index.html` `<title>...</title>`
- For dynamic titles (e.g., selected city), update `document.title` in `App.vue` after selection