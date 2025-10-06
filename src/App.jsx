import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/Home/HomePage";
import Dashboard from "./pages/User/Dashboard";
import PreviousTries from "./pages/User/PreviousTries";
// import Suggestions from "./pages/User/Suggestions";
import Trending from "./pages/User/Trending";
import TryFreePage from "./pages/TryFree/TryFreePage";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import PrivateRoute from "./Components/PrivateRoute";
import UserTryOn from "./pages/User/UserTryOn";
import VirtualWardrobe from "./pages/User/VirtualWardrobe";
import ProtectedLayout from "./Components/ProtectedLayout";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Private Routes wrapped inside ProtectedLayout */}
          <Route
            element={
              <PrivateRoute>
                <ProtectedLayout />
              </PrivateRoute>
            }
          >
            <Route path="/user" element={<Dashboard />} />
            <Route path="/try-free" element={<TryFreePage />} />
            <Route path="/user/wardrobe" element={<VirtualWardrobe />} />
            <Route path="/user/try-on" element={<UserTryOn />} />
            <Route path="/previous-tries" element={<PreviousTries />} />
            {/* <Route path="/suggestions" element={<Suggestions />} /> */}
            <Route path="/trending" element={<Trending />} />
          </Route>

          {/* Default route */}
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
