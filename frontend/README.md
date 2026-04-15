# Swastika Tracker - Affiliates CRM

Login-first React admin app for the Affiliates module with business isolation across **H&W** and **Pooja**.

## What is implemented
- Direct authentication-first entry (`/login`)
- Business context selection (`/select-business`)
- Protected CRM app shell (`/app/*`)
- Affiliates list, create, edit, detail pages
- Forward-only status transitions:
  - Contacted -> Samples Given -> Follow Up Visit
- Analytics dashboard with animated charts
- Live API integration with backend (`src/services/api.js`)
- Theme switch (dark/light mode with persistence)

## Run
Start backend first at `http://localhost:4000` (default).

Optional frontend env (`frontend/.env`):
```bash
VITE_API_BASE_URL=http://localhost:4000/api
```

Then run frontend:
```bash
npm run dev
```

If PowerShell blocks npm scripts on your machine, use:
```bash
npm.cmd run dev
```

## Demo credentials
- `admin@swastika.in / Admin@123`
- `hw@swastika.in / Admin@123`
- `pooja@swastika.in / Admin@123`

## Notes
- Frontend now uses live backend APIs with JWT auth/business switching.
