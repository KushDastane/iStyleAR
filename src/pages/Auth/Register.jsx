import { useState } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUserAlt,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1️⃣ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;

      // 2️⃣ Create Firestore user document
      console.log("🧾 Creating Firestore document for:", user.uid);
      await setDoc(doc(db, "users", user.uid), {
        name: form.name,
        email: form.email,
        avatar: "/defaultpfp.png",
        wardrobe: [],
        tryHistory: [],
        totalTryCount: 0,
        totalUploads: 0,
        freeTryonsLeft: 15,
        profileCompleted: false,
        createdAt: new Date().toISOString(),
      });

      console.log("✅ Firestore user doc created successfully");
      toast.success("Registration successful! Please log in.");

      // 3️⃣ Prevent race: Sign out and redirect to login
      await signOut(auth);
      localStorage.removeItem("newUser"); // clear any flags
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("❌ Registration error:", error);
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-800 dark:from-gray-900 dark:via-gray-800 dark:to-black p-4 overflow-hidden">
      <div className="relative w-full max-w-md bg-white/20 backdrop-blur-lg rounded-3xl shadow-xl p-10 flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-8 text-white text-center">
          Create Account
        </h2>

        <form className="w-full space-y-6" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="relative">
            <FaUserAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-3 pl-10 rounded-xl bg-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-300"
              required
            />
          </div>

          {/* Email */}
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
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

          {/* Password */}
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

          {/* Register Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:scale-105 transform transition-all duration-300 shadow-lg"
          >
            Register
          </button>
        </form>

        <p className="mt-6 text-white/80 text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-300 hover:underline">
            Login
          </Link>
        </p>

        {/* Floating decorations */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-blue-400/30 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      </div>
    </div>
  );
}
