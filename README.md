# 🌤️ Vue Weather App# Vue 3 Weather Forecast App



A modern weather application with a terminal-inspired interface that displays real-time weather data and 5-day forecasts.A beautiful weather forecast application built with Vue 3, TypeScript, and Tailwind CSS.



## ✨ Features## Features



- Real-time weather information for any city- 🌤️ Current weather display

- 5-day weather forecast- 📅 5-day weather forecast

- Chromepunk terminal design theme- 📱 Responsive design

- Responsive design for mobile and desktop- ⚡ Built with Vite for fast development

- TypeScript for type safety- 🔒 Secure API key management



## 🛠️ Tech Stack## Setup Instructions



- **Frontend:** Vue 3 with Composition API### 1. Install Dependencies

- **Language:** TypeScript```bash

- **Styling:** Tailwind CSSnpm install

- **Build Tool:** Vite```

- **HTTP Client:** Axios

- **API:** OpenWeatherMap### 2. Get OpenWeatherMap API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)

## 🚀 Quick Start2. Sign up for a free account

3. Get your API key from the dashboard

1. **Clone the repository**

   ```bash### 3. Configure Environment Variables

   git clone <repository-url>1. Copy the example environment file:

   cd vue-weather-app   ```bash

   ```   cp .env.example .env

   ```

2. **Install dependencies**2. Open `.env` and replace `your_openweathermap_api_key_here` with your actual API key:

   ```bash   ```

   npm install   VITE_OPENWEATHER_API_KEY=your_actual_api_key_here

   ```   ```



3. **Set up environment variables**### 4. Run the Development Server

   ```bash```bash

   cp .env.example .envnpm run dev

   ``````

   Add your OpenWeatherMap API key to the `.env` file:

   ```The app will be available at `http://localhost:5173/`

   VITE_OPENWEATHER_API_KEY=your_api_key_here

   ```## Project Structure



4. **Start development server**```

   ```bashsrc/

   npm run dev├── components/

   ```│   ├── WeatherDisplay.vue    # Current weather component

│   └── ForecastDisplay.vue   # 5-day forecast component

5. **Open your browser**├── assets/

   Navigate to `http://localhost:5173`│   └── main.css             # Tailwind CSS imports

└── App.vue                  # Main application component

## 📝 Available Scripts```



```bash## Tech Stack

npm run dev      # Start development server

npm run build    # Build for production- **Vue 3** with Composition API

npm run preview  # Preview production build- **TypeScript** for type safety

npm run lint     # Run ESLint- **Tailwind CSS** for styling

```- **Vite** for build tooling

- **Axios** for API requests

## 🎨 Design

## Environment Variables

The app features a retro-futuristic terminal interface with:

- IBM Plex Mono monospace font- `VITE_OPENWEATHER_API_KEY` - Your OpenWeatherMap API key

- Chromepunk color scheme

- CRT-style visual effects## Security

- Terminal command line aesthetics

- API keys are stored in environment variables

## 📱 Browser Support- `.env` file is excluded from Git

- Use `.env.example` as a template for deployment

Modern browsers that support ES2020+ features:

- Chrome 90+## License

- Firefox 88+

- Safari 14+MIT License
