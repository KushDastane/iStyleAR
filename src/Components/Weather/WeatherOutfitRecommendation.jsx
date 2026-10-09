import React from "react";
import { FaTshirt, FaCheck, FaTimes, FaInfoCircle, FaStar } from "react-icons/fa";

const categoryImages = {
  "t-shirt": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
  "shirt": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
  "polo": "https://images.unsplash.com/photo-1586363104862-3a5e222ee4ea?w=400&q=80",
  "shorts": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&q=80",
  "tank top": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80",
  "light t-shirt": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80",
  "jacket": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80",
  "coat": "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400&q=80",
  "sweater": "https://images.unsplash.com/photo-1614975059251-992f11792b9f?w=400&q=80",
  "hoodie": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80",
  "cardigan": "https://images.unsplash.com/photo-1434389678232-0670d9ce66e9?w=400&q=80",
  "raincoat": "https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=400&q=80",
  "waterproof jacket": "https://images.unsplash.com/photo-1542272604-780c968509ef?w=400&q=80",
  "long-sleeve": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&q=80"
};

export default function WeatherOutfitRecommendation({ recommendation }) {
  if (!recommendation || recommendation.recommendedItems.length === 0) {
    const categories = recommendation?.recommendedCategories || [];
    const displayImages = categories
      .map(c => categoryImages[c.toLowerCase()])
      .filter(Boolean)
      .slice(0, 3); // max 3 preview images

    return (
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl shadow-lg border border-slate-700/50 p-6 h-full flex flex-col relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-2 mb-2 relative z-10">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <FaStar className="text-indigo-400" />
          </div>
          <h3 className="font-semibold text-white tracking-wide">Weather Intelligence</h3>
        </div>
        <p className="text-indigo-200/80 text-sm mb-5 relative z-10">{recommendation?.explanation || "Add items to your wardrobe for personalized recommendations!"}</p>
        
        {displayImages.length > 0 && (
          <div className="flex gap-3 mb-6 relative z-10">
            {displayImages.map((img, idx) => (
              <img key={idx} src={img} alt="Suggested clothing" className="w-16 h-16 rounded-xl object-cover border border-white/10 shadow-md" />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4 relative z-10 mt-auto">
          {categories.length > 0 && (
            <div>
               <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-2">Ideal Clothing Types</p>
               <div className="flex flex-wrap gap-2">
                 {categories.map((c, i) => (
                   <span key={i} className="bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10">
                     {c}
                   </span>
                 ))}
               </div>
            </div>
          )}

          {recommendation?.recommendedFabrics && recommendation.recommendedFabrics.length > 0 && (
             <div>
                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-2">Suggested Fabrics</p>
                <div className="flex flex-wrap gap-2">
                  {recommendation.recommendedFabrics.map((f, i) => (
                    <span key={i} className="bg-indigo-500/20 text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium capitalize border border-indigo-500/30">
                      {f}
                    </span>
                  ))}
                </div>
             </div>
          )}
        </div>
      </div>
    );
  }

  const topItem = recommendation.recommendedItems[0];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl shadow-lg border border-slate-700/50 p-6 h-full flex flex-col relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
           <FaCheck className="text-emerald-400" />
        </div>
        <h3 className="font-semibold text-white tracking-wide text-lg">Today's Smart Pick</h3>
      </div>
      
      <p className="text-indigo-200/80 text-sm mb-5 relative z-10">{recommendation.explanation}</p>

      <div className="flex gap-4 items-center bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 mb-4 relative z-10 shadow-inner">
        <img src={topItem.imageUrl} alt={topItem.name} className="w-24 h-24 object-cover rounded-xl shadow-lg border border-white/20" />
        <div>
          <h4 className="font-bold text-white text-lg">{topItem.name}</h4>
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mt-1 bg-emerald-500/10 px-2 py-1 rounded-md w-fit">
            <FaCheck /> {topItem.weatherScore}% Match
          </div>
          <p className="text-indigo-200/70 text-xs mt-2 line-clamp-2 leading-relaxed">{topItem.weatherReasons[0]}</p>
        </div>
      </div>
      
      {recommendation.recommendedFabrics.length > 0 && (
         <div className="mt-auto relative z-10">
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-2">Suggested Fabrics</p>
            <div className="flex flex-wrap gap-2">
              {recommendation.recommendedFabrics.map((f, i) => (
                <span key={i} className="bg-indigo-500/20 text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium capitalize border border-indigo-500/30">
                  {f}
                </span>
              ))}
            </div>
         </div>
      )}
    </div>
  );
}
