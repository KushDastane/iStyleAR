import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser) => {
    try {
      console.log("📄 Fetching Firestore user:", firebaseUser.uid);
      const userRef = doc(db, "users", firebaseUser.uid);

      // ✅ Add abort safety to Firestore getDoc
      const controller = new AbortController();
      const signal = controller.signal;

      const docSnap = await Promise.race([
        getDoc(userRef),
        new Promise((_, reject) =>
          signal.addEventListener("abort", () =>
            reject(new Error("Aborted"))
          )
        ),
      ]);

      if (docSnap.exists()) {
        console.log("✅ Firestore data found.");
        setUser({ uid: firebaseUser.uid, ...docSnap.data() });
      } else {
        console.warn("⚠️ No Firestore user doc found!");
        setUser(firebaseUser);
      }
    } catch (error) {
      if (error.name === "AbortError" || error.message === "Aborted") {
        console.log("⚠️ Firestore fetch aborted safely (no crash).");
      } else {
        console.error("🔥 Auth listener error:", error);
        toast.error("Auth error: " + error.message);
      }
    }
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      await fetchUserData(auth.currentUser);
    }
  };

  useEffect(() => {
    console.log("👂 Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await fetchUserData(firebaseUser);
        } else {
          console.log("🚪 User signed out.");
          setUser(null);
        }
      } catch (error) {
        if (error.name === "AbortError" || error.message === "Aborted") {
          console.log("⚠️ Firestore fetch aborted safely (no crash).");
        } else {
          console.error("🔥 Auth listener error:", error);
          toast.error("Auth error: " + error.message);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log("🧹 Cleaning up auth listener...");
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
