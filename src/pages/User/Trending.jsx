import React, { useState, useEffect } from "react";
import {
  FaHeart,
  FaRegHeart,
  FaPlusCircle,
  FaFire,
  FaCheckCircle,
  FaTrophy,
  FaStar,
  FaFilter,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { db } from "../../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

export default function Trending() {
  const { user } = useAuth();

  const defaultAvatar = "/defaultpfp.png";
  const defaultImage =
    "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759736842/white_rnphno.png";

  // ---------- STATE ----------
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [addedItems, setAddedItems] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [starOfWeek, setStarOfWeek] = useState({
    name: "Loading...",
    avatar: defaultAvatar,
    tryOns: 0,
    outfit: defaultImage,
  });

  // =========================================================
  // 1. BUILD TRENDING ITEMS (optimized Firestore reads)
  // =========================================================

  async function buildTrendingItems() {
    try {
      // Fetch global items + all users in parallel
      const [itemsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, "items")),
        getDocs(collection(db, "users")),
      ]);

      // Map imageUrl → base item info (name/uploaderId)
      const itemInfoMap = {};
      itemsSnap.docs.forEach((d) => {
        const data = d.data();
        if (!data?.imageUrl) return;
        itemInfoMap[data.imageUrl] = {
          uploaderId: data.uploaderId,
          name: data.name,
        };
      });

      const itemMap = {};

      // Fetch all wardrobes in parallel
      const wardrobePromises = usersSnap.docs.map((userDoc) =>
        getDocs(collection(db, "users", userDoc.id, "wardrobe")).then(
          (wardSnap) => ({ userDoc, wardSnap })
        )
      );

      const wardrobes = await Promise.all(wardrobePromises);

      wardrobes.forEach(({ userDoc, wardSnap }) => {
        const userData = userDoc.data() || {};
        const baseUserInfo = {
          name: userData.name || userData.displayName || "Anonymous",
          avatar: userData.avatar || defaultAvatar,
        };

        wardSnap.docs.forEach((wDoc) => {
          const data = wDoc.data() || {};
          const imageKey = data.imageUrl;
          if (!imageKey) return;

          const itemInfo = itemInfoMap[imageKey];

          if (!itemMap[imageKey]) {
            itemMap[imageKey] = {
              id: imageKey,
              name: itemInfo?.name || data.name || "Untitled Outfit",
              costumeImageUrl: imageKey,
              latestTryOnUrl: imageKey,
              uploaderId: data.uploaderId || itemInfo?.uploaderId || userDoc.id,
              users: new Set(),
              date:
                data.addedAt?.toDate?.().toLocaleDateString?.() || "Unknown",
              user: baseUserInfo, // last wearer or uploader override later
            };
          }

          // track unique users who have this item
          itemMap[imageKey].users.add(userDoc.id);

          // keep latest wearer & date as display info
          itemMap[imageKey].user = baseUserInfo;
          itemMap[imageKey].date =
            data.addedAt?.toDate?.().toLocaleDateString?.() ||
            itemMap[imageKey].date;
        });
      });

      // Fetch uploader profiles in parallel (for creators)
      const uploaderIds = new Set(
        Object.values(itemMap)
          .map((item) => item.uploaderId)
          .filter(Boolean)
      );

      const uploaderDocs = await Promise.all(
        Array.from(uploaderIds).map((uid) =>
          getDoc(doc(db, "users", uid)).then((snap) => ({ uid, snap }))
        )
      );

      const uploaderMap = {};
      uploaderDocs.forEach(({ uid, snap }) => {
        if (snap.exists()) uploaderMap[uid] = snap.data();
      });

      // Finalize item objects
      const items = Object.values(itemMap).map((item) => {
        const tryOns = item.users.size;

        if (item.uploaderId && uploaderMap[item.uploaderId]) {
          const uploaderData = uploaderMap[item.uploaderId];
          item.user = {
            name: uploaderData.name || uploaderData.displayName || "Anonymous",
            avatar: uploaderData.avatar || defaultAvatar,
          };
        }

        return {
          ...item,
          tryOns,
        };
      });

      // Sort by popularity and limit
      const sortedTop = items
        .sort((a, b) => (b.tryOns || 0) - (a.tryOns || 0))
        .slice(0, 20);

      return sortedTop;
    } catch (err) {
      console.error("Failed to build trending items:", err);
      toast.error("Failed to load trending outfits");
      return [];
    }
  }

  // =========================================================
  // 2. STAR OF THE WEEK (computed from trendingItems only)
  // =========================================================

  function computeStarOfWeek(items) {
    if (!items || items.length === 0) {
      return {
        name: "No Data",
        avatar: defaultAvatar,
        tryOns: 0,
        outfit: defaultImage,
      };
    }

    // uploaderId → { totalAdds, topItem }
    const uploaderMap = {};

    items.forEach((item) => {
      const uploaderId = item.uploaderId;
      if (!uploaderId) return;

      if (!uploaderMap[uploaderId]) {
        uploaderMap[uploaderId] = {
          uploaderId,
          totalAdds: 0,
          topItem: null,
        };
      }

      const adds = item.tryOns || 0;
      uploaderMap[uploaderId].totalAdds += adds;

      if (
        !uploaderMap[uploaderId].topItem ||
        (uploaderMap[uploaderId].topItem.tryOns || 0) < adds
      ) {
        uploaderMap[uploaderId].topItem = item;
      }
    });

    const topUploader = Object.values(uploaderMap).sort(
      (a, b) => (b.totalAdds || 0) - (a.totalAdds || 0)
    )[0];

    if (!topUploader || topUploader.totalAdds <= 0) {
      return {
        name: "No Data",
        avatar: defaultAvatar,
        tryOns: 0,
        outfit: defaultImage,
      };
    }

    const topItem = topUploader.topItem || {};
    const displayUser = topItem.user || {};

    return {
      name: displayUser.name || "Anonymous",
      avatar: displayUser.avatar || defaultAvatar,
      tryOns: topItem.tryOns || topUploader.totalAdds || 0,
      outfit: topItem.costumeImageUrl || defaultImage,
    };
  }

  // =========================================================
  // 3. EFFECT: LOAD TRENDING + STAR (SINGLE ENTRY POINT)
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const items = await buildTrendingItems();
      if (cancelled) return;

      setTrendingItems(items);
      const star = computeStarOfWeek(items);
      setStarOfWeek(star);
      setIsLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
    // we don't depend on `user` to avoid double refetch unless you want user-specific view
  }, []);

  // =========================================================
  // 4. FETCH FAVORITES (once per user)
  // =========================================================

  useEffect(() => {
    if (!user) return;

    async function fetchFavorites() {
      try {
        const favSnap = await getDocs(
          collection(db, "users", user.uid, "trendingFavorites")
        );
        const favIds = favSnap.docs.map((doc) => doc.data().itemId);
        setFavorites(favIds);
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
      }
    }

    fetchFavorites();
  }, [user]);

  // =========================================================
  // 5. FETCH ITEMS ALREADY IN USER WARDROBE (for "Added" state)
  // =========================================================

  useEffect(() => {
    if (!user || trendingItems.length === 0) return;

    async function fetchAddedItems() {
      try {
        const wardrobeRef = collection(db, "users", user.uid, "wardrobe");
        const snapshot = await getDocs(wardrobeRef);

        const ids = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            const item = trendingItems.find(
              (t) => t.costumeImageUrl === data.imageUrl
            );
            return item?.id;
          })
          .filter(Boolean);

        setAddedItems(ids);
      } catch (err) {
        console.error("Failed to fetch wardrobe items:", err);
      }
    }

    fetchAddedItems();
  }, [user, trendingItems]);

  // =========================================================
  // 6. SCROLL TO TOP ON MOUNT
  // =========================================================

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // =========================================================
  // 7. ACTION HANDLERS
  // =========================================================

  const handleAddToWardrobe = async (item) => {
    if (!user) return toast.error("Please log in to add to your wardrobe!");

    try {
      setAddingId(item.id);

      const wardrobeRef = collection(db, "users", user.uid, "wardrobe");
      const q = query(
        wardrobeRef,
        where("imageUrl", "==", item.costumeImageUrl)
      );
      const existing = await getDocs(q);

      if (!existing.empty) {
        toast.info("This item is already in your wardrobe!");
        setAddedItems((prev) => [...new Set([...prev, item.id])]);
        setAddingId(null);
        return;
      }

      await addDoc(wardrobeRef, {
        itemId: item.id,
        name: item.name,
        imageUrl: item.costumeImageUrl,
        uploaderId: item.uploaderId,
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

  const toggleFavorite = async (itemId) => {
    if (!user) return toast.error("Please log in to save favorites!");

    const isFav = favorites.includes(itemId);

    try {
      if (isFav) {
        const q = query(
          collection(db, "users", user.uid, "trendingFavorites"),
          where("itemId", "==", itemId)
        );
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

        setFavorites((prev) => prev.filter((id) => id !== itemId));
        toast.success("Removed from favorites");
      } else {
        await addDoc(collection(db, "users", user.uid, "trendingFavorites"), {
          itemId,
        });
        setFavorites((prev) => [...prev, itemId]);
        toast.success("Added to favorites");
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  // =========================================================
  // 8. DERIVED DATA
  // =========================================================

  const displayedItems = showFavoritesOnly
    ? trendingItems.filter((item) => favorites.includes(item.id))
    : trendingItems;

  // =========================================================
  // 9. UI
  // =========================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Star of the Week */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-3xl shadow-2xl mb-12 transform  transition-transform duration-300">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-200 rounded-full mix-blend-overlay filter blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-lg opacity-75 animate-pulse" />
                <img
                  src={starOfWeek.avatar}
                  alt={starOfWeek.name}
                  className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-2xl object-cover"
                />
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full p-2 shadow-lg">
                  <FaTrophy className="w-5 h-5" />
                </div>
              </div>

              <div className="text-white">
                <div className="flex items-center gap-2 mb-2">
                  <FaStar className="text-yellow-300 w-5 h-5" />
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Fashion Star of the Week
                  </h2>
                </div>
                <p className="text-white/90 text-sm md:text-base leading-relaxed">
                  <span className="font-semibold text-yellow-200">
                    {starOfWeek.name}
                  </span>
                  's designs were added{" "}
                  <span className="font-bold text-xl text-yellow-300">
                    {starOfWeek.tryOns}+{" "}
                  </span>
                  times this week!
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <img
                src={starOfWeek.outfit}
                alt="Featured Outfit"
                className="relative w-32 h-32 md:w-36 md:h-36 object-contain rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 shadow-2xl transform  transition-transform duration-300"
              />
            </div>
          </div>
        </div>

        {/* Header Section */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-3 rounded-2xl shadow-lg">
                <FaFire className="text-white w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  Trending Outfits
                </h1>
                <p className="text-gray-600 text-sm md:text-base mt-1">
                  Discover what's hot in fashion right now
                </p>
              </div>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFavoritesOnly((prev) => !prev)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                showFavoritesOnly
                  ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white scale-105"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-pink-300"
              }`}
            >
              <FaFilter className="w-4 h-4" />
              {showFavoritesOnly ? "Show All" : "Favorites Only"}
            </button>
          </div>

          {/* Stats Bar */}
          <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <FaFire className="text-orange-500" />
              <span className="text-sm font-medium">
                {displayedItems.length}{" "}
                {showFavoritesOnly ? "Favorite" : "Trending"} Items
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FaHeart className="text-pink-500" />
              <span className="text-sm font-medium">
                {favorites.length} Favorites
              </span>
            </div>
          </div>
        </div>

        {/* Trending Grid */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-32">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <FaFire className="text-purple-600 w-6 h-6 animate-pulse" />
              </div>
            </div>
            <p className="mt-6 text-gray-600 font-medium text-lg">
              Loading trending outfits...
            </p>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl shadow-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-6">
              <FaHeart className="text-purple-600 w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {showFavoritesOnly ? "No favorites yet" : "No trending items"}
            </h3>
            <p className="text-gray-500 text-lg">
              {showFavoritesOnly
                ? "Start hearting items to see them here!"
                : "Check back soon for hot new styles"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedItems.map((item, index) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`,
                }}
              >
                {/* Image Container */}
                <div className="relative w-full h-72 overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
                  <img
                    src={item.latestTryOnUrl}
                    alt={item.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Item Name Badge */}
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                    {item.name}
                  </div>

                  {/* Stats Badge */}
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md text-gray-800 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg transform group-hover:scale-105 transition-transform">
                    <div className="flex items-center gap-1 text-orange-600">
                      <FaFire className="w-4 h-4" />
                      <span>{item.tryOns}</span>
                    </div>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600">Adds</span>
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    className="absolute top-3 right-3 bg-white/95 backdrop-blur-md p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 z-10"
                  >
                    {favorites.includes(item.id) ? (
                      <FaHeart className="w-5 h-5 text-pink-600 animate-pulse" />
                    ) : (
                      <FaRegHeart className="w-5 h-5 text-gray-600 group-hover:text-pink-400 transition-colors" />
                    )}
                  </button>

                  {/* Add Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToWardrobe(item);
                    }}
                    disabled={
                      addedItems.includes(item.id) || addingId === item.id
                    }
                    className={`absolute bottom-3 right-3 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all duration-300 transform ${
                      addedItems.includes(item.id)
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white cursor-default scale-105"
                        : addingId === item.id
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105 active:scale-95"
                    }`}
                  >
                    {addedItems.includes(item.id) ? (
                      <>
                        <FaCheckCircle className="w-4 h-4" />
                        Added
                      </>
                    ) : addingId === item.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding
                      </>
                    ) : (
                      <>
                        <FaPlusCircle className="w-4 h-4" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>

                {/* User Info */}
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.user.avatar}
                          alt={item.user.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-purple-100 shadow-md"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-1">
                          <FaStar className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-semibold text-sm truncate">
                          {item.user.name}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {item.date}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card entrance animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
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
