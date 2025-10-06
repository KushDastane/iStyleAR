import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { WardrobeProvider } from "./context/WardrobeContext";

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

// Layouts & Routes
import PrivateRoute from "./Components/PrivateRoute";
import ProtectedLayout from "./Components/ProtectedLayout";

// Footer
import Footer from "./Components/Footer";

function AppRoutes() {
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
      </Route>

      {/* ---------- FALLBACK ---------- */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WardrobeProvider>
        <Router>
          <AppRoutes />
          {/* Render Footer only for public pages */}
          <Footer />
        </Router>
      </WardrobeProvider>
    </AuthProvider>
  );
}
