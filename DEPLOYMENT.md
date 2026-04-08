# SmartCivic — Deployment Guide

> **Backend → Render** (branch: `feature/backend`)  
> **Frontend → Vercel** (branch: `feature/frontend`)

---

## What Was Changed for Deployment

### `feature/backend` branch

| File | Change |
|------|--------|
| `backend/requirements.txt` | Added `gunicorn`, `whitenoise`, `dj-database-url` |
| `backend/Procfile` | **New file** — tells Render how to start the app |
| `backend/render.yaml` | **New file** — Render infrastructure-as-code config |
| `backend/smartcivic/settings.py` | Added WhiteNoise middleware, `dj-database-url` DB parsing, `CORS_EXTRA_ORIGINS` env var, `STATICFILES_STORAGE` |
| `backend/.env.example` | Added `DATABASE_URL`, `CORS_EXTRA_ORIGINS` vars |

### `feature/frontend` branch

| File | Change |
|------|--------|
| `frontend/vercel.json` | **New file** — proxies `/api` and `/media` to Render backend, SPA fallback |
| `frontend/vite.config.js` | Dev proxy target reads `VITE_API_BASE_URL` env var (fallback: `localhost:8000`) |

---

## Part 1: Deploy Backend to Render

### Step 1 — Create PostgreSQL on Render

1. Go to **render.com → New → PostgreSQL**
2. Name: `smartcivic-db` | Plan: **Free**
3. Click **Create Database** and wait for it to be ready
4. Copy the **Internal Database URL** — you'll need it in Step 3

### Step 2 — Create Web Service

1. **New → Web Service**
2. Connect your GitHub repo → select branch **`feature/backend`**
3. Fill in:
   - **Name:** `smartcivic-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start Command:** `gunicorn smartcivic.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 120`
   - **Plan:** Free

   > **Tip:** If you use `render.yaml`, Render can auto-detect all of the above. Just push `render.yaml` to the branch and Render will pick it up.

### Step 3 — Set Environment Variables on Render

Go to the service → **Environment** tab and add:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | Click **Generate** or paste a 50-char random string |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `smartcivic-backend.onrender.com` |
| `DATABASE_URL` | Paste the Internal Database URL from Step 1 |
| `CELERY_BROKER_URL` | Your Upstash `rediss://` URL |
| `CELERY_RESULT_BACKEND` | Same Upstash `rediss://` URL |
| `HF_API_TOKEN` | Your HuggingFace token (`hf_xxx`) |
| `HF_SPACE_NAME` | Your HF space name (e.g. `youruser/smartcivic-ai`) |
| `HF_NLP_API_URL` | Your HF NLP API URL |
| `HF_IMAGE_API_URL` | Your HF image API URL |
| `EMAIL_HOST_USER` | Gmail address |
| `EMAIL_HOST_PASSWORD` | Gmail App Password |
| `FRONTEND_URL` | `https://your-app.vercel.app` *(fill after Vercel deploy)* |
| `CORS_EXTRA_ORIGINS` | `https://your-app.vercel.app` *(fill after Vercel deploy)* |

### Step 4 — Run Migrations (after first deploy)

1. Go to your Render service → **Shell** tab
2. Run:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

### Step 5 — Verify

- Visit `https://smartcivic-backend.onrender.com/api/` — should return a JSON response
- Visit `https://smartcivic-backend.onrender.com/admin/` — Django admin should load

---

## Part 2: Deploy Frontend to Vercel

### Step 1 — Update `vercel.json` with your Render URL

Open `frontend/vercel.json` and replace the destination URLs with your actual Render service URL:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://smartcivic-backend.onrender.com/api/:path*"
    },
    {
      "source": "/media/:path*",
      "destination": "https://smartcivic-backend.onrender.com/media/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 2 — Deploy on Vercel

1. Go to **vercel.com → New Project**
2. Import your GitHub repo → select branch **`feature/frontend`**
3. Fill in:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. No environment variables required — API calls use relative `/api/` paths which are rewritten by `vercel.json`.

5. Click **Deploy**

### Step 3 — Update Backend CORS

Once you have your Vercel URL (e.g. `https://smartcivic-abc123.vercel.app`):

1. Go to Render → your backend service → **Environment**
2. Set `CORS_EXTRA_ORIGINS` = `https://smartcivic-abc123.vercel.app`
3. Set `FRONTEND_URL` = `https://smartcivic-abc123.vercel.app`
4. Render will auto-redeploy

---

## Architecture in Production

```
Browser
  │
  ├─ /api/* ──────────────────► vercel.json rewrite
  │                                    │
  │                                    ▼
  │                        Render Web Service
  │                        (gunicorn + Django)
  │                                    │
  │                                    ├─► Render PostgreSQL (DATABASE_URL)
  │                                    ├─► Upstash Redis (Celery tasks)
  │                                    └─► HuggingFace Spaces (AI inference)
  │
  └─ /* ──────────────────────► Vercel (React SPA, static files)
```

---

## Local Development (unchanged)

```bash
# Backend
cd backend
cp .env.example .env        # fill in your local values
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver  # runs on :8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                 # runs on :5173, proxies /api → :8000
```

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `DisallowedHost` error | Add your Render domain to `ALLOWED_HOSTS` env var on Render |
| CORS blocked on frontend | Add your Vercel URL to `CORS_EXTRA_ORIGINS` on Render |
| Static files 404 | Make sure `collectstatic --noinput` runs in the build command |
| DB connection error | Check `DATABASE_URL` is set; Render PostgreSQL must be in same region |
| Celery tasks not running | Render free tier has no background workers — tasks run with `CELERY_ALWAYS_EAGER=True` or add a separate Worker service |

---

## Free Tier Limitations (Render + Vercel)

- **Render free web service** spins down after 15 min of inactivity — first request after sleep takes ~30s
- **Render free PostgreSQL** expires after 90 days — upgrade or use Neon.tech / Supabase for persistent DB
- **Celery workers** are not supported on the free web service — either set `CELERY_ALWAYS_EAGER=True` (synchronous tasks) or create a separate Render **Worker** service pointing to the same branch with start command: `celery -A smartcivic worker -l info`
