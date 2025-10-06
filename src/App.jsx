import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { WardrobeProvider } from "./context/WardrobeContext";

// Public Pages
import HomePage from "./pages/Home/HomePage";
import TryFreePage from "./pages/TryFree/TryFreePage";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Onboarding from "./pages/Auth/Onboarding";
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

// Footer
import Footer from "./Components/Footer";

function AppRoutes() {
  return (
    <Routes>
      {/* ---------- PUBLIC ROUTES ---------- */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/testimonials" element={<TestimonialsPage />} />
      <Route path="/terms" element={<TermsAndPrivacy />} />
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
        <Route path="outfit-builder" element={<OutfitBuilder />} />
        <Route path="community" element={<Community />} />
        <Route path="settings" element={<Settings />} />
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
