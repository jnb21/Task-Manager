# TaskFlow — Deployment Guide

## Architecture

```
Browser → Vercel CDN (React/Vite static build)
                ↓  HTTPS API calls (VITE_API_URL)
         Render Web Service (Express + node:sqlite)
                ↓
         Render Persistent Disk  (taskflow.db)
```

**Vercel** hosts the frontend as static files — no server, global CDN, free tier.  
**Render** runs the Express backend continuously — has Node.js, file system, free tier with limitations.

---

## Before you start

Push this repo to GitHub. Both platforms pull directly from it.

---

## Part 1 — Deploy the backend on Render

### 1. Create a Web Service

1. Go to **render.com** → sign in or create a free account
2. Click **"New +"** in the top navigation bar
3. Click **"Web Service"**
4. Click **"Connect account"** next to GitHub (first time only) and authorize Render
5. Find **task-manager** in the repo list → click **"Connect"**

### 2. Configure the service

Fill in these fields on the configuration screen:

| Field | Value |
|---|---|
| **Name** | `taskflow-api` (or anything you like) |
| **Region** | Closest to your users |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node --experimental-sqlite index.js` |
| **Instance Type** | `Free` (see note below about the database) |

> **Node version note:** The `--experimental-sqlite` flag is required on Node 22 (which Render uses).
> If Render upgrades to Node 23 or later, remove the flag — it becomes built-in and stable.

### 3. Set environment variables

Still on the configuration screen, scroll to **"Environment Variables"**.  
Click **"Add Environment Variable"** for each row:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | A long random string — run `openssl rand -hex 32` in your terminal to generate one |
| `FRONTEND_URL` | *(leave blank for now — you'll fill this in after Step 2)* |

### 4. (Strongly recommended) Add a Persistent Disk

> **Free tier limitation:** Render's free tier does not include a persistent disk. The file system resets on every deploy, which means **your SQLite database is wiped each time you push code**. This is fine for testing but not for real use.

To get persistent storage, upgrade to at least the **Starter plan ($7/month)**, then:

1. On the configuration screen, click **"Add Disk"**
2. Fill in:
   - **Name**: `taskflow-data`
   - **Mount Path**: `/data`
   - **Size**: `1 GB`
3. Add one more environment variable:
   - `DB_PATH` = `/data/taskflow.db`

### 5. Deploy

1. Click **"Create Web Service"** at the bottom of the page
2. Watch the build log — it takes 2–3 minutes the first time
3. When you see `Server running on port 10000` (or similar), the service is live
4. Your API URL is shown at the top: `https://taskflow-api.onrender.com`
   **Copy this URL — you need it in Step 2**

---

## Part 2 — Deploy the frontend on Vercel

### 1. Import the project

1. Go to **vercel.com** → sign in or create a free account
2. Click **"Add New…"** (top-right area) → **"Project"**
3. Under "Import Git Repository", find **task-manager** → click **"Import"**
   - If the repo isn't listed, click **"Adjust GitHub App Permissions"**, grant access to the repo, and come back

### 2. Configure the project

On the configuration screen:

| Field | Value |
|---|---|
| **Framework Preset** | `Vite` (auto-detected — confirm it shows this) |
| **Root Directory** | `.` (leave as-is — the root of the repo) |
| **Build Command** | `npm run build` (auto-filled) |
| **Output Directory** | `dist` (auto-filled) |

### 3. Add the environment variable

Expand the **"Environment Variables"** section on that same screen:

| Key | Value |
|---|---|
| `VITE_API_URL` | Your Render URL from Part 1 — e.g. `https://taskflow-api.onrender.com` |

> Do **not** include a trailing slash. Do **not** include `/api` — just the bare domain.

### 4. Deploy

1. Click **"Deploy"**
2. The build takes about 30–60 seconds
3. When it finishes, you'll see a preview URL like `https://taskflow-xyz.vercel.app`
   **Copy this URL — you need it for the final step**

---

## Part 3 — Wire them together (CORS)

The backend needs to know the frontend's URL to allow cross-origin requests.

1. Go back to **render.com** → click your `taskflow-api` service
2. Click **"Environment"** in the left sidebar
3. Find the `FRONTEND_URL` variable → click the **pencil icon** to edit it
4. Set it to your Vercel URL: `https://taskflow-xyz.vercel.app`
   - No trailing slash
   - Use the final production URL, not the preview URL
5. Click **"Save Changes"**
6. Render will automatically redeploy (takes ~1 minute)

Open your Vercel URL — register an account and start using the app.

---

## Local development (no changes needed)

```bash
# Install frontend deps (one time)
npm install

# Install backend deps (one time)
cd server && npm install && cd ..

# Start both servers together
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

`VITE_API_URL` is left unset locally, so Vite proxies `/api/*` requests to `localhost:3001` automatically.  
You do **not** need a `.env` file for local development — everything uses defaults.

---

## Environment variable reference

### Frontend (Vercel)

| Variable | Required in prod | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Full URL of the Render backend, no trailing slash. Example: `https://taskflow-api.onrender.com` |

### Backend (Render)

| Variable | Required in prod | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Random secret for signing auth tokens. Generate with `openssl rand -hex 32`. Changing this logs everyone out. |
| `FRONTEND_URL` | Yes | Your Vercel URL. Controls which origin CORS allows. |
| `NODE_ENV` | Yes | Set to `production`. Enables JWT_SECRET enforcement and other prod guards. |
| `PORT` | No | Render sets this automatically. |
| `DB_PATH` | No | Path to the SQLite file. Set to `/data/taskflow.db` when using a Render persistent disk. Defaults to `server/taskflow.db`. |

---

## Troubleshooting

**"Could not reach the server" on the auth page**  
→ `VITE_API_URL` is wrong or missing. Check it in Vercel → Project → Settings → Environment Variables. Redeploy after changing it.

**CORS errors in the browser console**  
→ `FRONTEND_URL` on Render doesn't match your Vercel URL exactly (check for trailing slash or typo). Update it and let Render redeploy.

**API works but data disappears on each deploy**  
→ You're on Render's free tier without a persistent disk. See Part 1, Step 4.

**Render service takes 30–60 seconds to respond on the first request**  
→ The free tier spins the service down after 15 minutes of inactivity. The first request after idle wakes it up. This is normal on the free plan. Upgrade to Starter to eliminate it.

**`node:sqlite` error on Render**  
→ Your Node version on Render is below 22.5. In the Render dashboard → service → Settings → scroll to "Environment" → set `NODE_VERSION` to `22`. Or confirm the start command includes `--experimental-sqlite`.
