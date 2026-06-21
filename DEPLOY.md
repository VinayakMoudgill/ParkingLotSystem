# Deployment Guide

This project has **two parts** that deploy to **two different places**:

| Part | Hosts on | Why |
|---|---|---|
| 🟦 NestJS backend | **Render** (free tier) | GitHub Pages can't run a Node server |
| 🟩 React frontend | **GitHub Pages** | Static files only |

Do the **backend first** — you need its URL before building the frontend.

---

## Part 1 — Deploy the Backend to Render

1. Push this project to a GitHub repository (see "Pushing to GitHub" below).
2. Go to <https://render.com> → sign up (free) → **New → Web Service**.
3. Connect your GitHub repo.
4. Fill in the settings:
   - **Root Directory:** *(leave blank — the backend is at the repo root)*
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/main`
5. Add **Environment Variables** (Advanced → Add Environment Variable):
   - `JWT_SECRET` = a long random string
   - `CORS_ORIGINS` = `https://YOURNAME.github.io` *(fill in after Part 2, or set now if you know your GitHub username)*
   - *(Render sets `PORT` automatically — don't add it.)*
6. Click **Create Web Service**. After it builds, Render gives you a URL like:
   ```
   https://parkflow-api.onrender.com
   ```
   **Copy this URL** — you need it next.

> ⚠️ **Note:** Render's free tier has an *ephemeral* filesystem, so the
> `data/admins.json` file resets whenever the service restarts/redeploys.
> That just means you re-create the first admin after a restart — fine for a demo.
> Also, free services "sleep" after 15 min idle; the first request then takes ~30s to wake.

---

## Part 2 — Deploy the Frontend to GitHub Pages

1. In your GitHub repo, go to **Settings → Secrets and variables → Actions → New repository secret**:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** your Render backend URL from Part 1 (e.g. `https://parkflow-api.onrender.com`)
2. Go to **Settings → Pages**:
   - **Source:** select **GitHub Actions**
3. Push to the `main` branch (or run the workflow manually from the **Actions** tab).
   The included workflow (`.github/workflows/deploy-frontend.yml`) builds the
   frontend and publishes it. When it finishes, your site is live at:
   ```
   https://YOURNAME.github.io/YOUR-REPO/
   ```
4. **Finish CORS:** go back to Render → your service → Environment, and make sure
   `CORS_ORIGINS` is set to `https://YOURNAME.github.io` (no trailing slash, no repo path).
   Save — Render redeploys automatically.

Done. Open the Pages URL and the frontend will talk to your live backend.

---

## Pushing to GitHub (first time)

From inside the project folder:

```bash
git init
git add .
git commit -m "ParkFlow: full-stack parking system"
git branch -M main
git remote add origin https://github.com/YOURNAME/YOUR-REPO.git
git push -u origin main
```

`.gitignore` already excludes `node_modules`, `dist`, and the local `data/` datastore.

---

## Local Development (unchanged)

```bash
npm install            # backend deps
npm --prefix frontend install
npm run dev            # runs backend (:3000) + frontend (:5173) together
```

The frontend defaults to `http://localhost:3000` when `VITE_API_BASE_URL` is not set.

---

## Environment Variables Summary

**Backend** (Render dashboard):
| Variable | Example | Purpose |
|---|---|---|
| `JWT_SECRET` | `a-long-random-string` | Signs admin JWTs |
| `CORS_ORIGINS` | `https://yourname.github.io` | Allows the frontend to call the API |
| `PORT` | *(auto-set by Render)* | Port to listen on |

**Frontend** (GitHub Actions secret):
| Variable | Example | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `https://parkflow-api.onrender.com` | Points the UI at the backend |
