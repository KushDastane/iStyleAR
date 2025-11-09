# Production Safety Refactor TODO

## 1. Optimize Live Try-On Network Usage

- [ ] Downscale canvas before sending to backend in `src/pages/User/UserTryOn.jsx` (processFrame and handleCaptureTryOn)
- [ ] Downscale canvas in `src/pages/TryFree/TryFreePage.jsx` (processFrame)

## 2. Backend Environment Variables

- [ ] Ensure Cloudinary secrets are in Railway env vars (already using os.getenv)
- [ ] Add comments in `tryon_backend/app.py` explaining why secrets are moved to backend

## 3. Frontend Environment Variables

- [ ] Verify frontend .env only has public keys: VITE_API_URL, VITE_RECAPTCHA_SITE_KEY, VITE_FIREBASE_API_KEY, VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET
- [ ] Remove any sensitive keys from frontend (none found)

## 4. Testing

- [ ] Test AR functionality intact
- [ ] Verify Firebase auth works
- [ ] Verify Cloudinary uploads work
- [ ] Verify reCAPTCHA works

## 5. Documentation

- [ ] Update comments in code explaining security decisions
