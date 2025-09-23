// Map OpenWeather condition codes to Lucide icon names
// Reference: https://openweathermap.org/weather-conditions
export const weatherCodeToLucide: Record<string | number, string> = {
  // Thunderstorm
  200: 'CloudLightning', 201: 'CloudLightning', 202: 'CloudLightning',
  210: 'CloudLightning', 211: 'CloudLightning', 212: 'CloudLightning', 221: 'CloudLightning',
  230: 'CloudLightning', 231: 'CloudLightning', 232: 'CloudLightning',

  // Drizzle
  300: 'CloudDrizzle', 301: 'CloudDrizzle', 302: 'CloudDrizzle',
  310: 'CloudDrizzle', 311: 'CloudDrizzle', 312: 'CloudDrizzle',
  313: 'CloudDrizzle', 314: 'CloudDrizzle', 321: 'CloudDrizzle',

  // Rain
  500: 'CloudRain', 501: 'CloudRain', 502: 'CloudRain', 503: 'CloudRain', 504: 'CloudRain',
  511: 'CloudRain', 520: 'CloudRain', 521: 'CloudRain', 522: 'CloudRain', 531: 'CloudRain',

  // Snow
  600: 'CloudSnow', 601: 'CloudSnow', 602: 'CloudSnow',
  611: 'CloudSnow', 612: 'CloudSnow', 613: 'CloudSnow',
  615: 'CloudSnow', 616: 'CloudSnow', 620: 'CloudSnow', 621: 'CloudSnow', 622: 'CloudSnow',

  // Atmosphere
  701: 'Wind', 711: 'Wind', 721: 'Wind', 731: 'Wind', 741: 'Wind', 751: 'Wind', 761: 'Wind', 762: 'Wind', 771: 'Wind', 781: 'Wind',

  // Clear
  800: 'Sun',

  // Clouds
  801: 'CloudSun', 802: 'CloudSun',
  803: 'Cloud', 804: 'Cloud',
}

export const getLucideIconNameForCode = (code: number): string => {
  return weatherCodeToLucide[code] || 'Sun'
}
