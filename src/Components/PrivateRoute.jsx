import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function PrivateRoute({ children }) {
  const { user } = useAuth();

  if (user === undefined)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9E4C5]"></div>
      </div>
    ); // show loading instead of blank
  if (!user) return <Navigate to="/login" replace />;

  // If user is new (from localStorage) and profile not completed, redirect to profile setup
  if (user && localStorage.getItem("newUser") && !user.profileCompleted) {
    return <Navigate to="/user/profile" replace />;
  }

  return children;
}
