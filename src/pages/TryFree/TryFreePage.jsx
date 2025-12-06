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
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Unable to access webcam. Please allow camera permissions.");
    }
  };

  const processFrame = async () => {
    if (
      !selectedDress ||
      !canvasRef.current ||
      !videoRef.current ||
      !isLiveTryOnRef.current ||
      processingRef.current
    ) {
      if (isLiveTryOnRef.current)
        animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    processingRef.current = true;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;
    const previewCtx = previewCanvas.getContext("2d");

    previewCtx.save();
    previewCtx.scale(-1, 1);
    previewCtx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    previewCtx.restore();

    if (lastOverlayRef.current) {
      previewCtx.save();
      previewCtx.scale(-1, 1);
      previewCtx.drawImage(
        lastOverlayRef.current,
        -canvas.width,
        0,
        canvas.width,
        canvas.height
      );
      previewCtx.restore();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(previewCanvas, 0, 0);

    try {
      const downscaledCanvas = document.createElement("canvas");
      const downscaledCtx = downscaledCanvas.getContext("2d");
      downscaledCanvas.width = video.videoWidth * 0.5;
      downscaledCanvas.height = video.videoHeight * 0.5;
      downscaledCtx.drawImage(
        video,
        0,
        0,
        downscaledCanvas.width,
        downscaledCanvas.height
      );

      const frameData = downscaledCanvas
        .toDataURL("image/jpeg", 0.8)
        .split(",")[1];
      const response = await fetch(`${BACKEND}/tryon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frame: frameData,
          shirtUrl: selectedDress.img,
        }),
      });

      const data = await response.json();

      if (data.result) {
        const resultImg = new Image();
        resultImg.onload = () => {
          lastOverlayRef.current = resultImg;
        };
        resultImg.src = `data:image/jpeg;base64,${data.result}`;
      }
    } catch (err) {
      console.error("API call failed:", err);
    } finally {
      processingRef.current = false;
      if (isLiveTryOnRef.current) {
        animationRef.current = requestAnimationFrame(processFrame);
      }
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
 ${
   selectedDress?.id === dress.id
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
                <div className="relative aspect-square md:aspect-video w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
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
                    style={{ display: isLiveTryOn ? "block" : "none" }}
                  />

                  {!stream && selectedDress && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50">
                      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                        <FaCamera className="w-7 h-7 text-indigo-600" />
                      </div>
                      <p className="text-lg font-semibold text-slate-800 mb-1">
                        Ready to Begin
                      </p>
                      <p className="text-sm text-slate-600">
                        Activate your camera to start
                      </p>
                    </div>
                  )}

                  {stream && !selectedDress && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50">
                      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                        <FaTshirt className="w-7 h-7 text-purple-600" />
                      </div>
                      <p className="text-lg font-semibold text-slate-800 mb-1">
                        Select an Outfit
                      </p>
                      <p className="text-sm text-slate-600">
                        Choose from the collection above
                      </p>
                    </div>
                  )}

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
                        onClick={startLiveTryOn}
                        className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                      >
                        <FaPlay className="w-3 h-3" />
                        Start Try-On
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
    </section>
  );
}
