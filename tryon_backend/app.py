import os
import traceback
import base64
from io import BytesIO
from tempfile import NamedTemporaryFile

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import requests
import numpy as np

# ----------------------
# App config
# ----------------------
app = Flask(__name__)
# limit incoming request size to avoid huge uploads (8 MiB)
app.config['MAX_CONTENT_LENGTH'] = 8 * 1024 * 1024

# CORS setup (ensure applied even if heavy libs fail)
CORS(app, origins=["https://istylear.netlify.app", "http://localhost:5173"],
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True)

# Keep an after_request to make sure CORS headers exist for proxy responses
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin', '*')
    response.headers['Access-Control-Allow-Origin'] = origin
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

# ----------------------
# Lazy-import heavy libs (OpenCV, MediaPipe) to avoid import-time crashes
# ----------------------
cv2 = None
mp = None
_opencv_available = False
_mediapipe_available = False
pose = None
previous_points = None 

try:
    import cv2 as _cv2
    # optional: try optimized flags but ignore failures
    try:
        os.environ['OPENCV_VIDEOIO_PRIORITY_MSMF'] = '0'
        _cv2.setUseOptimized(True)
        _cv2.ocl.setUseOpenCL(False)
    except Exception as e:
        print("Warning: OpenCV runtime flags failed:", e)
    cv2 = _cv2
    _opencv_available = True
except Exception as e:
    print("Warning: OpenCV import failed:", e)

try:
    import mediapipe as _mp
    mp = _mp
    _mediapipe_available = True
except Exception as e:
    print("Warning: Mediapipe import failed:", e)

# ----------------------
# Helpers
# ----------------------
def approx_bytes_from_b64(b64str):
    try:
        return (len(b64str) * 3) // 4
    except Exception:
        return 0

def downsize_pil_image(img, max_w=512):
    if img.width > max_w:
        new_h = int((max_w / img.width) * img.height)
        img = img.resize((max_w, new_h), Image.LANCZOS)
    return img

# ----------------------
# Routes
# ----------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True}), 200

@app.route("/")
def home():
    return jsonify({"message": "Try-On Backend is live 🚀"})

