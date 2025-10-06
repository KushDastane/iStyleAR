import { useState, useEffect, useRef } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase/config";
import { toast } from "react-toastify";
import { useAuth } from "../../context/useAuth";
import { useLocation } from "react-router-dom";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function UserTryOn() {
  const { user } = useAuth();
  const location = useLocation();
  const clothFromState = location.state?.cloth;
  const [freeTryonsLeft, setFreeTryonsLeft] = useState(0);
  const [selectedDress, setSelectedDress] = useState(null);
  const [tryOnImage, setTryOnImage] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);

  // eslint-disable-next-line no-unused-vars
  const canvasRef = useRef(null); // optional for AR rendering

  // Preloaded catalog of clothes (can be replaced with Firestore images later)
  const catalog = [
    { id: 1, name: "Red Shirt", img: "/assets/shirts/red.png" },
    { id: 2, name: "Blue Jacket", img: "/assets/shirts/blue.png" },
    { id: 3, name: "Green Hoodie", img: "/assets/shirts/green.png" },
    { id: 4, name: "Yellow T-Shirt", img: "/assets/shirts/yellow.png" },
    { id: 5, name: "Gray Coat", img: "/assets/shirts/gray.png" },
  ];

  // If cloth from state, add to catalog and select it
  useEffect(() => {
    if (clothFromState) {
      const wardrobeCloth = {
        id: clothFromState.id || 'wardrobe-' + Date.now(),
        name: clothFromState.name,
        img: clothFromState.imageUrl,
      };
      setSelectedDress(wardrobeCloth);
    }
  }, [clothFromState]);

  // Fetch user's free try-ons left
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setFreeTryonsLeft(userDoc.data().freeTryonsLeft ?? 15);
      } else {
        // Initialize user with 15 free try-ons
        await updateDoc(doc(db, "users", user.uid), { freeTryonsLeft: 15 });
        setFreeTryonsLeft(15);
      }
    };
    fetchData();
  }, [user]);

  // Capture try-on (mock capture for now)
  const handleCaptureTryOn = () => {
    if (!selectedDress) return toast.error("Select a dress first!");
    // Replace with AR canvas capture later
    setTryOnImage(selectedDress.img);
  };

  const handleUploadTryOn = async () => {
    if (!tryOnImage) return toast.error("Capture your try-on first!");
    if (freeTryonsLeft <= 0) return toast.error("No free try-ons left today!");

    setUploading(true);

    try {
      // 1️⃣ Upload try-on image
      const tryOnRef = ref(
        storage,
        `tryfree/${user.uid}/tryOns/${Date.now()}_tryon.png`
      );
      const response = await fetch(tryOnImage);
      const blob = await response.blob();
      await uploadBytes(tryOnRef, blob);
      const tryOnUrl = await getDownloadURL(tryOnRef);

      // 2️⃣ Save in user tries collection
      await addDoc(collection(db, "users", user.uid, "tries"), {
        dressUrl: selectedDress.img,
        tryOnUrl,
        public: isPublic,
        rewardClaimed: false,
        timestamp: serverTimestamp(),
      });

      // 3️⃣ If public, add to public gallery and reward user
      if (isPublic) {
        await addDoc(collection(db, "publicTries"), {
          dressUrl: selectedDress.img,
          tryOnUrl,
          userName: user.displayName ?? "Anonymous",
          timestamp: serverTimestamp(),
        });

        // Increment free try-ons
        const userRef = doc(db, "users", user.uid);
        const newCount = freeTryonsLeft + 1;
        await updateDoc(userRef, { freeTryonsLeft: newCount });
        setFreeTryonsLeft(newCount);

        toast.success("Public try-on saved! +1 free try-on 🎉");
      } else {
        toast.success("Private try-on saved!");
      }

      // Reset
      setTryOnImage(null);
      setIsPublic(false);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed!");
    }

    setUploading(false);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">Try-On AR</h1>
      <p className="mb-4 text-gray-600">
        Free try-ons left today: {freeTryonsLeft}
      </p>

      {/* Dress Catalog */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {catalog.map((dress) => (
          <div
            key={dress.id}
            className={`border-2 p-2 rounded-lg cursor-pointer ${
              selectedDress?.id === dress.id
                ? "border-blue-500"
                : "border-gray-300"
            }`}
            onClick={() => setSelectedDress(dress)}
          >
            <img
              src={dress.img}
              alt={dress.name}
              className="w-32 h-32 object-contain"
            />
            <p className="text-center mt-2">{dress.name}</p>
          </div>
        ))}
      </div>

      {/* Capture Try-On */}
      <button
        onClick={handleCaptureTryOn}
        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg mb-4"
      >
        Capture Try-On
      </button>

      {/* Try-On Preview */}
      {tryOnImage && (
        <div className="w-64 h-64 border-2 border-gray-300 rounded-md flex items-center justify-center mb-4">
          <img
            src={tryOnImage}
            alt="tryon"
            className="w-full h-full object-contain rounded-md"
          />
        </div>
      )}

      {/* Public / Private Option */}
      {tryOnImage && (
        <label className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4"
          />
          <span>Make this public & earn reward</span>
        </label>
      )}

      {/* Upload Button */}
      {tryOnImage && (
        <button
          onClick={handleUploadTryOn}
          disabled={uploading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Save Try-On"}
        </button>
      )}
    </div>
  );
}
