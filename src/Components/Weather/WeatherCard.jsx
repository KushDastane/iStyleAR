import React from "react";
import { FaCloudSun, FaTint, FaWind, FaUmbrella } from "react-icons/fa";

export default function WeatherCard({ weather, loading, error }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
        <FaCloudSun className="text-gray-300 text-4xl mb-3" />
        <p className="text-gray-500 text-sm">Weather intelligence unavailable.</p>
        <p className="text-gray-400 text-xs mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl shadow-lg p-6 text-white relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 right-0 p-4 opacity-50">
         {weather.icon && <img src={`http://openweathermap.org/img/wn/${weather.icon}@4x.png`} alt="weather icon" className="w-24 h-24 drop-shadow-lg" />}
      </div>
      
      <div className="relative z-10">
        <p className="text-blue-100 font-medium text-sm mb-1 uppercase tracking-wider">📍 {weather.location}</p>
        <div className="flex items-end gap-3 mb-4">
          <h2 className="text-5xl font-extrabold">{weather.temperatureC}°</h2>
          <p className="text-blue-200 font-medium pb-1 text-lg capitalize">{weather.weatherDescription}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-blue-200 text-xs font-semibold uppercase">
              <FaTint /> Humidity
            </div>
            <span className="font-bold">{weather.humidity}%</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-blue-200 text-xs font-semibold uppercase">
              <FaWind /> Wind
            </div>
            <span className="font-bold">{weather.windSpeed} m/s</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-blue-200 text-xs font-semibold uppercase">
              <FaUmbrella /> Rain
            </div>
            <span className="font-bold">{weather.precipitationProbability}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
