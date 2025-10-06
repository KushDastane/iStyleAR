import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaUserCircle, FaBars, FaTimes } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { toast } from "react-toastify";
import Logo from "../assets/logo.png";
import { useAuth } from "../context/useAuth";



export default function ProtectedLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();


  const navLinks = [
    { name: "Dashboard", path: "/user" },
    { name: "Trending", path: "/user/trending" },
    { name: "Virtual Try-On", path: "/user/try-on" },
    { name: "View Cart", path: "/user/wardrobe" },
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
      <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-1 flex justify-between items-center h-16">
          {/* Left: Logo + App Name */}
          <div className="flex items-center space-x-3">
            <img src={Logo} alt="iStyleAR" className="h-10 w-10" />
            <span className="font-bold text-xl text-gray-900">iStyleAR</span>
          </div>

          {/* Middle: Nav Links (hidden on small screens) */}
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
              className="text-gray-700 w-6 h-6 cursor-pointer hover:text-purple-600"
              onClick={() => {
                if (!loading && user) navigate("/user/wardrobe");
              }}
            />
            <FaUserCircle className="text-gray-700 w-6 h-6 cursor-pointer hover:text-purple-600" />

            {/* Desktop Logout */}
            <button
              onClick={handleLogout}
              className="hidden md:inline-block px-4 py-2 bg-red-700 hover:bg-red-900 text-white font-medium rounded-md w-fit self-start transition-colors"
            >
              Logout
            </button>

            {/* Hamburger Menu (small screens) */}
            <div className="md:hidden">
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
          <div className="md:hidden bg-white shadow-md border-t border-gray-200 px-4 py-2 flex flex-col gap-2">
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

            {/* Subtle Mobile Logout */}
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="px-4 py-2 bg-red-700 hover:bg-red-900 text-white font-medium rounded-md w-fit self-start transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Outlet for child pages */}
      <main className="pt-16">
        <Outlet />
      </main>
    </>
  );
}
