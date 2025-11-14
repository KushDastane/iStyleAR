import { useState, useEffect, useRef } from "react";
import {
  Outlet,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { FaShoppingCart, FaBars, FaTimes } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { toast } from "react-toastify";
import Logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";


export default function ProtectedLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const menuRef = useRef(null);

  // ✅ Guards
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9E4C5]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleScroll = () => {
      if (menuOpen) setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
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
      navigate("/login");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <nav className="w-full bg-white/90 backdrop-blur-md shadow-md fixed top-0 left-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-1 flex justify-between items-center h-16">
          {/* Left: Logo + App Name */}
          <div className="flex items-center space-x-3">
            <img src={Logo} alt="iStyleAR" className="h-10 w-10 rounded-full" />
            <span className="font-bold text-xl text-gray-900">iStyleAR</span>
          </div>

          {/* Middle: Nav Links */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-gray-700 hover:text-purple-600 font-medium ${
                  location.pathname === link.path ? "text-purple-600" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right: Icons + Logout + Hamburger */}
          <div className="flex gap-2 items-center space-x-4 md:space-x-2">
            <FaShoppingCart
              className={`w-6 h-6 cursor-pointer hover:text-purple-600 ${
                location.pathname === "/user/wardrobe"
                  ? "text-purple-600"
                  : "text-gray-700"
              }`}
              onClick={() => navigate("/user/wardrobe")}
            />

            <img
              src={user.avatar || "/defaultpfp.png"}
              alt="Profile"
              className={`w-8 h-8 rounded-full object-cover border-2 cursor-pointer hover:border-purple-600 ${
                location.pathname === "/user/profile"
                  ? "border-purple-600 shadow-lg"
                  : "border-gray-300"
              }`}
              onClick={() => navigate("/user/profile")}
            />

            <button
              onClick={handleLogout}
              className="hidden md:inline-block px-4 py-2 bg-red-700 hover:bg-red-900 text-white font-medium rounded-md transition-colors"
            >
              Logout
            </button>

            {/* Hamburger (mobile) */}
            <div className="md:hidden" ref={menuRef}>
              <button onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? (
                  <FaTimes className="w-6 h-6 text-gray-700" />
                ) : (
                  <FaBars className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div
            ref={menuRef}
            className="md:hidden bg-white shadow-md border-t border-gray-200 px-4 py-2 flex flex-col gap-2"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 font-medium rounded-md ${
                  location.pathname === link.path ? "text-purple-600" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}

            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="px-4 py-2 bg-red-700 hover:bg-red-900 text-white font-medium rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      <main className="pt-16">
        <Outlet />
      </main>
    </>
  );
}
