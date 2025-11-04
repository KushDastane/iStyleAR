import requests
import base64
import cv2
import numpy as np

# Create a simple test image (blue square)
test_img = np.zeros((480, 640, 3), dtype=np.uint8)
test_img[:, :] = [255, 0, 0]  # Blue image

# Encode to base64
success, buffer = cv2.imencode('.jpg', test_img)
if success:
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    # Test the API
    try:
        response = requests.post('https://istylear-production.up.railway.app/tryon', json={
            'frame': img_base64,
            'shirtUrl': 'https://res.cloudinary.com/dyiaqidiq/image/upload/v1759683904/red_zbtczb.png'
        }, timeout=10)

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")

    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
else:
    print("Failed to encode test image")
