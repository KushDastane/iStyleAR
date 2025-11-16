import { useState, useEffect, useRef } from "react";
import {
  Outlet,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { FaShoppingCart, FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { toast } from "react-toastify";
import Logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import { useWardrobe } from "../context/WardrobeContext";


export default function ProtectedLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  console.log("NAVBAR USER:", user);
  const menuRef = useRef(null);
  const { wardrobeItems } = useWardrobe();


  // ✅ Guards
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-purple-600 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
      if (menuOpen) setMenuOpen(false);
    };

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const navLinks = [
    { name: "Dashboard", path: "/user" },
    { name: "Trending", path: "/user/trending" },
    { name: "Virtual Try-On", path: "/user/try-on" },
    { name: "View Cart", path: "/user/wardrobe" },
    { name: "Achievements", path: "/user/achievements" },
    { name: "My Captures", path: "/user/captures" },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <nav
        className={`w-full fixed top-0 left-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-lg shadow-lg"
            : "bg-white/90 backdrop-blur-md shadow-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-18">
            {/* Left: Logo + App Name */}
            <Link
              to="/user"
              className="flex items-center space-x-3 group transition-transform hover:scale-105"
            >
              <div className="relative">
                <img
                  src={Logo}
                  alt="iStyleAR"
                  className="h-10 w-10 rounded-full ring-2 ring-purple-100 group-hover:ring-purple-300 transition-all"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                iStyleAR
              </span>
            </Link>

            {/* Middle: Nav Links (Desktop) */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? "text-purple-600"
                        : "text-gray-700 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right: Icons + Profile + Logout */}
            <div className="flex items-center space-x-3">
              {/* Cart Icon */}
              <button
                onClick={() => navigate("/user/wardrobe")}
                className={`relative p-2 rounded-lg transition-all duration-200 ${
                  location.pathname === "/user/wardrobe"
                    ? "bg-purple-100 text-purple-600"
                    : "text-gray-700 hover:bg-gray-100 hover:text-purple-600"
                }`}
              >
                <FaShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full font-bold">
                  {wardrobeItems.length}
                </span>
              </button>

              {/* Profile Picture */}
              <button
                onClick={() => navigate("/user/profile")}
                className={`relative rounded-full transition-all duration-200 ${
                  location.pathname === "/user/profile"
                    ? "ring-2 ring-purple-600 ring-offset-2"
                    : "ring-2 ring-gray-200 hover:ring-purple-300"
                }`}
              >
                <img
                  src={
                    user?.avatar && user.avatar.trim() !== ""
                      ? user.avatar
                      : "/defaultpfp.png"
                  }
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover"
                />
              </button>

              {/* Logout Button (Desktop) */}
              <button
                onClick={handleLogout}
                className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>Logout</span>
              </button>

              {/* Hamburger (Mobile) */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                ref={menuRef}
              >
                {menuOpen ? (
                  <FaTimes className="w-6 h-6" />
                ) : (
                  <FaBars className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 py-3 bg-gradient-to-b from-white to-gray-50 border-t border-gray-200 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 shadow-sm"
                      : "text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg transition-all duration-200 shadow-md mt-2"
            >
              <FaSignOutAlt className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-16 lg:pt-18 min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
        <Outlet />
      </main>
    </>
  );
}