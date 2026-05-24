import axios from 'axios';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const UNITS = process.env.OPENWEATHER_UNITS || 'metric';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Simple cache with TTL (5 minutes)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const getCacheKey = (endpoint, params) => `${endpoint}:${JSON.stringify(params)}`;

const fetchWithCache = async (url, cacheKey) => {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const response = await axios.get(url);
  cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
  return response.data;
};

export const getCurrentWeather = async (lat, lon) => {
  try {
    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${UNITS}`;
    const cacheKey = getCacheKey('current', { lat, lon });
    return await fetchWithCache(url, cacheKey);
  } catch (error) {
    console.warn(`Weather API error: ${error.message}. Returning mock weather for lat/lon [${lat}, ${lon}].`);
    return {
      name: `GPS (${String(lat).slice(0, 5)}, ${String(lon).slice(0, 5)})`,
      main: { temp: 31, humidity: 65 },
      wind: { speed: 12 },
      weather: [{ main: 'Clouds', description: 'partly cloudy', icon: '03d' }]
    };
  }
};

export const getForecast = async (lat, lon, days = 5) => {
  try {
    const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${UNITS}&cnt=${days * 8}`;
    const cacheKey = getCacheKey('forecast', { lat, lon, days });
    return await fetchWithCache(url, cacheKey);
  } catch (error) {
    console.warn(`Weather API error: ${error.message}. Returning mock forecast.`);
    const list = [];
    for (let i = 0; i < days * 8; i++) {
      list.push({
        dt: Date.now() + i * 3 * 3600 * 1000,
        main: { temp: 28 + (i % 3), humidity: 60 },
        weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
        wind: { speed: 8 }
      });
    }
    return { list };
  }
};

// Helper to get weather by city name (optional)
export const getWeatherByCity = async (city, countryCode = 'IN') => {
  try {
    const url = `${BASE_URL}/weather?q=${city},${countryCode}&appid=${API_KEY}&units=${UNITS}`;
    const cacheKey = getCacheKey('city', { city, countryCode });
    return await fetchWithCache(url, cacheKey);
  } catch (error) {
    console.warn(`Weather API error: ${error.message}. Returning mock weather for city [${city}].`);
    let hash = 0;
    for (let i = 0; i < city.length; i++) {
      hash = city.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    
    const temps = [25, 29, 32, 35, 20];
    const humidities = [48, 55, 65, 82, 52];
    const conditions = [
      { main: 'Clear', description: 'clear sky', icon: '01d' },
      { main: 'Clouds', description: 'scattered clouds', icon: '03d' },
      { main: 'Rain', description: 'moderate rain', icon: '10d' },
      { main: 'Haze', description: 'hazy', icon: '50d' },
      { main: 'Clouds', description: 'partly cloudy', icon: '02d' }
    ];

    const idx = hash % 5;
    return {
      name: city,
      main: { temp: temps[idx], humidity: humidities[idx] },
      wind: { speed: 6 + (hash % 8) },
      weather: [conditions[idx]]
    };
  }
};