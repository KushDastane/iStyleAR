import React from "react";
import { FaHeart, FaShoppingCart } from "react-icons/fa";

export default function Trending() {
  const trendingItems = [
    {
      id: 1,
      name: "Red Shirt",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683904/red_zbtczb.png",
      user: {
        name: "Alice",
        avatar:
          "https://toppng.com/uploads/preview/user-account-management-logo-user-icon-11562867145a56rus2zwu.png",
      },
      date: "Oct 5, 2025",
    },
    {
      id: 2,
      name: "Blue Jacket",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683919/blue_kbphud.png",
      user: {
        name: "Bob",
        avatar:
          "https://toppng.com/uploads/preview/user-account-management-logo-user-icon-11562867145a56rus2zwu.png",
      },
      date: "Oct 4, 2025",
    },
    {
      id: 3,
      name: "Green Hoodie",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683905/green_sfbxnt.png",
      user: {
        name: "Charlie",
        avatar:
          "https://toppng.com/uploads/preview/user-account-management-logo-user-icon-11562867145a56rus2zwu.png",
      },
      date: "Oct 3, 2025",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-1">
            Trending Outfits 🔥
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            See what others are wearing and get inspired
          </p>
        </div>

        {/* Trending Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {trendingItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-lg transition transform hover:-translate-y-1 overflow-hidden relative"
            >
              {/* Outfit Image */}
              <div className="relative w-full h-56">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {/* Outfit Name Badge */}
                <span className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-lg shadow-md">
                  {item.name}
                </span>

                {/* Like Icon */}
                <FaHeart className="absolute top-2 right-2 text-pink-600 w-5 h-5 shadow-sm cursor-pointer" />

                {/* Add to Cart Icon */}
                <FaShoppingCart className="absolute bottom-2 right-2 text-gray-800 w-5 h-5 shadow-sm cursor-pointer" />
              </div>

              {/* User Info & Date */}
              <div className="p-4 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.user.avatar}
                      alt={item.user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100"
                    />
                    <span className="text-gray-700 font-medium text-sm">
                      {item.user.name}
                    </span>
                  </div>
                  <span className="text-gray-400 text-xs">{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
