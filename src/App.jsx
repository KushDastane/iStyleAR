import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Public Pages
import HomePage from "./pages/Home/HomePage";
import TryFreePage from "./pages/TryFree/TryFreePage";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Onboarding from "./pages/Auth/Onboarding";
import HowItWorks from "./pages/Home/HowItWorks";
import FAQ from "./pages/Home/FAQ";
import ContactUs from "./pages/Home/ContactUs";
import TestimonialsPage from "./pages/Home/TestimonialsPage";
import TermsAndPrivacy from "./pages/Home/TermsAndPrivacy";

// User Pages
import Dashboard from "./pages/User/Dashboard";
import Trending from "./pages/User/Trending";
import UserTryOn from "./pages/User/UserTryOn";
import VirtualWardrobe from "./pages/User/VirtualWardrobe";
import OutfitBuilder from "./pages/User/OutfitBuilder";
import Community from "./pages/User/Community";
import Settings from "./pages/User/Settings";

// Layouts & Routes
import PrivateRoute from "./Components/PrivateRoute";
import ProtectedLayout from "./Components/ProtectedLayout";

// Optional: Footer for public pages
import Footer from "./Components/Footer";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ---------- PUBLIC ROUTES ---------- */}
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ---------- AUTH ROUTES ---------- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* ---------- PROTECTED ROUTES (NAVBAR inside ProtectedLayout) ---------- */}
          <Route
            element={
              <PrivateRoute>
                <ProtectedLayout />
              </PrivateRoute>
            }
          >
            <Route path="/user" element={<Dashboard />} />
            <Route path="/user/wardrobe" element={<VirtualWardrobe />} />
            <Route path="/user/try-on" element={<UserTryOn />} />
            <Route path="/user/outfit-builder" element={<OutfitBuilder />} />
            <Route path="/user/community" element={<Community />} />
            <Route path="/user/settings" element={<Settings />} />

            <Route path="/user/trending" element={<Trending />} />
          </Route>

          {/* ---------- FALLBACK ROUTE ---------- */}
          <Route path="*" element={<HomePage />} />
        </Routes>

        {/* Footer visible only on public pages */}
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
