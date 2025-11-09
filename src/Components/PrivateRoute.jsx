import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // While loading, show spinner only
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9E4C5]"></div>
      </div>
    );
  }

  // After loading is complete, check user state
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user exists but profileCompleted is false and localStorage has 'newUser', redirect to /user/profile
  if (user && localStorage.getItem("newUser") && !user.profileCompleted) {
    return <Navigate to="/user/profile" replace />;
  }

  // Otherwise render children
  return children;
}
