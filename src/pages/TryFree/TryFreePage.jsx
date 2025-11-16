import { useState, useRef, useEffect } from "react";
import {
  FaTshirt,
  FaCamera,
  FaStop,
  FaCheckCircle,
  FaArrowRight,
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
      const response = await fetch(`/api/tryon`, {
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
    <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-5xl w-full relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-200">
            <FaTshirt className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 mb-3 tracking-tight">
            Virtual Try-On Studio
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed mb-4">
            Experience augmented reality fashion with AI. Select an outfit and
            see it on yourself instantly.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-gray-200">
            <span className="text-sm text-gray-600">
              Want your own wardrobe?
            </span>
            <a
              href="/register"
              className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors inline-flex items-center gap-1 group"
            >
              Sign up free
              <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Clothing Selection */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Choose Your Outfit
            </h2>
            <p className="text-sm text-gray-600">
              Select from our curated collection
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-5">
            {demoClothes.map((dress) => (
              <div
                key={dress.id}
                onClick={() => handleDressSelect(dress)}
                className={`group relative bg-white rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-xl ${
                  selectedDress?.id === dress.id
                    ? "shadow-xl scale-105 ring-2 ring-indigo-400 ring-offset-2"
                    : "shadow-md hover:scale-102 border border-gray-100"
                }`}
              >
                <div className="relative">
                  <div className="w-28 h-28 md:w-32 md:h-32 flex items-center justify-center relative">
                    <img
                      src={dress.img}
                      alt={dress.name}
                      className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>

                  {selectedDress?.id === dress.id && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                      <FaCheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <div className="mt-3 text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    {dress.name}
                  </p>
                  <div
                    className={`mt-2 w-full h-0.5 rounded-full transition-all duration-300 ${
                      selectedDress?.id === dress.id
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                        : "bg-gray-200 group-hover:bg-indigo-200"
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Section */}
        <div ref={previewRef} className="flex flex-col items-center">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-2xl border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Live Preview
              </h2>
              <p className="text-gray-600">See yourself in real-time</p>
            </div>

            <div
              className="relative aspect-square w-full max-w-xl mx-auto mb-8 rounded-2xl overflow-hidden 
bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-200 shadow-inner"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{
                  display: stream ? "block" : "none",
                }}
              />
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover absolute inset-0"
                style={{ display: isLiveTryOn ? "block" : "none" }}
              />

              {!stream && selectedDress && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6 shadow-lg">
                    <FaCamera className="w-9 h-9 text-indigo-600" />
                  </div>
                  <p className="text-xl font-semibold text-gray-800 mb-2">
                    Ready to Begin
                  </p>
                  <p className="text-sm text-gray-500">
                    Click the button below to activate your camera
                  </p>
                </div>
              )}

              {stream && !selectedDress && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6 shadow-lg">
                    <FaTshirt className="w-9 h-9 text-indigo-600" />
                  </div>
                  <p className="text-xl font-semibold text-gray-800 mb-2">
                    Select an Outfit
                  </p>
                  <p className="text-sm text-gray-500">
                    Choose from the collection above to continue
                  </p>
                </div>
              )}

              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-200 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                  </div>
                  <p className="text-gray-800 font-semibold mt-6 text-lg">
                    Initializing AR...
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    This will take just a moment
                  </p>
                </div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex flex-col gap-4">
              {selectedDress && !stream && (
                <button
                  onClick={startWebcam}
                  className="w-full px-8 py-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
                >
                  <FaCamera className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Activate Camera
                </button>
              )}

              {stream && selectedDress && !isLiveTryOn && (
                <button
                  onClick={startLiveTryOn}
                  className="w-full px-8 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg tracking-wide uppercase transition-all duration-300 shadow-lg hover:shadow-2xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02]"
                >
                  Start Virtual Try-On
                </button>
              )}

              {isLiveTryOn && (
                <button
                  onClick={stopLiveTryOn}
                  className="w-full px-8 py-5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-lg tracking-wide uppercase transition-all duration-300 shadow-lg hover:shadow-2xl hover:from-red-600 hover:to-rose-700 flex items-center justify-center gap-3 group"
                >
                  <FaStop className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Stop Try-On
                </button>
              )}

              <button
                onClick={handleReset}
                className="w-full px-8 py-5 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold text-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 hover:shadow-lg"
              >
                Reset Session
              </button>
            </div>

            {/* Status indicator */}
            {isLiveTryOn && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 font-medium">
                  Live AR Active
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
