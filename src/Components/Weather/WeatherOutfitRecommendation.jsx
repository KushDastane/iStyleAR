import React from "react";
import { FaTshirt, FaCheck, FaTimes, FaInfoCircle } from "react-icons/fa";

export default function WeatherOutfitRecommendation({ recommendation }) {
  if (!recommendation || recommendation.recommendedItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <FaInfoCircle className="text-blue-500" />
          <h3 className="font-semibold text-gray-800">Weather Intelligence</h3>
        </div>
        <p className="text-gray-600 text-sm mb-4">{recommendation?.explanation}</p>
        
        {recommendation?.recommendedCategories && recommendation.recommendedCategories.length > 0 && (
          <div className="mb-3">
             <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Ideal Clothing Types</p>
             <div className="flex flex-wrap gap-2">
               {recommendation.recommendedCategories.map((c, i) => (
                 <span key={i} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-medium border border-indigo-100">
                   {c}
                 </span>
               ))}
             </div>
          </div>
        )}

        {recommendation?.recommendedFabrics && recommendation.recommendedFabrics.length > 0 && (
           <div className="mt-auto">
              <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Suggested Fabrics</p>
              <div className="flex flex-wrap gap-2">
                {recommendation.recommendedFabrics.map((f, i) => (
                  <span key={i} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium capitalize border border-blue-100">
                    {f}
                  </span>
                ))}
              </div>
           </div>
        )}
        
        {(!recommendation?.recommendedCategories?.length && !recommendation?.recommendedFabrics?.length) && (
           <p className="text-gray-500 text-sm mt-2">Add more items to your wardrobe for weather-based recommendations!</p>
        )}
      </div>
    );
  }

  const topItem = recommendation.recommendedItems[0];
  const otherItems = recommendation.recommendedItems.slice(1, 4);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <FaInfoCircle className="text-indigo-500" />
        <h3 className="font-semibold text-gray-900 text-lg">Today's Smart Pick</h3>
      </div>
      
      <p className="text-gray-600 text-sm mb-5">{recommendation.explanation}</p>

      <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 mb-4">
        <img src={topItem.imageUrl} alt={topItem.name} className="w-20 h-20 object-cover rounded-xl shadow-sm" />
        <div>
          <h4 className="font-bold text-gray-900">{topItem.name}</h4>
          <div className="flex items-center gap-1 text-green-600 text-xs font-semibold mt-1">
            <FaCheck /> {topItem.weatherScore}% Match
          </div>
          <p className="text-gray-500 text-xs mt-1 line-clamp-1">{topItem.weatherReasons[0]}</p>
        </div>
      </div>
      
      {recommendation.recommendedFabrics.length > 0 && (
         <div className="mt-auto">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Suggested Fabrics</p>
            <div className="flex flex-wrap gap-2">
              {recommendation.recommendedFabrics.map((f, i) => (
                <span key={i} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium capitalize border border-blue-100">
                  {f}
                </span>
              ))}
            </div>
         </div>
      )}
    </div>
  );
}
