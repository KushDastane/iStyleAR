/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import { FaTshirt, FaShareAlt, FaFolderOpen } from "react-icons/fa";
import { GiClothes } from "react-icons/gi";

export default function AboutAndFeatures({
  aboutRef,
  aboutInView,
  featuresRef,
  featuresInView,
}) {
  return (
    <>
      {/* 🌟 About Section */}
      <section
        ref={aboutRef}
        className="relative min-h-screen flex flex-col md:flex-row items-center justify-center p-6 md:p-24 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 overflow-hidden"
      >
        {/* Floating gradient orbs in background */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-300/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl"></div>

        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={aboutInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1 }}
          className="md:w-1/2 mb-10 md:mb-0 z-10"
        >
          <h2 className="text-5xl font-extrabold mb-6 text-gray-900 tracking-tight">
            About{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
              iStyleAR
            </span>
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            We are a passionate team of creators building an advanced platform
            for fashion lovers to explore, try, and express their style. With{" "}
            <span className="font-semibold text-purple-900">
              Augmented Reality
            </span>
            , you can virtually try on outfits, mix and match styles, and create
            your own wardrobe collections — all from the comfort of your home.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={aboutInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1 }}
          className="md:w-1/2 flex justify-center relative z-10"
        >
          <motion.img
            src="src/assets/hero/about.jpg"
            alt="AR experience"
            className="w-3/4 md:w-2/3 rounded-2xl shadow-2xl border border-white/60"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </section>

      {/* 🚀 Features Section */}
      <section
        ref={featuresRef}
        className="min-h-screen p-6 md:p-24 bg-gradient-to-b from-indigo-50 to-white relative overflow-hidden"
      >
        <div className="absolute top-20 left-10 w-60 h-60 bg-purple-200/40 blur-3xl rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-200/40 blur-3xl rounded-full"></div>

        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="text-4xl font-bold mb-16 text-center text-gray-900"
        >
          Our{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Features
          </span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={featuresInView ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, staggerChildren: 0.2 }}
          className="grid md:grid-cols-4 sm:grid-cols-2 gap-10 text-center z-10"
        >
          {[
            {
              icon: (
                <GiClothes size={40} className="text-indigo-600 mx-auto mb-4" />
              ),
              title: "Virtual Try-On",
              desc: "Experience real-time AR outfit fitting on your body instantly.",
            },
            {
              icon: (
                <FaTshirt size={40} className="text-purple-600 mx-auto mb-4" />
              ),
              title: "Mix & Match",
              desc: "Combine different clothes and accessories to explore new looks.",
            },
            {
              icon: (
                <FaShareAlt size={40} className="text-blue-600 mx-auto mb-4" />
              ),
              title: "Share with Friends",
              desc: "Post your styles and get feedback from your fashion circle.",
            },
            {
              icon: (
                <FaFolderOpen
                  size={40}
                  className="text-pink-600 mx-auto mb-4"
                />
              ),
              title: "Virtual Collection",
              desc: "Save, organize, and showcase your favorite outfits anytime.",
            },
          ].map((f, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.08, rotateY: 5 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-xl hover:shadow-2xl border border-white/40"
            >
              {f.icon}
              <h3 className="font-semibold text-xl mb-3 text-gray-900">
                {f.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </>
  );
}
