
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { WardrobeProvider } from "./context/WardrobeContext";
import { RecommendationProvider } from "./context/RecommendationContext";

// Public Pages
import HomePage from "./pages/Home/HomePage";
import TryFreePage from "./pages/TryFree/TryFreePage";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

// User Pages
import Dashboard from "./pages/User/Dashboard";
import Trending from "./pages/User/Trending";
import UserTryOn from "./pages/User/UserTryOn";
import VirtualWardrobe from "./pages/User/VirtualWardrobe";
import ProfileSetup from "./pages/User/ProfileSetup";

// Layouts & Routes
import PrivateRoute from "./Components/PrivateRoute";
import ProtectedLayout from "./Components/ProtectedLayout";
import ErrorBoundary from "./Components/ErrorBoundary";

// Footer
import Footer from "./Components/Footer";

function AppRoutes() {
  console.log("AppRoutes rendering");
  return (
    <Routes>
      {/* ---------- PUBLIC ROUTES ---------- */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/try-free" element={<TryFreePage />} />

      {/* ---------- PROTECTED ROUTES ---------- */}
      <Route
        path="/user/*"
        element={
          <PrivateRoute>
            <ProtectedLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="trending" element={<Trending />} />
        <Route path="try-on" element={<UserTryOn />} />
        <Route path="wardrobe" element={<VirtualWardrobe />} />
        <Route path="profile" element={<ProfileSetup />} />
      </Route>

      {/* ---------- FALLBACK ---------- */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default function App() {
  console.log("App component rendering");
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WardrobeProvider>
          <RecommendationProvider>
            <Router>
              <AppRoutes />
              {/* Render Footer only for public pages */}
              <Footer />
            </Router>
          </RecommendationProvider>
        </WardrobeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
