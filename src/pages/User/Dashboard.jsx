import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWardrobe } from "../../context/WardrobeContext";
import { useRecommendation } from "../../context/RecommendationContext";
import CreativeCarousel from "../../Components/CreativeCarousel";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaHeart, FaFire } from "react-icons/fa";
import { db } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";

import { toast } from "react-toastify";

const getTimeAgo = (date) => {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const { addToWardrobe, wardrobeItems } = useWardrobe();
  const { topSuggestions, replaceItem, isLoadingSuggestions } =
    useRecommendation();
  const navigate = useNavigate();
  const [previousTries, setPreviousTries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isItemAdded = (item) =>
    wardrobeItems.some(
      (w) => w.name === item.name && w.imageUrl === item.imageUrl
    );

  const fetchPreviousTries = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const tries = (data.tryHistory || [])
          .filter((item) => item.clothImageUrl && item.clothName) // Only include items with valid cloth data
          .filter((item) =>
            wardrobeItems.some((w) => w.imageUrl === item.clothImageUrl)
          ) // Only include items still in wardrobe
          .map((item, index) => ({
            id: index.toString(),
            name: item.clothName,
            imageUrl: item.clothImageUrl,
            img: item.resultURL,
            timeAgo: getTimeAgo(new Date(item.timestamp)),
            timestamp: item.timestamp,
          }))
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 4);
        setPreviousTries(tries);
      } else {
        setPreviousTries([]);
      }
    } catch (err) {
      console.error("Failed to fetch previous tries:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWardrobe = async (item) => {
    try {
      await addToWardrobe(item);
      toast.success(`${item.name} added to wardrobe!`);
      // Get excluded items (already in wardrobe)
      const excludedIds = wardrobeItems.map((w) => w.imageUrl);
      replaceItem(item, excludedIds); // Replace the added item with another random one, excluding already added items
    } catch (error) {
      toast.error("Failed to add to wardrobe. Please try again.");
      console.error(error);
    }
  };
  const handleTryAgain = (item) => {
    navigate("/user/try-on", {
      state: { cloth: { name: item.name, imageUrl: item.img } },
    });
  };

  useEffect(() => {
    if (wardrobeItems.length > 0) {
      fetchPreviousTries();
    } else {
      setIsLoading(false);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user, wardrobeItems]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-1">
            Welcome back, {user?.name || "User"}
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Explore your wardrobe and discover trending styles
          </p>
        </div>

        {/* Carousels */}

        <div className="space-y-10">
          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <div
              onClick={() => navigate("/user/try-on")}
              className="cursor-pointer bg-white rounded-xl shadow-md p-6 flex flex-col justify-center items-center hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              <FaCamera className="text-indigo-600 w-7 h-7 mb-2" />
              <h2 className="text-gray-800 font-medium text-base mb-1">
                AR Try on
              </h2>
              <p className="text-gray-500 text-sm text-center">
                Upload images & try clothes virtually
              </p>
            </div>

            <div
              onClick={() => navigate("/user/wardrobe")}
              className="cursor-pointer bg-white rounded-xl shadow-md p-6 flex flex-col justify-center items-center hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              <FaHeart className="text-green-600 w-7 h-7 mb-2" />
              <h2 className="text-gray-800 font-medium text-base mb-1">
                Virtual Wardrobe
              </h2>
              <p className="text-gray-500 text-sm text-center">
                View saved outfits & styles
              </p>
            </div>

            <div
              onClick={() => navigate("/user/trending")}
              className="cursor-pointer bg-white rounded-xl shadow-md p-6 flex flex-col justify-center items-center hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              <FaFire className="text-pink-600 w-7 h-7 mb-2" />
              <h2 className="text-gray-800 font-medium text-base mb-1">
                Trending
              </h2>
              <p className="text-gray-500 text-sm text-center">
                Discover popular outfits
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <div className="flex items-center mb-3 space-x-2">
              <div className="border-l-6 border-green-600 h-6 rounded-2xl"></div>

              <h2 className="text-gray-800 font-medium text-lg">
                Top Suggestions
              </h2>
            </div>
            {isLoadingSuggestions ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600">
                  Loading suggestions...
                </span>
              </div>
            ) : (
              <CreativeCarousel
                items={topSuggestions}
                onTryAgain={handleAddToWardrobe}
                showTryAgain={true}
                buttonText="Add to Wardrobe"
                isItemAdded={isItemAdded}
              />
            )}
          </div>

          {wardrobeItems.length > 0 &&
            (isLoading || previousTries.length > 0) && (
              <div className="bg-white p-4 rounded-2xl shadow-sm">
                <div className="flex items-center mb-3 space-x-2">
                  <FaCamera className="text-indigo-600 w-5 h-5" />
                  <h2 className="text-gray-800 font-medium text-lg">
                    Recently Tried
                  </h2>
                </div>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">
                      Loading recent tries...
                    </span>
                  </div>
                ) : (
                  <CreativeCarousel
                    items={previousTries}
                    onTryAgain={handleTryAgain}
                    showTryAgain={true}
                    buttonText="Wear Again"
                    slidesPerViewDesktop={Math.min(previousTries.length, 4)}
                  />
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
