import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { useState, useRef, useEffect } from "react";
import {
  FaTshirt,
  FaCamera,
  FaStop,
  FaCheckCircle,
  FaArrowRight,
  FaVideo,
  FaPlay,
  FaRedo,
} from "react-icons/fa";
import ARWakeUpModal from "../../Components/ARWakeUpModal";

export default function TryFreePage() {
  const [selectedDress, setSelectedDress] = useState(null);
  const [stream, setStream] = useState(null);
  const [isLiveTryOn, setIsLiveTryOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const previewRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const processingRef = useRef(false);
  const isLiveTryOnRef = useRef(false);
  const lastOverlayRef = useRef(null);
  const BACKEND = import.meta.env.VITE_API_URL || "";
  const [showWakeModal, setShowWakeModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const poseDetectorRef = useRef(null);
  const poseLandmarksRef = useRef([]);
  const smoothedPoseLandmarksRef = useRef([]);
  const clothingImageCacheRef = useRef(new Map());
  const clothingImageMetaRef = useRef(new Map());
  const overlayStateRef = useRef(null);
  const frameCounterRef = useRef(0);


  // computed health url used by modal
  const healthUrl = BACKEND
    ? `${BACKEND.replace(/\/$/, "")}/health`
    : "/health";

  const demoClothes = [
    {
      id: 1,
      name: "Men's Suit",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1762707319/wardrobe/4uXaATkQjpPuy71gWKh1LRC25hz1/wjcjyy0dpm04xsxpj9ls.png",
    },
    {
      id: 2,
      name: "Female Dupatta",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1762706947/wardrobe/4uXaATkQjpPuy71gWKh1LRC25hz1/u66buogxqfneg1flxysr.png",
    },
    {
      id: 3,
      name: "Unisex Tshirt",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1762696034/wardrobe/tE1OmRIo9BPuVVyoyWROLjeGeWM2/bko2pmrn2hn5nkrectkn.png",
    },
  ];

  const handleDressSelect = (dress) => {
    setSelectedDress(dress);
    setTimeout(() => {
      previewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
  };


  useEffect(() => {
    async function loadDetector() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        poseDetectorRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        console.log("Pose model loaded");
      } catch (err) {
        console.error("Failed to load pose detector", err);
      }
    }
    loadDetector();
  }, []);

  const computeImageContentMetrics = (img) => {
    try {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) return null;
      const maxDim = 512;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const sw = Math.max(1, Math.round(w * scale));
      const sh = Math.max(1, Math.round(h * scale));
      const off = document.createElement("canvas");
      off.width = sw;
      off.height = sh;
      const octx = off.getContext("2d", { willReadFrequently: true });
      octx.clearRect(0, 0, sw, sh);
      octx.drawImage(img, 0, 0, sw, sh);
      const data = octx.getImageData(0, 0, sw, sh).data;
      let minX = sw, minY = sh, maxX = -1, maxY = -1;
      for (let y = 0; y < sh; y += 1) {
        for (let x = 0; x < sw; x += 1) {
          if (data[(y * sw + x) * 4 + 3] > 8) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < minX || maxY < minY) return null;
      const cropW = Math.max(1, maxX - minX + 1);
      const cropH = Math.max(1, maxY - minY + 1);
      let neckRow = Math.round(cropH * 0.12);
      for (let y = minY; y <= maxY; y += 1) {
        let covered = 0;
        for (let x = minX; x <= maxX; x += 1) {
          if (data[(y * sw + x) * 4 + 3] > 16) covered += 1;
        }
        if (covered / cropW >= 0.22) {
          neckRow = y - minY;
          break;
        }
      }
      return {
        sxNorm: minX / sw, syNorm: minY / sh,
        swNorm: cropW / sw, shNorm: cropH / sh,
        aspect: cropH / cropW, neckNorm: neckRow / cropH,
      };
    } catch { return null; }
  };

  const preloadDressImage = (imageUrl) => {
    if (!imageUrl) return Promise.resolve(null);
    const cached = clothingImageCacheRef.current.get(imageUrl);
    if (cached) return Promise.resolve(cached);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        clothingImageCacheRef.current.set(imageUrl, img);
        clothingImageMetaRef.current.set(imageUrl, computeImageContentMetrics(img));
        resolve(img);
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  useEffect(() => {
    if (selectedDress?.img) {
      preloadDressImage(selectedDress.img).catch(console.error);
    }
  }, [selectedDress]);

  const computeOverlayTransform = (poseLandmarks, canvasWidth, canvasHeight) => {
    const pose = poseLandmarks?.[0];
    if (!pose || pose.length < 25) return null;
    const leftShoulder = pose[11], rightShoulder = pose[12], leftHip = pose[23], rightHip = pose[24];
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;
    const shoulderCx = ((leftShoulder.x + rightShoulder.x) * 0.5) * canvasWidth;
    const shoulderCy = ((leftShoulder.y + rightShoulder.y) * 0.5) * canvasHeight;
    const hipCx = ((leftHip.x + rightHip.x) * 0.5) * canvasWidth;
    const hipCy = ((leftHip.y + rightHip.y) * 0.5) * canvasHeight;
    const shoulderSpan = Math.hypot((rightShoulder.x - leftShoulder.x) * canvasWidth, (rightShoulder.y - leftShoulder.y) * canvasHeight);
    const hipSpan = Math.hypot((rightHip.x - leftHip.x) * canvasWidth, (rightHip.y - leftHip.y) * canvasHeight);
    const torsoHeight = Math.hypot(hipCx - shoulderCx, hipCy - shoulderCy);

    const itemName = selectedDress?.name?.toLowerCase() || "";
    const isAccessory = itemName.includes("muffler") || itemName.includes("scarf") || itemName.includes("tie");
    const widthBaseMult = isAccessory ? 0.75 : 1.75;
    const heightBaseMult = isAccessory ? 1.0 : 1.75;

    const width = Math.max(isAccessory ? 80 : 160, shoulderSpan * widthBaseMult);
    const height = Math.max(width * 1.35, torsoHeight * heightBaseMult);
    const centerX = shoulderCx;
    const collarLift = torsoHeight * 0.14;
    const centerY = shoulderCy - collarLift + height * 0.5;
    let angle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x);
    if (angle > Math.PI / 2) angle -= Math.PI;
    if (angle < -Math.PI / 2) angle += Math.PI;
    angle = Math.max(-0.65, Math.min(0.65, angle));

    const shoulderZDelta = (rightShoulder.z ?? 0) - (leftShoulder.z ?? 0);
    const shoulderXSpan = Math.max(0.01, Math.abs(rightShoulder.x - leftShoulder.x));
    const yawRatio = shoulderZDelta / shoulderXSpan;
    const yawStrength = Math.min(1, Math.abs(yawRatio) * 0.25);
    const yawDirection = Math.sign(yawRatio) || 1;

    const torsoLean = (shoulderCx - hipCx) / Math.max(1, torsoHeight);
    const shoulderAngle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x);
    const hipAngle = Math.atan2(rightHip.y - leftHip.y, rightHip.x - leftHip.x);
    const torsoTwist = Math.atan2(Math.sin(shoulderAngle - hipAngle), Math.cos(shoulderAngle - hipAngle));
    const taper = (shoulderSpan - hipSpan) / Math.max(1, hipSpan);

    const scaleX = Math.max(0.62, 1 - yawStrength * 0.45);
    const scaleY = Math.max(0.9, Math.min(1.12, 1 + taper * 0.08));
    const depthOffsetX = yawDirection * width * yawStrength * 0.08;
    const shearX = Math.max(-0.22, Math.min(0.22, torsoLean * 0.9 + torsoTwist * 0.45));
    const shoulderDrop = rightShoulder.y - leftShoulder.y;
    const hipDrop = rightHip.y - leftHip.y;
    const shearY = Math.max(-0.1, Math.min(0.1, (shoulderDrop - hipDrop) * 0.55));

    return { centerX, centerY, width, height, angle, scaleX, scaleY, shearX, shearY, depthOffsetX };
  };

  const smoothOverlayTransform = (current, previous, alpha) => {
    if (!current) return previous;
    if (!previous) return current;
    const angleDelta = Math.atan2(Math.sin(current.angle - previous.angle), Math.cos(current.angle - previous.angle));
    const MAX_ANGLE_STEP = 0.35;
    const safeDelta = Math.abs(angleDelta) > MAX_ANGLE_STEP ? Math.sign(angleDelta) * MAX_ANGLE_STEP : angleDelta;
    return {
      centerX: alpha * current.centerX + (1 - alpha) * previous.centerX,
      centerY: alpha * current.centerY + (1 - alpha) * previous.centerY,
      width: alpha * current.width + (1 - alpha) * previous.width,
      height: alpha * current.height + (1 - alpha) * previous.height,
      angle: previous.angle + alpha * safeDelta,
      scaleX: alpha * current.scaleX + (1 - alpha) * previous.scaleX,
      scaleY: alpha * current.scaleY + (1 - alpha) * previous.scaleY,
      depthOffsetX: alpha * (current.depthOffsetX ?? 0) + (1 - alpha) * (previous.depthOffsetX ?? 0),
      shearX: alpha * (current.shearX ?? 0) + (1 - alpha) * (previous.shearX ?? 0),
      shearY: alpha * (current.shearY ?? 0) + (1 - alpha) * (previous.shearY ?? 0),
    };
  };

  const drawClothingOverlay = (ctx, image, transform, contentMetrics) => {
    if (!ctx || !image || !transform) return;
    ctx.save();
    ctx.translate(transform.centerX + (transform.depthOffsetX ?? 0), transform.centerY);
    ctx.rotate(transform.angle);
    ctx.transform(1, transform.shearY ?? 0, transform.shearX ?? 0, 1, 0, 0);
    ctx.scale(transform.scaleX, transform.scaleY);
    const srcX = Math.round((contentMetrics?.sxNorm ?? 0) * image.naturalWidth);
    const srcY = Math.round((contentMetrics?.syNorm ?? 0) * image.naturalHeight);
    const srcW = Math.max(1, Math.round((contentMetrics?.swNorm ?? 1) * image.naturalWidth));
    const srcH = Math.max(1, Math.round((contentMetrics?.shNorm ?? 1) * image.naturalHeight));
    const contentAspect = contentMetrics?.aspect || transform.height / Math.max(1, transform.width);
    const fitWidthFromHeight = transform.height / Math.max(0.2, contentAspect);
    const drawWidth = transform.width * 0.74 + fitWidthFromHeight * 0.26;
    const drawHeight = transform.height;
    const neckNorm = Math.max(0, Math.min(0.45, contentMetrics?.neckNorm ?? 0.12));
    const targetNeckLocalY = -drawHeight * 0.47;
    const sourceNeckLocalY = -drawHeight / 2 + neckNorm * drawHeight;
    const drawYOffset = targetNeckLocalY - sourceNeckLocalY;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.filter = "blur(1.2px)";
    ctx.drawImage(image, srcX, srcY, srcW, srcH, -drawWidth / 2 - 2, -drawHeight / 2 + drawYOffset - 2, drawWidth + 4, drawHeight + 4);
    ctx.restore();

    ctx.globalAlpha = 0.95;
    ctx.drawImage(image, srcX, srcY, srcW, srcH, -drawWidth / 2, -drawHeight / 2 + drawYOffset, drawWidth, drawHeight);
    ctx.restore();
  };

  const handleReset = () => {
    setSelectedDress(null);
    setIsLiveTryOn(false);
    isLiveTryOnRef.current = false;
    lastOverlayRef.current = null;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      return mediaStream;
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Unable to access webcam. Please allow camera permissions.");
      throw err;
    }
  };

  const smoothLandmarks = (currentLandmarks, previousLandmarks, alpha) => {
    if (!currentLandmarks?.length) return [];
    if (!previousLandmarks?.length) return currentLandmarks;

    return currentLandmarks.map((pose, poseIdx) => {
      const prevPose = previousLandmarks[poseIdx];
      if (!prevPose || prevPose.length !== pose.length) return pose;

      return pose.map((point, pointIdx) => {
        const prevPoint = prevPose[pointIdx];
        if (!prevPoint) return point;

        return {
          ...point,
          x: alpha * point.x + (1 - alpha) * prevPoint.x,
          y: alpha * point.y + (1 - alpha) * prevPoint.y,
          z: alpha * (point.z ?? 0) + (1 - alpha) * (prevPoint.z ?? 0),
        };
      });
    });
  };

  const processFrame = () => {
    if (
      !selectedDress ||
      !canvasRef.current ||
      !videoRef.current ||
      !isLiveTryOnRef.current
    ) {
      if (isLiveTryOnRef.current)
        animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    if (canvas.width === 0 || canvas.height === 0) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw video locally so mirrored CSS takes effect on both
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let poseResults = null;
    if (poseDetectorRef.current) {
      try {
        if (video.currentTime > 0) {
          poseResults = poseDetectorRef.current.detectForVideo(video, performance.now());
        }
      } catch (err) {
        console.error("Detection error:", err);
      }
    }

    const rawLandmarks = poseResults?.landmarks || [];
    const smoothedPose = smoothLandmarks(rawLandmarks, smoothedPoseLandmarksRef.current, 0.6);
    smoothedPoseLandmarksRef.current = smoothedPose;

    if (smoothedPose.length > 0) {
      const nextOverlay = computeOverlayTransform(smoothedPose, canvas.width, canvas.height);
      overlayStateRef.current = smoothOverlayTransform(nextOverlay, overlayStateRef.current, 0.6);
    }

    const dressImage = selectedDress?.img ? clothingImageCacheRef.current.get(selectedDress.img) : null;
    const dressMeta = selectedDress?.img ? clothingImageMetaRef.current.get(selectedDress.img) : null;
    const overlayTransform = overlayStateRef.current;

    if (dressImage && overlayTransform) {
      drawClothingOverlay(ctx, dressImage, overlayTransform, dressMeta);
    }

    if (isLiveTryOnRef.current) {
      animationRef.current = requestAnimationFrame(processFrame);
    }
  };

  const startLiveTryOn = () => {
    if (!selectedDress || !stream) return;
    setIsLiveTryOn(true);
    isLiveTryOnRef.current = true;
    setLoading(true);
    animationRef.current = requestAnimationFrame(processFrame);
    setTimeout(() => setLoading(false), 1000);
  };

  const stopLiveTryOn = () => {
    setIsLiveTryOn(false);
    isLiveTryOnRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    processingRef.current = false;
    setLoading(false);
  };

  // -------------------------
  // New: handleStartClick + onReady handler for the Wake modal
  // -------------------------
  const handleStartClick = async () => {
    // prevent double clicks
    setIsStarting(true);
    // show the mascot modal which will poll healthUrl
    setShowWakeModal(true);

    // optimistic ping to wake server quickly
    try {
      fetch(healthUrl, { method: "GET", cache: "no-store" }).catch(() => { });
    } catch (e) {
      // ignore
    }
  };

  const handleBackendReady = async () => {
    // modal detected backend is live
    // keep the mascot animation smooth: close modal (it has ready animation)
    setShowWakeModal(false);

    // Ensure webcam/permission is available — if not, start webcam
    try {
      if (!stream) {
        await startWebcam();
        // small delay to allow video element to attach and metadata to load
        await new Promise((r) => setTimeout(r, 250));
      }
    } catch (e) {
      // user denied camera or error — abort start
      setIsStarting(false);
      return;
    }

    // Start actual live try-on
    startLiveTryOn();

    // allow button to be clickable again (the live try-on UI has separate stop)
    setIsStarting(false);
  };

  // -------------------------

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-200">
            <FaTshirt className="text-white w-5 h-5" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-3 tracking-tight">
            Virtual Try-On Studio
          </h1>

          <p className="text-base text-slate-600 max-w-2xl mx-auto mb-6">
            Experience AI-powered fashion. Select an outfit and see it on
            yourself in real-time.
          </p>

          <a
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md group"
          >
            Sign In for more
            <FaArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Clothing-Selection */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Step 1
            </span>
            <h2 className="text-xl font-bold text-slate-800">
              Choose Your Outfit
            </h2>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            {demoClothes.map((dress) => (
              <div
                key={dress.id}
                onClick={() => handleDressSelect(dress)}
                className={`relative bg-white rounded-xl p-4 cursor-pointer transition-all duration-300 border-2 hover:scale-[1.015] hover:shadow-md transition-all
 ${selectedDress?.id === dress.id
                    ? "shadow-lg border-indigo-500 scale-[1.02]"
                    : "shadow-sm hover:shadow-md border-slate-200 hover:border-indigo-300"
                  }`}
              >
                <div className="w-24 h-24 flex items-center justify-center relative bg-slate-50 rounded-lg p-3">
                  <img
                    src={dress.img}
                    alt={dress.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {selectedDress?.id === dress.id && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-md">
                    <FaCheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <p className="mt-3 text-xs font-semibold text-slate-700 text-center">
                  {dress.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Section */}
        <div ref={previewRef} className="flex flex-col items-center">
          <div className="bg-white rounded-xl shadow-sm p-6 w-full border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Step 2
                </span>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FaVideo className="w-4 h-4 text-indigo-500" />
                  Live Preview
                </h2>
              </div>

              {isLiveTryOn && (
                <div className="flex items-center gap-2 text-xs px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                  <div className="relative flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full absolute animate-ping opacity-75"></div>
                  </div>
                  <span className="text-green-700 font-semibold">Live</span>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
              {/* Camera Feed */}

              <div className="md:col-span-2">
                <div
                  className="relative aspect-square md:aspect-video w-full rounded-lg overflow-hidden border bg-gradient-to-br from-white via-purple-50 to-purple-80
 border-slate-200 shadow-inner"
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{
                      display: stream ? "block" : "none",
                      transform: "scaleX(-1)",
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-cover absolute inset-0"
                    style={{ display: isLiveTryOn ? "block" : "none", transform: "scaleX(-1)" }}
                  />

                  {/* Idle / "Ready to Begin" overlay */}
                  {!stream && selectedDress && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      {/* Premium Background — z-0 so it sits behind UI */}
                      <div
                        className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center
                 bg-gradient-to-br from-[#0a0a0f] via-[#0d0d14] to-[#09090d] backdrop-blur-xl"
                      >
                        {/* Subtle floating neon glows */}
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Soft purple top-left bloom */}
                          <div className="absolute -top-16 -left-16 w-64 h-64 bg-purple-500/15 blur-[90px] rounded-full" />

                          {/* Slight pink/indigo bottom-right bloom */}
                          <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-500/10 blur-[100px] rounded-full" />

                          {/* Faint white center glow (VERY subtle) */}
                          <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-48 h-48 bg-white/5 blur-[120px] rounded-full"
                          />
                        </div>
                      </div>

                      {/* Foreground UI (ensure above background) */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="relative z-10 w-16 h-16 rounded-full bg-white/10 ring-1 ring-white/10 flex items-center justify-center mb-4">
                          <FaCamera className="w-7 h-7 text-white/90" />
                        </div>

                        <p className="relative z-10 text-lg font-semibold text-white/90 mb-1">
                          Ready to Begin
                        </p>
                        <p className="relative z-10 text-sm text-white/70 max-w-xs">
                          Activate your camera to start
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Stream present but no dress selected */}
                  {stream && !selectedDress && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <div className="relative z-10 w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                        <FaTshirt className="w-7 h-7 text-purple-600" />
                      </div>
                      <p className="relative z-10 text-lg font-semibold text-slate-800 mb-1">
                        Select an Outfit
                      </p>
                      <p className="relative z-10 text-sm text-slate-600">
                        Choose from the collection above
                      </p>
                    </div>
                  )}

                  {/* Loading overlay */}
                  {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95">
                      <div className="relative mb-4">
                        <div className="w-12 h-12 border-3 border-slate-200 rounded-full"></div>
                        <div className="w-12 h-12 border-3 border-t-indigo-500 border-r-purple-500 rounded-full animate-spin absolute top-0"></div>
                      </div>
                      <p className="text-slate-800 font-semibold text-sm">
                        Initializing AR...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Panel */}
              <div className="md:col-span-1">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    Actions
                  </h3>

                  <div className="space-y-2">
                    {selectedDress && !stream && (
                      <button
                        onClick={startWebcam}
                        className="w-full px-3 py-2.5 rounded-md bg-indigo-600 text-white text-sm 
  font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaCamera className="w-3.5 h-3.5" />
                        Activate Camera
                      </button>
                    )}

                    {stream && selectedDress && !isLiveTryOn && (
                      <button
                        onClick={handleStartClick}
                        className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                        disabled={isStarting}
                      >
                        <FaPlay className="w-3 h-3" />
                        {isStarting ? "Starting..." : "Start Try-On"}
                      </button>
                    )}

                    {isLiveTryOn && (
                      <button
                        onClick={stopLiveTryOn}
                        className="w-full px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                      >
                        <FaStop className="w-3 h-3" />
                        Stop Try-On
                      </button>
                    )}

                    <button
                      onClick={handleReset}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaRedo className="w-3 h-3" />
                      Reset
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Real-time Processing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>AI-Powered Fit</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>HD Quality</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AR Wake-up modal (mascot) */}
      <ARWakeUpModal
        open={showWakeModal}
        healthUrl={healthUrl}
        onReady={handleBackendReady}
        onClose={() => {
          setShowWakeModal(false);
          setIsStarting(false);
        }}
      />
    </section>
  );
}
