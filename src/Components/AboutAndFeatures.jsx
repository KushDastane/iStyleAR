/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import { FaTshirt, FaShareAlt, FaFolderOpen, FaUpload } from "react-icons/fa";
import { GiClothes } from "react-icons/gi";
import { HiArrowRight } from "react-icons/hi";
import About from "../assets/hero/about.jpg";

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
        id="about"
        ref={aboutRef}
        className="relative flex flex-col md:flex-row items-center justify-center p-8 sm:p-16 md:p-24 bg-gradient-to-r from-purple-50 via-purple-50/80 to-blue-50 overflow-hidden"
      >
        {/* Subtle floating orbs */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-16 right-16 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl"></div>

        {/* About Text + How It Works */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={aboutInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1 }}
          className="md:w-1/2 mb-10 md:mb-0 z-10 flex flex-col gap-8"
        >
          {/* About Paragraph */}
          <div>
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 sm:mb-6 text-gray-900 tracking-tight text-center md:text-left">
              About{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
                iStyleAR
              </span>
            </h2>
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed text-center md:text-left">
              We are a passionate team building a platform for fashion lovers to
              explore, try, and express their style. With{" "}
              <span className="font-semibold text-purple-900">
                Augmented Reality
              </span>
              , you can virtually try outfits, mix and match styles, and curate
              your wardrobe — all from home.
            </p>
          </div>

          {/* How It Works Steps */}
          <div className="flex flex-row items-center justify-between gap-2 w-full">
            {/* Step 1 */}
            <motion.div className="flex-1 flex flex-col items-center bg-purple-500/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg">
              <FaUpload className="text-white text-3xl mb-2" />
              <div className="font-bold text-white text-sm mb-1 text-center">
                Upload
              </div>
              <p className="text-white text-center text-xs">
                Upload your outfit/photo
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div className="flex-1 flex flex-col items-center bg-blue-500/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg">
              <GiClothes className="text-white text-3xl mb-2" />
              <div className="font-bold text-white text-sm mb-1 text-center">
                Try-On
              </div>
              <p className="text-white text-center text-xs">
                Virtually AR based try on
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div className="flex-1 flex flex-col items-center bg-pink-500/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg">
              <FaFolderOpen className="text-white text-3xl mb-2" />
              <div className="font-bold text-white text-sm mb-1 text-center">
                Export
              </div>
              <p className="text-white text-center text-xs">
                Create style & share it
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* About Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={aboutInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1 }}
          className="md:w-1/2 flex justify-center z-10 w-full mt-8 md:mt-0"
        >
          <motion.img
            src={About}
            alt="AR experience"
            className="w-full max-w-sm md:w-2/3 rounded-2xl shadow-lg border border-white/40"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </section>

      {/* 🚀 Features Section with Dark Background */}
      <section
        id="features"
        ref={featuresRef}
        className="relative p-8 sm:p-16 md:p-24 bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-800 text-white overflow-hidden"
      >
        {/* Floating Gradient Circles */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl"></div>

        {/* Section Title */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="text-3xl sm:text-4xl font-bold mb-12 text-center text-white"
        >
          Our{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Features
          </span>
        </motion.h2>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={featuresInView ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, staggerChildren: 0.2 }}
          className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-6 text-center z-10"
        >
          {[
            {
              icon: <GiClothes size={36} className="text-white mx-auto mb-3" />,
              title: "Virtual Try-On",
              desc: "Real-time AR outfit fitting instantly.",
            },
            {
              icon: <FaTshirt size={36} className="text-white mx-auto mb-3" />,
              title: "Mix & Match",
              desc: "Combine clothes and accessories to explore new looks.",
            },
            {
              icon: (
                <FaShareAlt size={36} className="text-white mx-auto mb-3" />
              ),
              title: "Share Styles",
              desc: "Post outfits and get feedback from friends.",
            },
            {
              icon: (
                <FaFolderOpen size={36} className="text-white mx-auto mb-3" />
              ),
              title: "Virtual Collection",
              desc: "Save and showcase your favorite outfits anytime.",
            },
          ].map((f, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-md hover:shadow-lg border border-white/20"
            >
              {f.icon}
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-white text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </>
  );
}
