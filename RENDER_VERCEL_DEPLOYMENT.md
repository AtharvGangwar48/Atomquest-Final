# 🚀 Render + Vercel Deployment (10 Minutes)

## Why Render + Vercel?
- ✅ Both have generous free tiers
- ✅ No credit card required for free tier
- ✅ Auto SSL certificates
- ✅ Auto deployments from GitHub
- ✅ Good performance and reliability

---

## Step 1: Setup Database - Neon PostgreSQL (2 min)

1. Go to **https://neon.tech**
2. Click "Sign Up" (Free, no credit card)
3. Create new project:
   - Name: `atomberg-db`
   - Region: Choose closest to you
4. After creation, click "Connection String"
5. Copy the **Pooled connection** string
   ```
   postgresql://username:password@host.neon.tech/dbname?sslmode=require
   ```
6. Keep this tab open (you'll need it later)

---

## Step 2: Setup LiveKit - Video Infrastructure (2 min)

1. Go to **https://cloud.livekit.io**
2. Sign up (Free tier available)
3. Create new project:
   - Name: `atomberg-video`
4. Go to "Settings" → "Keys"
5. Copy and save these 3 values:
   ```
   API Key: APIxxxxxxxxxxxxxx
   API Secret: xxxxxxxxxxxxxxxxxxxxxxx
   WebSocket URL: wss://atomberg-xxxxx.livekit.cloud
   ```

---

## Step 3: Deploy Backend on Render (4 min)

### Option A: One-Click Deploy (Easiest)

1. Go to **https://render.com**
2. Sign up with GitHub (Free)
3. Click "New +" → "Blueprint"
4. Connect your GitHub repository
5. Render will auto-detect `render.yaml`
6. Click "Apply"
7. Add these environment variables:
   - `DATABASE_URL`: Paste from Neon (Step 1)
   - `LIVEKIT_API_KEY`: From LiveKit (Step 2)
   - `LIVEKIT_API_SECRET`: From LiveKit (Step 2)
   - `LIVEKIT_WS_URL`: From LiveKit (Step 2)
8. Click "Deploy"

### Option B: Manual Setup

1. Go to **https://render.com**
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your repository
5. Configure:
   ```
   Name: atomberg-backend
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm run start:prod
   Plan: Free
   ```

6. **Add Environment Variables** (Click "Advanced" → "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<paste-neon-connection-string>
   JWT_SECRET=<any-random-32-char-string>
   LIVEKIT_API_KEY=<from-livekit>
   LIVEKIT_API_SECRET=<from-livekit>
   LIVEKIT_WS_URL=<from-livekit>
   REDIS_HOST=redis.render.com
   REDIS_PORT=6379
   MINIO_ENDPOINT=localhost
   MINIO_PORT=9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_BUCKET=atomberg
   ```

7. **Add Redis** (Free):
   - Click "New +" → "Redis"
   - Name: `atomberg-redis`
   - Plan: Free
   - Create
   - Copy "Internal Redis URL"
   - Update backend env: `REDIS_HOST` and `REDIS_PORT` from URL

8. Click "Create Web Service"
9. Wait 5-10 minutes for build
10. Copy your backend URL: `https://atomberg-backend-xxxx.onrender.com`

---

## Step 4: Deploy Frontend on Vercel (2 min)

1. Go to **https://vercel.com**
2. Sign up with GitHub (Free)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure:
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build (auto-detected)
   Output Directory: .next (auto-detected)
   Install Command: npm install (auto-detected)
   ```

6. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://atomberg-backend-xxxx.onrender.com
   NEXT_PUBLIC_WS_URL=https://atomberg-backend-xxxx.onrender.com
   NEXT_PUBLIC_LIVEKIT_URL=wss://atomberg-xxxxx.livekit.cloud
   ```
   *(Replace with your actual Render backend URL and LiveKit URL)*

7. Click "Deploy"
8. Wait 2-3 minutes
9. Your app is live! Copy the URL: `https://atomberg-xxxx.vercel.app`

---

## Step 5: Create Admin User (2 min)

### Method 1: Using API

```bash
# Replace with your Render backend URL
curl -X POST https://atomberg-backend-xxxx.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin-vcp@atomquest.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "agent"
  }'
```

### Method 2: Direct Database Update

1. Go to Neon dashboard
2. Click "SQL Editor"
3. Run this query:
   ```sql
   -- First, create admin user (if not exists)
   INSERT INTO users (id, email, password, name, role, "isVerified", "isActive", "createdAt")
   VALUES (
     gen_random_uuid(),
     'admin-vcp@atomquest.com',
     '$2b$10$YourHashedPasswordHere',
     'Admin User',
     'admin',
     true,
     true,
     NOW()
   )
   ON CONFLICT (email) DO NOTHING;

   -- Or update existing user
   UPDATE users 
   SET role = 'admin', "isVerified" = true, "isActive" = true 
   WHERE email = 'admin-vcp@atomquest.com';
   ```

---

## 🎉 Your App is Live!

### URLs:
- **Frontend**: https://atomberg-xxxx.vercel.app
- **Backend**: https://atomberg-backend-xxxx.onrender.com
- **Admin Panel**: https://atomberg-xxxx.vercel.app/admin
- **Login**: https://atomberg-xxxx.vercel.app/login

### Default Credentials:
```
Admin:
  Email: admin-vcp@atomquest.com
  Password: admin123

Demo Agent:
  Email: agent@demo.com
  Password: password123

Demo Customer:
  Email: customer@demo.com
  Password: password123
```

---

## Common Issues & Fixes

### ❌ Backend shows "Application failed to respond"
- **Fix**: Wait 10-15 minutes for first deploy (Render free tier is slower)
- Check Render logs for errors
- Ensure DATABASE_URL is correct

### ❌ Frontend can't connect to backend
- **Fix**: Update `NEXT_PUBLIC_API_URL` in Vercel
- Go to Vercel → Project → Settings → Environment Variables
- Update and redeploy

### ❌ Video calls not working
- **Fix**: Verify LiveKit credentials
- Check all 3 LiveKit env vars are correct
- Test LiveKit WebSocket URL in browser

### ❌ Database connection error
- **Fix**: Check Neon connection string
- Ensure `?sslmode=require` is at end of DATABASE_URL
- Verify Neon project is not paused

### ❌ Redis connection issues
- **Fix**: Use internal Redis URL from Render
- Format: `redis://red-xxxx:6379`

---

## Auto Deployments

Both platforms support auto-deployments:

**Render:**
- Pushes to `main` branch auto-deploy
- Configure in Dashboard → Settings

**Vercel:**
- Pushes to any branch auto-deploy previews
- `main` branch deploys to production

---

## Monitoring & Logs

### Render:
- Dashboard → Your Service → Logs
- Real-time logs available
- Free tier gets 90 days of logs

### Vercel:
- Dashboard → Your Project → Deployments
- Click any deployment to see logs
- Free tier gets 100GB bandwidth/month

---

## Scaling (When You Need It)

### Free Tier Limits:
- **Render**: 750 hours/month, sleeps after 15 min inactivity
- **Vercel**: 100GB bandwidth, unlimited sites
- **Neon**: 500MB storage, 10GB bandwidth
- **LiveKit**: 50 participants/month

### Paid Upgrades (Optional):
- Render: $7/month (always-on, no sleep)
- Vercel: $20/month (more bandwidth)
- Neon: $19/month (3GB storage)

---

## Production Checklist

Before going live with real users:

- [ ] Update JWT_SECRET to strong random value
- [ ] Change all default passwords
- [ ] Setup custom domain on Vercel
- [ ] Enable Vercel analytics
- [ ] Setup error monitoring (Sentry free tier)
- [ ] Configure database backups in Neon
- [ ] Test all features:
  - [ ] User registration/login
  - [ ] Video calls
  - [ ] Screen sharing
  - [ ] Chat
  - [ ] Admin panel
- [ ] Add privacy policy & terms
- [ ] Setup email service (SendGrid free tier)

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **LiveKit Docs**: https://docs.livekit.io

---

## Cost Summary

**Monthly Costs (Free Tier):**
- Render: $0 (with 750 hours)
- Vercel: $0 (100GB bandwidth)
- Neon: $0 (500MB DB)
- LiveKit: $0 (50 participants)
- Redis on Render: $0

**Total: $0/month** 🎉

Perfect for demos, MVPs, and small projects!
