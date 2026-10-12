# NeuroDesk AI – Deployment Guide

This guide covers deploying **NeuroDesk AI** into production using the recommended modern stack:
- **Frontend**: [Vercel](https://vercel.com) (Next.js 15)
- **Backend**: [Render](https://render.com) or [Railway](https://railway.app) (FastAPI + PostgreSQL)

---

## Step 1: Deploy Backend & Database (Render)

The repository includes a ready-to-use [`render.yaml`](./render.yaml) blueprint that sets up both the FastAPI Web Service and a Managed PostgreSQL Database automatically.

### Option A: Using Render Blueprints (1-Click)
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository: `https://github.com/Sumanthkumark05/Ai-Dashboard-`.
4. Render will read [`render.yaml`](./render.yaml) and automatically create:
   - **`neurodesk-api`**: FastAPI Web Service (`backend/`)
   - **`neurodesk-db`**: Managed PostgreSQL Database
5. Click **Apply**.
6. Once the service deploys, copy your backend URL:
   `https://neurodesk-api-XXXX.onrender.com`

---

## Step 2: Deploy Frontend (Vercel)

1. Go to [Vercel](https://vercel.com) and log in.
2. Click **Add New...** → **Project**.
3. Import your GitHub repository: `Sumanthkumark05/Ai-Dashboard-`.
4. In the **Configure Project** screen:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: `./` (leave default)
5. Expand **Environment Variables** and add:
   - `BACKEND_URL`: `https://neurodesk-api-XXXX.onrender.com` (your backend URL from Step 1)
6. Click **Deploy**.
7. Once deployed, Vercel gives you your live URL:
   `https://your-project.vercel.app`

---

## Step 3: Link CORS on Backend

To ensure seamless security and cookie/session handling:
1. Open your **Render Dashboard** → Select **`neurodesk-api`**.
2. Go to **Environment**.
3. Set or update:
   - `FRONTEND_URL`: `https://your-project.vercel.app`
4. Click **Save Changes** (Render will redeploy with updated CORS origins).

---

## Alternative: All-in-One on Railway

If you prefer deploying everything under Railway:
1. Go to [Railway](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Add a **PostgreSQL** database service (`New` → `Database` → `Add PostgreSQL`).
4. Add the backend service:
   - Root directory: `/backend`
   - Set variable `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
5. Add the frontend service:
   - Root directory: `/`
   - Set variable `BACKEND_URL`: `${{Backend.RAILWAY_PUBLIC_DOMAIN}}`
6. Click **Deploy**.
