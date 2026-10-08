// src/data/climateRules.js

export const climateRules = [
  {
    condition: (weather) => weather.temperatureC < 10,
    recommend: {
      fabrics: ["Wool", "Fleece", "Thermal", "Heavy Cotton"],
      layering: "Heavy layering recommended",
      categories: ["Jacket", "Coat", "Sweater", "Hoodie"],
    },
    avoid: ["Linen", "Shorts", "Lightweight blends"],
    message: "Cold weather ahead! Bundle up with warm, heavy fabrics.",
  },
  {
    condition: (weather) => weather.temperatureC >= 10 && weather.temperatureC < 18,
    recommend: {
      fabrics: ["Cotton", "Denim", "Light Wool", "Polyester Blends"],
      layering: "Light layering",
      categories: ["Hoodie", "Long-sleeve", "Jacket", "Cardigan"],
    },
    avoid: ["Heavy Winter Coats", "Linen"],
    message: "Mild temperatures. Perfect for light layers and denim.",
  },
  {
    condition: (weather) => weather.temperatureC >= 18 && weather.temperatureC < 26,
    recommend: {
      fabrics: ["Cotton", "Linen", "Light Blends"],
      layering: "Single layer",
      categories: ["T-Shirt", "Shirt", "Polo"],
    },
    avoid: ["Heavy Wool", "Fleece", "Thermal"],
    message: "Pleasant and warm! Breathable cotton and light blends work best.",
  },
  {
    condition: (weather) => weather.temperatureC >= 26 && weather.temperatureC < 32,
    recommend: {
      fabrics: ["Cotton", "Linen", "Rayon", "Breathable synthetics"],
      layering: "Minimal",
      categories: ["T-Shirt", "Shorts", "Tank Top"],
    },
    avoid: ["Wool", "Leather", "Heavy Denim", "Fleece"],
    message: "It's getting hot! Go for lightweight, breathable fabrics.",
  },
  {
    condition: (weather) => weather.temperatureC >= 32,
    recommend: {
      fabrics: ["Linen", "Lightweight Cotton", "Moisture-wicking synthetics", "Rayon"],
      layering: "None",
      categories: ["Tank Top", "Shorts", "Light T-Shirt"],
    },
    avoid: ["Polyester", "Wool", "Denim", "Leather"],
    message: "Very hot weather. Loose-fitting and moisture-wicking fabrics are ideal.",
  }
];

export const humidityRules = [
  {
    condition: (weather) => weather.humidity > 70 && weather.temperatureC > 22,
    recommend: {
      fabrics: ["Linen", "Moisture-wicking synthetics", "Light Rayon"],
    },
    avoid: ["Heavy Cotton", "Polyester"],
    message: "High humidity! Pick clothes that don't trap moisture.",
  }
];

export const precipitationRules = [
  {
    condition: (weather) => weather.precipitationProbability > 50 || weather.weatherCondition?.toLowerCase().includes("rain"),
    recommend: {
      fabrics: ["Water-resistant synthetics", "Nylon", "Quick-dry blends"],
      categories: ["Raincoat", "Waterproof Jacket"],
    },
    avoid: ["Suede", "Heavy Wool", "Leather"],
    message: "Rain is likely! A water-resistant outer layer is recommended.",
  }
];
