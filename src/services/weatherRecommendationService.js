// src/services/weatherRecommendationService.js
import { climateRules, humidityRules, precipitationRules } from "../data/climateRules";

export const getOutfitRecommendation = (weather, wardrobeItems) => {
  if (!weather || !wardrobeItems || wardrobeItems.length === 0) {
    return {
      recommendedItems: [],
      recommendedFabrics: [],
      avoidItems: [],
      explanation: "",
      score: 0
    };
  }

  // 1. Gather rules that apply
  const appliedClimateRules = climateRules.filter(r => r.condition(weather));
  const appliedHumidityRules = humidityRules.filter(r => r.condition(weather));
  const appliedPrecipRules = precipitationRules.filter(r => r.condition(weather));

  const allRules = [...appliedClimateRules, ...appliedHumidityRules, ...appliedPrecipRules];
  
  if (allRules.length === 0) {
    return {
      recommendedItems: wardrobeItems, // fallback
      recommendedFabrics: [],
      avoidItems: [],
      explanation: "Enjoy your day! Wear whatever makes you comfortable.",
      score: 100
    };
  }

  // 2. Aggregate recommendations and avoids
  const recommendedFabrics = new Set();
  const recommendedCategories = new Set();
  const avoidList = new Set();
  let explanation = allRules.map(r => r.message).join(" ");

  allRules.forEach(rule => {
    rule.recommend?.fabrics?.forEach(f => recommendedFabrics.add(f.toLowerCase()));
    rule.recommend?.categories?.forEach(c => recommendedCategories.add(c.toLowerCase()));
    rule.avoid?.forEach(a => avoidList.add(a.toLowerCase()));
  });

  // 3. Score wardrobe items
  const scoredItems = wardrobeItems.map(item => {
    let score = 50; // base score
    let reasons = [];
    
    // Naive matching based on name (since we might not have rich metadata yet)
    const itemName = (item.name || "").toLowerCase();
    const itemCategory = (item.category || "").toLowerCase();
    const itemFabric = (item.fabric || "").toLowerCase();
    
    // Check avoids
    for (const a of avoidList) {
      if (itemName.includes(a) || itemCategory.includes(a) || itemFabric.includes(a)) {
        score -= 40;
        reasons.push(`Contains ${a}, which is not ideal today.`);
      }
    }
    
    // Check recommends
    for (const f of recommendedFabrics) {
      if (itemName.includes(f) || itemFabric.includes(f)) {
        score += 30;
        reasons.push(`Contains recommended fabric: ${f}.`);
      }
    }
    
    for (const c of recommendedCategories) {
      if (itemName.includes(c) || itemCategory.includes(c)) {
        score += 20;
        reasons.push(`Matches recommended category: ${c}.`);
      }
    }
    
    // Normalize score
    score = Math.max(0, Math.min(100, score));

    return {
      ...item,
      weatherScore: score,
      weatherReasons: reasons
    };
  });

  scoredItems.sort((a, b) => b.weatherScore - a.weatherScore);

  const recommendedItems = scoredItems.filter(i => i.weatherScore >= 60);
  const avoidItems = scoredItems.filter(i => i.weatherScore < 40);

  return {
    recommendedItems,
    recommendedFabrics: Array.from(recommendedFabrics),
    recommendedCategories: Array.from(recommendedCategories),
    avoidItems,
    explanation,
    score: recommendedItems.length > 0 ? recommendedItems[0].weatherScore : 50
  };
};

export const checkItemWeatherSuitability = (item, weather) => {
  if (!weather || !item) return null;
  const recommendation = getOutfitRecommendation(weather, [item]);
  const scoredItem = recommendation.recommendedItems.length > 0 
                      ? recommendation.recommendedItems[0] 
                      : recommendation.avoidItems[0];
  
  if (!scoredItem) return { isSuitable: true, message: "Suitable for today." };
  
  if (scoredItem.weatherScore >= 60) {
    return { isSuitable: true, message: "Great for today's weather! " + (scoredItem.weatherReasons[0] || "") };
  } else if (scoredItem.weatherScore < 40) {
    return { isSuitable: false, message: "Not ideal for today's weather. " + (scoredItem.weatherReasons[0] || "") };
  } else {
    return { isSuitable: true, message: "Okay for today's weather." };
  }
};
