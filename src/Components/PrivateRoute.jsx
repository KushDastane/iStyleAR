import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white text-lg">
        Loading your data...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Optional: redirect incomplete profiles
  if (userData && !userData.profileCompleted) {
    console.log("🧭 Redirecting to profile setup...");
    return <Navigate to="/user/profile" replace />;
  }

  return children;
}
