# iStyleAR — Technical Documentation

## 1. Project Overview

iStyleAR is a React-based virtual try-on application with a public, account-free demo and authenticated user features.

The application uses MediaPipe pose detection to identify body landmarks and HTML canvas to render clothing overlays on a live camera feed. Authenticated users can manage a virtual wardrobe, save try-on captures, and access weather-based and size recommendations.

The project also contains a standalone Flask backend that exposes health-check and image-processing endpoints.

Recommendations are implemented using JavaScript rules and predefined data. The size recommendation system is not a machine-learning model.

## 2. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React 19, JavaScript |
| Build Tool | Vite |
| Routing | React Router |
| Styling | Tailwind CSS |
| Pose Detection | MediaPipe Tasks Vision |
| Live Rendering | HTML Canvas |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Image Hosting | Cloudinary |
| Weather Data | Open-Meteo |
| Reverse Geocoding | BigDataCloud |
| Backend | Python, Flask |
| Image Processing | OpenCV, MediaPipe, Pillow, NumPy |

## 3. Application Architecture

### 3.1 Frontend Entry Points

- `src/main.jsx` bootstraps the React application.
- `src/App.jsx` defines application routes and the main application structure.
- React Context providers manage authentication, wardrobe, recommendations, and weather state.

### 3.2 Routing and Access Control

The application separates public pages from authenticated user pages.

| Route | Access | Description |
|---|---|---|
| `/` | Public | Home page |
| `/login` | Public | Google sign-in |
| `/try-free` | Public | Sample-garment try-on demo |
| `/user` | Authenticated | Dashboard |
| `/user/trending` | Authenticated | Trending items |
| `/user/try-on` | Authenticated | Wardrobe-based try-on |
| `/user/wardrobe` | Authenticated | Virtual wardrobe |
| `/user/profile` | Authenticated | User profile |
| `/user/achievements` | Authenticated | Achievements |
| `/user/captures` | Authenticated | Saved captures |

Authenticated routes are protected using `PrivateRoute` and rendered through `ProtectedLayout`.

### 3.3 Main Source Directories

```text
src/
├── Components/
│   ├── AI/
│   ├── Weather/
│   └── shared UI components
├── context/
├── data/
├── firebase/
├── pages/
│   ├── Auth/
│   ├── Home/
│   ├── TryFree/
│   └── User/
├── services/
└── utils/
```

The main responsibilities are:

- `Components/`: Shared UI components, route protection, and recommendation-related components.
- `context/`: Authentication, wardrobe, recommendation, and weather state.
- `data/`: Climate rules and predefined size charts.
- `firebase/`: Firebase initialization and configuration.
- `pages/`: Public and authenticated application pages.
- `services/`: Weather, wardrobe, and size recommendation logic.
- `utils/`: Supporting utility functions.

The complete dependency list and available frontend scripts are maintained in `package.json`.

## 4. Authentication and Data Storage

### 4.1 Authentication

Firebase Authentication handles Google sign-in through `GoogleAuthProvider` and `signInWithPopup`.

`AuthContext` observes authentication state and loads or creates the corresponding user document in Firestore.

Protected pages redirect unauthenticated users to `/login`.

### 4.2 Firestore Data Structure

The application uses the following Firestore locations:

| Collection / Path | Purpose |
|---|---|
| `users/{uid}` | User details, try-on count, and optional body profile |
| `users/{uid}/wardrobe` | Wardrobe items, image URLs, source, and favorite state |
| `users/{uid}/tries` | Saved try-on captures and associated garment information |
| `publicTries` | Captures shared publicly by users |
| `users/{uid}/trendingFavorites` | Favorite records for trending items |
| `users/{uid}/fitFeedback` | Location used by a feedback-writing helper; the current UI does not call this helper |

The optional body profile includes fields such as height, weight, chest, waist, shoulder, and preferred fit.

### 4.3 Image Storage

Cloudinary handles wardrobe image uploads and saved try-on capture uploads.

Firebase Storage is initialized in the Firebase configuration, but the active upload flows identified in the application use Cloudinary.

## 5. Virtual Try-On Implementation

The application has two try-on experiences: a public demo and an authenticated wardrobe-based experience.

### 5.1 Public Free Demo

Implementation: `src/pages/TryFree/TryFreePage.jsx`

Workflow:

1. The user selects one of the sample garments.
2. The browser requests camera access through `getUserMedia`.
3. The application checks the configured backend health endpoint through its readiness modal.
4. MediaPipe Tasks Vision performs pose detection in the browser.
5. Detected pose landmarks are used to calculate the clothing overlay transformation.
6. The camera frame and garment overlay are rendered on an HTML canvas.

The demo allows users to stop or reset the preview. It does not implement the signed-in capture-saving workflow.

The page loads pose detection model and WASM assets from external CDNs.

### 5.2 Authenticated Try-On

Implementation: `src/pages/User/UserTryOn.jsx`

Workflow:

1. The application loads the user's wardrobe and body profile from Firestore.
2. The user selects a garment and starts the camera.
3. The readiness modal checks the backend health endpoint.
4. MediaPipe detects pose and hand landmarks in the browser.
5. Smoothed pose data drives the garment overlay rendering.
6. Detected gestures can be used for interactions such as switching garments or capturing an image.
7. Users can retake or save a capture.
8. Saving uploads the image to Cloudinary and stores the resulting record in Firestore.

When a capture is marked public, the application also creates a record in `publicTries`.

### 5.3 Rendering Approach

The active live try-on implementation uses browser-side pose detection and canvas rendering.

It is a 2D clothing overlay rather than a 3D garment simulation or physics-based cloth-rendering system.

