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
import cloudinary
import cloudinary.uploader

app = Flask(__name__)
if os.getenv("FLASK_ENV") == "development":
    # Dev: allow all origins
    CORS(app)
else:
    # Prod: allow only Netlify frontend
    CORS(app, origins=["https://istylear.netlify.app"])

# Cloudinary config
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

@app.route("/")
def home():
    return jsonify({"message": "Try-On Backend is live 🚀"})

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
    import time
    print("Starting tryon request")
    try:
        data = request.get_json()
        frame_data = data.get('frame')
        shirt_url = data.get('shirtUrl')
        mode = data.get('mode', 'overlay')  # 'overlay' or 'full'

        if not frame_data or not shirt_url:
            return jsonify({'error': 'Missing data'}), 400

        # Decode frame
        img_bytes = base64.b64decode(frame_data)
        img = Image.open(BytesIO(img_bytes)).convert("RGB")
        img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        h, w, _ = img.shape

        # Pose detection
        results = pose.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        if not results.pose_landmarks:
            return jsonify({'result': None})

        lm = results.pose_landmarks.landmark

        # Check if required landmarks exist
        required_landmarks = [
            mp_pose.PoseLandmark.LEFT_SHOULDER,
            mp_pose.PoseLandmark.RIGHT_SHOULDER,
            mp_pose.PoseLandmark.LEFT_HIP
        ]
        points = []
        for lm_idx in required_landmarks:
            if lm[lm_idx].visibility < 0.5:
                return jsonify({'result': None})  # Low confidence
            points.append((
                int(lm[lm_idx].x * w),
                int(lm[lm_idx].y * h)
            ))

        left_shoulder, right_shoulder, left_hip = smooth_points(points)

        # Calculate shirt position & size
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
            np.frombuffer(requests.get(shirt_url, timeout=5).content, np.uint8),
            cv2.IMREAD_UNCHANGED
        )

        if shirt_resp is None:
            print("Failed to load shirt image")
            return jsonify({'result': None})

        shirt_resized = cv2.resize(shirt_resp, (x2 - x1, y2 - y1))

        # Composite overlay onto frame
        composited_img = img.copy()
        if shirt_resized.shape[2] == 4:  # has alpha
            alpha = shirt_resized[:, :, 3] / 255.0
            for c in range(3):
                composited_img[y1:y2, x1:x2, c] = (
                    alpha * shirt_resized[:, :, c] +
                    (1 - alpha) * composited_img[y1:y2, x1:x2, c]
                )
        else:
            composited_img[y1:y2, x1:x2] = shirt_resized[:, :, :3]

        if mode == "full":
            # Upload composited image to Cloudinary
            _, buffer = cv2.imencode('.png', cv2.cvtColor(composited_img, cv2.COLOR_BGR2RGB))
            buffer_bytes = buffer.tobytes()
            public_id = f"tryon_{int(time.time())}"

            upload_result = cloudinary.uploader.upload(
                BytesIO(buffer_bytes),
                folder="tryon_results",
                public_id=public_id
            )
            return jsonify({'result': upload_result['secure_url']})
        else:
            # Return overlay base64 for live try-on
            _, buffer = cv2.imencode('.png', cv2.cvtColor(composited_img, cv2.COLOR_BGR2RGB))
            result_b64 = base64.b64encode(buffer).decode('utf-8')
            return jsonify({'result': result_b64})

    except Exception as e:
        print("Error in /tryon:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("✅ Try-On backend running...")
    port = int(os.environ.get("PORT", 5000))  # Railway gives random PORT
    app.run(host="0.0.0.0", port=port)
