import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { FaTrash, FaDownload, FaShare } from "react-icons/fa";

export default function MyCaptures() {
  const { user, loading: authLoading } = useAuth(); // ⭐ <-- IMPORTANT
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------------
  // 1️⃣ FIRST WAIT FOR AUTH TO LOAD
  // --------------------------------------------------------
  useEffect(() => {
    if (authLoading) return; // Wait for auth
    if (!user) {
      // User not logged in
      setCaptures([]);
      setLoading(false);
      return;
    }

    fetchCaptures();
  }, [authLoading, user]);

  // --------------------------------------------------------
  // 2️⃣ Fetch captures only after user is ready
  // --------------------------------------------------------
  const fetchCaptures = async () => {
    try {
      const triesSnap = await getDocs(
        collection(db, "users", user.uid, "tries")
      );
      const tries = triesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCaptures(tries);
    } catch (err) {
      console.error("Error fetching captures:", err);
      toast.error("Failed to load captures");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------
  // 3️⃣ Loading UI (auth or captures)
  // --------------------------------------------------------
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // --------------------------------------------------------
  // 4️⃣ Logged in but no captures
  // --------------------------------------------------------
  if (captures.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-gray-400 text-4xl">📸</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No captures yet
        </h3>
        <p className="text-gray-500 text-center pl-3 pr-3">
          Start trying on clothes to save your favorite looks!
        </p>
      </div>
    );
  }
  const addWatermark = async (imageUrl) => {
    return new Promise(async (resolve, reject) => {
      const img = new Image();
      const logo = new Image();

      img.crossOrigin = "anonymous";
      logo.crossOrigin = "anonymous";

      img.src = imageUrl;
      logo.src = "/watermark.png"; // your logo in public folder

      img.onload = () => {
        logo.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = img.width;
          canvas.height = img.height;

          // Draw main image
          ctx.drawImage(img, 0, 0);

          // ----- WATERMARK SETTINGS -----
          const opacity = 0.4;
          const padding = img.width * 0.02;

          // Logo size (smaller)
          const logoWidth = img.width * 0.1;
          const aspectRatio = logo.width / logo.height;
          const logoHeight = logoWidth / aspectRatio;

          // Position bottom-right
          const xLogo = img.width - logoWidth - padding;
          const yLogo = img.height - logoHeight - padding - img.width * 0.04;
          // (extra space for text below)

          ctx.globalAlpha = opacity;

          // Draw logo
          ctx.drawImage(logo, xLogo, yLogo, logoWidth, logoHeight);

          // ---- TEXT BELOW LOGO ----
          ctx.font = `${img.width * 0.03}px Poppins`;
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";

          ctx.shadowColor = "rgba(0,0,0,0.4)";
          ctx.shadowBlur = 6;

          const textX = xLogo + logoWidth / 2; // centered under logo
          const textY = yLogo + logoHeight + 8; // little gap

          ctx.fillText("iStyleAR", textX, textY);

          ctx.globalAlpha = 1;

          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject("Blob error")),
            "image/jpeg",
            0.95
          );
        };

        logo.onerror = reject;
      };

      img.onerror = reject;
    });
  };


  const handleDelete = async (captureId) => {
    if (!window.confirm("Are you sure you want to delete this capture?"))
      return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "tries", captureId));
      setCaptures((prev) => prev.filter((c) => c.id !== captureId));
      toast.success("Capture deleted successfully");
    } catch (err) {
      console.error("Error deleting capture:", err);
      toast.error("Failed to delete capture");
    }
  };

const handleDownload = async (imageUrl, captureId) => {
  try {
    const blob = await addWatermark(imageUrl);
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `tryon-${captureId}.jpg`;
    link.click();

    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download error:", err);
    toast.error("Failed to download image");
  }
};



const handleShare = async (imageUrl) => {
  const caption =
    "Check out my virtual try-on on iStyleAR — a fun virtual try-on platform!\nRegister now at https://istylear.netlify.app/ 👗✨";

  try {
    const blob = await addWatermark(imageUrl);
    const file = new File([blob], "tryon.jpg", { type: "image/jpeg" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "My Virtual Try-On",
        text: caption,
      });
      return;
    }

    // fallback for iOS/desktop
    await navigator.clipboard.writeText(caption);
    toast.info("Caption copied! Paste it manually.");

    if (navigator.share) {
      await navigator.share({ files: [file] });
    }
  } catch (err) {
    console.error("Share error:", err);
    toast.error("Failed to share image");
  }
};




  // --------------------------------------------------------
  // 5️⃣ Captures exist → show grid
  // --------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Captures</h1>
          <p className="text-gray-600">
            View and manage your saved virtual try-ons
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {captures.map((capture) => (
            <div
              key={capture.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="relative">
                <img
                  src={capture.tryOnUrl}
                  className="w-full h-48 object-cover"
                />

                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleDownload(capture.tryOnUrl, capture.id)}
                    className="bg-white/80 p-2 rounded-full hover:bg-white transition"
                  >
                    <FaDownload />
                  </button>

                  <button
                    onClick={() => handleShare(capture.tryOnUrl)}
                    className="bg-white/80 p-2 rounded-full hover:bg-white transition"
                  >
                    <FaShare />
                  </button>

                  <button
                    onClick={() => handleDelete(capture.id)}
                    className="bg-red-500/80 p-2 rounded-full hover:bg-red-600 transition"
                  >
                    <FaTrash className="text-white" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm text-gray-600">
                  Size: {capture.size} | {capture.public ? "Public" : "Private"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
