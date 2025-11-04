import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaTshirt, FaCamera, FaStop } from "react-icons/fa";
import axios from "axios";

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
  const isLiveTryOnRef = useRef(false); // Use ref to avoid state update delay
  const lastOverlayRef = useRef(null); // To persist the last overlay

  const demoClothes = [
    {
      id: 1,
      name: "Red Shirt",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683904/red_zbtczb.png",
    },
    {
      id: 2,
      name: "Blue Jacket",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683919/blue_kbphud.png",
    },
    {
      id: 3,
      name: "Green Hoodie",
      img: "https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683905/green_sfbxnt.png",
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
    lastOverlayRef.current = null; // Clear last overlay
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

    // Update canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw live video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw last overlay if available
    if (lastOverlayRef.current) {
      ctx.drawImage(lastOverlayRef.current, 0, 0, canvas.width, canvas.height);
    }

    try {
      const frameData = canvas.toDataURL("image/jpeg").split(",")[1];
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/tryon`,
        {
          frame: frameData,
          shirtUrl: selectedDress.img,
        }
      );

      if (response.data.result) {
        const resultImg = new Image();
        resultImg.onload = () => {
          lastOverlayRef.current = resultImg; // update overlay
        };
        resultImg.src = `data:image/jpeg;base64,${response.data.result}`;
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
    isLiveTryOnRef.current = true; // Set ref immediately
    setLoading(true);
    animationRef.current = requestAnimationFrame(processFrame);
    setTimeout(() => setLoading(false), 1000);
  };

  const stopLiveTryOn = () => {
    setIsLiveTryOn(false);
    isLiveTryOnRef.current = false; // Clear ref immediately
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    processingRef.current = false;
    setLoading(false);
  };

  return (
    <section className="flex flex-col items-center justify-center px-6 py-8 bg-gradient-to-b from-white to-indigo-50">
      <div className="max-w-3xl w-full text-center">
        <FaTshirt className="text-indigo-600 w-10 h-10 mx-auto mb-3" />
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Try Our Free AR Demo
        </h1>
        <p className="text-gray-500 mb-10">
          Choose one of our sample outfits and preview it instantly. Want to try
          your own?{" "}
          <Link to="/register" className="text-indigo-600 hover:underline">
            Sign up
          </Link>
          .
        </p>

        <div className="flex flex-wrap justify-center gap-6 mb-10">
          {demoClothes.map((dress) => (
            <div
              key={dress.id}
              onClick={() => handleDressSelect(dress)}
              className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                selectedDress?.id === dress.id
                  ? "border-indigo-500 shadow-sm scale-105"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <img
                src={dress.img}
                alt={dress.name}
                className="w-28 h-28 md:w-32 md:h-32 object-contain"
              />
              <p className="text-sm mt-2 text-gray-700">{dress.name}</p>
            </div>
          ))}
        </div>

        <div ref={previewRef} className="flex flex-col items-center">
          <div className="w-64 h-64 border border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 mb-4 overflow-hidden relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ display: stream ? "block" : "none" }}
            />
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover absolute inset-0"
              style={{ display: isLiveTryOn ? "block" : "none" }}
            />

            {!stream && selectedDress && (
              <p className="text-gray-400 absolute inset-0 flex items-center justify-center">
                Click "Start Webcam" to begin
              </p>
            )}
            {stream && !selectedDress && (
              <p className="text-gray-400 absolute inset-0 flex items-center justify-center">
                Select a dress to begin
              </p>
            )}
            {loading && (
              <p className="text-gray-400 absolute inset-0 flex items-center justify-center">
                Starting live try-on...
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {selectedDress && !stream && (
              <button
                onClick={startWebcam}
                className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
              >
                <FaCamera className="inline mr-2" />
                Start Webcam
              </button>
            )}

            {stream && selectedDress && !isLiveTryOn && (
              <button
                onClick={startLiveTryOn}
                className="px-10 py-3 rounded-xl bg-indigo-600 text-white font-bold tracking-wide uppercase transition-all duration-200 shadow-lg hover:bg-indigo-700"
              >
                Start Live Try-On
              </button>
            )}

            {isLiveTryOn && (
              <button
                onClick={stopLiveTryOn}
                className="px-10 py-3 rounded-xl bg-red-600 text-white font-bold tracking-wide uppercase transition-all duration-200 shadow-lg hover:bg-indigo-700"
              >
                <FaStop className="inline mr-2" />
                Stop Live Try-On
              </button>
            )}

            <button
              onClick={handleReset}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
