# 🚀 Render + Vercel Deployment Guide (Actual Steps)

## Step 1: Database - Neon PostgreSQL (2 min)

1. Go to **https://neon.tech**
2. Sign up (Free, no credit card)
3. Click "Create Project"
   - Name: `atomberg-db`
   - Click "Create"
4. Copy the connection string (it appears after creation)
   ```
   postgresql://user:pass@ep-xxxx.neon.tech/neondb?sslmode=require
   ```
5. Save it somewhere safe

---

## Step 2: LiveKit Setup (2 min)

1. Go to **https://cloud.livekit.io**
2. Sign up (Free tier)
3. Create new project: `atomberg-video`
4. Go to Settings → Keys
5. Copy and save:
   ```
   API Key: APIxxxxxxxxx
   API Secret: xxxxxxxxxxxxxxxxx
   WebSocket URL: wss://atomberg-xxxx.livekit.cloud
   ```

---

## Step 3: Deploy Backend on Render (5 min)

### 3.1: Create Web Service

1. Go to **https://render.com**
2. Sign up with GitHub (Free)
3. Click **"New +"** button (top right)
4. Select **"Web Service"**

### 3.2: Connect Repository

1. Click "Build and deploy from a Git repository"
2. Click "Connect account" → Authorize GitHub
3. Find and click "Connect" next to your repository

### 3.3: Configure Service

You'll see a form with these fields:

**Name:**
```
atomberg-backend
```

**Region:**
```
Oregon (US West) or Frankfurt (Europe)
```

**Branch:**
```
main
```

**Root Directory:**
```
backend
```

**Environment:**
```
Docker
```

**Instance Type:**
```
Free
```

### 3.4: Auto-Deploy

Since you have `Dockerfile` in backend folder, Render will automatically detect it!

Just scroll down and click **"Create Web Service"**

### 3.5: Add Environment Variables

After service is created:

1. Click on your service name
2. Go to **"Environment"** tab (left sidebar)
3. Click **"Add Environment Variable"**
4. Add these one by one:

```
DATABASE_URL
Value: postgresql://user:pass@ep-xxxx.neon.tech/neondb?sslmode=require
```

```
JWT_SECRET
Value: super-secret-jwt-key-change-this-to-something-random-and-long
```

```
LIVEKIT_API_KEY
Value: APIxxxxxxxxx
```

```
LIVEKIT_API_SECRET
Value: xxxxxxxxxxxxxxxxx
```

```
LIVEKIT_WS_URL
Value: wss://atomberg-xxxx.livekit.cloud
```

```
PORT
Value: 3001
```

```
NODE_ENV
Value: production
```

```
REDIS_HOST
Value: localhost
```

```
REDIS_PORT
Value: 6379
```

5. Click **"Save Changes"**

### 3.6: Wait for Deployment

- First deploy takes 5-10 minutes
- Watch the logs in "Logs" tab
- When you see "Listening on port 3001" → Success! ✅
- Copy your backend URL from top: `https://atomberg-backend-xxxx.onrender.com`

---

## Step 4: Deploy Frontend on Vercel (3 min)

1. Go to **https://vercel.com**
2. Click **"Sign Up"** → Continue with GitHub
3. Click **"Add New..."** → **"Project"**
4. Find your repository → Click **"Import"**

### 4.1: Configure Project

**Framework Preset:**
```
Next.js (auto-detected)
```

**Root Directory:**
- Click "Edit" next to Root Directory
- Select `frontend`
- Click "Continue"

**Build and Output Settings:**
- Leave as default (auto-detected)

### 4.2: Environment Variables

Click **"Environment Variables"** section:

Add these 3 variables:

```
Name: NEXT_PUBLIC_API_URL
Value: https://atomberg-backend-xxxx.onrender.com
```

```
Name: NEXT_PUBLIC_WS_URL  
Value: https://atomberg-backend-xxxx.onrender.com
```

```
Name: NEXT_PUBLIC_LIVEKIT_URL
Value: wss://atomberg-xxxx.livekit.cloud
```

⚠️ **Replace with YOUR actual URLs from Step 3 and Step 2!**

