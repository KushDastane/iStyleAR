import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

export default function Footer() {
  const location = useLocation();

  // Show footer only on public homepage
  if (location.pathname !== "/") return null;

  const handleScroll = (id) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-800 text-white py-12 px-6 md:px-24">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
        {/* Brand / Logo */}
        <div className="flex flex-col items-center md:items-start md:flex-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">iStyleAR</h1>
          <p className="text-gray-300 text-sm md:text-base">
            Experience fashion in Augmented Reality.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col md:flex-row flex-1 justify-center md:justify-around gap-8 w-full md:w-auto text-center md:text-left">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleScroll("about")}
              className="hover:text-gray-200 transition"
            >
              About
            </button>
            <button
              onClick={() => handleScroll("features")}
              className="hover:text-gray-200 transition"
            >
              Features
            </button>
            <button
              onClick={() => handleScroll("try-free-section")}
              className="hover:text-gray-200 transition"
            >
              Try Free
            </button>
            <button
              onClick={() => handleScroll("team")}
              className="hover:text-gray-200 transition"
            >
              Team
            </button>
          </div>
          <div className="flex flex-col space-y-2">
            <Link to="/login" className="hover:text-gray-200 transition">
              Login
            </Link>
            <Link to="/register" className="hover:text-gray-200 transition">
              Sign Up
            </Link>
          </div>
        </div>

        {/* Social Icons */}
        <div className="flex gap-4 justify-center md:justify-end md:flex-1">
          <a href="#" className="hover:text-gray-200 transition">
            <FaFacebookF />
          </a>
          <a href="#" className="hover:text-gray-200 transition">
            <FaInstagram />
          </a>
          <a href="#" className="hover:text-gray-200 transition">
            <FaTwitter />
          </a>
          <a href="#" className="hover:text-gray-200 transition">
            <FaLinkedinIn />
          </a>
        </div>
      </div>

      {/* Divider & Copyright */}
      <div className="border-t border-white/20 mt-8 pt-4 text-center text-gray-300 text-sm">
        &copy; {new Date().getFullYear()} iStyleAR. All rights reserved.
      </div>
    </footer>
  );
}