@app.route('/tryon', methods=['POST', 'OPTIONS'])
def tryon():
    # Preflight
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    # If heavy libs missing, respond clearly (server still answers -> no 502 from proxy)
    if not _opencv_available or not _mediapipe_available:
        print("Error: required image libs missing. _opencv:", _opencv_available, " _mp:", _mediapipe_available)
        return jsonify({'error': 'Backend not ready: missing image processing libs'}), 503

    # Lazy-init mediapipe pose (lightweight config)
    global pose
    if pose is None:
        try:
            mp_pose = mp.solutions.pose
            pose = mp_pose.Pose(
                static_image_mode=False,
                model_complexity=0,  # use lighter model
                enable_segmentation=False,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
        except Exception as e:
            print("Error initializing mediapipe pose:", e)
            traceback.print_exc()
            return jsonify({'error': 'Failed to initialize pose model'}), 500

    print("Starting tryon request")
    try:
        # Parse JSON safely
        data = request.get_json(silent=True) or {}
        print("Received Content-Type:", request.content_type)
        print("JSON keys:", list(data.keys()))
        print("Form keys:", list(request.form.keys()))
        print("Files:", list(request.files.keys()))

        # Accept frame in multiple forms: JSON base64, form field, or uploaded file
        frame_data = data.get('frame') or request.form.get('frame')
        shirt_url = (data.get('shirtUrl') or data.get('shirt_url') or
                     request.form.get('shirtUrl') or request.form.get('shirt_url'))

        # If an uploaded file named 'frame' is present, convert to base64 for compatibility
        if not frame_data and 'frame' in request.files:
            try:
                uploaded = request.files['frame']
                file_bytes = uploaded.read()
                if len(file_bytes) > 6 * 1024 * 1024:
                    print("Uploaded file too large:", len(file_bytes))
                    return jsonify({'error': 'Frame file too large'}), 413
                frame_data = base64.b64encode(file_bytes).decode('utf-8')
                print("Converted uploaded frame to base64 len:", len(frame_data))
            except Exception as e:
                print("Error reading uploaded frame file:", e)
                traceback.print_exc()

        # Validate inputs: accept either frame OR shirtUrl
        if not frame_data and not shirt_url:
            print("Error: Missing both frame and shirtUrl")
            return jsonify({'error': 'Missing frame or shirtUrl'}), 400

        # If shirt URL exists, validate basic format
        if shirt_url and not shirt_url.startswith(('http://', 'https://')):
            return jsonify({'error': 'Invalid shirt URL'}), 400

        # If we have frame_data, check size and decode -> downsize -> convert to cv2
        if frame_data:
            approx_bytes = approx_bytes_from_b64(frame_data)
            print("Approx frame bytes:", approx_bytes)
            if approx_bytes > 6 * 1024 * 1024:
                print("Frame too large, rejecting")
                return jsonify({'error': 'Frame too large'}), 413

            try:
                img_bytes = base64.b64decode(frame_data)
            except Exception:
                print("Error decoding base64 frame")
                return jsonify({'error': 'Invalid image data'}), 400

            try:
                pil_img = Image.open(BytesIO(img_bytes)).convert("RGB")
                pil_img = downsize_pil_image(pil_img, max_w=512)  # downsize early
                img_cv = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
                h, w, _ = img_cv.shape
            except Exception as e:
                print("Error decoding/resizing frame:", e)
                traceback.print_exc()
                return jsonify({'error': 'Invalid image data'}), 400
        else:
            # If no frame_data, we currently require a background frame for pose detection
            # Return 400 so caller can provide one
            return jsonify({'error': 'Missing frame: background image required'}), 400

        # Pose detection (fast/light)
        try:
            results = pose.process(cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB))
            if not results.pose_landmarks:
                print("No pose landmarks detected")
                return jsonify({'result': None}), 200
        except Exception as e:
            print("Error in pose detection:", e)
            traceback.print_exc()
            return jsonify({'error': 'Pose detection failed'}), 500

        lm = results.pose_landmarks.landmark
        left_shoulder = (int(lm[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER].x * w),
                         int(lm[mp.solutions.pose.PoseLandmark.LEFT_SHOULDER].y * h))
        right_shoulder = (int(lm[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER].x * w),
                          int(lm[mp.solutions.pose.PoseLandmark.RIGHT_SHOULDER].y * h))
        left_hip = (int(lm[mp.solutions.pose.PoseLandmark.LEFT_HIP].x * w),
                    int(lm[mp.solutions.pose.PoseLandmark.LEFT_HIP].y * h))

        # Smoothing
        try:
            global previous_points
        except NameError:
            previous_points = None

        def smooth_points(points, alpha=0.6):
            global previous_points
            if previous_points is None:
                previous_points = points
                return points
            smoothed = []
            for p, pp in zip(points, previous_points):
                x = alpha * p[0] + (1 - alpha) * pp[0]
                y = alpha * p[1] + (1 - alpha) * pp[1]
                smoothed.append((x, y))
            previous_points = smoothed
            return smoothed

        left_shoulder, right_shoulder, left_hip = smooth_points([left_shoulder, right_shoulder, left_hip])

        # Calculate shirt overlay box
        shirt_width = int(abs(right_shoulder[0] - left_shoulder[0]) * 1.5)
        shirt_height = int(abs(left_hip[1] - left_shoulder[1]) * 1.6)
        x_center = int((left_shoulder[0] + right_shoulder[0]) / 2)
        y_top = int(left_shoulder[1] - shirt_height * 0.15)
        x1 = max(0, x_center - shirt_width // 2)
        y1 = max(0, y_top)
        x2 = min(w, x1 + shirt_width)
        y2 = min(h, y1 + shirt_height)

        # Load shirt image if URL provided
        shirt_arr = None
        if shirt_url:
            try:
                resp = requests.get(shirt_url, timeout=10)
                resp.raise_for_status()
                shirt_arr = cv2.imdecode(np.frombuffer(resp.content, np.uint8), cv2.IMREAD_UNCHANGED)
            except Exception as e:
                print("Error loading shirt image from URL:", e)
                traceback.print_exc()
                return jsonify({'error': 'Failed to load shirt image'}), 400

        if shirt_arr is None:
            return jsonify({'result': None}), 200

        # Resize & compose overlay
        try:
            w_box = max(1, x2 - x1)
            h_box = max(1, y2 - y1)
            shirt_resized = cv2.resize(shirt_arr, (w_box, h_box))
            overlay = np.zeros((h, w, 4), dtype=np.uint8)

            if shirt_resized.shape[2] == 4:
                alpha = shirt_resized[:, :, 3]
                for c in range(3):
                    overlay[y1:y2, x1:x2, c] = shirt_resized[:, :, c]
                overlay[y1:y2, x1:x2, 3] = alpha
            else:
                for c in range(3):
                    overlay[y1:y2, x1:x2, c] = shirt_resized[:, :, c]
                overlay[y1:y2, x1:x2, 3] = 255
        except Exception as e:
            print("Error processing shirt overlay:", e)
            traceback.print_exc()
            return jsonify({'error': 'Failed to process shirt overlay'}), 500

        # Encode result as base64 PNG
        try:
            _, buffer = cv2.imencode('.png', overlay)
            result_b64 = base64.b64encode(buffer).decode('utf-8')
            return jsonify({'result': result_b64}), 200
        except Exception as e:
            print("Error encoding result:", e)
            traceback.print_exc()
            return jsonify({'error': 'Failed to encode result'}), 500

    except Exception as e:
        print("Unexpected error in tryon:", e)
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

# ----------------------
# Run the app (dev)
# ----------------------
if __name__ == "__main__":
    print("✅ Try-On backend running...")
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