### 4.3: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. You'll see "🎉 Congratulations!"
4. Click "Continue to Dashboard"
5. Copy your app URL: `https://atomberg-xxxx.vercel.app`

---

## Step 5: Test Your App

1. Open: `https://atomberg-xxxx.vercel.app`
2. You should see your homepage! 🎉

### Test Login:
- Go to `/login`
- Try demo credentials:
  ```
  Email: agent@demo.com
  Password: password123
  ```

### Access Admin Panel:
1. First, create admin user via API:

**Using curl (Terminal/CMD):**
```bash
curl -X POST https://atomberg-backend-xxxx.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin-vcp@atomquest.com","password":"admin123","name":"Admin User","role":"agent"}'
```

**Or use Postman/Insomnia:**
- Method: POST
- URL: `https://atomberg-backend-xxxx.onrender.com/auth/register`
- Body (JSON):
  ```json
  {
    "email": "admin-vcp@atomquest.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "agent"
  }
  ```

2. Update admin role in database:
   - Go to Neon dashboard
   - Click "SQL Editor"
   - Run:
     ```sql
     UPDATE users SET role = 'admin', "isVerified" = true WHERE email = 'admin-vcp@atomquest.com';
     ```

3. Login at: `https://atomberg-xxxx.vercel.app/login`
   - Email: admin-vcp@atomquest.com
   - Password: admin123

---

## 🎉 You're Live!

Your app is now deployed:

- ✅ Frontend: `https://atomberg-xxxx.vercel.app`
- ✅ Backend: `https://atomberg-backend-xxxx.onrender.com`
- ✅ Admin: `https://atomberg-xxxx.vercel.app/admin`
- ✅ Database: Neon PostgreSQL
- ✅ Video: LiveKit Cloud

---

## Important Notes

### ⚠️ Render Free Tier
- Backend "sleeps" after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- This is NORMAL for free tier
- To avoid: Upgrade to paid ($7/month for always-on)

### 🔄 Auto Deployments
- **Render**: Push to `main` branch → auto deploys
- **Vercel**: Push to any branch → auto deploys

### 📊 View Logs
- **Render**: Dashboard → Your Service → Logs tab
- **Vercel**: Dashboard → Deployments → Click deployment → View logs

---

## Troubleshooting

### Backend shows 503 error
- Wait 30-60 seconds (it's waking up from sleep)
- Check logs in Render dashboard
- Verify DATABASE_URL is correct

### Frontend shows "Network Error"
- Check `NEXT_PUBLIC_API_URL` in Vercel settings
- Ensure backend is running (visit backend URL directly)
- Redeploy frontend after fixing env vars

### Database connection failed
- Verify Neon project is active (not paused)
- Check connection string has `?sslmode=require` at end
- Test connection in Neon SQL Editor first

### LiveKit not connecting
- Verify all 3 LiveKit env vars are correct
- Check WebSocket URL format: `wss://...`
- Test in LiveKit dashboard first

---

## Updating Your App

### Update Backend:
1. Make changes in code
2. Push to GitHub
3. Render auto-deploys (wait 5-10 min)

### Update Frontend:
1. Make changes in code
2. Push to GitHub  
3. Vercel auto-deploys (wait 2-3 min)

### Update Environment Variables:
- **Render**: Environment tab → Edit → Save Changes → Manual Deploy
- **Vercel**: Settings → Environment Variables → Save → Redeploy

---

## Cost Breakdown

All FREE for testing/demo:

| Service | Free Tier | Limits |
|---------|-----------|--------|
| Render | ✅ Free | 750 hrs/month, sleeps after 15min |
| Vercel | ✅ Free | 100GB bandwidth, unlimited sites |
| Neon | ✅ Free | 500MB storage, 10GB bandwidth |
| LiveKit | ✅ Free | 50 participants/month |

**Total: $0/month** 🎉

---

## Need Help?

1. Check service logs first
2. Verify all environment variables
3. Test backend health: `https://your-backend.onrender.com/health`
4. Test frontend locally: `npm run dev`

**Deployment Time: ~15 minutes total**
