import { createContext, useEffect, useState, useContext } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  console.log("AuthProvider initializing");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        currentUser ? "User logged in" : "No user"
      );

      if (currentUser) {
        try {
          if (!db) {
            console.error("Firebase db not initialized.");
            setUser(currentUser);
          } else {
            console.log("Fetching user data from Firestore...");
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const userData = docSnap.data();
              console.log("User data found:", userData);
              setUser({
                ...currentUser,
                ...userData,
                avatar: userData.avatar || "/defaultpfp.png",
                wardrobe: userData.wardrobe || [],
                tryHistory: userData.tryHistory || [],
                totalTryCount: userData.totalTryCount || 0,
                totalUploads: userData.totalUploads || 0,
                freeTryonsLeft: userData.freeTryonsLeft || 15,
                profileCompleted: userData.profileCompleted || false,
              });
            } else {
              console.log("No user data found in Firestore, using basic user");
              setUser(currentUser);
            }
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, []); // empty dependency array to run only once on mount

  const logout = async () => {
    if (auth) {
      await signOut(auth);
      setUser(null); // ensure state is cleared
    } else {
      console.error("Cannot logout: Firebase auth not initialized.");
    }
  };

  // Render a loader while initializing to prevent blank screen
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
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
