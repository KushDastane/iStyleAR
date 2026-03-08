import React, { useState, useEffect } from "react";
import { GiCelebrationFire } from "react-icons/gi";
import {
  FaTrophy,
  FaStar,
  FaFire,
  FaCalendarAlt,
  FaPlus,
  FaMedal,
  FaChartLine,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { db } from "../../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

export default function Achievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAdds, setTotalAdds] = useState(0);
  const [animateStats, setAnimateStats] = useState(false);

  const getBadge = (adds) => {
    if (adds >= 21)
      return {
        name: "Superstar",
        icon: FaTrophy,
        color: "text-yellow-500",
        bgGradient: "from-yellow-400 to-orange-500",
        borderColor: "border-yellow-400",
      };
    if (adds >= 6)
      return {
        name: "Trending Star",
        icon: FaFire,
        color: "text-pink-500",
        bgGradient: "from-pink-400 to-rose-500",
        borderColor: "border-pink-400",
      };
    if (adds >= 1)
      return {
        name: "Rising Star",
        icon: FaStar,
        color: "text-blue-500",
        bgGradient: "from-blue-400 to-indigo-500",
        borderColor: "border-blue-400",
      };
    return null;
  };

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const allUsersSnap = await getDocs(collection(db, "users"));
      const statsMap = {};
      let total = 0;

      for (const userDoc of allUsersSnap.docs) {
        const wardrobeSnap = await getDocs(
          collection(db, "users", userDoc.id, "wardrobe")
        );

        wardrobeSnap.forEach((wardrobeDoc) => {
          const data = wardrobeDoc.data();
          const uploaderId = data.uploaderId;

          if (!uploaderId || uploaderId !== user.uid) return;

          const key = data.itemId || data.imageUrl;
          if (!key) return;

          if (!statsMap[key]) {
            statsMap[key] = {
              id: key,
              name: data.name || "Unnamed Outfit",
              imageUrl: data.imageUrl,
              adds: 0,
              firstAppeared: null,
            };
          }

          statsMap[key].adds += 1;
          total += 1;

          const addedDate = data.addedAt?.toDate?.();
          if (
            addedDate &&
            (!statsMap[key].firstAppeared ||
              addedDate < statsMap[key].firstAppeared)
          ) {
            statsMap[key].firstAppeared = addedDate;
          }
        });
      }

      const achievementList = Object.values(statsMap)
        .map((item) => ({
          ...item,
          badge: getBadge(item.adds),
        }))
        .sort((a, b) => b.adds - a.adds);

      setAchievements(achievementList);
      setTotalAdds(total);
      setTimeout(() => setAnimateStats(true), 100);
    } catch (err) {
      console.error("Failed to fetch achievements:", err);
      toast.error("Failed to load achievements");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user]);

  const stats = [
    {
      label: "Total Adds",
      value: totalAdds,
      icon: FaPlus,
      color: "from-indigo-500 to-purple-600",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      label: "Achievements",
      value: achievements.length,
      icon: FaMedal,
      color: "from-amber-500 to-orange-600",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      label: "Top Item",
      value: achievements[0]?.adds || 0,
      icon: FaChartLine,
      color: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* Icon container (clean + modern + consistent with wardrobe) */}
          <div
            className="w-20 h-20 mx-auto mb-6 flex items-center justify-center 
                  bg-white/80 backdrop-blur-sm shadow-md rounded-3xl"
          >
            <FaTrophy className="text-yellow-500 text-4xl" />
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
            My Achievements
          </h1>

          {/* Subtext */}
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Celebrate your trending successes! Track how your costumes inspire
            others.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 transform hover:-translate-y-2 ${animateStats
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
                }`}
              style={{
                transitionDelay: `${index * 100}ms`,
                transition: "all 0.5s ease-out",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.label}
                  </p>
                  <p
                    className="text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    }}
                  >
                    <span
                      className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                    >
                      {stat.value}
                    </span>
                  </p>
                </div>
                <div className={`${stat.iconBg} p-4 rounded-2xl`}>
                  <stat.icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Achievements Grid */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-32">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">
              Loading achievements...
            </p>
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl shadow-lg">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
              <FaStar className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              No achievements yet
            </h3>
            <p className="text-gray-500 text-base max-w-md mx-auto">
              Upload your first costume and watch it trend to earn your first
              badge!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {achievements.map((achievement, index) => (
              <div
                key={achievement.id}
                className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: animateStats
                    ? "fadeInUp 0.6s ease-out forwards"
                    : "none",
                }}
              >
                {/* Image Container with Overlay */}
                <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <img
                    src={achievement.imageUrl}
                    alt={achievement.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Badge Overlay */}
                  {achievement.badge && (
                    <>
                      {/* Celebration Icon */}
                      <div className="absolute top-4 left-4 text-4xl animate-pulse">
                        🎉
                      </div>

                      {/* Badge Icon */}
                      <div
                        className={`absolute top-4 right-4 bg-white rounded-2xl p-3 shadow-xl border-2 ${achievement.badge.borderColor} transform group-hover:scale-110 transition-transform duration-300`}
                      >
                        <achievement.badge.icon
                          className={`w-6 h-6 ${achievement.badge.color}`}
                        />
                      </div>

                      {/* Badge Name Banner */}
                      <div
                        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-r ${achievement.badge.bgGradient} py-2 px-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300`}
                      >
                        <p className="text-white font-bold text-center text-sm">
                          {achievement.badge.name}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-bold text-xl text-gray-800 mb-4 line-clamp-2">
                    {achievement.name}
                  </h3>

                  <div className="space-y-3">
                    {/* Adds Count */}
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <div className="bg-green-500 p-2 rounded-lg">
                        <FaPlus className="text-white w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 font-medium">
                          Total Adds
                        </p>
                        <p className="text-lg font-bold text-gray-800">
                          {achievement.adds}
                        </p>
                      </div>
                    </div>

                    {/* First Appeared */}
                    {achievement.firstAppeared && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <FaCalendarAlt className="text-blue-600 w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            First Appeared
                          </p>
                          <p className="font-semibold text-gray-700">
                            {achievement.firstAppeared.toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Badge Legend */}
        <div className="mt-16 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl">
              <FaMedal className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Badge Levels</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-400">
              <div className="bg-blue-100 p-4 rounded-2xl">
                <FaStar className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">Rising Star</p>
                <p className="text-sm text-gray-600 font-medium">1–5 adds</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-pink-400">
              <div className="bg-pink-100 p-4 rounded-2xl">
                <FaFire className="w-8 h-8 text-pink-500" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">Trending Star</p>
                <p className="text-sm text-gray-600 font-medium">6–20 adds</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-yellow-400">
              <div className="bg-yellow-100 p-4 rounded-2xl">
                <FaTrophy className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">Superstar</p>
                <p className="text-sm text-gray-600 font-medium">21+ adds</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
