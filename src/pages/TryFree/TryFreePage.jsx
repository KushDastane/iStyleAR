import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaTshirt } from "react-icons/fa";

export default function TryFreePage() {
  const [selectedDress, setSelectedDress] = useState(null);
  const [isTrying, setIsTrying] = useState(false);
  const [highlightTryOn, setHighlightTryOn] = useState(false);
  const previewRef = useRef(null);

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
    setIsTrying(false);
    setHighlightTryOn(true);

    // Scroll smoothly to preview section
    setTimeout(() => {
      previewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);

    // Stop button pulse after few seconds
    setTimeout(() => {
      setHighlightTryOn(false);
    }, 4000);
  };

  const handleTryOn = () => {
    if (selectedDress) setIsTrying(true);
  };

  const handleReset = () => {
    setSelectedDress(null);
    setIsTrying(false);
  };

  return (
    <section className="flex flex-col items-center justify-center px-6 py-8 bg-gradient-to-b from-white to-indigo-50">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="max-w-3xl w-full text-center"
      >
        {/* Header */}
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

        {/* Clothes grid */}
        <motion.div
          className="flex flex-wrap justify-center gap-6 mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
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
        </motion.div>

        {/* Preview Box */}
        <motion.div
          ref={previewRef}
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="w-64 h-64 border border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 mb-4 overflow-hidden relative">
            {isTrying && selectedDress ? (
              <motion.img
                key={selectedDress.id}
                src={selectedDress.img}
                alt="AR Preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="w-full h-full object-contain"
              />
            ) : selectedDress ? (
              <p className="text-gray-400">Click “Try On” to preview</p>
            ) : (
              <p className="text-gray-400">Select a dress to begin</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              onClick={() => {
                handleTryOn();
              }}
              disabled={!selectedDress}
              animate={
                selectedDress
                  ? {
                      scale: [1, 1.07, 1],
                    }
                  : { scale: 1 }
              }
              transition={{
                repeat: selectedDress ? Infinity : 0,
                duration: 1.6,
                ease: "easeInOut",
              }}
              className={`relative overflow-hidden px-10 py-3 rounded-xl text-white font-bold tracking-wide uppercase transition-all duration-200 shadow-lg ${
                selectedDress
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {/* INNER SHIMMER GLOW */}
              {selectedDress && (
                <motion.span
                  className="absolute inset-0 -z-0 rounded-xl bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_60%)]"
                  animate={{
                    opacity: [0.2, 0.6, 0.2],
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "easeInOut",
                  }}
                />
              )}

              {/* BUTTON TEXT */}
              <span className="relative z-10">Try On</span>

              {/* SHIMMER SWEEP */}
              {selectedDress && (
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.6,
                    ease: "easeInOut",
                  }}
                  style={{ mixBlendMode: "overlay" }}
                />
              )}

              {/* PULSING BORDER */}
              {selectedDress && (
                <motion.span
                  className="absolute inset-0 rounded-xl border border-indigo-400/60"
                  animate={{
                    opacity: [0.3, 0.9, 0.3],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                  }}
                />
              )}
            </motion.button>

            <button
              onClick={handleReset}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              Reset
            </button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
