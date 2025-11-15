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

// Gesture controller import
import {
  createHandDetector,
  detectGesture,
} from "../../utils/gestureController";

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
  const [showPalmHint, setShowPalmHint] = useState(false);

  // Gesture / helper UI
  const [gestureMessage, setGestureMessage] = useState("");
  const [showGestureGuide, setShowGestureGuide] = useState(false); // always during live
  const [showDistanceWarning, setShowDistanceWarning] = useState(false);

  // Countdown 3→2→1
  const [countdown, setCountdown] = useState(null);

  const sizes = ["S", "M", "L", "XL", "XXL"];
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastOverlayRef = useRef(null);
  const isProcessingRef = useRef(false);
  const overlayFrozenRef = useRef(false); // 🔥 NEW: freeze backend calls during countdown
  const isLiveTryOnRef = useRef(false);
  const carouselRef = useRef(null);
  const selectedDressRef = useRef(null);

  const detectorRef = useRef(null);
  const lastGestureTimeRef = useRef(0);
  const missedFramesRef = useRef(0);

  const captureButtonRef = useRef(null);
  const cameraSectionRef = useRef(null);

  useEffect(() => {
    if (cameraSectionRef.current) {
      // small timeout ensures full layout rendered
      setTimeout(() => {
        cameraSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
    }
  }, []);

  // ---------------- FETCH USER / WARDROBE ----------------

  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setFreeTryonsLeft(snap.data().freeTryonsLeft ?? 15);
      } else {
        await updateDoc(doc(db, "users", user.uid), { freeTryonsLeft: 15 });
        setFreeTryonsLeft(15);
      }
    };
    fetchUser();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchWardrobe = async () => {
      const snap = await getDocs(collection(db, "users", user.uid, "wardrobe"));
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setWardrobeItems(items);
      if (items.length > 0 && !selectedDress) setSelectedDress(items[0]);
    };
    fetchWardrobe();
  }, [user]);

  // ---------------- LOAD HAND DETECTOR ----------------

  useEffect(() => {
    async function loadDetector() {
      try {
        detectorRef.current = await createHandDetector();
        console.log("Hand detector loaded");
      } catch (err) {
        console.error("Failed to load hand detector", err);
      }
    }
    loadDetector();
  }, []);

  // ---------------- CLEANUP ----------------

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      isLiveTryOnRef.current = false;
    };
  }, [stream]);

  // Sync selected dress with ref
  useEffect(() => {
    selectedDressRef.current = selectedDress || null;
    lastOverlayRef.current = null;
    isProcessingRef.current = false;
  }, [selectedDress]);

  // ---------------- START WEBCAM ----------------

  const startWebcam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(s);

      await new Promise((resolve) => {
        const check = setInterval(() => {
          if (videoRef.current) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });

      videoRef.current.srcObject = s;
      await videoRef.current.play();

      setHighlightLive(true);
      setTimeout(() => setHighlightLive(false), 4000);
    } catch (err) {
      console.error(err);
      alert("Unable to access webcam. Please allow camera permissions.");
    }
  };

  // ---------------- FRAME PROCESSING (OVERLAY) ----------------

  const processFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw live video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw last known overlay (frozen or live)
    if (lastOverlayRef.current) {
      ctx.drawImage(lastOverlayRef.current, 0, 0, canvas.width, canvas.height);
    }

    const currentDress = selectedDressRef.current;

    // 🔥 KEY PART: DO NOT CALL BACKEND WHEN OVERLAY IS FROZEN (countdown)
    if (
      !overlayFrozenRef.current &&
      !isProcessingRef.current &&
      currentDress?.imageUrl
    ) {
      isProcessingRef.current = true;
      try {
        const frameData = canvas.toDataURL("image/jpeg").split(",")[1];
        const dressIdAtRequestTime = currentDress.id;

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/tryon`,
          {
            frame: frameData,
            shirtUrl: currentDress.imageUrl,
          }
        );

        if (response.data.result) {
          const img = new Image();
          img.onload = () => {
            // Ignore outdated responses
            if (
              !selectedDressRef.current ||
              selectedDressRef.current.id !== dressIdAtRequestTime
            ) {
              return;
            }
            lastOverlayRef.current = img;
          };
          img.src = `data:image/png;base64,${response.data.result}`;
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

  // ---------------- COUNTDOWN + FREEZE OVERLAY ----------------

  const startCountdownCapture = () => {
    // ⛔ Stop backend updates but keep video moving
    overlayFrozenRef.current = true;
    setGestureMessage("✋ Hold still...");
    setCountdown(3);

    let current = 3;
    const intervalId = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        clearInterval(intervalId);
        setCountdown(null);
        setGestureMessage("");

        // At this point: video is on, overlay is frozen.
        // Capture current canvas frame as final image
        const canvas = canvasRef.current;
        if (canvas) {
          const url = canvas.toDataURL("image/png");
          setTryOnImage(url);
        }

        stopLiveTryOn();
      } else {
        setCountdown(current);
      }
    }, 1000);
  };

  // ---------------- GESTURE HANDLER ----------------

  const handleGesture = (g) => {
    const now = performance.now();
    // throttle so gestures don’t spam
    if (now - lastGestureTimeRef.current < 2500) return;
    lastGestureTimeRef.current = now;

    if (g === "CAPTURE") {
      // Start 3-2-1 timer & freeze overlay
      startCountdownCapture();
      return;
    }

    if (!wardrobeItems.length || !selectedDressRef.current) return;

    const idx = wardrobeItems.findIndex(
      (i) => i.id === selectedDressRef.current.id
    );
    const safeIdx = idx === -1 ? 0 : idx;

    if (g === "NEXT") {
      const nextIndex = (safeIdx + 1) % wardrobeItems.length;
      const nextDress = wardrobeItems[nextIndex];
      setSelectedDress(nextDress);
      setGestureMessage("👍 Next Dress");
      carouselRef.current?.slideTo(nextIndex);
    }

    if (g === "PREV") {
      const prevIndex =
        (safeIdx - 1 + wardrobeItems.length) % wardrobeItems.length;
      const prevDress = wardrobeItems[prevIndex];
      setSelectedDress(prevDress);
      setGestureMessage("👎 Previous Dress");
      carouselRef.current?.slideTo(prevIndex);
    }
  };

  // ---------------- GESTURE DETECTION LOOP ----------------

  const startGestureDetection = () => {
    const video = videoRef.current;
    if (!video || !detectorRef.current) return;

    const detectLoop = async (t) => {
      if (!isLiveTryOnRef.current) return;

      const results = await detectorRef.current.detectForVideo(
        video,
        t || performance.now()
      );

      const landmarks = results?.landmarks;
      const gesture = detectGesture(landmarks);

      if (gesture) {
        missedFramesRef.current = 0;
        setShowDistanceWarning(false);
        handleGesture(gesture);
      } else {
        missedFramesRef.current += 1;
        if (missedFramesRef.current > 90) {
          setShowDistanceWarning(true);
        }
      }

      requestAnimationFrame(detectLoop);
    };

    requestAnimationFrame(detectLoop);
  };

  // ---------------- LIVE TRY-ON TOGGLE ----------------

  const startLiveTryOn = () => {
    if (!selectedDress || !videoRef.current || !stream) {
      toast.error("Start camera and select a dress first.");
      return;
    }

    if (videoRef.current.readyState < 2) {
      setTimeout(startLiveTryOn, 200);
      return;
    }

    setIsLiveTryOn(true);
    isLiveTryOnRef.current = true;
    setGestureMessage("");
    setCountdown(null);
    overlayFrozenRef.current = false;
    missedFramesRef.current = 0;
    setShowGestureGuide(true);
    setShowDistanceWarning(false);

    setShowPalmHint(true);
    setTimeout(() => setShowPalmHint(false), 4000);

    animationRef.current = requestAnimationFrame(processFrame);
    startGestureDetection();
  };

  const stopLiveTryOn = () => {
    setIsLiveTryOn(false);
    isLiveTryOnRef.current = false;
    setGestureMessage("");
    setCountdown(null);
    overlayFrozenRef.current = false;
    setShowGestureGuide(false);
    setShowDistanceWarning(false);
  };

  const handleReset = () => {
    setSelectedDress(null);
    stopLiveTryOn();
    lastOverlayRef.current = null;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setTryOnImage(null);
  };

  // Manual capture button (no gesture)
  const handleCaptureTryOn = () => {
    if (!selectedDress) return toast.error("Select a dress first!");
    if (canvasRef.current && isLiveTryOn) {
      const url = canvasRef.current.toDataURL("image/png");
      setTryOnImage(url);
      stopLiveTryOn();
    } else {
      setTryOnImage(selectedDress.imageUrl);
    }
  };

  const handleRetake = () => {
    setTryOnImage(null);
    setIsPublic(false);
    if (stream && selectedDress) {
      setIsLiveTryOn(true);
      isLiveTryOnRef.current = true;
      overlayFrozenRef.current = false;
      missedFramesRef.current = 0;
      setShowGestureGuide(true);
      setShowDistanceWarning(false);
      animationRef.current = requestAnimationFrame(processFrame);
      startGestureDetection();
    }
  };

  const handleUploadTryOn = async () => {
    if (!tryOnImage) return toast.error("Capture your try-on first!");
    if (freeTryonsLeft <= 0) return toast.error("No free try-ons left today!");
    setUploading(true);

    try {
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

  // ---------------- UI ----------------

  return (
    <div className="relative min-h-screen p-4 md:p-6 pb-32 flex flex-col items-center overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 opacity-50 -z-10" />

      {/* Header */}
      <div className="text-center mb-8 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white rounded-xl py-6 px-4 shadow-lg">
        <h1 className="text-2xl md:text-4xl font-extrabold flex items-center justify-center gap-2">
          <FaMagic />
          Virtual Try-On
          <FaRegEye />
        </h1>
        <p className="mt-2 text-xs md:text-sm text-white/90">
          Select • Size • Capture • Save
        </p>
      </div>

      {/* Try-on count */}
      <div className="mb-6 bg-white shadow-md rounded-full px-6 py-2">
        <span className="font-semibold text-gray-700">
          Free Try-Ons Left: {freeTryonsLeft}
        </span>
      </div>

      {/* MAIN */}
      <div
        ref={cameraSectionRef}
        className="flex flex-col lg:flex-row w-full max-w-6xl gap-6"
      >
        {/* Camera */}
        <div
          className="w-full lg:w-1/2 min-h-[28rem] border rounded-xl shadow bg-white overflow-hidden relative flex items-center justify-center
"
        >
          <div className="relative w-full aspect-square bg-black">
            {/* Gesture message */}
            {gestureMessage && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-xl text-sm z-50">
                {gestureMessage}
              </div>
            )}

            {/* Palm hint */}
            {showPalmHint && !gestureMessage && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-xl text-sm backdrop-blur-sm animate-pulse z-40">
                ✋ Show your palm to capture
              </div>
            )}

            {/* Big centered countdown */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                <span className="text-white text-7xl md:text-8xl font-extrabold animate-pulse drop-shadow-lg">
                  {countdown}
                </span>
              </div>
            )}

            {/* Gesture helper box (always during live) */}
            {isLiveTryOn && showGestureGuide && (
              <div className="absolute top-4 right-4 w-36 h-40 border-2 border-white/60 rounded-xl bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none z-40">
                <p className="text-white/90 text-xs mb-2 font-medium">
                  Gesture Area
                </p>
                <div className="flex flex-col gap-2 text-xs text-white/90">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👍</span>
                    <span>Next</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👎</span>
                    <span>Previous</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✋</span>
                    <span>Capture</span>
                  </div>
                </div>
              </div>
            )}

            {/* Distance warning */}
            {isLiveTryOn && showDistanceWarning && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm animate-pulse z-50">
                Move your hand closer to the camera
              </div>
            )}

            {/* Video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                transform: "scaleX(-1)",
                display: stream && !tryOnImage ? "block" : "none",
              }}
            />

            {/* Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none object-cover"
              style={{
                transform: "scaleX(-1)",
                opacity: isLiveTryOn ? 1 : 0,
                transition: "opacity 0.2s ease",
              }}
            />

            {/* Final captured screenshot */}
            {tryOnImage && (
              <img
                src={tryOnImage}
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
            {/* Glassmorphism Placeholder - DARK */}
            {/* FULL-SURFACE Glassmorphism Placeholder */}
            {!stream && !tryOnImage && (
              <div
                className="absolute inset-0 flex items-center justify-center z-20
                  bg-gradient-to-br from-black/60 via-black/40 to-black/20
                  backdrop-blur-xl object-cover"
              >
                {/* Floating gradients */}
                <div className="absolute inset-0">
                  <div className="absolute -top-10 -left-10 w-52 h-52 bg-purple-500/20 blur-3xl rounded-full"></div>
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full"></div>
                </div>

                {/* Center content */}
                <div className="relative flex flex-col items-center text-center px-4">
                  <FaCamera className="text-white/90 text-6xl drop-shadow-[0_0_18px_rgba(255,255,255,0.25)] mb-6" />

                  <h2 className="text-white font-semibold text-lg tracking-wide">
                    Camera is Off
                  </h2>

                  <p className="text-gray-300 text-sm mt-1">
                    Tap{" "}
                    <span className="text-indigo-300 font-semibold">Start</span>{" "}
                    to turn it on
                  </p>

                  <div className="mt-4 text-[11px] text-gray-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
                    <span>Privacy: Video is never stored</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wardrobe */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow p-3">
            {wardrobeItems.length > 0 ? (
              <CreativeCarousel
                ref={carouselRef}
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
            <div className="flex flex-col items-center mt-2 w-full">
              {/* Size Buttons */}
              <div className="flex flex-wrap justify-center gap-3">
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

              {/* Soft Glow Aura (behind size buttons) */}
              <div className="relative w-full h-10 mt-2 pointer-events-none">
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-[-20px]
        w-48 h-48 bg-indigo-500/20 blur-3xl rounded-full"
                ></div>
              </div>

              {/* Minimal Aesthetic Divider */}
              <div className="w-full flex flex-col items-center mt-[-4px] mb-2">
                <div className="w-24 h-[1px] bg-neutral-300 rounded-full"></div>

                <p className="mt-2 text-[11px] text-neutral-500 tracking-wide">
                  Immerse | Try | Capture
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACTION BAR */}
      {!tryOnImage ? (
        <div className="mt-6 w-full max-w-lg mx-auto">
          <div className="bg-white/90 backdrop-blur-xl shadow-lg rounded-2xl p-4 flex items-center justify-around">
            {/* CAMERA START */}
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

            {/* Manual Capture */}
            <button
              ref={captureButtonRef}
              onClick={handleCaptureTryOn}
              className="flex flex-col items-center"
            >
              <FaRegEye className="text-2xl text-green-600" />
              <span className="text-xs font-medium mt-1 text-green-700">
                Capture
              </span>
            </button>

            {/* Reset */}
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
        // After capture (Retake / Save)
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
