import { createContext, useEffect, useState, useContext, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUserRef = useRef(null); // Track current user being processed
  const isMountedRef = useRef(true); // Use ref for isMounted to avoid stale closures

  useEffect(() => {
    if (!auth) {
      console.error("Firebase auth not initialized.");
      setLoading(false);
      return;
    }

    console.log("Setting up auth state listener...");

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log(
        "Auth state changed:",
        currentUser ? `User logged in: ${currentUser.uid}` : "No user"
      );

      // Update current user ref to track which user we're processing
      currentUserRef.current = currentUser;

      if (currentUser) {
        try {
          if (!db) {
            console.error("Firebase db not initialized.");
            if (isMountedRef.current && currentUserRef.current === currentUser) {
              setUser(currentUser);
            }
          } else {
            console.log(
              `Fetching user data from Firestore for UID: ${currentUser.uid}...`
            );
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);

            // Check if component is still mounted and this is still the current user
            if (!isMountedRef.current || currentUserRef.current !== currentUser) {
              console.log("Component unmounted or user changed, skipping setUser");
              return;
            }

            if (docSnap.exists()) {
              const userData = docSnap.data();
              console.log("User data found:", userData);

              const mergedUser = {
                ...currentUser,
                ...userData,
                avatar: userData.avatar || "/defaultpfp.png",
                wardrobe: userData.wardrobe || [],
                tryHistory: userData.tryHistory || [],
                totalTryCount: userData.totalTryCount || 0,
                totalUploads: userData.totalUploads || 0,
                freeTryonsLeft: userData.freeTryonsLeft || 15,
                profileCompleted: userData.profileCompleted || false,
              };

              console.log("Setting merged user:", mergedUser);
              setUser(mergedUser);
            } else {
              console.log("No user data found in Firestore, using basic user");
              setUser(currentUser);
            }
          }
        } catch (err) {
          console.error("🔥 Error fetching user data:", err);
          // Check if component is still mounted and this is still the current user
          if (isMountedRef.current && currentUserRef.current === currentUser) {
            // Fallback to basic user data on error
            setUser(currentUser);
          }
        }
      } else {
        console.log("No current user, setting user to null");
        // Only set to null if component is mounted
        if (isMountedRef.current) {
          setUser(null);
        }
      }

      console.log("Setting loading to false");
      if (isMountedRef.current) {
        setLoading(false);
      }
    });

    return () => {
      console.log("Cleaning up auth state listener");
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []); // empty dependency array to run only once on mount

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
        // Clear user state - onAuthStateChanged will handle setting user to null
        // Don't manually setUser(null) here to avoid double re-render
        // Clear any localStorage items if needed
        localStorage.removeItem("newUser");
        console.log("User logged out successfully");
      } else {
        console.error("Cannot logout: Firebase auth not initialized.");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Still clear local state even if Firebase logout fails
      localStorage.removeItem("newUser");
    }
  };

  // Render a loader while initializing to prevent blank screen
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white bg-black">
        Initializing user session...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);
