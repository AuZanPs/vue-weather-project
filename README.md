# Weather Terminal v2.1

A retro-futuristic weather application inspired by classic VCR/Teletext "blue screen" terminals — compact, no-scroll, and fast.

## ✨ Features

* **Cancellable, Cached Search:** Four-stage search (prefix city → prefix country → exact city → exact country) with latest-only cancellation, retry/backoff, and API response caching.
* **Weather-Validated Suggestions:** Each suggestion gets prechecked against OpenWeather data; badges show [--]/[CHK]/[OK] as validation progresses.
* **Terminal UI (No Scroll):** A fixed-height terminal pane with persistent output, retro loader, and a compact, edge-hugging grid. Page avoids vertical scroll by design.
* **Readable Retro Typography:** VT323 terminal styling for the command/terminal areas; clear monospace stacks elsewhere where needed.
* **Unit Toggle Without Refetch:** Client-side conversion for temperatures and wind speeds keeps switching instant and offline from API.
* **Celestial + Atmospheric Panels:** Sunrise/sunset, moon phase, humidity, pressure, wind; matching terminal styling.
* **Forecast with Dates:** Five-day forecast includes a compact date next to each weekday and a retro precipitation bar.

## 🛠️ Tech Stack

* **Framework:** Vue 3 (Composition API)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Build Tool:** Vite
* **APIs:**
    * OpenWeatherMap (for weather data)
    * GeoDB Cities (for location searching)

## 🚀 Setup and Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/AuZanPs/vue-weather-project.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root and add your API keys:
    ```
    VITE_OPENWEATHER_API_KEY=your_key_here
    VITE_RAPIDAPI_KEY=your_key_here
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

## 📱 Live Demo

If deploying to GitHub Pages, set `base` in `vite.config.js` to your repo name and publish the `dist` folder. A demo link can go here.

## 🎮 Usage

1. Type at least 2 characters to search cities or countries
2. Use ↑/↓ to navigate results, Enter to select
3. Watch validation badges: [--] queued, [CHK] validating, [OK] weather-verified
4. Toggle °C/°F under the temperature (instant, no refetch)
5. Forecast shows weekday with a date and a precipitation bar

## 🎨 Design Philosophy

The **Weather Terminal** embraces a nostalgic aesthetic reminiscent of:
- **VCR Blue Screen Interfaces** from the 1980s
- **Government Terminal Systems** with classification-style headers
- **Teletext Broadcasting** with monospace fonts and block layouts
- **CRT Monitor Effects** with subtle scanlines and glow effects

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint with auto-fix
```

### Environment Variables

Create a `.env` file in the project root:

```env
# OpenWeatherMap API Configuration
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here

# RapidAPI Configuration for GeoDB Cities
VITE_RAPIDAPI_KEY=your_rapidapi_key_here
```

### API Keys Setup

1. **OpenWeatherMap API:** 
   - Visit [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account
   - Generate an API key

2. **RapidAPI (GeoDB Cities):**
   - Visit [RapidAPI GeoDB Cities](https://rapidapi.com/wirefreethought/api/geodb-cities)
   - Subscribe to the free tier
   - Copy your API key

## 🏗️ Architecture

### Core Components

- **`App.vue`** - Main application container and state management
- **`CitySearch.vue`** - Four-stage, cancellable search with persistent terminal output and validation badges
- **`WeatherDisplay.vue`** - Primary weather information display
- **`WeatherDetails.vue`** - Atmospheric data specifications
- **`ForecastDisplay.vue`** - 5-day weather forecast
- **`CelestialTracker.vue`** - Sunrise, sunset, and moon phase data

### Advanced Features

- **Four-Stage, Cancellable Search:** Prefix cities → Prefix countries → Exact cities → Exact countries; latest-only, cached, with retry/backoff
- **API Validation:** Each suggestion verified against OpenWeatherMap; progressive badges in UI
- **Coordinate-Based Weather:** Uses GeoDB lat/lon for accuracy when available
- **Smooth Unit Conversion:** Client-side conversion for temps and wind
- **Compact No-Scroll Layout:** Tight paddings, fixed terminal pane, edge-hugging grid

## 🌐 Deployment

You can deploy to any static host (Vercel/Netlify/GitHub Pages). For GitHub Pages, set `base` in `vite.config.js`, run `npm run build`, then publish `dist`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Acknowledgments

- **OpenWeatherMap** for reliable weather data
- **GeoDB Cities** for comprehensive location search
- **Vue.js Team** for the excellent framework
- **Tailwind CSS** for utility-first styling
- **Vite** for lightning-fast development experience

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/AuZanPs/vue-weather-project/issues) page
2. Create a new issue with detailed information
3. Follow the issue template for faster resolution

---

**Built with ❤️ and nostalgia for the golden age of computing**
