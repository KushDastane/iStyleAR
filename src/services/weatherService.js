// src/services/weatherService.js

/**
 * Gets current weather based on coordinates using Open-Meteo (Free, No API Key needed)
 * and BigDataCloud for Reverse Geocoding.
 */
export const getCurrentWeather = async (lat, lon) => {
  try {
    // 1. Fetch Weather Data (Open-Meteo)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error("Weather API failed");
    const weatherData = await weatherRes.json();

    // 2. Fetch City Name (BigDataCloud Reverse Geocoding - Free)
    const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    let locationName = "Current Location";
    try {
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        locationName = geoData.city || geoData.locality || geoData.principalSubdivision || "Current Location";
      }
    } catch (e) {
      console.warn("Could not fetch location name, using fallback");
    }

    return normalizeMeteoData(weatherData.current, locationName);
  } catch (err) {
    console.error("Error fetching weather:", err);
    throw err;
  }
};

const mapWmoCode = (code) => {
  // Maps WMO codes to conditions, descriptions, and OpenWeatherMap icon codes
  if (code === 0) return { main: "Clear", desc: "clear sky", icon: "01d" };
  if (code === 1) return { main: "Clear", desc: "mainly clear", icon: "02d" };
  if (code === 2) return { main: "Clouds", desc: "partly cloudy", icon: "03d" };
  if (code === 3) return { main: "Clouds", desc: "overcast", icon: "04d" };
  if (code === 45 || code === 48) return { main: "Fog", desc: "fog", icon: "50d" };
  if (code >= 51 && code <= 57) return { main: "Drizzle", desc: "drizzle", icon: "09d" };
  if (code >= 61 && code <= 67) return { main: "Rain", desc: "rain", icon: "10d" };
  if (code >= 71 && code <= 77) return { main: "Snow", desc: "snow", icon: "13d" };
  if (code >= 80 && code <= 82) return { main: "Rain", desc: "rain showers", icon: "09d" };
  if (code >= 85 && code <= 86) return { main: "Snow", desc: "snow showers", icon: "13d" };
  if (code >= 95) return { main: "Thunderstorm", desc: "thunderstorm", icon: "11d" };
  
  return { main: "Unknown", desc: "unknown", icon: "02d" };
};

const normalizeMeteoData = (current, locationName) => {
  const mappedWeather = mapWmoCode(current.weather_code);
  
  return {
    temperatureC: Math.round(current.temperature_2m),
    feelsLikeC: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    precipitationProbability: current.precipitation > 0 ? 100 : 0, // Simplified
    rainfall: current.precipitation,
    windSpeed: current.wind_speed_10m,
    weatherCondition: mappedWeather.main,
    weatherDescription: mappedWeather.desc,
    icon: mappedWeather.icon,
    location: locationName,
    timestamp: new Date().getTime(),
  };
};

export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};