The separate Flask image-processing endpoint is not used by the active frontend rendering workflow.

## 6. Backend Architecture

The backend is a standalone Flask application located in `tryon_backend/app.py`.

It provides health-check and image-processing endpoints.

### 6.1 Image Processing Workflow

The `/tryon` endpoint:

1. Receives a camera frame and garment image URL.
2. Decodes and resizes the input frame.
3. Detects pose landmarks using MediaPipe.
4. Estimates shoulder and hip positions.
5. Transforms and composites the garment image.
6. Encodes the resulting image as PNG.
7. Returns the result as base64-encoded data.

The implementation also includes request-size restrictions. The total request limit is approximately 8 MiB, with a separate frame limit of approximately 6 MiB.

### 6.2 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Returns a message indicating that the backend is running. |
| `GET` | `/health` | Returns a health-check response. |
| `POST` | `/tryon` | Processes a frame and garment image to generate an overlay. |

### 6.3 POST `/tryon`

The endpoint accepts JSON fields:

- `frame`: Base64-encoded image data.
- `shirtUrl`: HTTP(S) URL of the garment image.

The implementation also supports form fields and a multipart file named `frame`.

A successful response contains a `result` property with base64 PNG data without a data-URL prefix.

If no pose is detected, the response contains a null result.

Notable error responses include:

| Status | Meaning |
|---|---|
| `400` | Invalid or missing input data |
| `413` | Request or frame exceeds configured size limits |
| `503` | OpenCV or MediaPipe is unavailable |
| `500` | Processing, initialization, or encoding failure |

### 6.4 Frontend and Backend Relationship

An important implementation distinction is that the current frontend does not submit camera frames to `POST /tryon`.

The active free-demo and authenticated try-on pages use the backend `/health` endpoint as a readiness check. Pose detection and live canvas rendering happen in the browser.

The backend image-processing endpoint remains a separate implementation.

## 7. Weather Recommendation System

The weather functionality is implemented through:

- `src/services/weatherService.js`
- `src/context/WeatherContext.jsx`
- `src/services/weatherRecommendationService.js`
- `src/data/climateRules.js`

### 7.1 Weather Data Retrieval

The application uses browser geolocation to obtain the user's location.

- Open-Meteo provides current weather information.
- BigDataCloud provides reverse geocoding to obtain a readable location name.

The weather service does not require a weather API key.

`WeatherContext` fetches weather information and refreshes it periodically. If location or weather retrieval fails, it attempts a fallback location.

The service simplifies precipitation into a binary value rather than preserving a detailed precipitation probability.

### 7.2 Recommendation Logic

The recommendation service applies rules based on weather conditions such as temperature, humidity, and precipitation.

It uses garment information, including names, categories, and fabric descriptions, to score wardrobe items against the climate rules.

This is a rule-based recommendation system, not a trained machine-learning model.

## 8. Size Recommendation System

Implementation:

- `src/services/sizeRecommendationService.js`
- `src/data/sizeCharts.js`

The size recommendation service compares measurements such as chest, shoulder, and waist against predefined size charts.

It uses a weighted scoring approach and adjusts the result according to the user's preferred fit, including slim or oversized preferences.

### Measurement Sources

The implementation can use:

1. Features estimated from live pose landmarks.
2. Measurements stored in the user's body profile.
3. Built-in default measurements when other values are unavailable.

Pose-derived measurements are approximate and depend on assumptions used by the implementation. They should not be interpreted as precise body measurements.

Available size recommendations are limited by the brand and category entries present in the predefined size charts.

## 9. Installation and Development

### 9.1 Frontend

Requirements:

- Node.js
- npm

Install dependencies:

```bash
npm install
```

Configure the Firebase environment variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Configure Cloudinary:

```env
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Configure the backend base URL for the readiness check:

```env
VITE_API_URL=
```

The account-deletion confirmation component also reads `VITE_RECAPTCHA_SITE_KEY`.

Start the development server:

```bash
npm run dev
```

### 9.2 Backend

The repository specifies Python 3.10.14 in `tryon_backend/runtime.txt`.

From the backend directory:

```bash
cd tryon_backend
python -m pip install -r requirements.txt
python app.py
```

The development server uses port 5000 by default. The `PORT` environment variable can override it.

The backend CORS configuration includes the deployed Netlify origin and `http://localhost:5173`.

### 9.3 Available Frontend Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Creates the production build |
| `npm run preview` | Previews the production build |
| `npm run lint` | Runs ESLint |

## 10. Testing

The repository includes `test_api.py`, a small manual script that sends a sample frame to a configured hosted backend endpoint.

It is not a general automated test suite.

The frontend package scripts include linting and production build commands.

## 11. Current Limitations

- Live try-on uses 2D garment overlays rather than 3D garment simulation.
- The active frontend uses browser-side pose detection and canvas rendering; it does not call the Flask `/tryon` endpoint.
- Both active try-on experiences depend on a successful backend health check before starting.
- Pose-derived body measurements are approximate.
- Size recommendations rely on predefined charts and rule-based scoring.
- Weather recommendations use garment text fields and basic climate rules.
- Precipitation is simplified into a binary value by the weather service.
- Pose detection model and runtime assets are loaded from external CDNs.
- Firebase and Cloudinary require separate project configuration.
- A fit-feedback writing helper exists, but the current UI does not connect to it.

## 12. Further Development

Potential areas for future work include:

- Connecting the active frontend try-on flow to the backend image-processing endpoint, if needed.
- Improving body measurement calibration.
- Expanding size-chart coverage.
- Improving weather-based garment matching.
- Adding automated tests for frontend and backend workflows.