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

app = Flask(__name__)
CORS(app, origins=["https://istylear.netlify.app", "http://localhost:5173"])


mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=False, model_complexity=1, enable_segmentation=False, min_detection_confidence=0.7, min_tracking_confidence=0.7)

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

@app.route('/tryon', methods=['POST'])
def tryon():
    print("Starting tryon request")
    try:
        data = request.get_json()
        frame_data = data.get('frame')
        shirt_url = data.get('shirtUrl')
        if not frame_data or not shirt_url:
            return jsonify({'error': 'Missing data'}), 400

        # Decode frame
        img_bytes = base64.b64decode(frame_data)
        img = Image.open(BytesIO(img_bytes))
        img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        h, w, _ = img.shape

        # Pose detection
        results = pose.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        if not results.pose_landmarks:
            return jsonify({'result': None})

        lm = results.pose_landmarks.landmark
        left_shoulder = (int(lm[mp_pose.PoseLandmark.LEFT_SHOULDER].x * w),
                         int(lm[mp_pose.PoseLandmark.LEFT_SHOULDER].y * h))
        right_shoulder = (int(lm[mp_pose.PoseLandmark.RIGHT_SHOULDER].x * w),
                          int(lm[mp_pose.PoseLandmark.RIGHT_SHOULDER].y * h))
        left_hip = (int(lm[mp_pose.PoseLandmark.LEFT_HIP].x * w),
                    int(lm[mp_pose.PoseLandmark.LEFT_HIP].y * h))

        left_shoulder, right_shoulder, left_hip = smooth_points([left_shoulder, right_shoulder, left_hip])

        shirt_width = int(abs(right_shoulder[0] - left_shoulder[0]) * 1.5)
        shirt_height = int(abs(left_hip[1] - left_shoulder[1]) * 1.6)
        x_center = int((left_shoulder[0] + right_shoulder[0]) / 2)
        y_top = int(left_shoulder[1] - shirt_height * 0.15)
        x1 = max(0, x_center - shirt_width // 2)
        y1 = max(0, y_top)
        x2 = min(w, x1 + shirt_width)
        y2 = min(h, y1 + shirt_height)

        # Load shirt image
        shirt_resp = cv2.imdecode(
            np.frombuffer(requests.get(shirt_url).content, np.uint8),
            cv2.IMREAD_UNCHANGED
        )

        if shirt_resp is not None:
            shirt_resized = cv2.resize(shirt_resp, (x2 - x1, y2 - y1))
            # Create overlay image with alpha
            overlay = np.zeros((h, w, 4), dtype=np.uint8)
            if shirt_resized.shape[2] == 4:
                # Use alpha channel
                alpha = shirt_resized[:, :, 3]
                for c in range(0, 3):
                    overlay[y1:y2, x1:x2, c] = shirt_resized[:, :, c]
                overlay[y1:y2, x1:x2, 3] = alpha
            else:
                # No alpha channel, assume opaque
                for c in range(0, 3):
                    overlay[y1:y2, x1:x2, c] = shirt_resized[:, :, c]
                overlay[y1:y2, x1:x2, 3] = 255
        else:
            print("Failed to load shirt image")
            return jsonify({'result': None})

        _, buffer = cv2.imencode('.png', overlay)
        result_b64 = base64.b64encode(buffer).decode('utf-8')
        return jsonify({'result': result_b64})

    except Exception as e:
        print("Error:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("✅ Try-On backend running...")
    port = int(os.environ.get("PORT", 5000))  # Railway gives random PORT
    app.run(host="0.0.0.0", port=port)
