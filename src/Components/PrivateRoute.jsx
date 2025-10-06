import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function PrivateRoute({ children }) {
  const { user } = useAuth();

  if (user === undefined) return null; // still loading
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
