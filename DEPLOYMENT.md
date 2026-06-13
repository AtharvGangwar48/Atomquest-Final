# 🚀 Simple Deployment Guide (5 Minutes)

## Option 1: Railway.app (Recommended - Easiest)

### Step 1: Setup Database (2 min)
1. Go to **https://neon.tech**
2. Sign up (Free)
3. Create new project: "atomberg-db"
4. Copy connection string (looks like: `postgresql://user:pass@host/db?sslmode=require`)

### Step 2: Setup LiveKit (2 min)
1. Go to **https://cloud.livekit.io**
2. Sign up (Free tier)
3. Create new project
4. Copy these values:
   - API Key
   - API Secret  
   - WebSocket URL (wss://...)

### Step 3: Deploy Backend (3 min)
1. Go to **https://railway.app**
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select this repository
5. Click "Add Variables" and add:
   ```
   DATABASE_URL=<neon-connection-string>
   JWT_SECRET=your-super-secret-key-min-32-chars
   LIVEKIT_API_KEY=<from-step-2>
   LIVEKIT_API_SECRET=<from-step-2>
   LIVEKIT_WS_URL=<from-step-2>
   REDIS_HOST=redis.railway.internal
   REDIS_PORT=6379
   MINIO_ENDPOINT=minio
   MINIO_PORT=9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_BUCKET=atomberg
   PORT=3001
   ```
6. Add Redis service:
   - Click "New" → "Database" → "Redis"
7. Click "Deploy"
8. Copy your backend URL (looks like: `https://xyz.railway.app`)

### Step 4: Deploy Frontend (2 min)
1. Go to **https://vercel.com**
2. Sign up with GitHub
3. Click "Add New" → "Project"
4. Import this repository
5. Set Root Directory: `frontend`
6. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=<backend-url-from-step-3>
   NEXT_PUBLIC_WS_URL=<backend-url-from-step-3>
   NEXT_PUBLIC_LIVEKIT_URL=<livekit-ws-url>
   ```
7. Click "Deploy"
8. Your app is live! 🎉

### Step 5: Create Admin User
1. Open Railway backend logs
2. Find backend service URL
3. Run this command in terminal:
   ```bash
   curl -X POST https://your-backend-url.railway.app/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin-vcp@atomquest.com",
       "password": "admin123",
       "name": "Admin User",
       "role": "agent"
     }'
   ```
4. Connect to Neon database and run:
   ```sql
   UPDATE users SET role = 'admin', "isVerified" = true WHERE email = 'admin-vcp@atomquest.com';
   ```

---

## Option 2: Render.com (Alternative)

### Backend:
1. Go to **https://render.com**
2. New → Web Service → Connect GitHub repo
3. Select `backend` folder
4. Build: `npm install && npm run build`
5. Start: `npm run start:prod`
6. Add same environment variables as Railway
7. Deploy

### Frontend:
1. New → Static Site → Connect repo
2. Select `frontend` folder
3. Build: `npm run build`
4. Publish: `.next`
5. Add environment variables
6. Deploy

---

## Quick Test URLs

After deployment, test these:

- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-backend.railway.app/health
- **Login**: https://your-app.vercel.app/login
- **Admin**: https://your-app.vercel.app/admin

---

## Default Credentials

**Admin:**
- Email: admin-vcp@atomquest.com
- Password: admin123

**Demo Agent:**
- Email: agent@demo.com
- Password: password123

**Demo Customer:**
- Email: customer@demo.com
- Password: password123

---

## Troubleshooting

**Backend not connecting to DB:**
- Check DATABASE_URL is correct
- Ensure SSL mode is enabled in connection string

**Frontend can't reach backend:**
- Check NEXT_PUBLIC_API_URL matches backend URL
- Ensure CORS is enabled (already configured)

**LiveKit not working:**
- Verify all 3 LiveKit env vars are correct
- Check WebSocket URL format: wss://...

**Database tables not created:**
- Railway auto-runs migrations
- Or manually: Connect to Railway backend → Run: `npm run typeorm migration:run`

---

## Cost Estimate

- **Neon DB**: Free (500MB)
- **Railway**: Free ($5/month credit, enough for small apps)
- **Vercel**: Free (100GB bandwidth)
- **LiveKit**: Free (50 participants)

**Total: $0/month for testing** ✅

---

## Need Help?

1. Check Railway/Vercel logs for errors
2. Ensure all environment variables are set
3. Test backend health endpoint first
4. Then test frontend

**Deployment time: ~10 minutes total**
