import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentWeather, getUserLocation } from "../services/weatherService";

const WeatherContext = createContext();

export const WeatherProvider = ({ children }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const { lat, lon } = await getUserLocation();
      const data = await getCurrentWeather(lat, lon);
      setWeather(data);
    } catch (err) {
      console.error("Failed to fetch weather:", err);
      setError(err.message || "Failed to get weather data");
      
      // Fallback if no location permission
      try {
          console.log("Attempting fallback weather for New York...");
          // Fallback to New York coordinates if permission denied
          const data = await getCurrentWeather(40.7128, -74.0060);
          if (data) {
              setWeather(data);
              setError("Using default location (Location permission denied)");
          }
      } catch (e) {
          console.error("Fallback also failed", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // Refresh weather every hour
    const interval = setInterval(fetchWeather, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <WeatherContext.Provider value={{ weather, loading, error, refreshWeather: fetchWeather }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => useContext(WeatherContext);
