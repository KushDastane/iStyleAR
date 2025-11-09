// --- Optional: Simple cache/version management ---
const APP_VERSION = "1.0.5";
const savedVersion = localStorage.getItem("app_version");
if (savedVersion !== APP_VERSION) {
  console.log("New version detected! Clearing old cache...");
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem("app_version", APP_VERSION);
}

// --- React setup ---
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./context/AuthContext";
import App from "./App.jsx";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

console.log("🚀 Starting iStyleAR app...");

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const root = createRoot(rootElement);

// ✅ Keep StrictMode — it’s fine now because we guard everything
root.render(
  <StrictMode>
    <AuthProvider>
      <>
        <App />
        <ToastContainer position="top-right" autoClose={2000} />
      </>
    </AuthProvider>
  </StrictMode>
);

console.log("✅ App rendered successfully");
