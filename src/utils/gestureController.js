import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

export async function createHandDetector() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  const detector = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });

  return detector;
}

// ------ GESTURE LOGIC -------
export function detectGesture(landmarks) {
  if (!landmarks || landmarks.length === 0) return null;

  const hand = landmarks[0];

  const wrist = hand[0];
  const thumbTip = hand[4];
  const thumbMCP = hand[2];
  const indexTip = hand[8];
  const indexMCP = hand[5];
  const middleTip = hand[12];
  const middleMCP = hand[9];
  const ringTip = hand[16];
  const ringMCP = hand[13];
  const pinkyTip = hand[20];
  const pinkyMCP = hand[17];

  // ---- 1) All fingers (except thumb) must be extended for palm ----
  const fingersExtended =
    indexTip.y < indexMCP.y &&
    middleTip.y < middleMCP.y &&
    ringTip.y < ringMCP.y &&
    pinkyTip.y < pinkyMCP.y;

  // ---- 2) THUMB OPENS SIDEWAYS (for palm) ----
  const thumbSideways = Math.abs(thumbTip.x - thumbMCP.x) > 0.04; // thumb pointing outward

  // ---- 3) STRONG thumb up / down detection ----
  // MUCH harder conditions (IMPORTANT)
  const strongThumbUp =
    thumbTip.y < wrist.y - 0.18 && // strongly above wrist
    thumbTip.y < thumbMCP.y - 0.1; // strongly extended upward

  const strongThumbDown =
    thumbTip.y > wrist.y + 0.18 && // strongly below
    thumbTip.y > thumbMCP.y + 0.1;

  // ---- PALM FIRST (VERY FORGIVING) ----
  if (fingersExtended && thumbSideways && !strongThumbUp && !strongThumbDown) {
    return "CAPTURE";
  }

  // ---- NEXT / PREV (VERY STRICT) ----
  if (strongThumbUp) return "NEXT";
  if (strongThumbDown) return "PREV";

  return null;
}


