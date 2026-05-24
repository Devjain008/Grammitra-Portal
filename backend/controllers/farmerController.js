import { getCurrentWeather, getForecast, getWeatherByCity } from '../services/weatherService.js';

// @desc    Get current weather and farming alerts for a specific location
// @route   GET /api/farmer/weather
export const getVillageWeather = async (req, res) => {
  try {
    const { lat, lon, village } = req.query;
    let weatherData;

    // Fetch by coordinates if GPS is available, otherwise fallback to village name
    if (lat && lon) {
      weatherData = await getCurrentWeather(lat, lon);
    } else if (village) {
      weatherData = await getWeatherByCity(village);
    } else {
      return res.status(400).json({ message: "Please provide lat/lon or village name." });
    }

    // Process OpenWeather data to generate rural-friendly alerts
    const tempCelsius = weatherData.main.temp;
    const isRaining = weatherData.weather.some(w => w.main.toLowerCase() === 'rain');
    
    let farmingAlert = "Weather is normal. Good time for regular field activities.";
    if (tempCelsius > 40) {
      farmingAlert = "Heatwave Alert: Ensure adequate watering for crops. Avoid field work during peak afternoon hours.";
    } else if (isRaining) {
      farmingAlert = "Rain Alert: Halt pesticide spraying. Protect harvested crops.";
    }

    res.status(200).json({
      location: weatherData.name,
      temperature: tempCelsius,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
      condition: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      farmingAlert
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch weather data. " + error.message });
  }
};