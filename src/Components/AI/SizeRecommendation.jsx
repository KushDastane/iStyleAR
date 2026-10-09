import React from "react";
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaRuler } from "react-icons/fa";

export default function SizeRecommendation({ recommendation, selectedSize, isLiveTracking, onOpenProfile }) {
  if (!recommendation) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow border border-gray-100 flex flex-col items-center justify-center text-center gap-3">
        <FaRuler className="text-gray-400 text-3xl" />
        <h4 className="text-gray-800 font-semibold">AI Size Recommendation</h4>
        <p className="text-gray-500 text-sm">Update your body profile to get personalized size recommendations.</p>
        <button 
          onClick={onOpenProfile}
          className="px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold mt-2 hover:bg-gray-800 transition"
        >
          Update Profile
        </button>
      </div>
    );
  }

  const { recommendedSize, allScores, explanation, brand, category } = recommendation;
  
  // Find the score for the currently selected size
  const selectedScoreObj = allScores?.find(s => s.size === selectedSize);
  const confidence = selectedScoreObj ? selectedScoreObj.score : 0;
  
  let confidenceColor = "text-green-600";
  let confidenceBg = "bg-green-100";
  let sizeFeedback = "Perfect Match";
  
  const sizeOrder = ["S", "M", "L", "XL", "XXL"];
  const selectedIdx = sizeOrder.indexOf(selectedSize);
  const recIdx = sizeOrder.indexOf(recommendedSize);

  if (confidence < 70) {
    confidenceColor = "text-yellow-600";
    confidenceBg = "bg-yellow-100";
    if (selectedIdx === recIdx) {
      sizeFeedback = "Closest Match";
    } else {
      sizeFeedback = selectedIdx > recIdx ? "Slightly Loose" : "Slightly Tight";
    }
  }
  if (confidence < 40) {
    confidenceColor = "text-red-600";
    confidenceBg = "bg-red-100";
    if (selectedIdx === recIdx) {
      sizeFeedback = "Poor Fit";
    } else {
      sizeFeedback = selectedIdx > recIdx ? "Too Large" : "Too Small";
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <FaRuler className="text-6xl" />
      </div>
      
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h3 className="text-gray-800 font-bold text-lg">AI Size Match</h3>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Beta</span>
        </div>
        {isLiveTracking && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-lg border border-green-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Live Scan Active</span>
          </div>
        )}
      </div>
      <p className="text-gray-500 text-xs mb-4">{brand} • {category}</p>

      <div className="flex items-end gap-4 mb-4">
        <div className="flex flex-col items-center justify-center bg-black text-white w-16 h-16 rounded-2xl shadow-md transition-transform scale-105">
          <span className="text-2xl font-bold">{selectedSize}</span>
        </div>
        <div className="pb-1 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-sm font-bold ${confidenceColor} ${confidenceBg} px-2.5 py-1 rounded-lg transition-colors`}>
              {confidence}% Match
            </span>
            <span className={`text-xs font-semibold ${confidenceColor}`}>{sizeFeedback}</span>
          </div>
          <p className="text-gray-600 text-sm font-medium leading-tight">
            {selectedSize === recommendedSize 
              ? (confidence < 70 
                  ? `This is the closest match, but it may not fit perfectly based on your ${isLiveTracking ? 'live scan.' : 'measurements.'}`
                  : (isLiveTracking ? "Perfect fit based on your live camera body scan." : explanation))
              : `You selected ${selectedSize}. We recommend ${recommendedSize} for the best fit based on your ${isLiveTracking ? 'live scan' : 'measurements'}.`}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={onOpenProfile}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-xl text-sm font-semibold transition"
        >
          Edit My Measurements
        </button>
      </div>
    </div>
  );
}
