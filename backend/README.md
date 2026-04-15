# Backend (PostgreSQL + Express)

## Structure
- `src/config` - env and database pool
- `src/constants` - domain constants
- `src/controllers` - request handlers
- `src/middleware` - auth, validation, error handling
- `src/routes` - route modules
- `src/services` - SQL/data business logic
- `src/utils` - shared helpers
- `scripts` - DB init and seed scripts
- `postgresql/schema.sql` - PostgreSQL schema

## Setup
1. Copy `.env.example` to `.env` and update values.
2. Install packages:
   ```bash
   npm install
   ```
3. Initialize schema:
   ```bash
   npm run db:init
   ```
4. Seed demo data:
   ```bash
   npm run db:seed
   ```
5. Start server:
   ```bash
   npm run dev
   ```

## API base
- `http://localhost:4000/api`

## Main endpoints
- `POST /auth/login`
- `POST /auth/select-business`
- `GET /auth/me`
- `GET /auth/businesses`
- `GET /affiliates`
- `POST /affiliates`
- `GET /affiliates/:id`
- `PATCH /affiliates/:id`
- `POST /affiliates/:id/status`
- `GET /affiliates/export/csv`
- `POST /affiliates/import/csv`
- `GET /reminders`
- `POST /reminders`
- `POST /reminders/:id/complete`
- `GET /activities`
- `GET /analytics/affiliates`
- `GET /health`
