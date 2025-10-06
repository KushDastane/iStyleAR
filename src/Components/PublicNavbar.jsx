import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaTshirt,
  FaCamera,
  FaUsers,
  FaSignInAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import Logo from "../assets/logo.png";

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // scroll with offset for fixed navbar
  const scrollToSection = (id) => {
    const navHeight = navRef.current?.offsetHeight || 80;
    // try id, then data-section attribute
    const el =
      document.getElementById(id) ||
      document.querySelector(`[data-section="${id}"]`) ||
      document.querySelector(`a[name="${id}"]`);
    if (!el) return;
    const top =
      el.getBoundingClientRect().top + window.pageYOffset - navHeight - 12;
    window.scrollTo({ top, behavior: "smooth" });
  };

  // handle clicks (works if user is on other route: navigate to "/" then scroll)
  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      // allow small delay for DOM render then scroll
      setTimeout(() => scrollToSection(targetId), 120);
    } else {
      scrollToSection(targetId);
    }
  };

  const handleLogoClick = () => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 120);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-400 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-md text-gray-900"
          : "bg-transparent text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-3">
        {/* Logo */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-2 font-bold text-xl cursor-pointer"
        >
          {" "}
          <FaTshirt
            className={`text-2xl transition-all duration-200 ${
              scrolled ? "text-indigo-600" : "text-purple-300"
            }`}
          />
          {/* <img src={Logo} alt="iStyleAR" className="h-10 w-10" /> */}
          <span>iStyleAR</span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <button
            onClick={(e) => handleNavClick(e, "about")}
            className="flex items-center gap-2 hover:text-indigo-400 transition"
          >
            <FaTshirt className="text-lg" />
            <span>About</span>
          </button>

          <button
            onClick={(e) => handleNavClick(e, "features")}
            className="flex items-center gap-2 hover:text-indigo-400 transition"
          >
            <FaCamera className="text-lg" />
            <span>Features</span>
          </button>

          <button
            onClick={(e) => handleNavClick(e, "team")}
            className="flex items-center gap-2 hover:text-indigo-400 transition"
          >
            <FaUsers className="text-lg" />
            <span>Team</span>
          </button>
        </div>

        {/* Desktop action buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={(e) => handleNavClick(e, "try-free-section")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              scrolled
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <FaCamera />
            Try AR
          </button>

          <Link
            to="/login"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              scrolled
                ? "border border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                : "border border-white/60 text-white hover:bg-white/20"
            }`}
          >
            <FaSignInAlt />
            Login
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden ml-2 text-2xl"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile menu panel */}
      <div
        className={`md:hidden transition-all duration-300 origin-top ${
          open
            ? "max-h-screen opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        } bg-white/95 text-gray-900 shadow-lg`}
      >
        <div className="px-6 py-4 flex flex-col gap-3">
          <button
            onClick={(e) => handleNavClick(e, "about")}
            className="text-left flex items-center gap-3 py-2 hover:text-indigo-600"
          >
            <FaTshirt /> About
          </button>
          <button
            onClick={(e) => handleNavClick(e, "features")}
            className="text-left flex items-center gap-3 py-2 hover:text-indigo-600"
          >
            <FaCamera /> Features
          </button>
          <button
            onClick={(e) => handleNavClick(e, "team")}
            className="text-left flex items-center gap-3 py-2 hover:text-indigo-600"
          >
            <FaUsers /> Team
          </button>

          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={(e) => handleNavClick(e, "try-free-section")}
              className="px-4 py-3 rounded bg-indigo-600 text-white text-center"
            >
              Try AR
            </button>
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded border border-gray-300 text-center"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
