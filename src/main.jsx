if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      console.log("Unregistering old service worker:", reg.scope);
      reg.unregister();
    });
  });
}

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

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

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
  // Fallback: show error message
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; background: white;">
        <div style="text-align: center; padding: 20px; max-width: 400px;">
          <h2 style="color: #ef4444; margin-bottom: 10px;">Application Error</h2>
          <p style="color: #666; margin-bottom: 15px;">Failed to load the application. This might be due to a mobile browser caching issue.</p>
          <div style="margin-bottom: 15px;">
            <button onclick="window.location.reload()" style="margin-right: 10px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Refresh Page</button>
            <button onclick="window.location.href = window.location.href + '?t=' + Date.now()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">Hard Refresh</button>
          </div>
          <p style="color: #888; font-size: 12px;">If the problem persists, try clearing your browser cache or using an incognito/private browsing window.</p>
        </div>
      </div>
    `;
  }
}
