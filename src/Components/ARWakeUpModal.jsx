import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ARWakeUpModal.jsx (animated mascot version)
// Usage:
// <ARWakeUpModal
//    healthUrl="https://your-api.example.com/health"
//    onReady={() => { /* backend awake — proceed to AR */ }}
//    open={showModal}
//    onClose={() => setShowModal(false)}
// />

export default function ARWakeUpModal({
  healthUrl = "/health",
  onReady = () => {},
  open = true,
  onClose = () => {},
}) {
  const [status, setStatus] = useState("checking"); // 'checking' | 'sleeping' | 'waking' | 'ready' | 'error'
  const [tries, setTries] = useState(0);
  const [message, setMessage] = useState("Checking server status...");
  const pollingRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    if (open) startCheck();
    return () => stopCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function stopCheck() {
    if (pollingRef.current) clearTimeout(pollingRef.current);
    pollingRef.current = null;
  }

  function startCheck() {
    setStatus("checking");
    setTries(0);
    setMessage("Checking server status...");
    cancelledRef.current = false;
    doPoll(0);
  }

  // doPoll with exponential backoff + max interval
  function doPoll(n) {
    if (cancelledRef.current) return;
    const attempt = n + 1;
    setTries(attempt);

    // Immediately try a quick fetch
    fetch(healthUrl, { method: "GET", cache: "no-store" })
      .then(async (res) => {
        if (res.ok) {
          setStatus("ready");
          setMessage("Server is awake. You can try AR now.");
          stopCheck();
          onReady();
        } else {
          handleNotReady(attempt);
        }
      })
      .catch(() => {
        handleNotReady(attempt);
      });

    function handleNotReady(attemptNumber) {
      if (cancelledRef.current) return;
      if (attemptNumber === 1) {
        setStatus("sleeping");
        setMessage(
          "Server appears to be sleeping. Waking it up — this may take a few seconds."
        );
      } else {
        setStatus("waking");
        setMessage("Still waking... trying again.");
      }

      // exponential backoff with jitter
      const base = 2000; // 2s
      const max = 15000; // 15s
      const jitter = Math.floor(Math.random() * 1000);
      const nextDelay = Math.min(
        max,
        base * Math.pow(1.8, attemptNumber - 1) + jitter
      );

      pollingRef.current = setTimeout(() => doPoll(attemptNumber), nextDelay);
    }
  }

  function handleCancel() {
    cancelledRef.current = true;
    stopCheck();
    setStatus("error");
    setMessage("Wake-up cancelled. You can retry.");
  }

  function handleManualRetry() {
    startCheck();
  }

  // Small progress indicator derived from tries (purely cosmetic)
  const progress = Math.min(100, Math.round(Math.min(tries * 12, 100)));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6"
          >
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-48 h-48 flex items-center justify-center">
                <ServerMascot status={status} />
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">
                  Waking the server
                </h3>
                <p className="text-sm text-gray-600 mb-4">{message}</p>

                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      status === "ready" ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                    style={{ width: `${status === "ready" ? 100 : progress}%` }}
                  />
                </div>

                <div className="flex gap-3 justify-end items-center">
                  <div className="text-xs text-gray-500 mr-auto">
                    Attempts: {tries}
                  </div>

                  {status === "ready" ? (
                    <button
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm shadow"
                      onClick={() => {
                        onClose();
                      }}
                    >
                      Continue
                    </button>
                  ) : (
                    <>
                      <button
                        className="px-4 py-2 rounded-lg bg-white border text-sm"
                        onClick={handleManualRetry}
                      >
                        Retry now
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-4 text-xs text-gray-400">
                  Tip: If the server takes too long, try again in a few minutes
                  or check our status page.
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// -----------------------------
// Server mascot component (SVG + framer-motion)
// -----------------------------
function ServerMascot({ status = "checking" }) {
  // visual states:
  // sleeping: closed eyes, "Zzz" bubbles
  // waking: alarm/hand pokes, eyes open gradually
  // ready: happy hop and fade out

  const containerVariants = {
    idle: { scale: 1 },
    wake: {
      x: [0, -4, 4, -4, 0],
      rotate: [-2, 2, -2, 2, -2],
      transition: { duration: 0.6, repeat: Infinity },
    },
    ready: {
      scale: [1, 1.1, 0.8],
      y: [0, -12, 0, -8, 0],
      opacity: [1, 1, 0],
      transition: { duration: 1.2 },
    },
  };

  return (
    <motion.div
      className="relative w-40 h-40 flex items-center justify-center"
      variants={containerVariants}
      animate={
        status === "ready" ? "ready" : status === "waking" ? "wake" : "idle"
      }
    >
      {/* server body */}
      <svg viewBox="0 0 120 120" className="w-40 h-40">
        <defs>
          <linearGradient id="lg" x1="0" x2="1">
            <stop offset="0%" stopColor="#eef2ff" />
            <stop offset="100%" stopColor="#e6fffa" />
          </linearGradient>
        </defs>

        {/* base rectangle */}
        <motion.rect
          x="12"
          y="18"
          rx="12"
          ry="12"
          width="96"
          height="72"
          fill="url(#lg)"
          stroke="#d1d5db"
          strokeWidth="1.5"
          initial={{ y: 0 }}
        />

        {/* eyes - animate open/close */}
        {status !== "ready" ? (
          <g>
            <motion.line
              x1="36"
              y1="54"
              x2="52"
              y2="54"
              stroke="#111827"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <motion.line
              x1="68"
              y1="54"
              x2="84"
              y2="54"
              stroke="#111827"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        ) : (
          <g>
            <motion.ellipse cx="44" cy="50" rx="8" ry="6" fill="#0f172a" />
            <motion.ellipse cx="76" cy="50" rx="8" ry="6" fill="#0f172a" />
            {/* little shine */}
            <motion.circle
              cx="40"
              cy="48"
              r="1.6"
              fill="#9ae6b4"
              opacity={0.9}
            />
            <motion.circle
              cx="72"
              cy="48"
              r="1.6"
              fill="#9ae6b4"
              opacity={0.9}
            />
          </g>
        )}

        {/* mouth */}
        {status === "ready" ? (
          <motion.path
            d="M50 68 Q60 80 70 68"
            stroke="#0f172a"
            strokeWidth="3"
            fill="none"
          />
        ) : (
          <motion.rect
            x="48"
            y="64"
            width="24"
            height="6"
            rx="3"
            fill="#0f172a"
            opacity={status === "sleeping" ? 0.6 : 1}
          />
        )}

        {/* front panel */}
        <circle cx="30" cy="84" r="3" fill="#fca5a5" />
        <circle cx="40" cy="84" r="3" fill="#fbbf24" />
        <circle cx="50" cy="84" r="3" fill="#86efac" />

        {/* snore bubbles for sleeping */}
        {status === "sleeping" && (
          <g>
            <motion.text
              x="86"
              y="34"
              fontSize="10"
              fill="#9ca3af"
              style={{ fontWeight: 700 }}
              animate={{ y: [0, -6, 0], opacity: [1, 0.6, 0] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
            >
              Z
            </motion.text>
            <motion.text
              x="90"
              y="26"
              fontSize="8"
              fill="#9ca3af"
              style={{ fontWeight: 700 }}
              animate={{ y: [0, -10, -18], opacity: [0.8, 0.5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              z
            </motion.text>
          </g>
        )}
      </svg>

      {/* alarm hand/character that pokes to wake (visible for waking state) */}
      <AnimatePresence>
        {status !== "sleeping" &&
          status !== "checking" &&
          status !== "error" && (
            <motion.div
              key="poke"
              initial={{ x: 60, y: 20, rotate: -20, scale: 0.9 }}
              animate={
                status === "ready"
                  ? { x: 76, y: -20, rotate: 20, scale: 0.6, opacity: 0 }
                  : {
                      x: [60, 52, 60],
                      rotate: [-20, 0, -20],
                      scale: [0.9, 1, 0.9],
                    }
              }
              transition={{
                duration: status === "ready" ? 0.9 : 0.9,
                repeat: status === "waking" ? Infinity : 0,
              }}
              className="absolute w-12 h-12"
            >
              <svg viewBox="0 0 64 64" className="w-12 h-12">
                <circle
                  cx="28"
                  cy="28"
                  r="14"
                  fill="#fef3c7"
                  stroke="#f59e0b"
                  strokeWidth="1"
                />
                <rect
                  x="20"
                  y="36"
                  width="16"
                  height="6"
                  rx="3"
                  fill="#f59e0b"
                />
                <motion.path
                  d="M22 22 Q28 18 34 22"
                  stroke="#111827"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </motion.div>
          )}
      </AnimatePresence>
      {/* puff of smoke on disappear */}
      {status === "ready" && (
        <motion.div
          initial={{ scale: 0.4, opacity: 0.6 }}
          animate={{ scale: [0.4, 1.2], opacity: [0.6, 0] }}
          transition={{ duration: 0.8 }}
          className="absolute bottom-0 w-10 h-10"
        >
          <svg viewBox="0 0 64 64" className="w-10 h-10 opacity-70">
            <circle cx="32" cy="32" r="10" fill="#e5e7eb" />
            <circle cx="24" cy="36" r="6" fill="#e5e7eb" />
            <circle cx="40" cy="36" r="6" fill="#e5e7eb" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}

/*
Backend minimal /health example (Node + Express)

const express = require('express');
const app = express();
app.get('/health', (req, res) => res.status(200).json({ uptime: process.uptime() }));
app.listen(process.env.PORT || 3000);

Notes:
- Make the endpoint very small and fast. Avoid auth on /health — use a separate protected endpoint for sensitive checks.
- In production you may want a signed short-lived token or IP allowlist for automated pings.
*/
