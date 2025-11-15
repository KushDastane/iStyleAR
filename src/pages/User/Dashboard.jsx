import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWardrobe } from "../../context/WardrobeContext";
import { useRecommendation } from "../../context/RecommendationContext";
import CreativeCarousel from "../../Components/CreativeCarousel";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaHeart, FaFire, FaClock, FaMagic } from "react-icons/fa";
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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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
          .filter((item) => item.clothImageUrl && item.clothName)
          .filter((item) =>
            wardrobeItems.some((w) => w.imageUrl === item.clothImageUrl)
          )
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
      const excludedIds = wardrobeItems.map((w) => w.imageUrl);
      replaceItem(item, excludedIds);
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

  // 🌈 Vibrant Gradients
  const navigationCards = [
    {
      icon: FaCamera,
      iconColor: "text-white",
      bgGradient: "from-indigo-400 via-indigo-500 to-indigo-600",
      title: "AR Try On",
      description: "Upload images & try clothes virtually",
      path: "/user/try-on",
      badge: "Popular",
    },
    {
      icon: FaHeart,
      iconColor: "text-white",
      bgGradient: "from-emerald-400 via-emerald-500 to-emerald-600",
      title: "Virtual Wardrobe",
      description: "View saved outfits & styles",
      path: "/user/wardrobe",
      badge: `${wardrobeItems.length} items`,
    },
    {
      icon: FaFire,
      iconColor: "text-white",
      bgGradient: "from-rose-400 via-rose-500 to-rose-600",
      title: "Trending",
      description: "Discover popular outfits",
      path: "/user/trending",
      badge: "New",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* 🌟 Welcome Header */}
        <div className="mb-12">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
                  {getGreeting()}, {user?.name || "User"}
                </h1>
                <span className="text-2xl">👋</span>
              </div>
              <p className="text-gray-600 text-base md:text-lg font-medium">
                Ready to explore your style today?
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
              <FaHeart className="text-emerald-500 w-4 h-4" />
              <span className="text-sm font-semibold text-gray-700">
                {wardrobeItems.length}
              </span>
              <span className="text-sm text-gray-500">in wardrobe</span>
            </div>

            {previousTries.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
                <FaClock className="text-indigo-500 w-4 h-4" />
                <span className="text-sm font-semibold text-gray-700">
                  {previousTries.length}
                </span>
                <span className="text-sm text-gray-500">recent tries</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-10">
          {/* 🌈 Vibrant Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {navigationCards.map((card, index) => (
              <div
                key={index}
                onClick={() => navigate(card.path)}
                className="group cursor-pointer bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100"
              >
                <div
                  className={`h-2 bg-gradient-to-r ${card.bgGradient}`}
                ></div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${card.bgGradient} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <card.icon className={`${card.iconColor} w-6 h-6`} />
                    </div>

                    {card.badge && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                        {card.badge}
                      </span>
                    )}
                  </div>

                  <h2 className="text-gray-900 font-semibold text-lg mb-2 group-hover:text-indigo-600 transition-colors">
                    {card.title}
                  </h2>

                  <p className="text-gray-600 text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ✨ Top Suggestions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <FaMagic className="text-rose-600 w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-gray-900 font-semibold text-xl">
                    Top Suggestions
                  </h2>
                  <p className="text-gray-700 text-sm">
                    Curated picks just for you
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 pb-3">
              {isLoadingSuggestions ? (
                <div className="flex flex-col items-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-amber-600 absolute top-0 left-0"></div>
                  </div>
                  <span className="mt-4 text-gray-600 font-medium">
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
          </div>

          {/* 🕒 Recently Tried */}
          {wardrobeItems.length > 0 &&
            (isLoading || previousTries.length > 0) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-600 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <FaClock className="text-indigo-700 w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-gray-900 font-semibold text-xl">
                        Recently Tried
                      </h2>
                      <p className="text-gray-700 text-sm">
                        Your latest virtual try-ons
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {isLoading ? (
                    <div className="flex flex-col items-center py-12">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200"></div>
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-indigo-700 absolute top-0 left-0"></div>
                      </div>
                      <span className="mt-4 text-gray-600 font-medium">
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
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
