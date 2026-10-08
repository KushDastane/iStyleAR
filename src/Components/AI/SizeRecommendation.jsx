import React from "react";
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaRuler } from "react-icons/fa";

export default function SizeRecommendation({ recommendation, onOpenProfile }) {
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

  const { recommendedSize, confidence, explanation, brand, category } = recommendation;
  
  let confidenceColor = "text-green-600";
  let confidenceBg = "bg-green-100";
  if (confidence < 70) {
    confidenceColor = "text-yellow-600";
    confidenceBg = "bg-yellow-100";
  }
  if (confidence < 40) {
    confidenceColor = "text-red-600";
    confidenceBg = "bg-red-100";
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <FaRuler className="text-6xl" />
      </div>
      
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-gray-800 font-bold text-lg">AI Size Match</h3>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Beta</span>
      </div>
      <p className="text-gray-500 text-xs mb-4">{brand} • {category}</p>

      <div className="flex items-end gap-4 mb-4">
        <div className="flex flex-col items-center justify-center bg-black text-white w-16 h-16 rounded-2xl shadow-md">
          <span className="text-2xl font-bold">{recommendedSize}</span>
        </div>
        <div className="pb-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-sm font-bold ${confidenceColor} ${confidenceBg} px-2.5 py-1 rounded-lg`}>
              {confidence}% Match
            </span>
          </div>
          <p className="text-gray-600 text-sm font-medium">{explanation}</p>
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
