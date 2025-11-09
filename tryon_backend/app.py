import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import mediapipe as mp
import base64
from io import BytesIO
import requests
from PIL import Image

# ----------------------
# Headless OpenCV setup for Railway deployment
# ----------------------
os.environ['OPENCV_VIDEOIO_PRIORITY_MSMF'] = '0'  # Disable MSMF backend for headless
cv2.setUseOptimized(True)
cv2.ocl.setUseOpenCL(False)

# ----------------------
# Initialize Flask app
# ----------------------
app = Flask(__name__)

# CORS setup for localhost and deployed frontend
CORS(app, origins=["https://istylear.netlify.app", "http://localhost:5173"],
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True)

# ----------------------
# Routes
# ----------------------
@app.route("/")
def home():
    return jsonify({"message": "Try-On Backend is live 🚀"})

# ----------------------
# Mediapipe Pose Setup
# ----------------------
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    enable_segmentation=False,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

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

# ----------------------
# Try-On Route
# ----------------------
@app.route('/tryon', methods=['POST', 'OPTIONS'])
def tryon():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    print("Starting tryon request")
    try:
        data = request.get_json()
        if not data:
            print("Error: No JSON data received")
            return jsonify({'error': 'Invalid JSON data'}), 400

        frame_data = data.get('frame')
        shirt_url = data.get('shirtUrl')

        if not frame_data or not shirt_url:
            print(f"Error: Missing data - frame_data: {bool(frame_data)}, shirt_url: {bool(shirt_url)}")
            return jsonify({'error': 'Missing frame or shirtUrl'}), 400

        # Decode frame
        try:
            img_bytes = base64.b64decode(frame_data)
            img = Image.open(BytesIO(img_bytes))
            img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            h, w, _ = img.shape
        except Exception as e:
            print(f"Error decoding image: {e}")
            return jsonify({'error': 'Invalid image data'}), 400

        # Pose detection
        try:
            results = pose.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            if not results.pose_landmarks:
                print("No pose landmarks detected")
                return jsonify({'result': None}), 200
        except Exception as e:
            print(f"Error in pose detection: {e}")
            return jsonify({'error': 'Pose detection failed'}), 500

        lm = results.pose_landmarks.landmark
        left_shoulder = (int(lm[mp_pose.PoseLandmark.LEFT_SHOULDER].x * w),
                         int(lm[mp_pose.PoseLandmark.LEFT_SHOULDER].y * h))
        right_shoulder = (int(lm[mp_pose.PoseLandmark.RIGHT_SHOULDER].x * w),
                          int(lm[mp_pose.PoseLandmark.RIGHT_SHOULDER].y * h))
        left_hip = (int(lm[mp_pose.PoseLandmark.LEFT_HIP].x * w),
                    int(lm[mp_pose.PoseLandmark.LEFT_HIP].y * h))

        left_shoulder, right_shoulder, left_hip = smooth_points([left_shoulder, right_shoulder, left_hip])

        # Calculate shirt position
        shirt_width = int(abs(right_shoulder[0] - left_shoulder[0]) * 1.5)
        shirt_height = int(abs(left_hip[1] - left_shoulder[1]) * 1.6)
        x_center = int((left_shoulder[0] + right_shoulder[0]) / 2)
        y_top = int(left_shoulder[1] - shirt_height * 0.15)
        x1 = max(0, x_center - shirt_width // 2)
        y1 = max(0, y_top)
        x2 = min(w, x1 + shirt_width)
        y2 = min(h, y1 + shirt_height)

        # Load shirt image from URL
        try:
            shirt_resp = cv2.imdecode(
                np.frombuffer(requests.get(shirt_url, timeout=10).content, np.uint8),
                cv2.IMREAD_UNCHANGED
            )
        except Exception as e:
            print(f"Error loading shirt image from URL: {e}")
            return jsonify({'error': 'Failed to load shirt image'}), 400

        if shirt_resp is not None:
            try:
                shirt_resized = cv2.resize(shirt_resp, (x2 - x1, y2 - y1))
                overlay = np.zeros((h, w, 4), dtype=np.uint8)

                if shirt_resized.shape[2] == 4:
                    # Use alpha channel
                    alpha = shirt_resized[:, :, 3]
                    for c in range(0, 3):
                        overlay[y1:y2, x1:x2, c] = shirt_resized[:, :, c]
                    overlay[y1:y2, x1:x2, 3] = alpha
                else:
                    # No alpha channel
                    for c in range(0, 3):
                        overlay[y1:y2, x1:x2, c] = shirt_resized[:, :, c]
                    overlay[y1:y2, x1:x2, 3] = 255
            except Exception as e:
                print(f"Error processing shirt overlay: {e}")
                return jsonify({'error': 'Failed to process shirt overlay'}), 500
        else:
            print("Failed to load shirt image")
            return jsonify({'result': None}), 200

        try:
            _, buffer = cv2.imencode('.png', overlay)
            result_b64 = base64.b64encode(buffer).decode('utf-8')
            return jsonify({'result': result_b64}), 200
        except Exception as e:
            print(f"Error encoding result: {e}")
            return jsonify({'error': 'Failed to encode result'}), 500

    except Exception as e:
        print(f"Unexpected error in tryon: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

# ----------------------
# Run the app
# ----------------------
if __name__ == "__main__":
    print("✅ Try-On backend running...")
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
