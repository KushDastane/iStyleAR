import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/config";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  FaUserAlt,
  FaLock,
  FaArrowLeft,
  FaHome,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth) {
      toast.error(
        "Authentication service unavailable. Please check your connection."
      );
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      toast.success("Login successful!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/user");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-800 dark:from-gray-900 dark:via-gray-800 dark:to-black p-4 overflow-hidden">
      <div className="relative w-full max-w-md bg-white/20 backdrop-blur-lg rounded-3xl shadow-xl p-10 flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-8 text-white text-center">
          Welcome Back
        </h2>
        <form className="w-full space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <FaUserAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-3 pl-10 rounded-xl bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-300"
              required
            />
          </div>
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 pl-10 pr-10 rounded-xl bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-300"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:scale-105 transform transition-all duration-300 shadow-lg"
          >
            Login
          </button>
        </form>
        <p className="mt-6 text-white/80 text-sm text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-purple-300 hover:underline">
            Register
          </Link>
        </p>

        <p className="mt-6 flex justify-center items-center gap-2 text-sm text-white/80">
          <Link
            to="/"
            className="flex items-center gap-2 text-purple-300 hover:text-purple-400 transition-all duration-300 group"
          >
            <FaArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />

            <span className="font-medium group-hover:underline">
              Back to Home
            </span>
          </Link>
        </p>

        {/* Decorative floating blur circles */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-blue-400/30 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      </div>
    </div>
  );
}
