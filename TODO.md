# TODO: Connect Frontend to Railway Backend

## Completed Steps

- [x] Create .env file with VITE_API_URL=https://istylear-production.up.railway.app/
- [x] Update axios calls in UserTryOn.jsx to use import.meta.env.VITE_API_URL + '/tryon'
- [x] Update axios calls in TryFreePage.jsx to use import.meta.env.VITE_API_URL + '/tryon'
- [x] Update test_api.py to use the new Railway URL
- [x] Update public/\_redirects to proxy /api/\* to the backend
- [x] Verify backend CORS (already includes Netlify domain)

## Remaining Tasks

- [ ] Test the API connections from the frontend
- [ ] Deploy the updated frontend to Netlify
- [ ] Verify live try-on works with the new backend URL
