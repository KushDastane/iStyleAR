import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaTshirt,
  FaCamera,
  FaUsers,
  FaSignInAlt,
  FaBars,
  FaTimes,
  FaChevronRight,
} from "react-icons/fa";

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const navRef = useRef(null);
  const menuRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  /* ------------------------------------
     MOBILE MENU CONTROLLERS
  ------------------------------------ */
  const SECTION_OFFSETS = {
    about: 60,
    features: 80,
    team: 120,
    "try-free-section": 90,
  };

  const toggleMenu = () => setOpen((prev) => !prev);
  const closeMenu = () => setOpen(false);

  /* ------------------------------------
     Event Listeners (Scroll + Click Outside)
  ------------------------------------ */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });

    const handleClickOutside = (event) => {
      if (!open) return;

      const clickedHamburger = event.target.closest(".hamburger-btn");

      if (
        !clickedHamburger &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  /* ------------------------------------
     FIXED SCROLL OFFSET LOGIC
  ------------------------------------ */
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const navHeight = navRef.current?.offsetHeight || 70;

    const isMobile = window.innerWidth < 768;
    const EXTRA_DOWN = isMobile ? 450 : 80;

    const y =
      el.getBoundingClientRect().top + window.scrollY - navHeight + EXTRA_DOWN;

    window.scrollTo({ top: y, behavior: "smooth" });
  };

  /* ------------------------------------
     HANDLE CLICK ON NAV LINKS
  ------------------------------------ */
  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    closeMenu(); // close menu FIRST

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => scrollToSection(targetId), 250);
    } else {
      setTimeout(() => scrollToSection(targetId), 50);
    }
  };

  /* ------------------------------------
     LOGO CLICK GOES TO TOP
  ------------------------------------ */
  const handleLogoClick = () => {
    closeMenu();

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 180);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /* ------------------------------------
     NAV LINKS
  ------------------------------------ */
  const navLinks = [
    { id: "about", label: "About", icon: FaTshirt },
    { id: "features", label: "Features", icon: FaCamera },
    { id: "team", label: "Team", icon: FaUsers },
  ];

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled
          ? "bg-white/95 backdrop-blur-lg shadow-lg border-gray-200"
          : "bg-gradient-to-b from-black/30 to-transparent backdrop-blur-sm"
        }`}
    >
      <div className="relative max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* LEFT — LOGO */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-3 font-bold text-xl cursor-pointer group"
        >
          <img
            src={scrolled ? "/trade_light.png" : "/trade_dark.png"}
            alt="iStyleAR"
            className="h-6 sm:h-8 w-auto object-contain transition-all duration-300 transform group-hover:scale-105"
          />
        </div>

        {/* CENTER — PERFECTLY CENTERED NAV LINKS */}
        <div className="hidden md:flex items-center space-x-2 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={(e) => handleNavClick(e, link.id)}
                className={`group flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ${scrolled
                    ? "text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                    : "text-white hover:bg-white/20"
                  }`}
              >
                <Icon className="text-base group-hover:scale-110 transition-transform duration-300" />
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>

        {/* RIGHT — ACTION BUTTONS */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={(e) => handleNavClick(e, "try-free-section")}
            className={`group flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${scrolled
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700"
                : "bg-white text-indigo-600 shadow-lg hover:shadow-xl hover:bg-gray-50"
              }`}
          >
            <FaCamera />
            <span>Try AR</span>
            <FaChevronRight className="text-xs opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
          </button>

          <Link
            to="/login"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 border-2 ${scrolled
                ? "border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                : "border-white text-white hover:bg-white hover:text-indigo-600"
              }`}
          >
            <FaSignInAlt />
            <span>Sign In</span>
          </Link>
        </div>

        {/* MOBILE HAMBURGER */}
        <button
          className={`hamburger-btn md:hidden p-2 rounded-lg transition-all duration-300 ${scrolled
              ? "text-gray-900 hover:bg-gray-100"
              : "text-white hover:bg-white/20"
            }`}
          onClick={toggleMenu}
        >
          <div className="relative w-6 h-6">
            <FaBars
              className={`absolute inset-0 text-2xl transition-all duration-300 ${open ? "opacity-0 rotate-180" : "opacity-100 rotate-0"
                }`}
            />
            <FaTimes
              className={`absolute inset-0 text-2xl transition-all duration-300 ${open ? "opacity-100 rotate-0" : "opacity-0 rotate-180"
                }`}
            />
          </div>
        </button>
      </div>
      {/* Mobile Menu Panel */}
      <div
        ref={menuRef}
        className={`md:hidden transition-all duration-500 origin-top ${open
            ? "max-h-screen opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-4 overflow-hidden"
          } bg-white/98 backdrop-blur-lg shadow-2xl border-t border-gray-200`}
      >
        <div className="px-6 py-6 flex flex-col gap-2">
          {navLinks.map((link, i) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={(e) => handleNavClick(e, link.id)}
                className={`group text-left flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300 transform hover:translate-x-2 ${open ? "animate-slideIn" : ""
                  }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-indigo-100 transition-colors">
                  <Icon className="text-lg" />
                </div>
                <span className="font-medium">{link.label}</span>
                <FaChevronRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}

          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-3">
            <button
              onClick={(e) => handleNavClick(e, "try-free-section")}
              className="group flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <FaCamera />
              <span>Try AR Now</span>
              <FaChevronRight className="text-xs" />
            </button>

            <Link
              to="/login"
              onClick={closeMenu}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border-2 border-indigo-600 text-indigo-600 font-semibold hover:bg-indigo-600 hover:text-white transition-all"
            >
              <FaSignInAlt />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ANIMATIONS */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.4s ease-out forwards;
        }
      `}</style>
    </nav>
  );

}
