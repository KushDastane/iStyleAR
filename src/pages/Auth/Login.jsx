import { useState, useEffect } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase/config";
import { toast } from "react-toastify";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaArrowLeft, FaGoogle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const redirectParam =
    new URLSearchParams(location.search).get("redirect") || "/user";

  const getFriendlyError = (error) => {
    if (!error?.code) return "Something went wrong. Please try again.";
    switch (error.code) {
      case "auth/popup-closed-by-user":
        return "Sign-in popup closed. Please try again.";
      default:
        return error.message || "Authentication failed. Please try again.";
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
      toast.error("Authentication unavailable. Check your connection.");
      return;
    }

    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();

      // VERY IMPORTANT → add all needed scopes
      provider.addScope("email");
      provider.addScope("profile");
      provider.addScope("https://www.googleapis.com/auth/userinfo.profile");

      provider.setCustomParameters({
        prompt: "select_account", // Always shows account selector
      });

      await signInWithPopup(auth, provider);

      toast.success("Logged in with Google!");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error(getFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  // Redirect after login
  useEffect(() => {
    if (user) {
      navigate(redirectParam || "/user", { replace: true });
    }
  }, [user, navigate, redirectParam]);

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/3 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Floating particles */}
        <div
          className="absolute top-20 left-20 w-2 h-2 bg-purple-400 rounded-full animate-ping"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-40 right-32 w-3 h-3 bg-blue-400 rounded-full animate-ping"
          style={{ animationDuration: "4s", animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-32 left-1/3 w-2 h-2 bg-pink-400 rounded-full animate-ping"
          style={{ animationDuration: "5s", animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"
          style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}
        ></div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
      </div>

      {/* Main login card */}
      <div className="relative w-full max-w-md transform transition-all duration-500 hover:scale-[1.02]">
        {/* Glow effect behind card */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-blue-600/30 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>

        {/* Glass card */}
        <div className="relative backdrop-blur-2xl bg-white/10 border border-white/20 rounded-[2rem] shadow-2xl p-8 md:p-12">
          {/* Shimmer effect */}
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-700"></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center space-y-8">
            {/* Logo/Icon area */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:rotate-12 hover:scale-110">
                <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent animate-gradient">
                Welcome Back
              </h2>
              <p className="text-white/60 text-sm md:text-base font-light tracking-wide">
                Sign in to continue your journey
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            {/* Google Login Button */}
            <div className="w-full space-y-4">
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className={`group relative w-full py-4 px-6 rounded-2xl font-semibold text-white overflow-hidden transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] ${
                  loading ? "opacity-70 cursor-not-allowed" : "hover:shadow-2xl"
                }`}
              >
                {/* Button gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                {/* Button border glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_20px_rgba(168,85,247,0.5)]"></div>

                {/* Button content */}
                <div className="relative flex items-center justify-center gap-3">
                  <FaGoogle
                    className={`text-xl transition-transform duration-300 ${
                      loading ? "animate-spin" : "group-hover:scale-110"
                    }`}
                  />
                  <span className="text-base md:text-lg">
                    {loading ? "Signing in..." : "Sign in with Google"}
                  </span>
                </div>
              </button>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Secured by Google OAuth 2.0</span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            {/* Back to Home Link */}
            <Link
              to="/"
              className="group flex items-center gap-2.5 text-white/70 hover:text-white transition-all duration-300 text-sm md:text-base font-medium"
            >
              <div className="relative">
                <FaArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
                <div className="absolute inset-0 blur-md bg-purple-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              </div>
              <span className="relative">
                Back to Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 group-hover:w-full transition-all duration-300"></span>
              </span>
            </Link>
          </div>

          {/* Corner accent decorations */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-tr-[2rem] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-bl-[2rem] pointer-events-none"></div>
        </div>
      </div>

      {/* Additional floating elements */}
      <div
        className="absolute top-10 left-10 w-20 h-20 border border-purple-500/20 rounded-full animate-spin pointer-events-none"
        style={{ animationDuration: "20s" }}
      ></div>
      <div
        className="absolute bottom-20 right-20 w-16 h-16 border border-blue-500/20 rounded-full animate-spin pointer-events-none"
        style={{ animationDuration: "15s", animationDirection: "reverse" }}
      ></div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
