import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/config";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { toast } from "react-toastify";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const DEFAULT_AVATAR = "/defaultpfp.png";

  // 🔥 Always return a safe avatar
  const safeAvatar = (url) => {
    if (typeof url === "string" && url.trim() !== "") return url;
    return DEFAULT_AVATAR;
  };

  // ------------------------------------------------------------------
  // ⭐ Create a brand-new user for first Google login
  // ------------------------------------------------------------------
  const createNewUser = async (firebaseUser) => {
    const email = firebaseUser.email;
    const googlePhoto = firebaseUser.photoURL;
    const name = firebaseUser.displayName || email.split("@")[0];

    const avatar = safeAvatar(googlePhoto);

    const userData = {
      name,
      email,
      username: email.split("@")[0],
      avatar,
      wardrobe: [],
      tryHistory: [],
      totalTryCount: 0,
      totalUploads: 0,
      freeTryonsLeft: 15,
      profileCompleted: false,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", firebaseUser.uid), userData);

    setUser({ uid: firebaseUser.uid, ...userData });
  };

  // ------------------------------------------------------------------
  // ⭐ Merge Google login to existing email/password user
  // ------------------------------------------------------------------
  const mergeWithExistingUser = async (firebaseUser) => {
    const email = firebaseUser.email;
    const googlePhoto = firebaseUser.photoURL;

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const snap = await getDocs(q);

    let existing = null;
    let existingUid = null;

    snap.forEach((docSnap) => {
      existing = docSnap.data();
      existingUid = docSnap.id;
    });

    // If no old user → create a new one
    if (!existing || !existingUid) {
      await createNewUser(firebaseUser);
      return;
    }

    const finalAvatar = safeAvatar(existing.avatar || googlePhoto);

    const mergedData = {
      ...existing,
      name: existing.name || firebaseUser.displayName || email.split("@")[0],
      email: email,
      username: existing.username || email.split("@")[0],
      avatar: finalAvatar,
    };

    await updateDoc(doc(db, "users", existingUid), {
      avatar: finalAvatar,
      name: mergedData.name,
    });

    setUser({ uid: existingUid, ...mergedData });
  };

  // ------------------------------------------------------------------
  // ⭐ Main user loader (runs on every refresh)
  // ------------------------------------------------------------------
  const fetchUserData = async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      return;
    }

    const uid = firebaseUser.uid;
    const googlePhoto = firebaseUser.photoURL;

    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    // No Firestore doc → first login or merging needed
    if (!snap.exists()) {
      await mergeWithExistingUser(firebaseUser);
      return;
    }

    // Normal existing Firestore user
    const data = snap.data();

    // 🔥 Ensure avatar ALWAYS exists
    const finalAvatar = safeAvatar(data.avatar || googlePhoto);

    if (finalAvatar !== data.avatar) {
      await updateDoc(ref, { avatar: finalAvatar });
      data.avatar = finalAvatar;
    }

    setUser({ uid, ...data });
  };

  // Manual refresh function for app use
  const refreshUser = async () => {
    if (auth.currentUser) await fetchUserData(auth.currentUser);
  };

  // Local UI update
  const updateUser = (updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      await fetchUserData(firebaseUser);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
