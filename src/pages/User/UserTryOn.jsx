import { useState, useEffect, useRef } from "react";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
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
import { FaRegEye, FaMagic, FaCamera, FaStop } from "react-icons/fa";
import axios from "axios";

export default function UserTryOn() {
  const { user } = useAuth();
  const [freeTryonsLeft, setFreeTryonsLeft] = useState(0);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [selectedDress, setSelectedDress] = useState(null);
  const [tryOnImage, setTryOnImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [stream, setStream] = useState(null);
  const [isLiveTryOn, setIsLiveTryOn] = useState(false);

  const [highlightLive, setHighlightLive] = useState(false);


  const sizes = ["S", "M", "L", "XL", "XXL"];
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastOverlayRef = useRef(null);
  const isProcessingRef = useRef(false);
  const isLiveTryOnRef = useRef(false);

  // Fetch free try-ons
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Start webcam
 const startWebcam = async () => {
   try {
     const mediaStream = await navigator.mediaDevices.getUserMedia({
       video: true,
     });
     setStream(mediaStream);

     await new Promise((resolve) => {
       const checkRef = setInterval(() => {
         if (videoRef.current) {
           clearInterval(checkRef);
           resolve();
         }
       }, 100);
     });

     videoRef.current.srcObject = mediaStream;

     try {
       await videoRef.current.play();

       // 👇 ADD THIS: highlight the LIVE button
       setHighlightLive(true);
       setTimeout(() => setHighlightLive(false), 4000);
     } catch (playErr) {
       console.error("Video play error:", playErr);
       alert(
         "Unable to play video. Please check your browser settings for autoplay."
       );
     }
   } catch (err) {
     console.error("Webcam error:", err);
     alert("Unable to access webcam. Please allow camera permissions.");
   }
 };


  // Process frame
  const processFrame = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    // Update canvas size if needed
    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    const ctx = canvas.getContext("2d");

    // Draw video first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw last overlay if available
    if (lastOverlayRef.current) {
      ctx.drawImage(lastOverlayRef.current, 0, 0, canvas.width, canvas.height);
    }

    // Only send to backend if not already processing
    if (!isProcessingRef.current && selectedDress?.imageUrl) {
      isProcessingRef.current = true;
      try {
        const frameData = canvas.toDataURL("image/jpeg").split(",")[1];
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/tryon`,
          {
            frame: frameData,
            shirtUrl: selectedDress.imageUrl,
          }
        );

        if (response.data.result) {
          const img = new Image();
          img.onload = () => {
            lastOverlayRef.current = img;
          };
          img.src = `data:image/jpeg;base64,${response.data.result}`;
        }
      } catch (err) {
        console.error("Backend error:", err);
      } finally {
        isProcessingRef.current = false;
      }
    }

    if (isLiveTryOnRef.current) {
      animationRef.current = requestAnimationFrame(processFrame);
    }
  };

  const startLiveTryOn = async () => {
    if (!selectedDress || !videoRef.current || !stream) return;

    // Wait for video to be ready
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

  const handleReset = () => {
    setSelectedDress(null);
    stopLiveTryOn();
    lastOverlayRef.current = null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCaptureTryOn = () => {
    if (!selectedDress) return toast.error("Select a dress first!");
    if (canvasRef.current && isLiveTryOn) {
      const url = canvasRef.current.toDataURL("image/png");
      setTryOnImage(url);
      stopLiveTryOn(); // Freeze the live try-on at this frame
    } else {
      setTryOnImage(selectedDress.imageUrl);
    }
  };

  const handleRetake = () => {
    setTryOnImage(null);
    setIsPublic(false);
    startLiveTryOn(); // Resume live try-on
  };

  const handleUploadTryOn = async () => {
    if (!tryOnImage) return toast.error("Capture your try-on first!");
    if (freeTryonsLeft <= 0) return toast.error("No free try-ons left today!");
    setUploading(true);

    try {
      // Upload to Cloudinary
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      const response = await fetch(tryOnImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", `tryons/${user.uid}`);

      const cloudinaryResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );

      const tryOnUrl = cloudinaryResponse.data.secure_url;

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
      } else {
        toast.success("Private try-on saved!");
      }

      setTryOnImage(null);
      setIsPublic(false);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed!");
    }

    setUploading(false);
  };

  return (
    <div
      className="
  relative min-h-screen 
  p-4 md:p-6 
  pb-32  /* <-- ADDED: space for bottom bar on phone */
  flex flex-col items-center 
  overflow-x-hidden
"
    >
      {/* Background & Header */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 opacity-50 -z-10"></div>
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-300/40 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-300/40 rounded-full blur-[120px] -z-10"></div>

      {/* Header */}
      <div className="text-center mb-8 relative bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white rounded-xl py-6 px-4 shadow-lg">
        <h1 className="text-2xl md:text-4xl font-extrabold flex items-center justify-center gap-2 tracking-tight">
          <FaMagic className="text-white/90" />
          Virtual Try-On
          <FaRegEye className="text-white/90" />
        </h1>
        <p className="mt-2 text-xs md:text-sm text-white/90 font-medium tracking-wide">
          Select • Size • Capture • Save
        </p>
      </div>

      {/* Try-on count */}
      <div className="mb-6 bg-white shadow-md rounded-full px-6 py-2">
        <span className="font-semibold text-gray-700">
          Free Try-Ons Left: {freeTryonsLeft}
        </span>
      </div>

      {/* MAIN SECTION */}
      <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-6">
        {/* Try-on Preview */}
        <div className="w-full lg:w-1/2 min-h-[28rem] border rounded-xl shadow flex items-center justify-center bg-white overflow-hidden relative">
          <div className="relative w-full aspect-square bg-black">
            {/* Live video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                transform: "scaleX(-1)",
                backgroundColor: "black",
                display: stream && !tryOnImage ? "block" : "none",
              }}
            />

            {/* Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{
                transform: "scaleX(-1)",
                opacity: isLiveTryOn ? 1 : 0,
                transition: "opacity 0.2s ease",
              }}
            />

            {/* Final screenshot / fallback */}
            {tryOnImage ? (
              <img
                src={tryOnImage}
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              !stream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
                  Your Try-On will appear here.
                </div>
              )
            )}
          </div>
        </div>

        {/* Wardrobe */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="w-full bg-white rounded-xl shadow p-3">
            {wardrobeItems.length > 0 ? (
              <CreativeCarousel
                items={wardrobeItems}
                selectedItem={selectedDress}
                onSelect={setSelectedDress}
              />
            ) : (
              <div className="flex items-center justify-center h-52 text-gray-500 text-center px-4">
                Add items in cart first
              </div>
            )}
          </div>

          {/* Size Picker */}
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

      {/* ACTION BAR (NON-FIXED, CLEAN, MODERN) */}
      {!tryOnImage ? (
        <div className="mt-6 w-full max-w-lg mx-auto">
          <div
            className="bg-white/90 backdrop-blur-xl shadow-lg rounded-2xl 
                    p-4 flex items-center justify-around"
          >
            {/* START / LIVE / STOP */}
            {!stream ? (
              <button
                onClick={startWebcam}
                className="flex flex-col items-center"
              >
                <FaCamera className="text-2xl text-blue-600" />
                <span className="text-xs font-medium mt-1 text-blue-700">
                  Start
                </span>
              </button>
            ) : !isLiveTryOn ? (
              <button
                onClick={startLiveTryOn}
                className={`flex flex-col items-center relative ${
                  highlightLive ? "live-ripple" : ""
                }`}
              >
                <FaMagic className="text-2xl text-purple-600" />
                <span className="text-xs font-medium mt-1 text-purple-700">
                  Live
                </span>
              </button>
            ) : (
              <button
                onClick={stopLiveTryOn}
                className="flex flex-col items-center"
              >
                <FaStop className="text-2xl text-red-600" />
                <span className="text-xs font-medium mt-1 text-red-700">
                  Stop
                </span>
              </button>
            )}

            {/* CAPTURE */}
            <button
              onClick={handleCaptureTryOn}
              className="flex flex-col items-center"
            >
              <FaRegEye className="text-2xl text-green-600" />
              <span className="text-xs font-medium mt-1 text-green-700">
                Capture
              </span>
            </button>

            {/* RESET */}
            <button
              onClick={handleReset}
              className="flex flex-col items-center"
            >
              <FaCamera className="text-xl rotate-180 text-gray-600" />
              <span className="text-xs font-medium mt-1 text-gray-700">
                Reset
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 w-full max-w-lg mx-auto">
          <div className="bg-white/95 backdrop-blur-xl shadow-lg rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex w-full justify-between">
              <button
                onClick={handleRetake}
                className="w-[48%] py-2 bg-orange-500 text-white rounded-lg font-medium"
              >
                Retake
              </button>

              <button
                onClick={handleUploadTryOn}
                disabled={uploading}
                className="w-[48%] py-2 bg-blue-600 text-white rounded-lg font-medium"
              >
                {uploading ? "Uploading..." : "Save"}
              </button>
            </div>

            {/* PUBLIC TOGGLE */}
            <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4"
              />
              Make Public + Earn Reward
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
