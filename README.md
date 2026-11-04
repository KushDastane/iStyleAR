# iStyleAR

iStyleAR is a web-based virtual try-on application that lets users preview clothing on a live camera feed. It combines browser-based pose detection and canvas rendering with personalized wardrobe management, saved try-on captures, and rule-based weather and size recommendations.

The application provides an account-free demo alongside authenticated features for managing a personal wardrobe and saved outfits.

## Features

- **Live Virtual Try-On:** Preview garments over a live camera feed using MediaPipe pose detection and HTML canvas.
- **Free Demo:** Try sample garments without creating an account.
- **Google Authentication:** Sign in using Firebase Authentication and access protected user pages.
- **Virtual Wardrobe:** Upload, manage, and organize clothing items.
- **Saved Captures:** Save try-on results and optionally share them publicly.
- **Size Recommendations:** Get rule-based size suggestions using body profile measurements and predefined size charts.
- **Weather-Based Suggestions:** Receive outfit recommendations based on local weather conditions.
- **Trending and Achievements:** Explore trending items and view user achievements.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React 19, JavaScript, Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Pose Detection | MediaPipe Tasks Vision |
| Rendering | HTML Canvas |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Image Hosting | Cloudinary |
| Weather Data | Open-Meteo, BigDataCloud |
| Backend | Python, Flask, OpenCV, MediaPipe |

## How It Works

1. Select a sample garment in the free demo or choose an item from your wardrobe after signing in.
2. Allow camera access to start the live try-on experience.
3. MediaPipe detects body pose landmarks in the browser.
4. The application uses the detected landmarks to position and render a clothing overlay on the camera feed using HTML canvas.
5. Signed-in users can capture the result and save it to their account.

**Implementation note:** The active frontend performs pose detection and live overlay rendering in the browser. A separate Flask backend provides health-check and image-processing endpoints. The current frontend uses the backend health check as a readiness check; it does not use the Flask `/tryon` endpoint for its active live-rendering workflow.

## Getting Started

### Prerequisites

- Node.js
- npm
- A Firebase project configured with Google Authentication and Firestore
- A Cloudinary account for wardrobe and capture uploads

### Frontend Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/KushDastane/iStyleAR.git
   cd iStyleAR
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure the following Firebase environment variables:

   ```env
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

4. Configure Cloudinary for image uploads:

   ```env
   VITE_CLOUDINARY_CLOUD_NAME=
   VITE_CLOUDINARY_UPLOAD_PRESET=
   ```

5. Configure the backend base URL used by the readiness check:

   ```env
   VITE_API_URL=
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

Vite will display the local development URL in the terminal.

Google sign-in must be enabled in the Firebase Authentication project.

### Backend

The repository also contains a standalone Flask service in `tryon_backend/`. Its API and setup details are documented in [DOCS.md](DOCS.md).

## Project Documentation

For implementation details, application architecture, routes, data storage, API endpoints, and known limitations, see [DOCS.md](DOCS.md).

## License

No license information is specified here. Refer to the repository for the applicable licensing terms.