import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import "./index.css";
import App from "./App.jsx";

console.log("Starting React app...");

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
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 20px;">
          <h2 style="color: #ef4444; margin-bottom: 10px;">Application Error</h2>
          <p style="color: #666;">Failed to load the application. Please refresh the page.</p>
          <button onclick="window.location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Refresh Page</button>
        </div>
      </div>
    `;
  }
}
