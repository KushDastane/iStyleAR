// src/services/sizeRecommendationService.js
import { brandSizeCharts } from "../data/sizeCharts";

/**
 * Calculates a fit score based on differences.
 * @param {number} userVal 
 * @param {number} min 
 * @param {number} max 
 * @returns {number} score between 0 and 100
 */
const calculateDimensionScore = (userVal, min, max) => {
  if (!userVal || !min || !max) return 0;
  
  const mid = (min + max) / 2;
  const tolerance = (max - min) * 1.5; // Acceptable range before score drops sharply
  
  const diff = Math.abs(userVal - mid);
  if (diff <= (max - min) / 2) return 100; // Inside the range perfectly
  
  // Linear drop-off outside the range
  const score = Math.max(0, 100 - ((diff - (max - min) / 2) / tolerance) * 100);
  return score;
};

/**
 * Recommend size based on body profile and pose estimation
 */
export const getFitRecommendation = (bodyProfile, poseFeatures, clothingItem) => {
  if (!clothingItem) return null;

  const brand = clothingItem.brand || "Generic";
  const category = clothingItem.category || "T-Shirt";
  const preferredFit = bodyProfile?.preferredFit || "regular";
  
  // Use generic chart if brand/category missing
  let chart = brandSizeCharts[brand]?.[category] || brandSizeCharts["Generic"]?.[category] || brandSizeCharts["Generic"]["T-Shirt"];
  
  if (!chart) return null; // No chart available at all
  
  // Determine effective measurements
  // Priority: 1. Manual Profile, 2. Pose Estimated
  // We assume poseFeatures provides normalized or calibrated CM estimates if possible.
  // For now, we will rely mostly on profile or simulated pose scaling.
  let chest = bodyProfile?.chest || poseFeatures?.estimatedChest || 98; // Fallback to avg M
  let waist = bodyProfile?.waist || poseFeatures?.estimatedWaist || 82; 
  let shoulder = bodyProfile?.shoulder || poseFeatures?.estimatedShoulder || 42;
  
  const sizeScores = [];
  
  for (const [sizeName, dims] of Object.entries(chart)) {
    let chestScore = calculateDimensionScore(chest, dims.chestMin, dims.chestMax);
    let waistScore = calculateDimensionScore(waist, dims.waistMin, dims.waistMax);
    let shoulderScore = calculateDimensionScore(shoulder, dims.shoulderMin, dims.shoulderMax);
    
    // Weighted average
    let baseScore = (chestScore * 0.5) + (shoulderScore * 0.3) + (waistScore * 0.2);
    
    // Adjust based on preferred fit
    if (preferredFit === "oversized") {
      // If user wants oversized, the next size up gets a boost.
      // This is a naive implementation: we just shift preferences.
      // A better way is to check if user measurements are near the min of the size.
      if (chest < dims.chestMin) {
        baseScore += 10; // Boost score if this size is larger than user
      }
    } else if (preferredFit === "slim") {
      if (chest > (dims.chestMin + dims.chestMax) / 2) {
        baseScore += 10; // Boost if this size is tighter
      }
    }
    
    // Normalize to 100
    baseScore = Math.min(100, Math.max(0, baseScore));
    
    sizeScores.push({
      size: sizeName,
      score: Math.round(baseScore)
    });
  }
  
  sizeScores.sort((a, b) => b.score - a.score);
  
  if (sizeScores.length === 0) return null;
  
  const bestFit = sizeScores[0];
  
  // Generate reason
  let reason = "Your body proportions match this size well.";
  if (preferredFit === "oversized") {
    reason = "Recommended for a comfortable, oversized fit based on your measurements.";
  } else if (preferredFit === "slim") {
    reason = "Recommended for a sleek, slim fit based on your measurements.";
  }
  
  return {
    recommendedSize: bestFit.size,
    confidence: bestFit.score,
    fitScore: bestFit.score,
    alternatives: sizeScores.slice(1, 3),
    explanation: reason,
    brand: brand,
    category: category,
  };
};

export const saveFitFeedback = async (db, uid, feedbackData) => {
  // Save feedback loop to Firestore
  // feedbackData: { itemId, brand, category, recommendedSize, actualSize, feedback, timestamp }
  try {
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
    await addDoc(collection(db, "users", uid, "fitFeedback"), {
      ...feedbackData,
      timestamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error saving fit feedback:", error);
    return false;
  }
};
