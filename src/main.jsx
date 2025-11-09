// 🧹 1. Unregister old service workers (to avoid cached JS bundles)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      console.log("Unregistering old service worker:", reg.scope);
      reg.unregister();
    });
  });
}

// 🌐 2. Clear corrupted localStorage/sessionStorage or outdated app data
try {
  const APP_VERSION = "1.0.4"; // ⬅️ increment this whenever you deploy a new version (updated for AbortError fixes)
  const savedVersion = localStorage.getItem("app_version");

  // check app version
  if (savedVersion !== APP_VERSION) {
    console.log("New version detected! Clearing old cache...");
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("app_version", APP_VERSION);
  } else {
    // verify localStorage JSON integrity (especially user data)
    const userData = localStorage.getItem("user");
    if (userData) JSON.parse(userData);
  }
} catch (e) {
  console.warn("Corrupted cached data detected, clearing...", e);
  localStorage.clear();
  sessionStorage.clear();
  // Don't force reload on mobile - let user handle it
  if (
    !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    window.location.reload();
  }
}

// 🧩 3. Normal React imports
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import "./index.css";
import App from "./App.jsx";

console.log("Starting React app...");
console.log("User agent:", navigator.userAgent);
console.log(
  "Is mobile:",
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
);

// 🚀 4. Safe app rendering
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Root element not found");

  console.log("Root element found, creating root...");
  const root = createRoot(rootElement);

  console.log("Rendering app...");
  root.render(
    <StrictMode>
      <App />
      <ToastContainer position="top-right" autoClose={2000} />
    </StrictMode>
  );

  console.log("App rendered successfully");
} catch (error) {
  console.error("Failed to render React app:", error);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; background: white;">
        <div style="text-align: center; padding: 20px; max-width: 400px;">
          <h2 style="color: #ef4444; margin-bottom: 10px;">Application Error</h2>
          <p style="color: #666; margin-bottom: 15px;">Failed to load the application. This might be due to a caching or local data issue.</p>
          <div style="margin-bottom: 15px;">
            <button onclick="window.location.reload()" style="margin-right: 10px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Refresh Page</button>
            <button onclick="window.location.href = window.location.href + '?t=' + Date.now()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">Hard Refresh</button>
          </div>
          <p style="color: #888; font-size: 12px;">If the problem persists, try clearing your browser cache or using an incognito/private window.</p>
        </div>
      </div>
    `;
  }
}
