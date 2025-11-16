/* eslint-disable no-unused-vars */
import { motion, useAnimation } from "framer-motion";
import { useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import TryFreePage from "../TryFree/TryFreePage";
import AboutAndFeatures from "../../Components/AboutAndFeatures";
import PublicNavbar from "../../Components/PublicNavbar";
import kushImg from "../../assets/team/pfp.png";
import pranavImg from "../../assets/team/pranav.png";
import pushpakImg from "../../assets/team/pushpak.png";
import sudhanshuImg from "../../assets/team/sudhanshu.png";

export default function HomePage() {
  console.log("HomePage component rendering");
  const [aboutRef, aboutInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });
  const [featuresRef, featuresInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });
  const [teamRef, teamInView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const tryFreeRef = useRef(null);

  const animation = useAnimation();
  useEffect(() => {
    if (aboutInView || featuresInView || teamInView)
      animation.start({ opacity: 1, y: 0 });
  }, [aboutInView, featuresInView, teamInView, animation]);

  return (
    <div className="w-full overflow-x-hidden bg-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center
  bg-gradient-to-br from-[#0e082f] via-[#1a0f47] to-[#0a0c25]
  text-white overflow-hidden px-4 sm:px-6 md:px-8"
      >
        {/* Soft glossy highlight (top center) */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-40 
      bg-white/5 blur-[60px] opacity-70 rounded-full pointer-events-none"
        ></div>

        {/* Deep shine diagonal purple glow */}
        <div
          className="absolute inset-0 
      bg-[radial-gradient(circle_at_30%_20%,rgba(140,70,255,0.35),transparent_60%)] 
      pointer-events-none"
        ></div>

        {/* Purple sheen overlay */}
        <div
          className="absolute inset-0 
      bg-[radial-gradient(circle_at_70%_30%,rgba(255,95,220,0.18),transparent_70%)] 
      pointer-events-none"
        ></div>

        {/* Slight grid sheen */}
        <div className="absolute inset-0 bg-grid-white/[0.03] pointer-events-none"></div>

        {/* Neon orb 1: Glowing Purple (top-right) */}
        <motion.div
          className="absolute w-[300px] h-[300px] sm:w-[450px] sm:h-[450px]
      bg-[radial-gradient(circle,rgba(150,80,255,0.45),rgba(255,120,230,0.22),transparent)]
      rounded-full blur-[110px] top-[-70px] right-[-60px]"
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Neon orb 2: Electric Cyan (bottom-left) */}
        <motion.div
          className="absolute w-[320px] h-[320px] sm:w-[480px] sm:h-[480px]
      bg-[radial-gradient(circle,rgba(70,130,255,0.45),rgba(90,220,255,0.25),transparent)]
      rounded-full blur-[120px] bottom-[-90px] left-[-80px]"
          animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Gloss highlight reflection (bottom center) */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-32
      bg-white/5 blur-[70px] opacity-40 rounded-full pointer-events-none"
        ></div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-5 sm:space-y-7 mt-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              The Future of Fashion Technology
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-5xl sm:text-5xl md:text-6xl lg:text-8xl font-bold tracking-tight leading-tight pt-6"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white ">
              iStyleAR
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-sm sm:text-lg md:text-xl max-w-2xl mx-auto text-gray-300 leading-relaxed font-light px-1"
          >
            Experience the future of fashion — try outfits virtually anywhere
            with
            <span className="text-purple-300 font-medium">
              {" "}
              Augmented Reality
            </span>
            .
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2"
          >
            <button
              onClick={() =>
                tryFreeRef.current?.scrollIntoView({ behavior: "smooth" })
              }
              className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold text-sm sm:text-lg shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transform hover:scale-[1.03] transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Try Free Demo
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <button
              onClick={() => (window.location.href = "/login")}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-semibold text-sm sm:text-lg hover:bg-white/20 transform hover:scale-[1.02] transition-all duration-300 shadow-lg"
            >
              Sign In
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center  gap-y-3 gap-x-8 pt-4 text-xs sm:text-sm text-gray-300"
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>No Installation Required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13 7H7v6h6V7z" />
                <path
                  fillRule="evenodd"
                  d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Real-time AR Processing</span>
            </div>
          </motion.div>
        </div>

        {/* Scroll Down Indicator – hidden on mobile to avoid overlap */}
        <motion.div
          className="flex absolute bottom-16 md:bottom-8 flex-col items-center gap-2 z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
            <motion.div
              className="w-1 h-2 bg-white rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <p className="text-white/60 text-xs font-medium tracking-wider uppercase">
            Scroll
          </p>
        </motion.div>
      </section>

      {/* About & Features */}
      <AboutAndFeatures
        aboutRef={aboutRef}
        aboutInView={aboutInView}
        featuresRef={featuresRef}
        featuresInView={featuresInView}
      />

      {/* Try Free Section */}
      <section
        id="try-free-section"
        ref={tryFreeRef}
        className=" bg-gradient-to-b from-gray-50 to-white "
      >
        <TryFreePage />
      </section>

      {/* Team Section */}
      <section
        id="team"
        ref={teamRef}
        className="py-16 md:py-24 bg-gradient-to-b text-center from-white to-gray-50 relative overflow-hidden px-4 md:px-8"
      >
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-purple-100/30 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-200/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={teamInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-4">
              Our Team
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Meet the Innovators
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A passionate team dedicated to revolutionizing the fashion
              industry through cutting-edge technology
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10"
            initial={{ opacity: 0, y: 30 }}
            animate={teamInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, staggerChildren: 0.1 }}
          >
            {[
              {
                name: "Kush Dastane",
                role: "Leader & Full-Stack Developer",
                img: kushImg,
              },
              {
                name: "Pranav Chavan",
                role: "AR Developer & 3D Modeling",
                img: pranavImg,
              },
              {
                name: "Pushpak Khade",
                role: "UI/UX Designer & Researcher",
                img: pushpakImg,
              },
              {
                name: "Sudhanshu Ray",
                role: "Frontend Developer & Researcher",
                img: sudhanshuImg,
              },
            ].map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={teamInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative"
              >
                <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                  {/* Hover Gradient Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative">
                    <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden shadow-md mb-4 ring-4 ring-gray-100 group-hover:ring-purple-200 transition-all duration-300">
                      <img
                        src={member.img}
                        alt={member.name}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {member.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
