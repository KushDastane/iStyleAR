import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase/config";
import { toast } from "react-toastify";
import { useAuth } from "../../context/useAuth";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import CreativeCarousel from "../../Components/CreativeCarousel";

export default function UserTryOn() {
  const { user } = useAuth();
  const [freeTryonsLeft, setFreeTryonsLeft] = useState(0);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [selectedDress, setSelectedDress] = useState(null);
  const [tryOnImage, setTryOnImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);

  const sizes = ["S", "M", "L", "XL", "XXL"];

  // Fetch user free try-ons
  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setFreeTryonsLeft(userDoc.data().freeTryonsLeft ?? 15);
      } else {
        await updateDoc(doc(db, "users", user.uid), { freeTryonsLeft: 15 });
        setFreeTryonsLeft(15);
      }
    };
    fetchUserData();
  }, [user]);

  // Fetch wardrobe items
  useEffect(() => {
    if (!user) return;
    const fetchWardrobe = async () => {
      const wardrobeSnap = await getDocs(
        collection(db, "users", user.uid, "wardrobe")
      );
      const items = wardrobeSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWardrobeItems(items);
      if (items.length > 0 && !selectedDress) setSelectedDress(items[0]);
    };
    fetchWardrobe();
  }, [user]);

  const handleCaptureTryOn = () => {
    if (!selectedDress) return toast.error("Select a dress first!");
    setTryOnImage(selectedDress.imageUrl);
  };

  const handleUploadTryOn = async () => {
    if (!tryOnImage) return toast.error("Capture your try-on first!");
    if (freeTryonsLeft <= 0) return toast.error("No free try-ons left today!");
    setUploading(true);

    try {
      const tryOnRef = ref(
        storage,
        `tryfree/${user.uid}/tryOns/${Date.now()}_tryon.png`
      );
      const response = await fetch(tryOnImage);
      const blob = await response.blob();
      await uploadBytes(tryOnRef, blob);
      const tryOnUrl = await getDownloadURL(tryOnRef);

      await addDoc(collection(db, "users", user.uid, "tries"), {
        dressUrl: selectedDress.imageUrl,
        size: selectedSize,
        tryOnUrl,
        public: isPublic,
        rewardClaimed: false,
        timestamp: serverTimestamp(),
      });

      if (isPublic) {
        await addDoc(collection(db, "publicTries"), {
          dressUrl: selectedDress.imageUrl,
          tryOnUrl,
          userName: user.displayName ?? "Anonymous",
          size: selectedSize,
          timestamp: serverTimestamp(),
        });

        const userRef = doc(db, "users", user.uid);
        const newCount = freeTryonsLeft + 1;
        await updateDoc(userRef, { freeTryonsLeft: newCount });
        setFreeTryonsLeft(newCount);
        toast.success("Public try-on saved! +1 free try-on 🎉");
      } else toast.success("Private try-on saved!");

      setTryOnImage(null);
      setIsPublic(false);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed!");
    }

    setUploading(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50 flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-5xl font-extrabold text-indigo-600">
          Virtual Try-On
        </h1>
        <p className="text-gray-600 mt-2 text-sm md:text-base">
          Select dress → Choose size → Capture → Save
        </p>
      </div>

      {/* Free Try-ons */}
      <div className="mb-6 bg-white shadow-md rounded-full px-6 py-2">
        <span className="font-semibold text-gray-700">
          Free Try-Ons Left: {freeTryonsLeft}
        </span>
      </div>

      {/* Main Section */}
      <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-6">
        {/* Try-On Display */}
        <div className="w-full lg:w-1/2 min-h-[28rem] border rounded-xl shadow flex items-center justify-center bg-white overflow-hidden">
          {tryOnImage ? (
            <img
              src={tryOnImage}
              alt={selectedDress?.name || "tryon"}
              className="w-full h-full object-contain transition-all duration-300"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-xl animate-pulse">
              <p className="text-gray-500 text-center px-4">
                Your Try-On will appear here
              </p>
            </div>
          )}
        </div>

        {/* Wardrobe + Sizes */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="w-full bg-white rounded-xl shadow p-3">
            <CreativeCarousel
              items={wardrobeItems}
              selectedItem={selectedDress}
              onSelect={setSelectedDress}
            />
          </div>

          {selectedDress && (
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg font-medium shadow transition ${
                    selectedSize === size
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 w-full max-w-2xl">
        <button
          onClick={handleCaptureTryOn}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition"
        >
          Capture Try-On
        </button>

        {tryOnImage && (
          <label className="flex items-center space-x-2 text-gray-700">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Make Public & Earn Reward</span>
          </label>
        )}

        {tryOnImage && (
          <button
            onClick={handleUploadTryOn}
            disabled={uploading}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition"
          >
            {uploading ? "Uploading..." : "Save Try-On"}
          </button>
        )}
      </div>
    </div>
  );
}
