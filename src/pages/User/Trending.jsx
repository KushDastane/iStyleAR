import React, { useState, useEffect } from "react";
import {
  FaHeart,
  FaRegHeart,
  FaPlusCircle,
  FaFire,
  FaCheckCircle,
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

  const fetchTrending = async () => {
    try {
      // First, fetch all items to get uploader info
      const itemsSnap = await getDocs(collection(db, "items"));
      const itemInfoMap = {};
      itemsSnap.docs.forEach((doc) => {
        const data = doc.data();
        itemInfoMap[data.imageUrl] = {
          uploaderId: data.uploaderId,
          name: data.name,
        };
      });

      const allUsersSnap = await getDocs(collection(db, "users"));
      const itemMap = {};

      for (const userDoc of allUsersSnap.docs) {
        const wardrobeSnap = await getDocs(
          collection(db, "users", userDoc.id, "wardrobe")
        );
        wardrobeSnap.docs.forEach((doc) => {
          const data = doc.data();
          const itemId = data.imageUrl; // assume unique per item
          const itemInfo = itemInfoMap[itemId];

          if (!itemMap[itemId]) {
            itemMap[itemId] = {
              id: itemId,
              name: itemInfo?.name || data.name,
              costumeImageUrl: data.imageUrl,
              latestTryOnUrl: data.imageUrl, // use costume image
              tryOns: 0,
              uploaderId: data.uploaderId || itemInfo?.uploaderId || userDoc.id,
              user: {
                name:
                  userDoc.data().name ||
                  userDoc.data().displayName ||
                  "Anonymous",
                avatar: userDoc.data().avatar || defaultAvatar,
              },
              date:
                data.addedAt?.toDate?.().toLocaleDateString?.() || "Unknown",
              users: new Set(),
            };
          }
          itemMap[itemId].users.add(userDoc.id);

          // Update to latest user (last added)
          itemMap[itemId].user = {
            name:
              userDoc.data().name || userDoc.data().displayName || "Anonymous",
            avatar: userDoc.data().avatar || defaultAvatar,
          };
          itemMap[itemId].date =
            data.addedAt?.toDate?.().toLocaleDateString?.() ||
            itemMap[itemId].date;
        });
      }

      // Fetch uploader data for items that have uploaderId
      const uploaderIds = new Set(
        Object.values(itemMap)
          .map((item) => item.uploaderId)
          .filter(Boolean)
      );

      const uploaderMap = {};
      for (const id of uploaderIds) {
        try {
          const uploaderDoc = await getDoc(doc(db, "users", id));
          if (uploaderDoc.exists()) {
            uploaderMap[id] = uploaderDoc.data();
          }
        } catch (err) {
          console.error("Error fetching uploader data for", id, err);
        }
      }

      // Update items to show uploader info instead of last adder
      Object.values(itemMap).forEach((item) => {
        if (item.uploaderId && uploaderMap[item.uploaderId]) {
          const uploaderData = uploaderMap[item.uploaderId];
          item.user = {
            name: uploaderData.name || uploaderData.displayName || "Anonymous",
            avatar: uploaderData.avatar || defaultAvatar,
          };
        }
        // If no uploaderId or no data, keep the last adder info (already set)
      });

      const items = Object.values(itemMap)
        .map((item) => ({
          ...item,
          tryOns: item.users.size,
        }))
        .sort((a, b) => b.tryOns - a.tryOns)
        .slice(0, 20);

      setTrendingItems(items);
      return items;
    } catch (err) {
      console.error("Failed to fetch trending items:", err);
      toast.error("Failed to load trending outfits");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStarOfWeek = async (items) => {
    try {
      console.log("Calculating star of week with items:", items.length);

      // Group by uploaderId and sum tryOns
      const uploaderMap = {};
      items.forEach((item) => {
        const uploaderId = item.uploaderId;
        console.log(
          "Item:",
          item.name,
          "uploaderId:",
          uploaderId,
          "tryOns:",
          item.tryOns
        );
        if (uploaderId) {
          if (!uploaderMap[uploaderId]) {
            uploaderMap[uploaderId] = {
              uploaderId,
              totalAdds: 0,
              items: [],
            };
          }
          uploaderMap[uploaderId].totalAdds += item.tryOns;
          uploaderMap[uploaderId].items.push(item);
        }
      });

      console.log("Uploader map:", uploaderMap);

      // Find top uploader
      const topUploader = Object.values(uploaderMap).sort(
        (a, b) => b.totalAdds - a.totalAdds
      )[0];

      console.log("Top uploader:", topUploader);

      if (topUploader && topUploader.totalAdds > 0) {
        try {
          // Get uploader user data directly by document ID
          const uploaderDoc = await getDoc(
            doc(db, "users", topUploader.uploaderId)
          );
          const uploaderData = uploaderDoc.data();

          console.log("Uploader data:", uploaderData);

          if (uploaderData) {
            // pick the uploader's most added outfit (safe copy + guard)
            const topItem = (topUploader.items || [])
              .slice()
              .sort((a, b) => (b.tryOns || 0) - (a.tryOns || 0))[0];

            setStarOfWeek({
              name:
                uploaderData.name || uploaderData.displayName || "Anonymous",
              avatar: uploaderData.avatar || defaultAvatar,
              tryOns: topItem?.tryOns ?? topUploader.totalAdds ?? 0,
              outfit:
                topItem?.costumeImageUrl ||
                topUploader.items?.[0]?.costumeImageUrl ||
                defaultImage,
            });
          } else {
            setStarOfWeek({
              name: "No Data",
              avatar: defaultAvatar,
              tryOns: 0,
              outfit: defaultImage,
            });
          }

        } catch (docErr) {
          console.error("Error fetching uploader doc:", docErr);
          setStarOfWeek({
            name: "No Data",
            avatar: defaultAvatar,
            tryOns: 0,
            outfit: defaultImage,
          });
        }
      } else {
        console.log("No top uploader found or no adds");
        setStarOfWeek({
          name: "No Data",
          avatar: defaultAvatar,
          tryOns: 0,
          outfit: defaultImage,
        });
      }
    } catch (err) {
      console.error("Failed to calculate star of week:", err);
      setStarOfWeek({
        name: "No Data",
        avatar: defaultAvatar,
        tryOns: 0,
        outfit: defaultImage,
      });
    }
  };

  const fetchStarOfWeek = async () => {
    try {
      // Fetch trending items to get uploader stats
      const trendingItems = await fetchTrending();
      await calculateStarOfWeek(trendingItems);
    } catch (err) {
      console.error(" Failed to fetch star of week:", err);
      setStarOfWeek({
        name: "No Data",
        avatar: defaultAvatar,
        tryOns: 0,
        outfit: defaultImage,
      });
    }
  };

  const displayedItems = showFavoritesOnly
    ? trendingItems.filter((item) => favorites.includes(item.id))
    : trendingItems;

  // ✅ Add to Firestore (specific button loading)
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
        setAddedItems((prev) => [...new Set([...prev, item.id])]); // mark it as added
        setAddingId(null);
        return;
      }
      await addDoc(wardrobeRef, {
        name: item.name,
        imageUrl: item.costumeImageUrl, // ⚠️ use costume, not user try-on
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
    const isFav = favorites.includes(itemId);
    if (isFav) {
      // remove
      const q = query(
        collection(db, "users", user.uid, "trendingFavorites"),
        where("itemId", "==", itemId)
      );
      const snap = await getDocs(q);
      snap.docs.forEach(async (doc) => await deleteDoc(doc.ref));
      setFavorites((prev) => prev.filter((id) => id !== itemId));
    } else {
      // add
      await addDoc(collection(db, "users", user.uid, "trendingFavorites"), {
        itemId,
      });
      setFavorites((prev) => [...prev, itemId]);
    }
  };

  useEffect(() => {
    fetchTrending();
    fetchStarOfWeek();
  }, [user]); // Add user dependency to refetch when avatar changes

  useEffect(() => {
    if (!user) return;

    const fetchAddedItems = async () => {
      try {
        const wardrobeRef = collection(db, "users", user.uid, "wardrobe");
        const snapshot = await getDocs(wardrobeRef);
        const ids = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            // match trendingItems by costume image URL
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
    };

    fetchAddedItems();
  }, [user, trendingItems]);

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      try {
        const favSnap = await getDocs(
          collection(db, "users", user.uid, "trendingFavorites")
        );
        const favIds = favSnap.docs.map((doc) => doc.data().itemId);
        setFavorites(favIds);
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
      }
    };

    fetchFavorites();
  }, [user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
                {starOfWeek.name}’s uploaded costumes were added to cart by{" "}
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

        {/* Trending Section */}
        <div className="mb-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:justify-between items-center gap-3 mb-1">
            {/* Title with Fire Icon */}
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 flex items-center gap-2">
              <FaFire className="text-pink-500" />
              Trending Outfits
            </h1>

            {/* Heart Filter Button */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center justify-center p-2 rounded-full transition-transform transform hover:scale-105 ${
                showFavoritesOnly
                  ? "bg-pink-500 text-white shadow-lg"
                  : "bg-white border border-gray-300"
              }`}
            >
              {showFavoritesOnly ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>

          <p className="text-gray-500 text-sm md:text-base">
            See what others are wearing and get inspired
          </p>
        </div>

        {/* 🧥 Trending Cards */}
        <div>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <span className="ml-4 text-gray-600">
                Loading trending outfits...
              </span>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No trending items found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 overflow-hidden"
                >
                  {/* Outfit Image */}
                  <div className="relative w-full h-56">
                    <img
                      src={item.latestTryOnUrl} // show actual user try-on photo
                      alt={item.name}
                      className="w-full h-56 object-cover"
                    />

                    <span className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-lg shadow-md">
                      {item.name}
                    </span>

                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-1 rounded-md flex items-center gap-1 shadow-md">
                      <FaFire className="text-pink-500" />
                      {item.tryOns} Added to Cart
                    </div>

                    {/* Like */}
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-md hover:scale-110 transition"
                    >
                      {favorites.includes(item.id) ? (
                        <FaHeart className="w-5 h-5 text-pink-600" />
                      ) : (
                        <FaRegHeart className="w-5 h-5 text-gray-400" />
                      )}
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
          )}
        </div>
      </div>
    </div>
  );
}
