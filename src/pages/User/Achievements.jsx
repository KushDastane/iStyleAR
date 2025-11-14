import React, { useState, useEffect } from "react";
import { GiCelebrationFire } from "react-icons/gi";
import {
  FaTrophy,
  FaStar,
  FaFire,
  FaCalendarAlt,
  FaPlus,
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

  const getBadge = (adds) => {
    if (adds >= 21)
      return { name: "Superstar", icon: FaTrophy, color: "text-yellow-500" };
    if (adds >= 6)
      return { name: "Trending Star", icon: FaFire, color: "text-pink-500" };
    if (adds >= 1)
      return { name: "Rising Star", icon: FaStar, color: "text-blue-500" };
    return null;
  };

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // 🔥 Core idea:
      // Look at EVERY user’s wardrobe and count items
      // where uploaderId === current logged-in user.
      const allUsersSnap = await getDocs(collection(db, "users"));

      // key: itemId (or fallback imageUrl) → stats
      const statsMap = {};
      let total = 0;

      for (const userDoc of allUsersSnap.docs) {
        const wardrobeSnap = await getDocs(
          collection(db, "users", userDoc.id, "wardrobe")
        );

        wardrobeSnap.forEach((wardrobeDoc) => {
          const data = wardrobeDoc.data();
          const uploaderId = data.uploaderId;

          // We only care about outfits that YOU uploaded
          if (!uploaderId || uploaderId !== user.uid) return;

          // Prefer itemId, else fall back to imageUrl as key
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

      // Turn map → array and add badges
      const achievementList = Object.values(statsMap)
        .map((item) => ({
          ...item,
          badge: getBadge(item.adds),
        }))
        .sort((a, b) => b.adds - a.adds); // highest first

      setAchievements(achievementList);
      setTotalAdds(total);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center justify-center gap-2 mb-2">
            <FaTrophy className="text-yellow-500" />
            My Achievements
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Celebrate your trending successes! See how many times your costumes
            have been added by others.
          </p>
          <div className="mt-4 bg-white rounded-lg shadow-md p-4 inline-block">
            <p className="text-lg font-semibold text-gray-800">
              Total Adds: <span className="text-indigo-600">{totalAdds}</span>
            </p>
          </div>
        </div>

        {/* Achievements List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-4 text-gray-600">Loading achievements...</span>
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-20">
            <FaStar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No achievements yet.</p>
            <p className="text-gray-400 text-sm">
              Upload costumes and get them trending to earn badges!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 overflow-hidden"
              >
                {/* Costume Image */}
                <div className="relative w-full h-48">
                  <img
                    src={achievement.imageUrl}
                    alt={achievement.name}
                    className="w-full h-48 object-cover"
                  />
                  {/* Celebration Overlay */}
                  {achievement.badge && (
                    <div
                      className={`absolute text-4xl top-2 left-2  ${achievement.badge.color}`}
                    >
                      🎉
                    </div>
                  )}
                  {/* Badge Overlay */}
                  {achievement.badge && (
                    <div
                      className={`absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md ${achievement.badge.color}`}
                    >
                      <achievement.badge.icon className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {achievement.name}
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaPlus className="text-green-500" />
                      <span>
                        Added {achievement.adds} time
                        {achievement.adds !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {achievement.firstAppeared && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaCalendarAlt className="text-blue-500" />
                        <span>
                          First appeared:{" "}
                          {achievement.firstAppeared.toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {achievement.badge && (
                      <div className="flex items-center gap-2 text-sm">
                        <achievement.badge.icon
                          className={`w-4 h-4 ${achievement.badge.color}`}
                        />
                        <span className="font-medium">
                          {achievement.badge.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Badge Legend */}
        <div className="mt-10 bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Badge Levels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <FaStar className="w-6 h-6 text-blue-500" />
              <div>
                <p className="font-medium text-gray-800">Rising Star</p>
                <p className="text-sm text-gray-600">1–5 adds</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaFire className="w-6 h-6 text-pink-500" />
              <div>
                <p className="font-medium text-gray-800">Trending Star</p>
                <p className="text-sm text-gray-600">6–20 adds</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaTrophy className="w-6 h-6 text-yellow-500" />
              <div>
                <p className="font-medium text-gray-800">Superstar</p>
                <p className="text-sm text-gray-600">21+ adds</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
