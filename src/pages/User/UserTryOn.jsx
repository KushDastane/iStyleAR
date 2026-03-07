import { useState, useEffect, useRef } from "react";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
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
import ARWakeUpModal from "../../Components/ARWakeUpModal";

import {
  createHandDetector,
  detectGesture,
} from "../../utils/gestureController";
import {
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

let handDetectorSingleton = null;
let handDetectorPromise = null;
let poseDetectorSingleton = null;
let poseDetectorPromise = null;

export default function UserTryOn() {
  const { user } = useAuth();
  const location = useLocation();
  const deepLinkedCloth = location.state?.cloth;

  const [freeTryonsLeft, setFreeTryonsLeft] = useState(0);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [selectedDress, setSelectedDress] = useState(deepLinkedCloth || null);
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
  const [showGestureGuide, setShowGestureGuide] = useState(false);
  const [showDistanceWarning, setShowDistanceWarning] = useState(false);

  // Countdown 3→2→1
  const [countdown, setCountdown] = useState(null);

  // AR Wake Up Modal
  const [showWakeUpModal, setShowWakeUpModal] = useState(false);
  const BACKEND = import.meta.env.VITE_API_URL || "";

  const healthUrl = BACKEND
    ? `${BACKEND.replace(/\/$/, "")}/health`
    : "/health";


  const sizes = ["S", "M", "L", "XL", "XXL"];
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null); // render RAF
  const detectionIntervalRef = useRef(null); // detection interval
  const clothingImageCacheRef = useRef(new Map());
  const overlayStateRef = useRef(null);
  const overlayFrozenRef = useRef(false);
  const isLiveTryOnRef = useRef(false);
  const isServerReadyRef = useRef(false);
  const carouselRef = useRef(null);
  const selectedDressRef = useRef(null);

  const detectorRef = useRef(null);
  const poseDetectorRef = useRef(null);
  const lastGestureTimeRef = useRef(0);
  const missedFramesRef = useRef(0);
  const lastLandmarksRef = useRef([]);
  const smoothedLandmarksRef = useRef([]);
  const isDetectingRef = useRef(false);
  const skippedDetectionRef = useRef(0);

  const captureButtonRef = useRef(null);
  const cameraSectionRef = useRef(null);

  // Performance Profiling Refs
  const frameCounterRef = useRef(0);
  const detectionTimeRef = useRef(0);
  const overlayComputeTimeRef = useRef(0);
  const frameCaptureTimeRef = useRef(0);
  const canvasDrawTimeRef = useRef(0);
  const totalFrameTimeRef = useRef(0);

  const MAX_CANVAS_WIDTH = 640;
  const DETECTION_INTERVAL_MS = 120; // ~8 FPS
  const SMOOTHING_ALPHA = 0.6;
  // Scroll into view on mount
  useEffect(() => {
    if (cameraSectionRef.current) {
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

      if (deepLinkedCloth) {
        setSelectedDress(deepLinkedCloth);
      } else if (items.length > 0 && !selectedDress) {
        setSelectedDress(items[0]);
      }
    };
    fetchWardrobe();
  }, [user, deepLinkedCloth]);

  // ---------------- LOAD HAND DETECTOR ----------------

  useEffect(() => {
    if ((detectorRef.current && poseDetectorRef.current) || (handDetectorSingleton && poseDetectorSingleton)) {
      detectorRef.current = handDetectorSingleton;
      poseDetectorRef.current = poseDetectorSingleton;
      return;
    }

    async function loadDetector() {
      try {
        if (!handDetectorPromise) {
          handDetectorPromise = createHandDetector();
        }
        if (!poseDetectorPromise) {
          poseDetectorPromise = (async () => {
            const vision = await FilesetResolver.forVisionTasks(
              "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            return PoseLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath:
                  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
              },
              runningMode: "VIDEO",
              numPoses: 1,
            });
          })();
        }

        const [handDetector, poseDetector] = await Promise.all([
          handDetectorPromise,
          poseDetectorPromise,
        ]);
        handDetectorSingleton = handDetector;
        poseDetectorSingleton = poseDetector;
        detectorRef.current = handDetector;
        poseDetectorRef.current = poseDetector;
        console.log("Hand and pose detectors loaded");
      } catch (err) {
        handDetectorPromise = null;
        poseDetectorPromise = null;
        console.error("Failed to load detectors", err);
      }
    }

    loadDetector();
  }, []);

  // ---------------- CLEANUP ----------------

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      isLiveTryOnRef.current = false;
      isDetectingRef.current = false;
    };
  }, [stream]);

  const preloadDressImage = (imageUrl) => {
    if (!imageUrl) return Promise.resolve(null);

    const cached = clothingImageCacheRef.current.get(imageUrl);
    if (cached) {
      if (cached.complete) return Promise.resolve(cached);
      return new Promise((resolve, reject) => {
        cached.onload = () => resolve(cached);
        cached.onerror = reject;
      });
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        clothingImageCacheRef.current.set(imageUrl, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  // Sync selected dress and preload clothing assets outside the frame loop
  useEffect(() => {
    selectedDressRef.current = selectedDress || null;
    overlayStateRef.current = null;

    if (selectedDress?.imageUrl) {
      preloadDressImage(selectedDress.imageUrl).catch((err) => {
        console.error("Failed to preload selected dress image", err);
      });
    }
  }, [selectedDress]);

  useEffect(() => {
    if (!wardrobeItems?.length) return;
    wardrobeItems.forEach((item) => {
      if (item?.imageUrl) {
        preloadDressImage(item.imageUrl).catch(() => {});
      }
    });
  }, [wardrobeItems]);

  // ---------------- START WEBCAM ----------------

  const startWebcam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(s);

      // Wait until video element exists
      await new Promise((resolve) => {
        const check = setInterval(() => {
          if (videoRef.current) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });

      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }

      setHighlightLive(true);
      setTimeout(() => setHighlightLive(false), 4000);
      return s;
    } catch (err) {
      console.error(err);
      alert("Unable to access webcam. Please allow camera permissions.");
      throw err;
    }
  };

  // ---------------- FRAME PROCESSING (OVERLAY) ----------------

  const smoothLandmarks = (currentLandmarks, previousLandmarks, alpha) => {
    if (!currentLandmarks?.length) return [];
    if (!previousLandmarks?.length) return currentLandmarks;

    return currentLandmarks.map((hand, handIdx) => {
      const prevHand = previousLandmarks[handIdx];
      if (!prevHand || prevHand.length !== hand.length) return hand;

      return hand.map((point, pointIdx) => {
        const prevPoint = prevHand[pointIdx];
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

  const syncCanvasSizeToVideo = (video, canvas) => {
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    const targetWidth = Math.min(videoWidth, MAX_CANVAS_WIDTH);
    const scale = targetWidth / videoWidth;
    const targetHeight = Math.max(1, Math.round(videoHeight * scale));

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
  };

  const computeOverlayTransform = (poseLandmarks, canvasWidth, canvasHeight) => {
    const pose = poseLandmarks?.[0];
    if (!pose || pose.length < 25) return null;

    const leftShoulder = pose[11];
    const rightShoulder = pose[12];
    const leftHip = pose[23];
    const rightHip = pose[24];
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

    const shoulderCx = ((leftShoulder.x + rightShoulder.x) * 0.5) * canvasWidth;
    const shoulderCy = ((leftShoulder.y + rightShoulder.y) * 0.5) * canvasHeight;
    const hipCx = ((leftHip.x + rightHip.x) * 0.5) * canvasWidth;
    const hipCy = ((leftHip.y + rightHip.y) * 0.5) * canvasHeight;

    const shoulderSpan = Math.hypot(
      (rightShoulder.x - leftShoulder.x) * canvasWidth,
      (rightShoulder.y - leftShoulder.y) * canvasHeight
    );
    const hipSpan = Math.hypot(
      (rightHip.x - leftHip.x) * canvasWidth,
      (rightHip.y - leftHip.y) * canvasHeight
    );
    const torsoHeight = Math.hypot(hipCx - shoulderCx, hipCy - shoulderCy);

    const width = Math.max(170, shoulderSpan * 1.9);
    const height = Math.max(width * 1.35, torsoHeight * 1.7);
    const centerX = shoulderCx;
    const centerY = shoulderCy + torsoHeight * 0.52;

    const rawAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    );
    // Normalize to prevent 180deg flips ("ulta") when pose landmarks jitter.
    let angle = rawAngle;
    if (angle > Math.PI / 2) angle -= Math.PI;
    if (angle < -Math.PI / 2) angle += Math.PI;
    const MAX_TILT_RAD = 0.65; // ~37deg
    angle = Math.max(-MAX_TILT_RAD, Math.min(MAX_TILT_RAD, angle));

    // Approximate yaw (side rotation) using shoulder depth difference + shoulder span.
    const shoulderZDelta = (rightShoulder.z ?? 0) - (leftShoulder.z ?? 0);
    const shoulderXSpan = Math.max(0.01, Math.abs(rightShoulder.x - leftShoulder.x));
    const yawRatio = shoulderZDelta / shoulderXSpan;
    const yawStrength = Math.min(1, Math.abs(yawRatio) * 0.25);
    const yawDirection = Math.sign(yawRatio) || 1;

    // Torso deformation signals (2.5D fit): lean + twist + taper.
    const torsoLean = (shoulderCx - hipCx) / Math.max(1, torsoHeight);
    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    );
    const hipAngle = Math.atan2(rightHip.y - leftHip.y, rightHip.x - leftHip.x);
    const torsoTwist = Math.atan2(
      Math.sin(shoulderAngle - hipAngle),
      Math.cos(shoulderAngle - hipAngle)
    );
    const taper = (shoulderSpan - hipSpan) / Math.max(1, hipSpan);

    // 2.5D effect: compress width on side turn and shift cloth slightly.
    const scaleX = Math.max(0.62, 1 - yawStrength * 0.45);
    const scaleY = Math.max(0.9, Math.min(1.12, 1 + taper * 0.08));
    const depthOffsetX = yawDirection * width * yawStrength * 0.08;

    // Affine torso skew to avoid rigid "sticker" look.
    const shearX = Math.max(-0.22, Math.min(0.22, torsoLean * 0.9 + torsoTwist * 0.45));
    const shoulderDrop = rightShoulder.y - leftShoulder.y;
    const hipDrop = rightHip.y - leftHip.y;
    const shearY = Math.max(-0.1, Math.min(0.1, (shoulderDrop - hipDrop) * 0.55));

    return {
      centerX,
      centerY,
      width,
      height,
      angle,
      scaleX,
      scaleY,
      shearX,
      shearY,
      depthOffsetX,
    };
  };

  const smoothOverlayTransform = (current, previous, alpha) => {
    if (!current) return previous;
    if (!previous) return current;

    const angleDelta = Math.atan2(
      Math.sin(current.angle - previous.angle),
      Math.cos(current.angle - previous.angle)
    );
    const MAX_ANGLE_STEP = 0.35; // ignore sudden pose glitches
    const safeDelta =
      Math.abs(angleDelta) > MAX_ANGLE_STEP
        ? Math.sign(angleDelta) * MAX_ANGLE_STEP
        : angleDelta;

    return {
      centerX: alpha * current.centerX + (1 - alpha) * previous.centerX,
      centerY: alpha * current.centerY + (1 - alpha) * previous.centerY,
      width: alpha * current.width + (1 - alpha) * previous.width,
      height: alpha * current.height + (1 - alpha) * previous.height,
      angle: previous.angle + alpha * safeDelta,
      scaleX: alpha * current.scaleX + (1 - alpha) * previous.scaleX,
      scaleY: alpha * current.scaleY + (1 - alpha) * previous.scaleY,
      depthOffsetX:
        alpha * (current.depthOffsetX ?? 0) +
        (1 - alpha) * (previous.depthOffsetX ?? 0),
      shearX: alpha * (current.shearX ?? 0) + (1 - alpha) * (previous.shearX ?? 0),
      shearY: alpha * (current.shearY ?? 0) + (1 - alpha) * (previous.shearY ?? 0),
    };
  };

  const getFallbackOverlayTransform = (canvasWidth, canvasHeight) => {
    const width = Math.max(180, canvasWidth * 0.48);
    const height = width * 1.35;
    return {
      centerX: canvasWidth * 0.5,
      centerY: canvasHeight * 0.56,
      width,
      height,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
      depthOffsetX: 0,
      shearX: 0,
      shearY: 0,
    };
  };

  const drawClothingOverlay = (ctx, image, transform) => {
    if (!ctx || !image || !transform) return;

    ctx.save();
    ctx.translate(
      transform.centerX + (transform.depthOffsetX ?? 0),
      transform.centerY
    );
    ctx.rotate(transform.angle);
    ctx.transform(1, transform.shearY ?? 0, transform.shearX ?? 0, 1, 0, 0);
    ctx.scale(transform.scaleX, transform.scaleY);
    ctx.drawImage(
      image,
      -transform.width / 2,
      -transform.height / 2,
      transform.width,
      transform.height
    );
    ctx.restore();
  };

  const processFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    syncCanvasSizeToVideo(video, canvas);

    const ctx = canvas.getContext("2d");
    const tStart = performance.now();

    // 1) Frame capture
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const tFrameCapture = performance.now() - tStart;

    // 2) Overlay compute + draw (GPU transform path)
    const tOverlayStart = performance.now();
    const selectedImageUrl = selectedDressRef.current?.imageUrl;
    const dressImage = selectedImageUrl
      ? clothingImageCacheRef.current.get(selectedImageUrl)
      : null;
    const overlayTransform =
      overlayStateRef.current || getFallbackOverlayTransform(canvas.width, canvas.height);

    if (!overlayFrozenRef.current && dressImage && overlayTransform) {
      drawClothingOverlay(ctx, dressImage, overlayTransform);
    }
    overlayComputeTimeRef.current = performance.now() - tOverlayStart;

    // Optional hand skeleton visualization
    if (isLiveTryOnRef.current && smoothedLandmarksRef.current?.length > 0) {
      try {
        drawLandmarks(ctx, smoothedLandmarksRef.current);
      } catch (err) {
        console.error("Error drawing landmarks:", err);
      }
    }

    const tCanvasDraw = performance.now() - tOverlayStart;
    const tTotal = performance.now() - tStart;

    frameCaptureTimeRef.current = tFrameCapture;
    canvasDrawTimeRef.current = tCanvasDraw;
    totalFrameTimeRef.current = tTotal;
    frameCounterRef.current += 1;

    if (frameCounterRef.current % 30 === 0) {
      console.log(`
Frame Diagnostics:
frame_capture_time = ${frameCaptureTimeRef.current.toFixed(2)} ms
detection_time = ${detectionTimeRef.current.toFixed(2)} ms
overlay_compute_time = ${overlayComputeTimeRef.current.toFixed(2)} ms
canvas_draw_time = ${canvasDrawTimeRef.current.toFixed(2)} ms
total_frame_time = ${totalFrameTimeRef.current.toFixed(2)} ms
skipped_detections = ${skippedDetectionRef.current}
      `);
      skippedDetectionRef.current = 0;
    }

    if (isLiveTryOnRef.current) {
      animationRef.current = requestAnimationFrame(processFrame);
    }
  };

  // ---------------- COUNTDOWN + FREEZE OVERLAY ----------------

  const startCountdownCapture = () => {
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
      carouselRef.current?.slideToItem(nextIndex);
    }

    if (g === "PREV") {
      const prevIndex =
        (safeIdx - 1 + wardrobeItems.length) % wardrobeItems.length;
      const prevDress = wardrobeItems[prevIndex];
      setSelectedDress(prevDress);
      setGestureMessage("👎 Previous Dress");
      carouselRef.current?.slideToItem(prevIndex);
    }
  };

  // ---------------- GESTURE DETECTION LOOP ----------------

  const startGestureDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(() => {
      if (!isLiveTryOnRef.current) return;

      const video = videoRef.current;
      const detector = detectorRef.current;
      const poseDetector = poseDetectorRef.current;
      if (!video || !detector) return;

      if (isDetectingRef.current) {
        skippedDetectionRef.current += 1;
        return;
      }

      isDetectingRef.current = true;
      const detectTimestamp = performance.now();

      (async () => {
        const tDetectStart = performance.now();
        try {
          const [results, poseResults] = await Promise.all([
            detector.detectForVideo(video, detectTimestamp),
            poseDetector
              ? poseDetector.detectForVideo(video, detectTimestamp)
              : Promise.resolve(null),
          ]);
          detectionTimeRef.current = performance.now() - tDetectStart;

          const rawLandmarks = results?.landmarks || [];
          lastLandmarksRef.current = rawLandmarks;

          const smoothedHands = smoothLandmarks(
            rawLandmarks,
            smoothedLandmarksRef.current,
            SMOOTHING_ALPHA
          );
          smoothedLandmarksRef.current = smoothedHands;

          const canvas = canvasRef.current;
          const poseLandmarks = poseResults?.landmarks || [];
          if (canvas && poseLandmarks.length > 0) {
            const nextOverlay = computeOverlayTransform(
              poseLandmarks,
              canvas.width,
              canvas.height
            );
            overlayStateRef.current = smoothOverlayTransform(
              nextOverlay,
              overlayStateRef.current,
              SMOOTHING_ALPHA
            );
          }

          const gesture = detectGesture(smoothedHands);
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
        } catch (err) {
          console.error("Detection error:", err);
        } finally {
          isDetectingRef.current = false;
        }
      })();
    }, DETECTION_INTERVAL_MS);
  };
  // ---------------- LIVE TRY-ON TOGGLE ----------------

  const startLiveTryOn = () => {
    if (!selectedDress || !videoRef.current) {
      toast.error("Start camera and select a dress first.");
      return;
    }

    // extra safety: ensure video is playing
    if (videoRef.current.readyState < 2) {
      setTimeout(startLiveTryOn, 200);
      return;
    }

    if (videoRef.current.readyState < 2) {
      setTimeout(startLiveTryOn, 200);
      return;
    }

    // First, show the AR Wake Up Modal
    setShowWakeUpModal(true);
  };

  const handleARReady = () => {
    // Called when AR backend is ready
    setShowWakeUpModal(false);
    setIsLiveTryOn(true);
    isLiveTryOnRef.current = true;
    isServerReadyRef.current = true;
    isDetectingRef.current = false;
    skippedDetectionRef.current = 0;
    smoothedLandmarksRef.current = [];
    overlayStateRef.current = null;
    setGestureMessage("");
    setCountdown(null);
    overlayFrozenRef.current = false;
    missedFramesRef.current = 0;
    setShowGestureGuide(true);
    setShowDistanceWarning(false);

    setShowPalmHint(true);
    setTimeout(() => setShowPalmHint(false), 4000);

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    animationRef.current = requestAnimationFrame(processFrame);
    startGestureDetection();
  };

  const handleWakeUpClose = () => {
    setShowWakeUpModal(false);
    isServerReadyRef.current = false;
  };

  const stopLiveTryOn = () => {
    setIsLiveTryOn(false);
    isLiveTryOnRef.current = false;
    isServerReadyRef.current = false;
    isDetectingRef.current = false;
    setGestureMessage("");
    setCountdown(null);
    overlayFrozenRef.current = false;
    setShowGestureGuide(false);
    setShowDistanceWarning(false);

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const handleReset = () => {
    setSelectedDress(null);
    stopLiveTryOn();
    isServerReadyRef.current = false;
    overlayStateRef.current = null;
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
      isServerReadyRef.current = false;
      setShowWakeUpModal(true);
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

  const drawLandmarks = (ctx, landmarks) => {
    if (!landmarks || !landmarks.length) return;

    // Tech/Neon style settings
    const CONNECTOR_COLOR = "#00FFC2"; // Cyan/Teal
    const LANDMARK_COLOR = "#A855F7"; // Purple
    const LINE_WIDTH = 4; // Thicker for visibility
    const RADIUS = 6;    // Larger for visibility

    // Fallback connections if MediaPipe import fails
    const CONNECTIONS = HandLandmarker?.HAND_CONNECTIONS || [
      { start: 0, end: 1 }, { start: 1, end: 2 }, { start: 2, end: 3 }, { start: 3, end: 4 }, // Thumb
      { start: 0, end: 5 }, { start: 5, end: 6 }, { start: 6, end: 7 }, { start: 7, end: 8 }, // Index
      { start: 0, end: 9 }, { start: 9, end: 10 }, { start: 10, end: 11 }, { start: 11, end: 12 }, // Middle
      { start: 0, end: 13 }, { start: 13, end: 14 }, { start: 14, end: 15 }, { start: 15, end: 16 }, // Ring
      { start: 0, end: 17 }, { start: 17, end: 18 }, { start: 18, end: 19 }, { start: 19, end: 20 }, // Pinky
      { start: 5, end: 9 }, { start: 9, end: 13 }, { start: 13, end: 17 } // Palm
    ];

    for (const hand of landmarks) {
      // Draw connectors
      ctx.save();
      ctx.strokeStyle = CONNECTOR_COLOR;
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = "round";

      for (const connection of CONNECTIONS) {
        const start = hand[connection.start];
        const end = hand[connection.end];

        // Safety check
        if (!start || !end) continue;

        const x1 = start.x * ctx.canvas.width;
        const y1 = start.y * ctx.canvas.height;
        const x2 = end.x * ctx.canvas.width;
        const y2 = end.y * ctx.canvas.height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // Draw landmarks
      ctx.save();
      ctx.fillStyle = LANDMARK_COLOR;
      for (const point of hand) {
        const x = point.x * ctx.canvas.width;
        const y = point.y * ctx.canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, RADIUS, 0, 2 * Math.PI);
        ctx.fill();

        // Inner white dot for "tech" look
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(x, y, RADIUS / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = LANDMARK_COLOR;
      }
      ctx.restore();
    }
  };

  // ---------------- UI ----------------

  return (
    <div className="relative min-h-screen pb-32 px-4 md:px-6 pt-6 flex flex-col items-center overflow-x-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100" />
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-16 w-64 h-64 bg-indigo-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="
      inline-flex items-center gap-4 
      bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700
      text-white px-10 py-5 rounded-2xl shadow-xl
      backdrop-blur-sm
    "
        >
          <FaMagic className="w-6 h-6 animate-pulse" />

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Virtual Try-On Studio
          </h1>

          <FaRegEye className="w-6 h-6 opacity-90" />
        </div>

        <p className="mt-3 text-sm md:text-base text-slate-600 font-medium">
          Select • Gesture Control • Capture • Save
        </p>
      </div>

      {/* Try-on counter */}
      <div className="mb-6 flex justify-center">
        <div className="bg-white/70 backdrop-blur-md border border-purple-100 shadow-lg rounded-full px-6 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-700">
            Free Try-Ons Remaining:
          </span>
          <span className="text-lg font-bold text-purple-700">
            {freeTryonsLeft}
          </span>
        </div>
      </div>

      {/* MAIN */}
      <div
        ref={cameraSectionRef}
        className="grid grid-cols-1 lg:grid-cols-2 items-start w-full max-w-6xl gap-6"
      >
        {/* Camera Panel */}
        <div className="w-full order-1">
          <div className="rounded-3xl overflow-hidden relative w-full">
            {/* Camera Header */}
            <div className="absolute top-0 left-0 right-0 px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex items-center justify-between z-30">
              <div className="flex items-center gap-2">
                <FaCamera className="w-4 h-4 text-purple-300" />
                <span className="text-xs font-semibold text-white">
                  Live Camera Feed
                </span>
              </div>
              {stream && (
                <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE</span>
                </div>
              )}
            </div>

            {/* Inner camera box (no grey outline) */}
            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden shadow-2xl">
              {/* Gesture message */}
              {gestureMessage && (
                <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-xl text-sm z-45 backdrop-blur-sm shadow-lg">
                  {gestureMessage}
                </div>
              )}

              {/* Palm hint */}
              {showPalmHint && !gestureMessage && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-purple-600/90 text-white px-4 py-2 rounded-xl text-xs backdrop-blur-sm animate-bounce z-40 shadow-lg">
                  ✋ Show your palm to capture
                </div>
              )}

              {/* Big centered countdown */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none bg-black/40 backdrop-blur-xs">
                  <span className="text-white text-7xl md:text-8xl font-extrabold animate-pulse drop-shadow-[0_0_22px_rgba(0,0,0,0.7)]">
                    {countdown}
                  </span>
                </div>
              )}

              {/* Gesture helper box */}
              {isLiveTryOn && showGestureGuide && (
                <div
                  className="
      absolute 
      right-2 
      top-12
      
      /* Sizes */
      w-28 px-2 py-2      /* Mobile */
      sm:w-32 sm:px-3 sm:py-2.5   /* Tablets */
      md:w-40 md:px-3 md:py-3     /* Desktop */

      border border-white/30 
      rounded-2xl 
      bg-black/40 
      backdrop-blur-md 
      flex flex-col 
      items-center 
      pointer-events-none 
      z-40 
      shadow-xl
    "
                >
                  <p className="text-white/90 text-[8px] sm:text-[9px] md:text-[10px] mb-1 md:mb-2 font-semibold tracking-wide">
                    Gesture Controls
                  </p>

                  <div className="flex flex-col gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] md:text-xs text-white/90">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-sm sm:text-base md:text-lg">
                        👍
                      </span>
                      <span>Next</span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-sm sm:text-base md:text-lg">
                        👎
                      </span>
                      <span>Prev</span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-sm sm:text-base md:text-lg">
                        ✋
                      </span>
                      <span>Capture</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Distance warning */}
              {isLiveTryOn && showDistanceWarning && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-amber-500/95 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm animate-pulse z-50 shadow-lg">
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
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                  alt="Captured try-on"
                />
              )}

              {/* Glassmorphism Placeholder */}
              {!stream && !tryOnImage && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl">
                  {/* Floating gradients */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-10 -left-10 w-52 h-52 bg-purple-500/20 blur-3xl rounded-full" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full" />
                  </div>

                  {/* Center content */}
                  <div className="relative flex flex-col items-center text-center px-4">
                    <FaCamera className="text-white/90 text-6xl drop-shadow-[0_0_18px_rgba(255,255,255,0.25)] mb-5" />
                    <h2 className="text-white font-semibold text-lg tracking-wide">
                      Camera is Off
                    </h2>
                    <p className="text-gray-300 text-sm mt-1">
                      Tap{" "}
                      <span className="text-indigo-300 font-semibold">
                        Start
                      </span>{" "}
                      to begin your try-on session
                    </p>
                    <div className="mt-4 text-[11px] text-gray-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Privacy: Video is never stored</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wardrobe + Size Panel */}
        <div className="w-full flex flex-col gap-5 order-3 lg:order-2">
          {/* Carousel container with premium glass */}
          <div className="bg-white/75 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl relative">
            {/* Soft glow behind carousel */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-300/30 blur-3xl" />
            </div>

            <div
              className="px-4 py-3 flex items-center justify-between 
                bg-gradient-to-r from-purple-600 to-indigo-600 
                rounded-t-3xl shadow-sm"
            >
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Your Wardrobe
              </h3>
              {wardrobeItems.length > 0 && (
                <span className="text-[11px] text-white">
                  {wardrobeItems.length} item
                  {wardrobeItems.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="pt-2 pb-5">
              {wardrobeItems.length > 0 ? (
                <CreativeCarousel
                  ref={carouselRef}
                  items={wardrobeItems}
                  selectedItem={selectedDress}
                  onSelect={setSelectedDress}
                  hideNames={true}
                />
              ) : (
                <div className="flex items-center justify-center h-52 text-gray-500 text-center px-6">
                  <div>
                    <p className="font-medium text-sm">
                      No items in your wardrobe yet
                    </p>
                    <p className="text-xs mt-1 text-gray-400">
                      Add outfits from your cart to try them virtually
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Size Picker */}
          {selectedDress && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl flex flex-col items-center px-6 py-5">
              <h4 className="text-sm font-semibold text-slate-800 mb-4 tracking-wide">
                Select Size
              </h4>

              <div className="flex flex-wrap justify-center gap-3">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center
                      ${selectedSize === size
                        ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg scale-110"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-purple-300 hover:bg-purple-50"
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Aura + Divider */}
              <div className="relative w-full mt-5 flex flex-col items-center">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-16 bg-purple-400/25 blur-3xl rounded-full pointer-events-none" />
                <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent rounded-full" />
                <p className="mt-3 text-[11px] text-slate-500 tracking-[0.18em] uppercase">
                  Immerse • Try • Capture
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ACTION BAR */}
        <div className="order-2 lg:order-3 lg:col-span-2">
          {!tryOnImage ? (
            <div className="mt-6 w-full max-w-lg mx-auto">
              <div className="bg-white/90 backdrop-blur-2xl shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-around border border-white/60">
                {/* CAMERA START / LIVE / STOP */}
                {!stream ? (
                  <button
                    onClick={startWebcam}
                    className="flex flex-col items-center group"
                  >
                    <div className="w-11 h-11 rounded-full flex items-center justify-center bg-blue-50 border border-blue-200 group-hover:bg-blue-100 transition">
                      <FaCamera className="text-xl text-blue-600" />
                    </div>
                    <span className="text-[11px] font-medium mt-1 text-blue-700">
                      Start
                    </span>
                  </button>
                ) : !isLiveTryOn ? (
                  <button
                    onClick={startLiveTryOn}
                    className={`flex flex-col items-center group ${highlightLive ? "animate-pulse" : ""
                      }`}
                  >
                    <div className="w-11 h-11 rounded-full flex items-center justify-center bg-purple-50 border border-purple-200 group-hover:bg-purple-100 transition">
                      <FaMagic className="text-xl text-purple-600" />
                    </div>
                    <span className="text-[11px] font-medium mt-1 text-purple-700">
                      Live
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={stopLiveTryOn}
                    className="flex flex-col items-center group"
                  >
                    <div className="w-11 h-11 rounded-full flex items-center justify-center bg-red-50 border border-red-200 group-hover:bg-red-100 transition">
                      <FaStop className="text-xl text-red-600" />
                    </div>
                    <span className="text-[11px] font-medium mt-1 text-red-700">
                      Stop
                    </span>
                  </button>
                )}

                {/* Manual Capture */}
                <button
                  ref={captureButtonRef}
                  onClick={handleCaptureTryOn}
                  className="flex flex-col items-center group"
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center bg-emerald-50 border border-emerald-200 group-hover:bg-emerald-100 transition">
                    <FaRegEye className="text-xl text-emerald-600" />
                  </div>
                  <span className="text-[11px] font-medium mt-1 text-emerald-700">
                    Capture
                  </span>
                </button>

                {/* Reset */}
                <button
                  onClick={handleReset}
                  className="flex flex-col items-center group"
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200 group-hover:bg-slate-100 transition">
                    <FaCamera className="text-lg rotate-180 text-slate-600" />
                  </div>
                  <span className="text-[11px] font-medium mt-1 text-slate-700">
                    Reset
                  </span>
                </button>
              </div>
            </div>
          ) : (
            // After capture (Retake / Save)
            <div className="mt-6 w-full max-w-lg mx-auto">
              <div className="bg-white/95 backdrop-blur-2xl shadow-2xl rounded-2xl p-5 border border-white/60 flex flex-col gap-3">
                <div className="flex w-full justify-between gap-3">
                  <button
                    onClick={handleRetake}
                    className="w-1/2 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition"
                  >
                    Retake
                  </button>

                  <button
                    onClick={handleUploadTryOn}
                    disabled={uploading}
                    className="w-1/2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Uploading..." : "Save Try-On"}
                  </button>
                </div>

                <label className="flex items-center gap-2 text-gray-700 text-sm font-medium mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>
                    Make this try-on public{" "}
                    <span className="text-purple-600 font-semibold">
                      + Earn 1 free try-on
                    </span>
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AR Wake Up Modal */}
      {showWakeUpModal && (
        <ARWakeUpModal
          open={showWakeUpModal}
          healthUrl={healthUrl} // ✅ REQUIRED
          onReady={handleARReady}
          onClose={handleWakeUpClose}
        />
      )}
    </div>
  );
}



































