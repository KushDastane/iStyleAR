import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white text-lg">
        Loading your data...
      </div>
    );
  }

  // (Safety) If this ever wraps "/", allow it even without auth
  if (!user && location.pathname === "/") {
    return children;
  }

  // Not logged in → send to login with redirect back
  if (!user) {
    const redirectPath = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectPath)}`}
        replace
      />
    );
  }

  // Optional: redirect incomplete profiles (avoid loop when already on /user/profile)
  if (
    userData &&
    !userData.profileCompleted &&
    !location.pathname.startsWith("/user/profile")
  ) {
    console.log("🧭 Redirecting to profile setup...");
    return <Navigate to="/user/profile" replace />;
  }

  return children;
}
