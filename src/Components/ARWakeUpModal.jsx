import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Enhanced ARWakeUpModal with professional design
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
  const [status, setStatus] = useState("checking");
  const [tries, setTries] = useState(0);
  const [message, setMessage] = useState("Initializing connection...");
  const pollingRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    if (open) startCheck();
    return () => stopCheck();
  }, [open]);

  function stopCheck() {
    if (pollingRef.current) clearTimeout(pollingRef.current);
    pollingRef.current = null;
  }

  function startCheck() {
    setStatus("checking");
    setTries(0);
    setMessage("Initializing connection...");
    cancelledRef.current = false;
    doPoll(0);
  }

  function doPoll(n) {
    if (cancelledRef.current) return;
    const attempt = n + 1;
    setTries(attempt);

    fetch(healthUrl, { method: "GET", cache: "no-store" })
      .then(async (res) => {
        if (res.ok) {
          setStatus("ready");
          setMessage("Connection established. Ready to proceed.");
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
          "Starting server instance. This typically takes 15-30 seconds..."
        );
      } else if (attemptNumber < 5) {
        setStatus("waking");
        setMessage("Establishing connection...");
      } else {
        setStatus("waking");
        setMessage("Server is warming up. Almost there...");
      }

      const base = 2000;
      const max = 15000;
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
    setMessage("Connection attempt cancelled.");
  }

  function handleManualRetry() {
    startCheck();
  }

  const progress = Math.min(100, Math.round(Math.min(tries * 12, 100)));

  const statusConfig = {
    checking: {
      color: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    sleeping: {
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    waking: {
      color: "text-indigo-700",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
    },
    ready: {
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    error: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  };

  const currentConfig = statusConfig[status] || statusConfig.checking;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900/60 via-slate-900/70 to-slate-900/80 backdrop-blur-sm"
            onClick={status === "ready" ? onClose : undefined}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Status indicator bar */}
              <div
                className={`h-1.5 ${
                  status === "ready"
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500"
                }`}
              >
                <motion.div
                  className="h-full bg-white/30"
                  initial={{ width: "0%" }}
                  animate={{ width: ["0%", "100%"] }}
                  transition={{
                    duration: 2,
                    repeat: status !== "ready" ? Infinity : 0,
                  }}
                />
              </div>

              <div className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  {/* Mascot Section */}
                  <div className="w-48 h-48 flex-shrink-0 flex items-center justify-center">
                    <ServerMascot status={status} />
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 w-full">
                    {/* Header */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-bold text-slate-900">
                          {status === "ready"
                            ? "Connection Ready"
                            : "Initializing Server"}
                        </h3>
                        <StatusBadge status={status} config={currentConfig} />
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {message}
                      </p>
                    </div>

                    {/* Progress Section */}
                    <div className="mb-6 space-y-3">
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span className="text-slate-500">
                          {status === "ready" ? "Complete" : "In Progress"}
                        </span>
                        <span className={currentConfig.color}>
                          {status === "ready" ? "100%" : `${progress}%`}
                        </span>
                      </div>

                      <div className="relative w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <motion.div
                          className={`h-full rounded-full ${
                            status === "ready"
                              ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                              : "bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-500"
                          }`}
                          initial={{ width: "0%" }}
                          animate={{
                            width: status === "ready" ? "100%" : `${progress}%`,
                          }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                        {status !== "ready" && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {status === "ready" ? (
                        <button
                          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                          onClick={onClose}
                        >
                          Continue to AR Experience
                        </button>
                      ) : (
                        <>
                          <button
                            className="flex-1 px-6 py-3 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                            onClick={handleManualRetry}
                          >
                            Retry Now
                          </button>
                          <button
                            className="flex-1 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                            onClick={handleCancel}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <div className="flex items-start gap-3 text-sm">
                        <svg
                          className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div className="space-y-1">
                          <p className="text-slate-600">
                            <span className="font-medium">Attempt {tries}</span>{" "}
                            · Server instances spin down during inactivity to
                            save resources
                          </p>
                          {tries > 8 && status !== "ready" && (
                            <p className="text-amber-600 font-medium">
                              Taking longer than expected. Check system status
                              if this persists.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Status Badge Component
function StatusBadge({ status, config }) {
  const labels = {
    checking: "Connecting",
    sleeping: "Starting",
    waking: "Initializing",
    ready: "Ready",
    error: "Error",
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} ${config.border} border`}
    >
      <motion.span
        className="w-1.5 h-1.5 rounded-full bg-current"
        animate={
          status !== "ready" && status !== "error"
            ? {
                opacity: [1, 0.3, 1],
              }
            : {}
        }
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      {labels[status]}
    </motion.span>
  );
}

// Enhanced Server Mascot
function ServerMascot({ status = "checking" }) {
  const containerVariants = {
    idle: { scale: 1, rotate: 0 },
    wake: {
      x: [0, -3, 3, -3, 3, 0],
      rotate: [-1, 1, -1, 1, 0],
      transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
    },
    ready: {
      scale: [1, 1.15, 1],
      y: [0, -16, 0],
      rotate: [0, 5, -5, 0],
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      className="relative w-44 h-44 flex items-center justify-center"
      variants={containerVariants}
      animate={
        status === "ready" ? "ready" : status === "waking" ? "wake" : "idle"
      }
    >
      <svg viewBox="0 0 140 140" className="w-44 h-44 drop-shadow-xl">
        <defs>
          <linearGradient id="serverGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
          <linearGradient id="panelGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Server body with enhanced styling */}
        <motion.g filter="url(#shadow)">
          <rect
            x="18"
            y="25"
            rx="16"
            ry="16"
            width="104"
            height="82"
            fill="url(#serverGrad)"
            stroke="#cbd5e1"
            strokeWidth="2"
          />

          {/* Accent line */}
          <rect
            x="18"
            y="25"
            width="104"
            height="6"
            rx="16"
            ry="16"
            fill="url(#panelGrad)"
            opacity="0.8"
          />

          {/* Ventilation slots */}
          <g opacity="0.2">
            <line
              x1="30"
              y1="48"
              x2="46"
              y2="48"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="30"
              y1="54"
              x2="46"
              y2="54"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="30"
              y1="60"
              x2="46"
              y2="60"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        </motion.g>

        {/* Eyes - animated based on status */}
        {status === "sleeping" || status === "checking" ? (
          <g>
            <motion.line
              x1="48"
              y1="64"
              x2="62"
              y2="64"
              stroke="#1e293b"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <motion.line
              x1="78"
              y1="64"
              x2="92"
              y2="64"
              stroke="#1e293b"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
        ) : (
          <g>
            <motion.ellipse
              cx="55"
              cy="62"
              rx="9"
              ry="8"
              fill="#1e293b"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.ellipse
              cx="85"
              cy="62"
              rx="9"
              ry="8"
              fill="#1e293b"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3 }}
            />
            {/* Highlights */}
            <circle cx="52" cy="59" r="2.5" fill="#60a5fa" opacity={0.9} />
            <circle cx="82" cy="59" r="2.5" fill="#60a5fa" opacity={0.9} />

            {status === "ready" && (
              <>
                <circle cx="58" cy="60" r="1.5" fill="white" opacity={0.6} />
                <circle cx="88" cy="60" r="1.5" fill="white" opacity={0.6} />
              </>
            )}
          </g>
        )}

        {/* Mouth */}
        {status === "ready" ? (
          <motion.path
            d="M58 78 Q70 88 82 78"
            stroke="#1e293b"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          />
        ) : (
          <rect
            x="60"
            y="76"
            width="20"
            height="5"
            rx="2.5"
            fill="#64748b"
            opacity={0.7}
          />
        )}

        {/* Status indicators */}
        <g>
          <motion.circle
            cx="38"
            cy="92"
            r="3.5"
            fill={status === "ready" ? "#10b981" : "#ef4444"}
            animate={
              status === "waking" || status === "checking"
                ? {
                    opacity: [1, 0.3, 1],
                  }
                : {}
            }
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.circle
            cx="52"
            cy="92"
            r="3.5"
            fill={
              status === "waking" || status === "ready" ? "#f59e0b" : "#94a3b8"
            }
            animate={
              status === "waking"
                ? {
                    opacity: [0.3, 1, 0.3],
                  }
                : {}
            }
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
          <motion.circle
            cx="66"
            cy="92"
            r="3.5"
            fill={status === "ready" ? "#10b981" : "#94a3b8"}
          />
        </g>

        {/* Sleep Z's */}
        {status === "sleeping" && (
          <g>
            <motion.text
              x="98"
              y="42"
              fontSize="14"
              fontWeight="700"
              fill="#94a3b8"
              animate={{
                y: [42, 35, 28],
                opacity: [1, 0.6, 0],
                scale: [1, 1.1, 1.2],
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
            >
              Z
            </motion.text>
            <motion.text
              x="106"
              y="50"
              fontSize="11"
              fontWeight="700"
              fill="#94a3b8"
              animate={{
                y: [50, 43, 36],
                opacity: [0.8, 0.5, 0],
                scale: [1, 1.1, 1.2],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: "easeOut",
                delay: 0.4,
              }}
            >
              z
            </motion.text>
            <motion.text
              x="112"
              y="56"
              fontSize="8"
              fontWeight="700"
              fill="#94a3b8"
              animate={{
                y: [56, 49, 42],
                opacity: [0.6, 0.3, 0],
                scale: [1, 1.1, 1.2],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.4,
                ease: "easeOut",
                delay: 0.8,
              }}
            >
              z
            </motion.text>
          </g>
        )}
      </svg>

      {/* Alarm/Wake indicator */}
      <AnimatePresence>
        {status === "waking" && (
          <motion.div
            initial={{ x: 80, y: 10, scale: 0, rotate: -30 }}
            animate={{
              x: [80, 70, 80],
              y: [10, 5, 10],
              scale: [0.8, 1, 0.8],
              rotate: [-30, -10, -30],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute"
          >
            <svg viewBox="0 0 48 48" className="w-12 h-12 drop-shadow-lg">
              <defs>
                <linearGradient id="bellGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <circle
                cx="24"
                cy="24"
                r="16"
                fill="url(#bellGrad)"
                stroke="#d97706"
                strokeWidth="1.5"
              />
              <path
                d="M18 22 L24 16 L30 22"
                stroke="#78350f"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="24" cy="28" r="2" fill="#78350f" />
              {/* Bell clapper */}
              <motion.line
                x1="24"
                y1="28"
                x2="24"
                y2="34"
                stroke="#78350f"
                strokeWidth="2"
                strokeLinecap="round"
                animate={{ rotate: [-10, 10, -10] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                style={{ originX: "50%", originY: "0%" }}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success sparkles */}
      {status === "ready" && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                scale: 0,
                x: 0,
                y: 0,
                opacity: 1,
              }}
              animate={{
                scale: [0, 1, 0],
                x: [0, Math.cos((i * 60 * Math.PI) / 180) * 40],
                y: [0, Math.sin((i * 60 * Math.PI) / 180) * 40],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.05,
                ease: "easeOut",
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z"
                  fill="#fbbf24"
                  stroke="#f59e0b"
                  strokeWidth="1"
                />
              </svg>
            </motion.div>
          ))}
        </>
      )}
    </motion.div>
  );
}
