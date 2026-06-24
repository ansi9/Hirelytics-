# Deploying Hirelytics to Vercel + Railway

This app has two parts:
- **Frontend** (React/Vite) → deploys to **Vercel**
- **API + Database** (Express + PostgreSQL) → deploys to **Railway**

---

## Step 1 — Deploy the API to Railway (free)

Railway hosts the Express server and gives you a free PostgreSQL database.

1. Go to [railway.app](https://railway.app) and sign up (free)
2. Click **New Project → Deploy from GitHub repo**
3. Select **ansi9/Hirelytics-** (authorize Railway to access it if prompted)
4. Railway will detect the monorepo. Set these in **Settings → Variables**:
   ```
   DATABASE_URL   ← Railway auto-provides this when you add a Postgres plugin
   NODE_ENV       production
   PORT           8080
   ```
5. Add a **PostgreSQL** plugin inside the Railway project (click + → Database → PostgreSQL)
   - Railway automatically sets `DATABASE_URL` for you
6. Set the **Start Command** in Railway settings:
   ```
   pnpm --filter @workspace/api-server run start
   ```
7. Set the **Build Command**:
   ```
   pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build
   ```
8. After deploy, copy your Railway public URL — it looks like:
   ```
   https://hirelytics-production.up.railway.app
   ```
9. Push the database schema (run once):
   - In Railway, open a shell and run: `pnpm --filter @workspace/db run push`

---

## Step 2 — Deploy the Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up / log in
2. Click **Add New → Project → Import Git Repository**
3. Select **ansi9/Hirelytics-**
4. Vercel will detect the `vercel.json` at the root automatically
   - **Framework Preset**: Other
   - Leave all build settings as-is (vercel.json handles them)
5. Under **Environment Variables**, add:
   ```
   RAILWAY_API_URL   https://your-app.up.railway.app
   ```
   (paste the Railway URL from Step 1)
6. Click **Deploy** — Vercel builds the frontend and proxies all `/api/*` calls to Railway

---

## How it works

```
Browser
  └─ GET /api/candidates     (Vercel domain)
       └─ Vercel proxy        (api/api-proxy.ts serverless function)
            └─ Railway API    https://your-app.up.railway.app/api/candidates
                 └─ PostgreSQL (Railway managed DB)
```

All API calls from the frontend use relative `/api/*` URLs so nothing in the code needs to change.

---

## Re-deploying after code changes

Both Vercel and Railway watch your GitHub repo and auto-deploy on every push to `main`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Vercel build fails with "PORT not set" | The vite config now defaults PORT to 3000 — should not happen |
| `/api/*` returns 503 | Check `RAILWAY_API_URL` is set correctly in Vercel environment variables |
| Database errors on Railway | Make sure you added the PostgreSQL plugin and ran `db push` |
| CORS errors | The Express server allows all origins in dev; for production add `CORS_ORIGIN=https://your-vercel-app.vercel.app` to Railway env vars |
