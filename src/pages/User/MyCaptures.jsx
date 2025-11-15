import React, { useState, useEffect } from "react";
import {
  FaTrash,
  FaDownload,
  FaShare,
  FaCamera,
  FaCalendar,
  FaGlobe,
  FaLock,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";

const formatDate = (rawDate) => {
  if (!rawDate) return "";
  let date = rawDate;

  // Firestore Timestamp support
  if (typeof rawDate?.toDate === "function") {
    date = rawDate.toDate();
  } else if (!(rawDate instanceof Date)) {
    date = new Date(rawDate);
  }

  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function MyCaptures() {
  const { user, loading: authLoading } = useAuth();
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ------------------------------
  // Fetch captures from Firestore
  // ------------------------------
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCaptures([]);
      setLoading(false);
      return;
    }

    const fetchCaptures = async () => {
      try {
        const triesSnap = await getDocs(
          collection(db, "users", user.uid, "tries")
        );
        const tries = triesSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            // tryOn image URL (fallback to other possible fields)
            tryOnUrl:
              data.tryOnUrl || data.resultURL || data.clothImageUrl || "",
            size: data.size || "M",
            public: data.public ?? true,
            createdAt: data.createdAt || data.timestamp || null,
          };
        });
        setCaptures(tries);
      } catch (err) {
        console.error("Error fetching captures:", err);
        toast.error("Failed to load captures");
      } finally {
        setLoading(false);
      }
    };

    fetchCaptures();
  }, [authLoading, user]);

  // ------------------------------
  // Watermark helper (from your logic)
  // ------------------------------
  const addWatermark = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const logo = new Image();

      img.crossOrigin = "anonymous";
      logo.crossOrigin = "anonymous";

      img.src = imageUrl;
      logo.src = "/watermark.png"; // ensure this exists in public/

      img.onload = () => {
        logo.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = img.width;
          canvas.height = img.height;

          ctx.drawImage(img, 0, 0);

          const opacity = 0.4;
          const padding = img.width * 0.02;

          const logoWidth = img.width * 0.1;
          const aspectRatio = logo.width / logo.height;
          const logoHeight = logoWidth / aspectRatio;

          const xLogo = img.width - logoWidth - padding;
          const yLogo = img.height - logoHeight - padding - img.width * 0.04;

          ctx.globalAlpha = opacity;
          ctx.drawImage(logo, xLogo, yLogo, logoWidth, logoHeight);

          // text below logo
          ctx.font = `${img.width * 0.03}px Poppins`;
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.shadowColor = "rgba(0,0,0,0.4)";
          ctx.shadowBlur = 6;

          const textX = xLogo + logoWidth / 2;
          const textY = yLogo + logoHeight + 8;

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

  // ------------------------------
  // Actions
  // ------------------------------
  const handleDelete = async (captureId) => {
    if (!window.confirm("Are you sure you want to delete this capture?"))
      return;

    if (!user) return;

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

      // fallback
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

  // ------------------------------
  // Loading states
  // ------------------------------
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your captures...</p>
        </div>
      </div>
    );
  }

  // ------------------------------
  // No user or no captures
  // ------------------------------
  if (!user || captures.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-20 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6 mx-auto">
            <FaCamera className="text-purple-600 text-4xl" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            {user ? "No Captures Yet" : "Please log in"}
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {user
              ? "Start your virtual try-on journey! Save your favorite looks and build your style collection."
              : "Log in to view and manage your saved virtual try-ons."}
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------
  // Filters
  // ------------------------------
  const filteredCaptures = captures.filter((cap) => {
    if (filter === "public") return cap.public;
    if (filter === "private") return !cap.public;
    return true;
  });

  // ------------------------------
  // Main UI
  // ------------------------------
 return (
   <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
     <div className="max-w-7xl mx-auto">
       {/* HEADER */}
       <div className="text-center mb-10">
         <div
           className="inline-flex items-center justify-center w-16 h-16 
                  bg-indigo-600 rounded-2xl shadow-md mb-4"
         >
           <FaCamera className="text-white text-2xl" />
         </div>

         <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
           My Captures
         </h1>

         <p className="text-gray-600 text-lg mt-1">
           {captures.length} {captures.length === 1 ? "capture" : "captures"}{" "}
           saved
         </p>
       </div>

       {/* FILTER TABS */}
       <div className="flex justify-center mb-8">
         <div className="inline-flex bg-white border border-gray-200 rounded-full shadow-sm p-1">
           {["all", "public", "private"].map((f) => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                 filter === f
                   ? "bg-indigo-600 text-white shadow-sm"
                   : "text-gray-700 hover:text-indigo-600"
               }`}
             >
               {f.charAt(0).toUpperCase() + f.slice(1)}
             </button>
           ))}
         </div>
       </div>

       {/* GRID */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {filteredCaptures.map((capture, index) => (
           <div
             key={capture.id}
             className="group bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
             style={{ animationDelay: `${index * 40}ms` }}
           >
             {/* IMAGE */}
             <div className="relative aspect-[3/4] overflow-hidden">
               <img
                 src={capture.tryOnUrl}
                 alt="Virtual try-on"
                 className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
               />

               {/* FADE OVERLAY */}
               <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

               {/* ACTION BUTTONS */}
               <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                 <button
                   onClick={() => handleDownload(capture.tryOnUrl, capture.id)}
                   className="bg-white/95 p-2.5 rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition"
                 >
                   <FaDownload className="text-sm" />
                 </button>

                 <button
                   onClick={() => handleShare(capture.tryOnUrl)}
                   className="bg-white/95 p-2.5 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition"
                 >
                   <FaShare className="text-sm" />
                 </button>

                 <button
                   onClick={() => handleDelete(capture.id)}
                   className="bg-white/95 p-2.5 rounded-xl shadow-sm hover:bg-red-600 hover:text-white transition"
                 >
                   <FaTrash className="text-sm" />
                 </button>
               </div>

               {/* PUBLIC/PRIVATE BADGE */}
               <div className="absolute top-3 left-3">
                 <div
                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
                     capture.public
                       ? "bg-indigo-600 text-white"
                       : "bg-gray-800 text-white"
                   }`}
                 >
                   {capture.public ? (
                     <FaGlobe className="text-xs" />
                   ) : (
                     <FaLock className="text-xs" />
                   )}
                   {capture.public ? "Public" : "Private"}
                 </div>
               </div>
             </div>

             {/* FOOTER */}
             <div className="p-4">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm font-semibold text-gray-800">
                   Size {capture.size}
                 </span>

                 <span className="text-xs text-gray-500 flex items-center gap-1">
                   <FaCalendar className="text-gray-400" />
                   {formatDate(capture.createdAt)}
                 </span>
               </div>

               {/* FIXED VIEW DETAILS */}
               <button
                 onClick={() => setSelectedCapture(capture)}
                 className="w-full text-sm font-medium text-indigo-600 hover:text-indigo-700 py-2 rounded-lg hover:bg-indigo-50 transition"
               >
                 View Details
               </button>
             </div>
           </div>
         ))}
       </div>

       {/* Empty state when filter hides all */}
       {filteredCaptures.length === 0 && captures.length > 0 && (
         <div className="text-center py-16">
           <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
             <FaCamera className="text-gray-400 text-3xl" />
           </div>
           <h3 className="text-xl font-semibold text-gray-700 mb-2">
             No {filter} captures found
           </h3>
           <p className="text-gray-500">Try selecting a different filter</p>
         </div>
       )}
     </div>

     {/* MODAL */}
     {selectedCapture && (
       <div
         className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
         onClick={() => setSelectedCapture(null)}
       >
         <div
           className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl transform transition-all"
           onClick={(e) => e.stopPropagation()}
         >
           <div className="relative">
             <img
               src={selectedCapture.tryOnUrl}
               alt="Selected capture"
               className="w-full max-h-[70vh] object-contain bg-gray-100"
             />
             <button
               onClick={() => setSelectedCapture(null)}
               className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-all shadow-lg"
             >
               ✕
             </button>
           </div>

           <div className="p-6">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-2xl font-bold text-gray-800">
                 Capture Details
               </h3>
               <div
                 className={`px-4 py-2 rounded-full text-sm font-semibold ${
                   selectedCapture.public
                     ? "bg-indigo-100 text-indigo-700"
                     : "bg-gray-100 text-gray-700"
                 }`}
               >
                 {selectedCapture.public ? "Public" : "Private"}
               </div>
             </div>

             <div className="space-y-3 mb-6">
               <div className="flex items-center gap-3 text-gray-600">
                 <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700">
                   📏
                 </div>
                 <span>
                   Size:{" "}
                   <strong className="text-gray-800">
                     {selectedCapture.size}
                   </strong>
                 </span>
               </div>

               <div className="flex items-center gap-3 text-gray-600">
                 <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700">
                   <FaCalendar />
                 </div>
                 <span>
                   Created:{" "}
                   <strong className="text-gray-800">
                     {formatDate(selectedCapture.createdAt)}
                   </strong>
                 </span>
               </div>
             </div>

             {/* Modal Buttons */}
             <div className="flex gap-3">
               <button
                 onClick={() =>
                   handleDownload(selectedCapture.tryOnUrl, selectedCapture.id)
                 }
                 className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
               >
                 <FaDownload /> Download
               </button>
               <button
                 onClick={() => handleShare(selectedCapture.tryOnUrl)}
                 className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
               >
                 <FaShare /> Share
               </button>
             </div>
           </div>
         </div>
       </div>
     )}
   </div>
 );

}
