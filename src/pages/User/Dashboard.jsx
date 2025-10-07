import { useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { useWardrobe } from "../../context/WardrobeContext";
import CreativeCarousel from "../../Components/CreativeCarousel";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaHeart, FaFire } from "react-icons/fa";

import { toast } from "react-toastify";

export default function Dashboard() {
  const { user } = useAuth();
  const { addToWardrobe, wardrobeItems } = useWardrobe();
  const navigate = useNavigate();

  const isItemAdded = (item) => wardrobeItems.some(w => w.name === item.name && w.imageUrl === item.imageUrl);

  const previousTries = [
    {
      name: "Casual T-Shirt",
      imageUrl:
        "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759736842/white_rnphno.png",
    },
    {
      name: "Party-wear",
      imageUrl:
        "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759736843/dress_eopxzr.png",
    },
    {
      name: "Bike wear",
      imageUrl:
        "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759736844/bikesuit_arhlec.png",
    },
  ];

  const topSuggestions = [
    {
      name: "Red Dress",
      imageUrl:
        "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683904/red_zbtczb.png",
    },
    {
      name: "Blue Jacket",
      imageUrl:
        "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683919/blue_kbphud.png",
    },
    {
      name: "Casual Shirt",
      imageUrl:
        "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683905/green_sfbxnt.png",
    },
    {
      name: "Red Dress",
      imageUrl:
        "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759736924/dress2_je9pre.png",
    },
    {
      name: "Blue Jacket",
      imageUrl:
        "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683919/blue_kbphud.png",
    },
    {
      name: "Casual Shirt",
      imageUrl:
        "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683905/green_sfbxnt.png",
    },
  ];

  const handleAddToWardrobe = async (item) => {
    try {
      await addToWardrobe(item);
      toast.success(`${item.name} added to wardrobe!`);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
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
              <FaHeart className="text-green-600 w-5 h-5" />
              <h2 className="text-gray-800 font-medium text-lg">
                Top Suggestions
              </h2>
            </div>
            <CreativeCarousel
              items={topSuggestions}
              onTryAgain={handleAddToWardrobe}
              showTryAgain={true}
              buttonText="Add to Wardrobe"
              isItemAdded={isItemAdded}
            />
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <div className="flex items-center mb-3 space-x-2">
              <FaCamera className="text-indigo-600 w-5 h-5" />
              <h2 className="text-gray-800 font-medium text-lg">
                Recently Tried
              </h2>
            </div>
            <CreativeCarousel
              items={previousTries}
              onTryAgain={handleTryAgain}
              showTryAgain={true}
              buttonText="Wear Again"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
