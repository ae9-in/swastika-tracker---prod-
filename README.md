# Swastika Tracker

Monorepo-style structure with clear separation between frontend and backend.

## Folder structure
- `frontend/` - React + Vite admin app (login-first Affiliates CRM UI)
- `backend/` - Backend assets and PostgreSQL schema
  - `backend/postgresql/schema.sql`

## Run frontend
```bash
cd frontend
npm run dev
```

If PowerShell blocks scripts:
```bash
cd frontend
npm.cmd run dev
```

## Current backend state
- Full Express + PostgreSQL backend is implemented under `backend/src`
- PostgreSQL schema is in `backend/postgresql/schema.sql`
- Setup and API details are in `backend/README.md`
