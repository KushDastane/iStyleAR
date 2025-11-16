// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FaTshirt, FaShareAlt, FaFolderOpen, FaUpload } from "react-icons/fa";
import { GiClothes } from "react-icons/gi";
import { HiArrowRight } from "react-icons/hi";
import About from "../assets/hero/about3.png";

export default function AboutAndFeatures({
  aboutRef,
  aboutInView,
  featuresRef,
  featuresInView,
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <>
      {/* 🌟 About Section */}
      <section
        id="about"
        ref={aboutRef}
        className="relative flex flex-col lg:flex-row items-center justify-between py-20 px-6 sm:px-12 lg:px-24 xl:px-32 bg-gradient-to-br from-purple-50 via-white to-blue-50 overflow-hidden"
      >
        {/* Enhanced background elements */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[32rem] h-[32rem] bg-gradient-to-tl from-blue-400/15 to-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-300/10 rounded-full blur-2xl"></div>

        {/* Content Container */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={aboutInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="lg:w-1/2 lg:pr-12 mb-12 lg:mb-0 z-10 max-w-2xl"
        >
          {/* Section Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={aboutInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-purple-100 rounded-full"
          >
            <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-purple-800 tracking-wide">
              ABOUT US
            </span>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={aboutInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 tracking-tight leading-tight"
          >
            Revolutionize Your Style with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600">
              iStyleAR
            </span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={aboutInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-600 text-lg leading-relaxed mb-10 font-light"
          >
            Experience the future of fashion with our cutting-edge platform. We
            combine{" "}
            <span className="font-semibold text-purple-700">
              Augmented Reality
            </span>{" "}
            technology with intuitive design to help you explore, experiment,
            and express your unique style — all from the comfort of your home.
          </motion.p>

          {/* How It Works Steps */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={aboutInView ? "visible" : "hidden"}
            className="space-y-4"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-5">
              How It Works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: <FaUpload className="text-3xl" />,
                  step: "01",
                  title: "Upload",
                  desc: "Upload your photo or outfit image",
                  gradient: "from-purple-500 to-purple-600",
                  bgGradient: "from-purple-50 to-purple-100",
                },
                {
                  icon: <GiClothes className="text-3xl" />,
                  step: "02",
                  title: "Try-On",
                  desc: "Experience AR-powered virtual fitting",
                  gradient: "from-blue-500 to-blue-600",
                  bgGradient: "from-blue-50 to-blue-100",
                },
                {
                  icon: <FaFolderOpen className="text-3xl" />,
                  step: "03",
                  title: "Share",
                  desc: "Save and share your perfect style",
                  gradient: "from-pink-500 to-pink-600",
                  bgGradient: "from-pink-50 to-pink-100",
                },
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`relative group bg-gradient-to-br ${step.bgGradient} p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-white/60`}
                >
                  {/* Step Number */}
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">
                      {step.step}
                    </span>
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-16 h-16 mb-4 bg-gradient-to-br ${step.gradient} rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}
                  >
                    {step.icon}
                  </div>

                  {/* Content */}
                  <h4 className="font-bold text-gray-900 text-lg mb-2">
                    {step.title}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Image Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 60 }}
          animate={aboutInView ? { opacity: 1, scale: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="lg:w-1/2 flex justify-center items-center z-10 relative"
        >
          {/* Decorative elements around image */}
          <div className="absolute -z-10 w-full h-full bg-gradient-to-br from-purple-300/30 to-blue-300/30 rounded-3xl blur-2xl scale-110"></div>

          <motion.div
            className="relative"
            animate={{ y: [0, -12, 0] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <img
              src={About}
              alt="AR fashion experience"
              className="w-full max-w-md lg:max-w-lg rounded-3xl shadow-2xl border-4 border-white/80"
            />

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={aboutInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute -bottom-6 -right-6 bg-gradient-to-br from-purple-600 to-blue-600 text-white px-6 py-4 rounded-2xl shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <div className="text-xs font-medium opacity-90">
                    AR Powered
                  </div>
                  <div className="text-lg font-bold">Live Now</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* 🚀 Features Section */}
      <section
        id="features"
        ref={featuresRef}
        className="relative py-24 px-6 sm:px-12 lg:px-24 xl:px-32
    bg-gradient-to-b from-[#0f0a22] via-[#180f33] to-[#0c1020]
    text-white overflow-hidden"
      >
        {/* Soft purple haze (top-left) */}
        <div
          className="absolute -top-32 -left-32 w-[32rem] h-[32rem]
    bg-purple-500/20 rounded-full blur-[130px]"
        ></div>

        {/* Pink–violet glow (upper-right) */}
        <div
          className="absolute -top-10 right-0 w-[28rem] h-[28rem]
    bg-pink-500/20 rounded-full blur-[140px]"
        ></div>

        {/* Blue cosmic orb (bottom-left) */}
        <div
          className="absolute bottom-0 left-[20%] w-[30rem] h-[30rem]
    bg-blue-500/20 rounded-full blur-[150px]"
        ></div>

        {/* Central purple-blue mist */}
        <div
          className="absolute inset-0 
    bg-[radial-gradient(ellipse_at_center,_rgba(88,32,180,0.12)_0%,_transparent_70%)]"
        ></div>

        {/* Soft deepening vignette */}
        <div
          className="absolute inset-0 
    bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.35)_100%)]"
        ></div>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 relative z-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2 mb-6 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
          >
            <span className="text-sm font-semibold text-blue-300 tracking-wide">
              FEATURES
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
          >
            Powerful Features for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Modern Fashion
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto font-light"
          >
            Discover innovative tools designed to transform your fashion
            experience
          </motion.p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={featuresInView ? "visible" : "hidden"}
          className="grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-6 relative z-10"
        >
          {[
            {
              icon: <GiClothes size={42} />,
              title: "Virtual Try-On",
              desc: "Experience instant AR-powered outfit fitting with photorealistic rendering technology.",
              gradient: "from-purple-500/20 to-purple-600/20",
              iconBg: "from-purple-500 to-purple-600",
            },
            {
              icon: <FaTshirt size={42} />,
              title: "Mix & Match",
              desc: "Combine unlimited clothing and accessories to create unique, personalized looks.",
              gradient: "from-blue-500/20 to-blue-600/20",
              iconBg: "from-blue-500 to-blue-600",
            },
            {
              icon: <FaShareAlt size={42} />,
              title: "Share Styles",
              desc: "Showcase your outfits and receive instant feedback from your fashion community.",
              gradient: "from-pink-500/20 to-pink-600/20",
              iconBg: "from-pink-500 to-pink-600",
            },
            {
              icon: <FaFolderOpen size={42} />,
              title: "Virtual Wardrobe",
              desc: "Organize and access your complete style collection anytime, anywhere.",
              gradient: "from-indigo-500/20 to-indigo-600/20",
              iconBg: "from-indigo-500 to-indigo-600",
            },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -12, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`group relative bg-gradient-to-br ${feature.gradient} backdrop-blur-xl p-8 rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-2xl`}
            >
              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

              {/* Icon */}
              <div
                className={`w-20 h-20 mb-6 bg-gradient-to-br ${feature.iconBg} rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
              >
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="font-bold text-2xl mb-3 text-white">
                {feature.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA accent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16 relative z-10"
        >
          <p className="text-gray-400 text-sm">
            Join thousands of fashion enthusiasts transforming their style
          </p>
        </motion.div>
      </section>
    </>
  );
}
