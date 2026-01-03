  import React, { useEffect, useState, useRef } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import { FaTimes } from "react-icons/fa";

  export default function ARWakeUpModal({
    healthUrl = "/health",
    onReady = () => {},
    open = true,
    onClose = () => {},
  }) {
    const [status, setStatus] = useState("checking");
    const [tries, setTries] = useState(0);
    const [message, setMessage] = useState("Initializing connection...");
    const [progressValue, setProgressValue] = useState(0); // visual progress 0-100

    const pollingRef = useRef(null); // timeout id for exponential backoff
    const rapidRef = useRef(null); // interval id for rapid polling
    const rampRef = useRef(null); // interval id for visual progress ramp
    const abortRef = useRef(null); // AbortController for the currently active fetch
    const afterAnimRef = useRef(null); // timeout for onReady after animation
    const cancelledRef = useRef(false);
    const readyNotifiedRef = useRef(false);

    useEffect(() => {
      cancelledRef.current = false;
      readyNotifiedRef.current = false;
      setProgressValue(0);
      if (open) startCheck();
      return () => {
        cleanupAll();
        removeVisibilityHandlers();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // ---- Visibility / focus handlers ----
    useEffect(() => {
      if (!open) return;
      const onFocusOrVisible = () => {
        if (status !== "ready" && status !== "error") doImmediatePoll();
      };
      window.addEventListener("focus", onFocusOrVisible);
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) onFocusOrVisible();
      });
      return () => {
        window.removeEventListener("focus", onFocusOrVisible);
        document.removeEventListener("visibilitychange", onFocusOrVisible);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, status]);

    // close on Escape
    useEffect(() => {
      if (!open) return;
      const onKey = (e) => {
        if (e.key === "Escape") {
          // stop background work and inform parent
          cleanupAll();
          onClose();
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    function removeVisibilityHandlers() {
      /* kept for symmetry */
    }

    // ---- Cleanup helpers ----
    function clearPollingTimeout() {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
    }
    function clearRapidInterval() {
      if (rapidRef.current) {
        clearInterval(rapidRef.current);
        rapidRef.current = null;
      }
    }
    function clearRampInterval() {
      if (rampRef.current) {
        clearInterval(rampRef.current);
        rampRef.current = null;
      }
    }
    function abortFetch() {
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {
          /* ignore */
        }
        abortRef.current = null;
      }
    }
    function cleanupAll() {
      clearPollingTimeout();
      clearRapidInterval();
      clearRampInterval();
      abortFetch();
      if (afterAnimRef.current) {
        clearTimeout(afterAnimRef.current);
        afterAnimRef.current = null;
      }
    }

    // ---- Start / Stop ----
    function startCheck() {
      cleanupAll();
      setStatus("checking");
      setTries(0);
      setMessage("Initializing connection...");
      cancelledRef.current = false;
      readyNotifiedRef.current = false;
      setProgressValue(0);
      startProgressRamp(); // start visual ramp
      doPoll(0);
    }

    function stopCheck() {
      clearPollingTimeout();
      clearRapidInterval();
      clearRampInterval();
    }

    function handleCancel() {
      cancelledRef.current = true;
      cleanupAll(); // abort any in-flight fetch and clear timers
      setStatus("error");
      setMessage("Connection attempt cancelled.");
    }

    function handleManualRetry() {
      startCheck();
    }

    // ---- Visual ramping logic ----
    function startProgressRamp() {
      clearRampInterval();
      // ramp every 700ms
      rampRef.current = setInterval(() => {
        setProgressValue((prev) => {
          if (cancelledRef.current) return prev;
          // determine a dynamic cap depending on status & tries
          let cap;
          if (status === "checking") cap = 20;
          else if (status === "sleeping") cap = 40;
          else if (status === "waking") {
            // near-end cap grows with attempts so it doesn't get stuck at low %.
            cap = Math.min(95, 30 + tries * 12 + Math.floor(Math.random() * 6));
          } else if (status === "error") cap = prev; // freeze on error
          else cap = 95;

          // if we're already at or above cap, don't grow further (until status changes)
          if (prev >= cap) return prev;

          // add an adaptive increment (bigger early, smaller near cap)
          const distance = cap - prev;
          const inc = Math.max(1, Math.ceil(distance / 12)); // smooth step
          return Math.min(cap, prev + inc);
        });
      }, 700);
    }

    // If status changes (ex: from checking -> waking) restart ramp to pick new cap
    useEffect(() => {
      // restart ramp to use new cap when status or tries changes
      if (open && status !== "ready" && status !== "error") {
        startProgressRamp();
      }
      if (status === "ready") {
        // ensure progress goes to 100 when ready
        setProgressValue(100);
        clearRampInterval();
        // delay slightly to allow progress bar animation to finish before notifying
        if (!afterAnimRef.current) {
          afterAnimRef.current = setTimeout(() => {
            if (!readyNotifiedRef.current) {
              readyNotifiedRef.current = true;
              try {
                onReady();
              } catch {
                /* swallow callback errors */
              }
            }
          }, 650); // must match motion transition ~600ms
        }
      }
      if (status === "error") {
        clearRampInterval();
      }
      return () => {
        if (afterAnimRef.current) {
          clearTimeout(afterAnimRef.current);
          afterAnimRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, tries, open]);

    // ---- Immediate one-shot poll used on focus/visibility ----
    function doImmediatePoll() {
      if (abortRef.current) return;
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(healthUrl, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      })
        .then((res) => {
          if (controller.signal.aborted || cancelledRef.current) return;
          if (res.ok) {
            // immediate success -> go ready (but onReady will be invoked after progress anim completes)
            finalizeReady();
          }
        })
        .catch(() => {
          // ignore errors for one-shot
        })
        .finally(() => {
          if (abortRef.current === controller) abortRef.current = null;
        });
    }

    // ---- Primary poll with exponential backoff ----
    function doPoll(n) {
      if (cancelledRef.current) return;
      const attempt = n + 1;
      setTries(attempt);

      // ensure single active fetch: abort previous if any
      abortFetch();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(healthUrl, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      })
        .then((res) => {
          if (controller.signal.aborted || cancelledRef.current) return;
          if (res.ok) {
            // server became ready
            finalizeReady();
          } else {
            scheduleNextAttempt(attempt);
          }
        })
        .catch(() => {
          if (controller.signal.aborted || cancelledRef.current) return;
          scheduleNextAttempt(attempt);
        })
        .finally(() => {
          if (abortRef.current === controller) abortRef.current = null;
        });
    }

    function finalizeReady() {
      // stop background polling, but visually complete progress first
      stopCheck(); // stops timers but does not call onReady yet
      setStatus("ready");
      setMessage("Connection established. Ready to proceed.");
      // setProgressValue(100) is handled by status effect above
    }

    // When waking, schedule exponential next attempt + rapid poll
    function scheduleNextAttempt(attemptNumber) {
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

      clearPollingTimeout();
      pollingRef.current = setTimeout(() => {
        pollingRef.current = null;
        doPoll(attemptNumber);
      }, nextDelay);

      if (!rapidRef.current) {
        // quick detection poll every 2s while warming
        rapidRef.current = setInterval(() => {
          if (abortRef.current || cancelledRef.current) return;
          const controller = new AbortController();
          abortRef.current = controller;
          fetch(healthUrl, {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          })
            .then((res) => {
              if (controller.signal.aborted || cancelledRef.current) return;
              if (res.ok) {
                finalizeReady();
              }
            })
            .catch(() => {
              // ignore
            })
            .finally(() => {
              if (abortRef.current === controller) abortRef.current = null;
            });
        }, 2000);
      }
    }

    // Progress is driven by progressValue state; motion will animate
    const progress = Math.max(0, Math.min(100, Math.round(progressValue)));

    // UI config (same)
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900/60 via-slate-900/70 to-slate-900/80 backdrop-blur-sm"
              onClick={status === "ready" ? onClose : undefined}
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
                role="dialog"
                aria-modal="true"
              >
                {/* Close button (FaTimes) */}
                {/* Close button (FaTimes) */}
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={() => {
                    cleanupAll();
                    onClose();
                  }}
                  className="absolute right-5 top-5 inline-flex items-center justify-center
              w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600
              shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pointer-events-auto cursor-pointer"
                >
                  <FaTimes className="w-4 h-4" />
                </button>

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
                    <div className="w-48 h-48 flex-shrink-0 flex items-center justify-center">
                      <ServerMascot status={status} />
                    </div>

                    <div className="flex-1 w-full">
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
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
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

                      <div className="flex flex-col sm:flex-row gap-3">
                        {status === "ready" ? (
                          <button
                            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg"
                            onClick={onClose}
                          >
                            Continue to AR Experience
                          </button>
                        ) : (
                          <>
                            <button
                              className="flex-1 px-6 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                              onClick={handleManualRetry}
                            >
                              Retry Now
                            </button>
                            <button
                              className="flex-1 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                              onClick={handleCancel}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>

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

  /* StatusBadge component (unchanged visuals) */
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
              ? { opacity: [1, 0.3, 1] }
              : {}
          }
          transition={{
            duration: 1.5,
            repeat: status !== "ready" && status !== "error" ? Infinity : 0,
          }}
        />
        {labels[status] || "Connecting"}
      </motion.span>
    );
  }

  /* ServerMascot: eyes closed until ready; waking does intermittent shake (repeatDelay built in) */
  function ServerMascot({ status = "checking" }) {
    const containerVariants = {
      idle: { scale: 1, rotate: 0 },
      wake: {
        x: [0, -3, 3, 0],
        rotate: [-1, 1, -1, 0],
        transition: {
          duration: 0.6,
          repeat: Infinity,
          repeatDelay: 1.6,
          ease: "easeInOut",
        },
      },
      ready: {
        scale: [1, 1.08, 1],
        y: [0, -10, 0],
        rotate: [0, 3, -3, 0],
        transition: { duration: 0.9, ease: "easeOut" },
      },
    };
    const isOpenEyes = status === "ready";

    return (
      <motion.div
        className="relative w-44 h-44 flex items-center justify-center"
        variants={containerVariants}
        animate={
          status === "ready" ? "ready" : status === "waking" ? "wake" : "idle"
        }
      >
        <motion.svg
          viewBox="0 0 140 140"
          className="w-44 h-44 drop-shadow-xl"
          role="img"
          aria-label="server mascot"
        >
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

          <g filter="url(#shadow)">
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
          </g>

          {/* Eyes closed unless ready */}
          {!isOpenEyes ? (
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
              <circle cx="52" cy="59" r="2.5" fill="#60a5fa" opacity={0.9} />
              <circle cx="82" cy="59" r="2.5" fill="#60a5fa" opacity={0.9} />
              <circle cx="58" cy="60" r="1.5" fill="white" opacity={0.6} />
              <circle cx="88" cy="60" r="1.5" fill="white" opacity={0.6} />
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

          {/* Status dots */}
          <g>
            <motion.circle
              cx="38"
              cy="92"
              r="3.5"
              fill={status === "ready" ? "#10b981" : "#ef4444"}
              animate={
                status === "waking" || status === "checking"
                  ? { opacity: [1, 0.3, 1] }
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
              animate={status === "waking" ? { opacity: [0.3, 1, 0.3] } : {}}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.circle
              cx="66"
              cy="92"
              r="3.5"
              fill={status === "ready" ? "#10b981" : "#94a3b8"}
            />
          </g>
        </motion.svg>

        {/* waking bell (intermittent) */}
        <AnimatePresence>
          {status === "waking" && (
            <motion.div
              initial={{ x: 80, y: 10, scale: 0, rotate: -30 }}
              animate={{
                x: [80, 70, 80],
                y: [10, 6, 10],
                scale: [0.8, 1, 0.8],
                rotate: [-30, -10, -30],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.6 }}
              className="absolute"
            >
              <svg
                viewBox="0 0 48 48"
                className="w-12 h-12 drop-shadow-lg"
                aria-hidden
              >
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
                <motion.line
                  x1="24"
                  y1="28"
                  x2="24"
                  y2="34"
                  stroke="#78350f"
                  strokeWidth="2"
                  strokeLinecap="round"
                  animate={{ rotate: [-12, 12, -12] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  style={{ transformOrigin: "50% 0%" }}
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
