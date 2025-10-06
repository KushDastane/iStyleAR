/* eslint-disable no-unused-vars */
import { motion, useAnimation } from "framer-motion";
import { useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import TryFreePage from "../TryFree/TryFreePage";
import AboutAndFeatures from "../../Components/AboutAndFeatures";
import PublicNavbar from "../../Components/PublicNavbar";

export default function HomePage() {
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
  }, [aboutInView, featuresInView, teamInView]);

  return (
    <div className="w-full overflow-x-hidden">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-800 text-white overflow-hidden px-4 md:px-0">
        {/* Floating Orbs */}
        <motion.div
          className="absolute w-40 h-40 md:w-60 md:h-60 bg-purple-500/30 rounded-full filter blur-3xl top-1/4 left-1/3 pointer-events-none"
          animate={{ x: [0, 40, 0], y: [0, -40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-32 h-32 md:w-52 md:h-52 bg-blue-400/30 rounded-full filter blur-2xl top-1/2 left-2/3 pointer-events-none"
          animate={{ x: [0, -50, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Hero Content */}
        <motion.h1
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-4 z-10 text-center"
        >
          iStyleAR
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="text-sm sm:text-lg md:text-xl max-w-md md:max-w-xl text-center mb-6 z-10"
        >
          Experience the future of fashion — try outfits virtually anywhere with
          Augmented Reality.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 z-10"
        >
          <button
            onClick={() =>
              tryFreeRef.current?.scrollIntoView({ behavior: "smooth" })
            }
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transform transition-all duration-300 text-white px-5 py-2 sm:px-6 sm:py-3 rounded-xl shadow-lg text-sm sm:text-base"
          >
            Try Free Demo
          </button>
          <button
            onClick={() => (window.location.href = "/login")}
            className="bg-white text-gray-900 px-5 py-2 sm:px-6 sm:py-3 rounded-xl shadow hover:scale-105 transform transition-all duration-300 text-sm sm:text-base"
          >
            Login
          </button>
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
        className="mt-4 bg-gradient-to-b from-indigo-50 to-indigo-50 px-4 md:px-0"
      >
        <TryFreePage />
      </section>

      {/* Team Section */}
      <section
        id="team"
        ref={teamRef}
        className="py-12 md:py-24 bg-gradient-to-b from-indigo-50 to-indigo-50 relative overflow-hidden px-4 md:px-0"
      >
        {/* Floating Orbs */}
        <div className="absolute top-5 left-5 w-28 h-28 md:w-36 md:h-36 bg-purple-200/20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-5 right-5 w-36 h-36 md:w-48 md:h-48 bg-blue-200/20 blur-3xl rounded-full"></div>

        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          animate={teamInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12 text-center text-gray-900"
        >
          Meet Our Team
        </motion.h2>

        <motion.div
          className="flex flex-wrap justify-center gap-6 sm:gap-12"
          initial={{ opacity: 0, y: 30 }}
          animate={teamInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, staggerChildren: 0.2 }}
        >
          {[
            {
              name: "Kush Dastane",
              role: "Leader & Full-Stack Developer",
              imgUrl: "src/assets/team/pfp.png",
            },
            {
              name: "Pranav Chavan",
              role: "AR Developer",
              imgUrl: "src/assets/team/pranav.png",
            },
            {
              name: "Pushpak Khade",
              role: "UI/UX Designer",
              imgUrl: "src/assets/team/pushpak.png",
            },
            {
              name: "Sudhanshu Ray",
              role: "Researcher",
              imgUrl: "src/assets/team/sudhanshu.png",
            },
          ].map((member, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="flex flex-col items-center text-center w-36 sm:w-40"
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full overflow-hidden shadow-lg mb-3 sm:mb-4">
                <img
                  src={member.img}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-base sm:text-lg md:text-xl text-gray-900">
                {member.name}
              </h3>
              <p className="text-gray-500 text-sm sm:text-base md:text-base">
                {member.role}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
