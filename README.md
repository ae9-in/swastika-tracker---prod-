# Swastik Tracker - Production Architecture

This project has been optimized for **Separate Deployment** on Vercel to ensure maximum stability and ease of scaling.

## 📁 Project Structure

### `/frontend`
- **Purpose**: React/Vite Single Page Application.
- **Deployment**: Deploy this as a standalone Vercel project.
- **Root Directory**: Set to `frontend`.
- **Primary Var**: `VITE_API_BASE_URL` (Points to the backend API).

### `/backend`
- **Purpose**: Express.js API with PostgreSQL integration.
- **Deployment**: Deploy this as a standalone Vercel project.
- **Root Directory**: Set to `backend`.
- **Primary Vars**: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`.

## 🚀 Deployment Instructions
Please refer to the `walkthrough.md` for the step-by-step configuration guide for Vercel.

## 🛡️ Security
- **SSL**: Mandatory for Database connections.
- **CORS**: Configured for multi-domain production traffic.
- **Auth**: Hardened JWT-based authentication.
