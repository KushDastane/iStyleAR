# IstyleAR - Virtual Try-On Application

## Overview

IstyleAR is a web-based virtual try-on application that allows users to preview clothing items on their body using augmented reality (AR) technology. The application features a free demo mode where users can try on sample outfits, and a full user system for personalized experiences.

## Features

### Free Demo Mode
- Select from sample clothing items (Red Shirt, Blue Jacket, Green Hoodie)
- Real-time webcam integration for live try-on
- Instant preview of clothing on user's body
- No account required for basic functionality

### User System (Premium Features)
- User registration and authentication
- Virtual wardrobe management
- Personalized try-on experiences
- Trending fashion recommendations
- Dashboard for user activity tracking

## Technology Stack

### Frontend
- **React 18** - Modern JavaScript library for building user interfaces
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library for React
- **React Router** - Declarative routing for React
- **Axios** - HTTP client for API requests
- **Firebase** - Authentication and backend services

### Backend
- **Flask** - Python web framework
- **OpenCV** - Computer vision library for image processing
- **Pillow** - Python Imaging Library
- **NumPy** - Numerical computing library

## Project Structure

```
IstyleAR/
├── public/                 # Static assets
├── src/
│   ├── Components/         # Reusable UI components
│   │   ├── AboutAndFeatures.jsx
│   │   ├── CreativeCarousel.jsx
│   │   ├── Footer.jsx
│   │   ├── PrivateRoute.jsx
│   │   ├── ProtectedLayout.jsx
│   │   └── PublicNavbar.jsx
│   ├── context/            # React context providers
│   │   ├── AuthContext.jsx
│   │   ├── RecommendationContext.jsx
│   │   ├── ThemeContext.jsx
│   │   ├── useAuth.jsx
│   │   └── WardrobeContext.jsx
│   ├── pages/              # Page components
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── TryFree/
│   │   │   └── TryFreePage.jsx
│   │   └── User/
│   │       ├── Dashboard.jsx
│   │       ├── Trending.jsx
│   │       ├── UserTryOn.jsx
│   │       └── VirtualWardrobe.jsx
│   ├── services/           # API service functions
│   │   └── wardrobeService.js
│   ├── firebase/           # Firebase configuration
│   │   └── config.js
│   ├── App.jsx             # Main application component
│   ├── main.jsx            # Application entry point
│   └── index.css           # Global styles
├── tryon_backend/          # Python Flask backend
│   └── app.py              # Main backend application
├── cors.json               # CORS configuration
├── index.html              # HTML template
├── package.json            # Node.js dependencies
├── vite.config.js          # Vite configuration
└── README.md               # Project README
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+
- pip (Python package manager)
- Git

### Frontend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd IstyleAR
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd tryon_backend
```

2. Install Python dependencies:
```bash
pip install flask opencv-python pillow numpy flask-cors
```

3. Start the Flask server:
```bash
python app.py
```

The backend will be available at `http://localhost:5000`

## API Endpoints

### Try-On Endpoint
- **URL**: `POST /tryon`
- **Description**: Processes a frame from webcam and overlays selected clothing
- **Request Body**:
  ```json
  {
    "frame": "base64-encoded-image-data",
    "shirtUrl": "url-to-shirt-image"
  }
  ```
- **Response**:
  ```json
  {
    "result": "base64-encoded-result-image"
  }
  ```

## Usage

### Free Demo
1. Navigate to the "Try Free" page
2. Select a clothing item from the available options
3. Click "Start Webcam" to enable camera access
4. Click "Try On" to see the virtual try-on result
5. Use "Reset" to start over

### User Registration
1. Click "Sign Up" in the navigation
2. Fill in registration details
3. Verify email if required
4. Log in to access premium features

## Development

### Code Style
- Use ESLint for JavaScript/React code linting
- Follow React best practices and hooks guidelines
- Use Tailwind CSS utility classes for styling
- Maintain consistent naming conventions

### Git Workflow
- Use feature branches for new development
- Follow conventional commit messages
- Create pull requests for code review

### Testing
- Test components in different browsers
- Verify responsive design on mobile devices
- Test webcam functionality with different cameras
- Validate API error handling

## Deployment

### Frontend Deployment
The application can be deployed to static hosting services like:
- Vercel
- Netlify
- GitHub Pages

Build the project:
```bash
npm run build
```

### Backend Deployment
The Flask backend can be deployed to:
- Heroku
- AWS Elastic Beanstalk
- Google App Engine
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation for common solutions

## Future Enhancements

- [ ] Mobile app development (React Native)
- [ ] Advanced AR features (pose detection, lighting adjustment)
- [ ] Social sharing of try-on results
- [ ] Integration with e-commerce platforms
- [ ] AI-powered fashion recommendations
- [ ] Multi-language support
