import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";

export const RecommendationContext = createContext();

export const RecommendationProvider = ({ children }) => {
  const [topSuggestions, setTopSuggestions] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

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
              imageUrl: data.imageUrl,
              tryOns: 0,
              uploaderId: itemInfo?.uploaderId || null,
              user: {
                name:
                  userDoc.data().name ||
                  userDoc.data().displayName ||
                  "Anonymous",
              },
              date:
                data.addedAt?.toDate?.().toLocaleDateString?.() || "Unknown",
              users: new Set(),
            };
          }
          itemMap[itemId].users.add(userDoc.id);
        });
      }

      const items = Object.values(itemMap)
        .map((item) => ({
          ...item,
          tryOns: item.users.size,
        }))
        .sort((a, b) => b.tryOns - a.tryOns);

      setTrendingItems(items);
      return items;
    } catch (err) {
      console.error("Failed to fetch trending items:", err);
      return [];
    }
  };

  const fetchTopSuggestions = async () => {
    setIsLoadingSuggestions(true);
    const trending = await fetchTrending();
    // Select 4 random items from trending
    const shuffled = [...trending].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);
    setTopSuggestions(selected);
    setIsLoadingSuggestions(false);
  };

  const replaceItem = (addedItem, excludedIds = []) => {
    setTopSuggestions((prev) => {
      const filtered = prev.filter((item) => item.id !== addedItem.id);
      // Find a new random item not already in suggestions and not in excluded
      const available = trendingItems.filter(
        (item) =>
          !filtered.some((s) => s.id === item.id) &&
          !excludedIds.includes(item.imageUrl)
      );
      if (available.length === 0) return filtered; // No more items
      const randomIndex = Math.floor(Math.random() * available.length);
      const newItem = available[randomIndex];
      return [...filtered, newItem];
    });
  };

  useEffect(() => {
    fetchTopSuggestions();
  }, []);

  return (
    <RecommendationContext.Provider
      value={{ topSuggestions, replaceItem, isLoadingSuggestions }}
    >
      {children}
    </RecommendationContext.Provider>
  );
};

export const useRecommendation = () => useContext(RecommendationContext);
