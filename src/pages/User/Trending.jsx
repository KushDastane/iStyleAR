import React, { useState, useEffect } from "react";
import { FaHeart, FaPlusCircle, FaFire, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import { db } from "../../firebase/config";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../../context/useAuth";

export default function Trending() {
  const { user } = useAuth();
  const [likedItems, setLikedItems] = useState([]);
  const [addingId, setAddingId] = useState(null);
  const [addedItems, setAddedItems] = useState([]);

  const trendingItems = [
    {
      id: 1,
      name: "Biker Jacket",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759736844/bikesuit_arhlec.png",
      user: {
        name: "Kush",
        avatar:
          "https://toppng.com/uploads/preview/user-account-management-logo-user-icon-11562867145a56rus2zwu.png",
      },
      date: "Oct 5, 2025",
      tryOns: 124,
    },
    {
      id: 2,
      name: "White T-Shirt",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759736842/white_rnphno.png",
      user: {
        name: "Pushpak",
        avatar:
          "https://toppng.com/uploads/preview/user-account-management-logo-user-icon-11562867145a56rus2zwu.png",
      },
      date: "Oct 4, 2025",
      tryOns: 100,
    },
    {
      id: 3,
      name: "Green T-Shirt",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759736843/dress_eopxzr.png",
      user: {
        name: "Pranav",
        avatar:
          "https://toppng.com/uploads/preview/user-account-management-logo-user-icon-11562867145a56rus2zwu.png",
      },
      date: "Oct 3, 2025",
      tryOns: 120,
    },
    {
      id: 4,
      name: "Red T-Shirt",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683905/green_sfbxnt.png",
      user: {
        name: "Deep",
        avatar:
          "https://toppng.com/uploads/preview/user-account-management-logo-user-icon-11562867145a56rus2zwu.png",
      },
      date: "Oct 5, 2025",
      tryOns: 124,
    },
    {
      id: 5,
      name: "Punjabi",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759736924/dress2_je9pre.png",
      user: {
        name: "Vidhi",
        avatar:
          "https://toppng.com/uploads/preview/user-account-management-logo-user-icon-11562867145a56rus2zwu.png",
      },
      date: "Oct 4, 2025",
      tryOns: 98,
    },
    {
      id: 6,
      name: "Green Hoodie",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683919/blue_kbphud.png",
      user: {
        name: "Sudhanshu",
        avatar:
          "https://toppng.com/uploads/preview/user-account-management-logo-user-icon-11562867145a56rus2zwu.png",
      },
      date: "Oct 3, 2025",
      tryOns: 66,
    },
  ];

  const starOfWeek = {
    name: "Yogini",
    avatar:
      "https://toppng.com/uploads/preview/user-account-management-logo-user-icon-11562867145a56rus2zwu.png",
    tryOns: 127,
    outfit: trendingItems[4].img,
  };

  const toggleLike = (id) => {
    setLikedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // ✅ Add to Firestore (specific button loading)
  const handleAddToWardrobe = async (item) => {
    if (!user) return toast.error("Please log in to add to your wardrobe!");

    try {
      setAddingId(item.id);

      const wardrobeRef = collection(db, "users", user.uid, "wardrobe");
      const q = query(wardrobeRef, where("imageUrl", "==", item.img));
      const existing = await getDocs(q);

      if (!existing.empty) {
        toast.info("This item is already in your wardrobe!");
        setAddedItems((prev) => [...new Set([...prev, item.id])]); // mark it as added
        setAddingId(null);
        return;
      }

      await addDoc(wardrobeRef, {
        name: item.name,
        imageUrl: item.img,
        addedAt: new Date(),
        source: "trending",
      });

      setAddedItems((prev) => [...prev, item.id]);
      toast.success(`"${item.name}" added to your wardrobe!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add item. Please try again.");
    } finally {
      setAddingId(null);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchAddedItems = async () => {
      try {
        const wardrobeRef = collection(db, "users", user.uid, "wardrobe");
        const snapshot = await getDocs(wardrobeRef);
        const ids = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            // match trendingItems by image URL
            const item = trendingItems.find((t) => t.img === data.imageUrl);
            return item?.id;
          })
          .filter(Boolean);

        setAddedItems(ids);
      } catch (err) {
        console.error("Failed to fetch wardrobe items:", err);
      }
    };

    fetchAddedItems();
  }, [user]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ⭐ Fashion Star of the Week */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white flex flex-col md:flex-row items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <img
              src={starOfWeek.avatar}
              alt={starOfWeek.name}
              className="w-16 h-16 rounded-full border-4 border-white shadow-md"
            />
            <div>
              <h2 className="text-2xl font-bold">
                Fashion Star of the Week 🌟
              </h2>
              <p className="text-sm text-indigo-100">
                {starOfWeek.name}’s styles were tried by{" "}
                <span className="font-semibold text-white">
                  {starOfWeek.tryOns}+
                </span>{" "}
                users this week!
              </p>
            </div>
          </div>
          <img
            src={starOfWeek.outfit}
            alt="Outfit of the Week"
            className="w-24 h-24 object-contain rounded-xl mt-4 md:mt-0 border border-white/40 bg-white/10"
          />
        </div>

        {/* 🔥 Trending Section */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-1 flex justify-center md:justify-start items-center gap-2">
            <FaFire className="text-pink-500" /> Trending Outfits
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            See what others are wearing and get inspired
          </p>
        </div>

        {/* 🧥 Trending Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {trendingItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 overflow-hidden"
            >
              {/* Outfit Image */}
              <div className="relative w-full h-56">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />

                <span className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-lg shadow-md">
                  {item.name}
                </span>

                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-1 rounded-md flex items-center gap-1 shadow-md">
                  <FaFire className="text-pink-500" />
                  {item.tryOns} Try-Ons
                </div>

                {/* Like */}
                <button
                  onClick={() => toggleLike(item.id)}
                  className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-md hover:scale-110 transition"
                >
                  <FaHeart
                    className={`w-5 h-5 ${
                      likedItems.includes(item.id)
                        ? "text-pink-600"
                        : "text-gray-400"
                    }`}
                  />
                </button>

                {/* Add / Added */}
                <button
                  onClick={() => handleAddToWardrobe(item)}
                  disabled={
                    addedItems.includes(item.id) || addingId === item.id
                  }
                  className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded-lg flex items-center gap-1 transition ${
                    addedItems.includes(item.id)
                      ? "bg-green-600 cursor-default text-white"
                      : addingId === item.id
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {addedItems.includes(item.id) ? (
                    <>
                      <FaCheckCircle /> Added
                    </>
                  ) : addingId === item.id ? (
                    "Adding..."
                  ) : (
                    <>
                      <FaPlusCircle /> Add
                    </>
                  )}
                </button>
              </div>

              {/* User Info */}
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
