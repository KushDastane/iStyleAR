/* eslint-disable no-unused-vars */
import { motion, useAnimation } from "framer-motion";
import { useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import TryFreePage from "../TryFree/TryFreePage";
import { Link } from "react-router-dom";
import AboutAndFeatures from "../../Components/AboutAndFeatures";

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

  const tryFreeRef = useRef(null); // Ref for TryFree section
  const animation = useAnimation();

  useEffect(() => {
    if (aboutInView || featuresInView || teamInView)
      animation.start({ opacity: 1, y: 0 });
  }, [aboutInView, featuresInView, teamInView]);

  //   const scrollToTryFree = () => {
  //     tryFreeRef.current?.scrollIntoView({ behavior: "smooth" });
  //   };

  return (
    <div className="w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-800 text-white overflow-hidden">
        {/* Floating Background Elements */}
        <motion.div
          className="absolute w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 top-1/4 left-1/3 pointer-events-none"
          animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-40 top-1/2 left-2/3 pointer-events-none"
          animate={{ x: [0, -60, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Hero Content */}
        <motion.h1
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-6xl md:text-7xl font-extrabold mb-4 z-10"
        >
          iStyleAR
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="text-xl md:text-2xl max-w-xl text-center mb-6 z-10"
        >
          Experience the future of fashion — try outfits virtually anywhere with
          Augmented Reality.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="flex space-x-4 z-10"
        >
          {/* Scroll Button for Free Try Demo */}
          <button
            onClick={() => {
              const demoSection = document.getElementById("try-free-section");
              demoSection?.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transform transition-all duration-300 text-white px-8 py-4 rounded-xl shadow-lg"
          >
            Try Free Demo
          </button>

          <Link
            to="/login"
            className="bg-white text-gray-900 px-8 py-4 rounded-xl shadow hover:scale-105 transform transition-all duration-300"
          >
            Login
          </Link>
        </motion.div>
      </section>

      <AboutAndFeatures
        aboutRef={aboutRef}
        aboutInView={aboutInView}
        featuresRef={featuresRef}
        featuresInView={featuresInView}
      />

      {/* Free Demo Embedded */}
      <section
        id="try-free-section"
        ref={tryFreeRef}
        className="min-h-screen p-6 md:p-24 bg-gradient-to-b from-white to-indigo-50"
      >
        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        ></motion.h2>
        <TryFreePage />
      </section>

      {/* Team */}
      <section
        ref={teamRef}
        className="min-h-screen p-6 md:p-24 bg-gradient-to-b from-white to-indigo-50"
      >
        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          animate={teamInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className="text-4xl font-bold mb-12 text-center text-gray-900"
        >
          Meet Our Team
        </motion.h2>

        <motion.div
          className="grid md:grid-cols-4 gap-12 justify-items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={teamInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, staggerChildren: 0.2 }}
        >
          {[
            {
              name: "Kush Dastane",
              role: "Leader & Full-Stack Developer",
              img: "/assets/team/kush.png",
            },
            {
              name: "Pranav Chavan",
              role: "AR Developer",
              img: "/assets/team/jane.png",
            },
            {
              name: "Pushpak Khade",
              role: "UI/UX Designer",
              img: "/assets/team/john.png",
            },
            {
              name: "Sudhanshu Ray",
              role: "Researcher",
              img: "/assets/team/john.png",
            },
          ].map((member, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <img
                src={member.img}
                alt={member.name}
                className="w-40 h-40 rounded-full object-cover mb-4 shadow-lg"
              />
              <h3 className="font-semibold text-xl">{member.name}</h3>
              <p className="text-gray-600">{member.role}</p>
            </div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
