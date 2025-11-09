import { createContext, useEffect, useState, useContext } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.error(
        "Firebase auth not initialized. Check your environment variables."
      );
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          if (!db) {
            console.error("Firebase db not initialized.");
            setUser(currentUser);
          } else {
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const userData = docSnap.data();
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
            } else setUser(currentUser);
          }
        } catch (err) {
          console.error(err);
          setUser(currentUser);
        }
      } else setUser(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]); // Add dependencies to force re-run if auth or db change

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    } else {
      console.error("Cannot logout: Firebase auth not initialized.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Add this at the bottom
export const useAuth = () => useContext(AuthContext);
