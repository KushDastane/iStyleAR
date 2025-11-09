import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import CreativeCarousel from "../../Components/CreativeCarousel";
import { FaRegEye, FaMagic } from "react-icons/fa";
import axios from "axios";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  writeBatch,
  arrayUnion,
  increment,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/config";

const DAILY_TRYON_LIMIT = 10;

export default function UserTryOn() {
  const [timeToReset, setTimeToReset] = useState("");
  const { user } = useAuth();
  const [freeTryonsLeft, setFreeTryonsLeft] = useState(0);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [isLoadingWardrobe, setIsLoadingWardrobe] = useState(true);
  const [selectedDress, setSelectedDress] = useState(null);
  const [tryOnImage, setTryOnImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [stream, setStream] = useState(null);
  const [isLiveTryOn, setIsLiveTryOn] = useState(false);

  const sizes = ["S", "M", "L", "XL", "XXL"];
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastOverlayRef = useRef(null);
  const isProcessingRef = useRef(false);
  const isLiveTryOnRef = useRef(false);

  // ⏰ Countdown to midnight reset
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0
      );
      const diff = midnight - now;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeToReset(
        `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds
          .toString()
          .padStart(2, "0")}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🧾 Fetch or create user doc + check reset
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      const userRef = doc(db, "users", user.uid);
      const today = new Date().toDateString();

      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          name: user.displayName ?? "Anonymous",
          email: user.email ?? "",
          totalTryCount: 0,
          tryHistory: [],
          freeTryonsLeft: DAILY_TRYON_LIMIT,
          lastReset: today,
          createdAt: serverTimestamp(),
        });
        setFreeTryonsLeft(DAILY_TRYON_LIMIT);
        return;
      }

      const data = snap.data();
      // Reset daily if last reset date differs
      if (data.lastReset !== today) {
        await setDoc(
          userRef,
          { freeTryonsLeft: DAILY_TRYON_LIMIT, lastReset: today },
          { merge: true }
        );
        setFreeTryonsLeft(DAILY_TRYON_LIMIT);
      } else {
        setFreeTryonsLeft(data.freeTryonsLeft ?? DAILY_TRYON_LIMIT);
      }
    };

    fetchUserData();
  }, [user]);

  // 🧥 Fetch wardrobe items
  useEffect(() => {
    if (!user) return;
    const fetchWardrobe = async () => {
      setIsLoadingWardrobe(true);
      try {
        const snap = await getDocs(
          collection(db, "users", user.uid, "wardrobe")
        );
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setWardrobeItems(items);
        if (items.length > 0 && !selectedDress) setSelectedDress(items[0]);
      } catch (err) {
        console.error("Error fetching wardrobe:", err);
      } finally {
        setIsLoadingWardrobe(false);
      }
    };
    fetchWardrobe();
  }, [user]);

  // 🧹 Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  // 🎥 Start webcam
  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Unable to access webcam. Please allow camera permissions.");
    }
  };

  // 🧠 Process frame with backend - optimized for network by downscaling canvas
  const processFrame = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (lastOverlayRef.current)
      ctx.drawImage(lastOverlayRef.current, 0, 0, canvas.width, canvas.height);

    if (!isProcessingRef.current && selectedDress?.imageUrl) {
      isProcessingRef.current = true;
      try {
        // Downscale canvas for network optimization - reduce to 50% size
        const downscaledCanvas = document.createElement("canvas");
        const downscaledCtx = downscaledCanvas.getContext("2d");
        downscaledCanvas.width = canvas.width * 0.5;
        downscaledCanvas.height = canvas.height * 0.5;
        downscaledCtx.drawImage(
          canvas,
          0,
          0,
          downscaledCanvas.width,
          downscaledCanvas.height
        );

        const frameData = downscaledCanvas
          .toDataURL("image/jpeg", 0.8)
          .split(",")[1]; // 0.8 quality for further compression
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/tryon`,
          {
            frame: frameData,
            shirtUrl: selectedDress.imageUrl,
          }
        );
        if (response.data?.result) {
          const img = new Image();
          img.onload = () => (lastOverlayRef.current = img);
          img.src = `data:image/jpeg;base64,${response.data.result}`;
        }
      } catch (err) {
        console.error("Try-on API error:", err);
      } finally {
        isProcessingRef.current = false;
      }
    }

    if (isLiveTryOnRef.current)
      animationRef.current = requestAnimationFrame(processFrame);
  };

  // 🎬 Start/Stop try-on
  const startLiveTryOn = async () => {
    if (!selectedDress || !videoRef.current || !stream) return;
    if (videoRef.current.readyState < 2) {
      setTimeout(startLiveTryOn, 200);
      return;
    }
    setIsLiveTryOn(true);
    isLiveTryOnRef.current = true;
    animationRef.current = requestAnimationFrame(processFrame);
  };
  const stopLiveTryOn = () => {
    setIsLiveTryOn(false);
    isLiveTryOnRef.current = false;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    isProcessingRef.current = false;
  };

  // 🔄 Reset try-on state
  const handleReset = () => {
    setSelectedDress(null);
    stopLiveTryOn();
    lastOverlayRef.current = null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // 📸 Capture frame - optimized for network by downscaling canvas
  const handleCaptureTryOn = async () => {
    if (!selectedDress) return toast.error("Select a dress first!");
    if (!canvasRef.current) return toast.error("No canvas available");
    setUploading(true);
    try {
      const canvas = canvasRef.current;
      // Downscale canvas for network optimization - reduce to 75% size for capture
      const downscaledCanvas = document.createElement("canvas");
      const downscaledCtx = downscaledCanvas.getContext("2d");
      downscaledCanvas.width = canvas.width * 0.75;
      downscaledCanvas.height = canvas.height * 0.75;
      downscaledCtx.drawImage(
        canvas,
        0,
        0,
        downscaledCanvas.width,
        downscaledCanvas.height
      );

      const frameData = downscaledCanvas
        .toDataURL("image/jpeg", 0.9)
        .split(",")[1]; // 0.9 quality for better capture quality
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/tryon`,
        {
          frame: frameData,
          shirtUrl: selectedDress.imageUrl,
          mode: "full",
        }
      );
      if (response.data.result) {
        setTryOnImage(`data:image/jpeg;base64,${response.data.result}`);
        stopLiveTryOn();
        toast.success("Try-on captured!");
      } else toast.error("Failed to capture try-on");
    } catch (err) {
      console.error("Capture error:", err);
      toast.error("Capture failed!");
    } finally {
      setUploading(false);
    }
  };

  // ☁️ Upload base64 image to Cloudinary
  const uploadToCloudinary = async (base64Image) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();
    formData.append("file", base64Image); // Direct base64 upload
    formData.append("upload_preset", uploadPreset);

    try {
      const uploadResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );
      return uploadResponse.data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Failed to upload image to Cloudinary");
    }
  };

  // ☁️ Upload to Cloudinary + Firestore
  const handleUploadTryOn = async () => {
    if (!tryOnImage) return toast.error("Capture your try-on first!");
    if (!user) return toast.error("User not authenticated");
    if (!selectedDress) return toast.error("Select a dress first!");
    if (freeTryonsLeft <= 0) return toast.error("No free try-ons left today!");

    setUploading(true);

    try {
      // Upload to Cloudinary
      const tryOnUrl = await uploadToCloudinary(tryOnImage);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      const batch = writeBatch(db);

      // Create user doc if not exists
      if (!userSnap.exists()) {
        batch.set(userRef, {
          name: user.displayName ?? "Anonymous",
          email: user.email ?? "",
          totalTryCount: 0,
          tryHistory: [],
          freeTryonsLeft: DAILY_TRYON_LIMIT,
          lastReset: new Date().toDateString(),
          createdAt: serverTimestamp(),
        });
      }

      const itemId = selectedDress?.id || selectedDress?.name || "unknown";
      const itemName = selectedDress?.name || "Unknown Item";
      const costumeImageUrl = selectedDress?.imageUrl || null;
      const userId = user.uid;
      const userName = user.displayName || "Anonymous";

      // Try history entry
      const tryHistoryEntry = {
        itemId,
        itemName,
        clothName: itemName,
        clothImageUrl: costumeImageUrl,
        tryOnUrl,
        resultURL: tryOnUrl,
        size: selectedSize,
        timestamp: Date.now(),
        public: isPublic,
      };

      // Add to user's 'tries' subcollection
      const triesRef = doc(collection(db, "users", user.uid, "tries"));
      batch.set(triesRef, {
        ...tryHistoryEntry,
        costumeImageUrl,
        rewardClaimed: false,
        timestamp: serverTimestamp(),
      });

      // Update user stats
      const newFreeCount = Math.max(0, freeTryonsLeft - 1);
      batch.update(userRef, {
        tryHistory: arrayUnion(tryHistoryEntry),
        totalTryCount: increment(1),
        freeTryonsLeft: newFreeCount,
      });

      if (isPublic) {
        const publicTriesRef = doc(db, "publicTries", `${itemId}_${userId}`);

        // Check if user already tried this item publicly
        const publicSnap = await getDoc(publicTriesRef);
        const isFirstPublicTry = !publicSnap.exists();

        // Save/update user's public try-on
        batch.set(publicTriesRef, {
          itemId,
          itemName,
          tryOnUrl,
          costumeImageUrl,
          userId,
          userName,
          timestamp: serverTimestamp(),
        });

        // Update item with uniqueUserCount and fashionPhotos
        const itemRef = doc(db, "items", itemId);
        const itemSnap = await getDoc(itemRef);
        const itemData = itemSnap.data() || {};
        const fashionPhotos = itemData.fashionPhotos || {};
        fashionPhotos[userId] = { userName, tryOnUrl };
        const update = { fashionPhotos };
        if (isFirstPublicTry) {
          update.uniqueUserCount = (itemData.uniqueUserCount || 0) + 1;
        }
        batch.set(itemRef, update, { merge: true });

        // Update global fashionStar
        // Find the user with the highest uniqueItemCount
        const allUsersQuery = query(collection(db, "users"));
        const allUsersSnap = await getDocs(allUsersQuery);
        let maxCount = 0;
        let fashionStarUser = null;
        for (const userDoc of allUsersSnap.docs) {
          const userData = userDoc.data();
          const userPublicTriesQuery = query(
            collection(db, "publicTries"),
            where("userId", "==", userDoc.id)
          );
          const userPublicTriesSnap = await getDocs(userPublicTriesQuery);
          const userDistinctItems = new Set(
            userPublicTriesSnap.docs.map((d) => d.data().itemId)
          );
          const userUniqueItemCount = userDistinctItems.size;
          if (userUniqueItemCount > maxCount) {
            maxCount = userUniqueItemCount;
            fashionStarUser = {
              userId: userDoc.id,
              userName: userData.name || userData.displayName || "Anonymous",
              tryOnUrl: fashionPhotos[userDoc.id]?.tryOnUrl || "",
            };
          }
        }
        if (fashionStarUser) {
          const fashionStarRef = doc(db, "global", "fashionStar");
          batch.set(fashionStarRef, fashionStarUser);
        }
      }

      await batch.commit();
      toast.success("Try-on saved successfully!");
      setFreeTryonsLeft(newFreeCount);
      setTryOnImage(null);
      setIsPublic(false);
    } catch (err) {
      console.error("Failed to upload/save try-on:", err);
      toast.error("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative min-h-screen p-4 md:p-6 flex flex-col items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 opacity-50 -z-10" />
      <div className="text-center mb-8 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white rounded-xl py-6 px-4 shadow-lg">
        <h1 className="text-2xl md:text-4xl font-extrabold flex items-center justify-center gap-2 tracking-tight">
          <FaMagic /> Virtual Try-On <FaRegEye />
        </h1>
        <p className="mt-2 text-xs md:text-sm text-white/90 font-medium tracking-wide">
          Select a dress • Choose your size • Capture • Save
        </p>
      </div>

      <div className="mb-6 bg-white shadow-md rounded-xl px-6 py-3 text-center">
        <div className="font-semibold text-gray-800 text-lg">
          Free Try-Ons Left:{" "}
          <span className="text-indigo-700">{freeTryonsLeft}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Resets in{" "}
          <span className="font-semibold text-indigo-600">{timeToReset}</span>
        </div>
      </div>

      {/* Main Try-On Section */}
      <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-6">
        <div className="w-full lg:w-1/2 min-h-[28rem] border rounded-xl shadow bg-white relative overflow-hidden flex items-center justify-center">
          <div className="relative w-full h-full">
            {stream && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            )}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {!stream && !tryOnImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
                Your Try-On will appear here.
              </div>
            )}
            {!stream && tryOnImage && (
              <img
                src={tryOnImage}
                alt="tryon"
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
          </div>
        </div>

        {/* Wardrobe + Size */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="w-full bg-white rounded-xl shadow p-3">
            {isLoadingWardrobe ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Loading wardrobe...</span>
              </div>
            ) : wardrobeItems.length > 0 ? (
              <CreativeCarousel
                items={wardrobeItems}
                selectedItem={selectedDress}
                onSelect={setSelectedDress}
              />
            ) : (
              <div className="flex items-center justify-center h-52 text-gray-500">
                Add items to wardrobe first
              </div>
            )}
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

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 w-full max-w-2xl">
        {!stream ? (
          <button
            onClick={startWebcam}
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Start Webcam
          </button>
        ) : !isLiveTryOn ? (
          <button
            onClick={startLiveTryOn}
            className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg"
          >
            Start Live Try-On
          </button>
        ) : (
          <button
            onClick={stopLiveTryOn}
            className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg"
          >
            Stop Live Try-On
          </button>
        )}

        <button
          onClick={handleCaptureTryOn}
          className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg"
        >
          Capture Try-On
        </button>
        <button
          onClick={handleReset}
          className="flex-1 px-6 py-2 bg-gray-600 text-white rounded-lg"
        >
          Reset
        </button>

        {tryOnImage && (
          <>
            <label className="flex items-center space-x-2 text-gray-700">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span>Make Public</span>
            </label>
            <button
              onClick={handleUploadTryOn}
              disabled={uploading || freeTryonsLeft <= 0}
              className={`flex-1 px-6 py-2 rounded-lg text-white ${
                uploading
                  ? "bg-gray-400"
                  : freeTryonsLeft <= 0
                  ? "bg-gray-500"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {uploading
                ? "Saving..."
                : freeTryonsLeft <= 0
                ? "No Try-Ons Left"
                : "Save Try-On"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
