# Weather Terminal v2.1

A retro-futuristic weather application inspired by classic VCR and Teletext "blue screen" interfaces from the 1980s and 90s.

## ✨ Features

* **Intelligent, Persistent Search:** A robust, four-stage sequential search engine that finds cities and countries, complete with an auto-retrying mechanism and "exact match" fallbacks.
* **100% Validated Suggestions:** Every search suggestion is pre-validated against the OpenWeatherMap API to guarantee it has available weather data, eliminating all "dead-end" results.
* **"Select & Save" Favorites:** A user-friendly favorites system that automatically saves selected locations to the browser's `localStorage` for quick access.
* **Authentic VCR Aesthetic:** A meticulously crafted design featuring the `VT323` font, a classic blue color palette, and a borderless, block-based layout.
* **Immersive UX:** Includes a one-time animated "System Boot" screen, a thematic "VCR Tracking" loading animation, and a subtle CRT screen effect for full immersion.
* **Pixel Art Icons:** Uses the `pixelarticons` library for a cohesive, low-resolution visual identity.

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
    git clone https://github.com/your-username/your-repo-name.git
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

Visit the live application: [Weather Terminal v2.1](https://your-username.github.io/your-repo-name/)

## 🎮 Usage

1. **Search for Locations:** Type in the search box to find cities or countries
2. **Smart Validation:** All suggestions are pre-validated for weather data availability
3. **Select & View:** Click any suggestion to view detailed weather information
4. **Unit Toggle:** Switch between Celsius and Fahrenheit with the toggle button
5. **Responsive Design:** Works seamlessly on desktop and mobile devices

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
- **`CitySearch.vue`** - Four-stage search interface with terminal styling
- **`WeatherDisplay.vue`** - Primary weather information display
- **`WeatherDetails.vue`** - Atmospheric data specifications
- **`ForecastDisplay.vue`** - 5-day weather forecast
- **`CelestialTracker.vue`** - Sunrise, sunset, and moon phase data

### Advanced Features

- **Four-Stage Search System:** Prefix cities → Prefix countries → Exact cities → Exact countries
- **API Validation:** Every suggestion verified against OpenWeatherMap before display
- **Coordinate-Based Weather:** Uses lat/lon coordinates for maximum accuracy
- **Smooth Unit Conversion:** Client-side temperature/wind speed unit switching
- **Defensive Programming:** Comprehensive null checks and error handling

## 🌐 Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Deployment Steps

1. Fork or clone this repository
2. Update the `base` property in `vite.config.js` to match your repository name
3. Set up your API keys in GitHub Secrets:
   - `VITE_OPENWEATHER_API_KEY`
   - `VITE_RAPIDAPI_KEY`
4. Push to the `main` branch to trigger automatic deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## � License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Acknowledgments

- **OpenWeatherMap** for reliable weather data
- **GeoDB Cities** for comprehensive location search
- **Vue.js Team** for the excellent framework
- **Tailwind CSS** for utility-first styling
- **Vite** for lightning-fast development experience

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/your-repo-name/issues) page
2. Create a new issue with detailed information
3. Follow the issue template for faster resolution

---

**Built with ❤️ and nostalgia for the golden age of computing**
