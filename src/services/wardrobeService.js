// src/services/wardrobeService.js

import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  // doc,
  // getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ✅ Add to wardrobe (safe & validated)
export const addToWardrobe = async (userId, item) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    // Safety: prefer current logged-in user ID
    const uid = userId || currentUser?.uid;
    if (!uid) throw new Error("No user ID found. Please login again.");

    // Validate required fields
    if (!item?.name || !item?.imageUrl) {
      throw new Error("Missing item details (name or image).");
    }

    // Optional: avoid duplicates (check if same name already exists)
    const wardrobeRef = collection(db, "users", uid, "wardrobe");
    const existing = await getDocs(wardrobeRef);
    const duplicate = existing.docs.find((d) => d.data().name === item.name);

    if (duplicate) {
      console.warn(`Item "${item.name}" already in wardrobe.`);
      return { message: "Already in wardrobe" };
    }

    // Add the item
    const docRef = await addDoc(wardrobeRef, {
      clothId: item.id || null,
      name: item.name,
      imageUrl: item.imageUrl,
      addedAt: serverTimestamp(),
      favorite: item.favorite ?? false,
      source: item.source || "dashboard",
    });

    console.log("Added to wardrobe:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding to wardrobe:", error);
    throw error;
  }
};

// ✅ Get wardrobe items
export const getWardrobeItems = async (userId) => {
  try {
    const auth = getAuth();
    const uid = userId || auth.currentUser?.uid;
    if (!uid) throw new Error("No user ID found.");

    const querySnapshot = await getDocs(
      collection(db, "users", uid, "wardrobe")
    );
    const items = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return items;
  } catch (error) {
    console.error("Error getting wardrobe items:", error);
    throw error;
  }
};
