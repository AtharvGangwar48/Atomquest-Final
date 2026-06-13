# SupportVision - Setup & Testing Guide

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## 🚀 Quick Start (5 minutes)

### Step 1: Start Infrastructure (Docker)

```bash
cd /Users/atharv/Desktop/Athomquest
docker-compose up -d
```

Verify all services are running:
```bash
docker ps
```

Expected services:
- `postgres` (port 5432)
- `redis` (port 6379)
- `livekit` (port 7880)

### Step 2: Setup Backend

```bash
cd backend
npm install
npm run start:dev
```

Wait for the message: `[Nest] ... LOG [NestFactory] Nest application successfully started`

Backend runs on: **http://localhost:3001**

### Step 3: Seed Database (New Terminal)

```bash
cd backend
node seed.js
```

Output will show:
```
🌱 Seeding database...

📝 Creating users...
  ✅ Agent: agent@demo.com
  ✅ Customer: customer@demo.com
  ✅ Admin: admin@demo.com

📞 Creating 3 historical sessions...
  [1] Session created: xxx
  [1] Customer joined
  ...

🟢 Creating 1 active session...
  Join URL: http://localhost:3000/session/join?token=xxx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SEED COMPLETE!
```

### Step 4: Setup Frontend (New Terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: **http://localhost:3000**

---

## 📋 Demo Credentials

| Role     | Email              | Password    |
|----------|-------------------|------------|
| Agent    | agent@demo.com    | password123 |
| Customer | customer@demo.com | password123 |
| Admin    | admin@demo.com    | password123 |

---

## 🧪 Testing Scenarios

### Scenario 1: Agent Creates Session & Customer Joins

**Browser 1 (Agent):**
1. Go to http://localhost:3000
2. Login with `agent@demo.com` / `password123`
3. Click "Create New Session"
4. Copy the join link from the session details
5. Click "Join" to enter the video call

**Browser 2 (Customer):**
1. Go to http://localhost:3000
2. Login with `customer@demo.com` / `password123`
3. Paste the join link or go to: `http://localhost:3000/session/join?token=<TOKEN>`
4. Click "Join Call"

**Test:**
- ✅ Both see live video/audio (WebRTC via LiveKit)
- ✅ Can exchange chat messages in real-time
- ✅ See participant list

### Scenario 2: Recording a Session

**During active call:**
1. Agent clicks "Start Recording"
2. Timer shows recording duration
3. Agent clicks "Stop Recording"
4. Recording saved in backend

**Verify:**
- API: `GET http://localhost:3001/recordings/session/<sessionId>`

### Scenario 3: End Session

1. Either participant clicks "End Call"
2. Session status changes to "ended"
3. Chat is archived

**Verify:**
- Session appears in "Session History" (ended sessions)
- No longer joinable via link

### Scenario 4: Admin Dashboard

1. Go to http://localhost:3000/admin
2. Login with `admin@demo.com` / `password123`
3. View all active sessions
4. See live participant count
5. Click "Force End" to terminate a session

**Test:**
- ✅ Real-time updates
- ✅ Session details (duration, participants)
- ✅ Force end works

### Scenario 5: Session History

**As Agent:**
1. Go to Dashboard
2. Click "Session History"
3. See all sessions created (sorted by recent)
4. Details: duration, customer name, status

**As Customer:**
1. Go to Dashboard
2. Click "Session History"
3. See all sessions joined

---

## 🔗 API Testing

### 1. Register User

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@demo.com",
    "password": "password123",
    "name": "Test User",
    "role": "customer"
  }'
```

Response:
```json
{
  "id": "uuid",
  "email": "test@demo.com",
  "accessToken": "eyJ..."
}
```

### 2. Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@demo.com",
    "password": "password123"
  }'
```

### 3. Create Session (Agent only)

```bash
AGENT_TOKEN="<accessToken from login>"

curl -X POST http://localhost:3001/sessions \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:
```json
{
  "sessionId": "uuid",
  "joinToken": "eyJ...",
  "joinUrl": "/session/join?token=eyJ..."
}
```

### 4. Join Session

```bash
CUSTOMER_TOKEN="<accessToken>"
JOIN_TOKEN="<joinToken from create>"

curl -X POST http://localhost:3001/sessions/join \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'$JOIN_TOKEN'"
  }'
```

Response:
```json
{
  "roomToken": "eyJ...",
  "roomName": "room-xxx",
  "wsUrl": "ws://localhost:7880",
  "sessionId": "uuid"
}
```

### 5. Get Session History

```bash
curl -X GET http://localhost:3001/sessions/history \
  -H "Authorization: Bearer $AGENT_TOKEN"
```

### 6. Start Recording

```bash
curl -X POST http://localhost:3001/recordings/start \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "uuid"
  }'
```

### 7. Stop Recording

```bash
RECORDING_ID="<id from start>"

curl -X POST http://localhost:3001/recordings/$RECORDING_ID/stop \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 8. Get Metrics

```bash
curl -X GET http://localhost:3001/metrics
```

Response:
```json
{
  "active_sessions": 1,
  "total_sessions": 5,
  "connected_participants": 2,
  "error_rate": 0
}
```

### 9. Prometheus Metrics

```bash
curl -X GET http://localhost:3001/metrics/prometheus
```

---

## 🛠️ Troubleshooting

### Backend won't start: "JwtService not available"

**Fix:** Already applied! Backend module updated to import JwtModule in SessionModule.

```bash
cd backend && npm run start:dev
```

### Database connection error

```bash
# Reset Docker volumes
docker-compose down -v
docker-compose up -d

# Wait 10 seconds for DB to initialize
sleep 10

# Restart backend
npm run start:dev
```

### LiveKit not working

```bash
# Check if running
docker logs livekit | tail -20

# Restart
docker-compose restart livekit
```

### Frontend can't connect to backend

1. Check backend is running: `curl http://localhost:3001/health`
2. Check .env.local exists in frontend folder
3. Clear browser cache: `Cmd+Shift+Delete`
4. Restart frontend: `npm run dev`

### WebRTC video not working

1. Check browser console (F12)
2. Ensure both users are in the same session
3. Try HTTPS in production (WebRTC requires secure context)
4. Check firewall isn't blocking UDP

---

## 📊 Live Testing Flow

1. **Terminal 1:** `cd backend && npm run start:dev`
2. **Terminal 2:** `cd backend && node seed.js` (wait for completion)
3. **Terminal 3:** `cd frontend && npm run dev`
4. **Browser 1 (Agent):** http://localhost:3000 → Login
5. **Browser 2 (Customer):** http://localhost:3000 → Join with token
6. **Test:** Video, chat, recording, end call

---

## ✅ Verification Checklist

- [ ] Backend starts without errors
- [ ] Seed script completes with 3 historical + 1 active session
- [ ] Frontend loads at http://localhost:3000
- [ ] Can login with demo credentials
- [ ] Agent can create session
- [ ] Customer can join via token
- [ ] Video/audio works (check browser permissions)
- [ ] Chat messages transmit in real-time
- [ ] Can start/stop recording
- [ ] Can end session
- [ ] Admin dashboard shows active sessions
- [ ] Session history shows past sessions
- [ ] API metrics endpoint returns data

---

## 🚀 Next Steps

- Deploy to production (AWS ECS, K8s)
- Enable HTTPS/WSS
- Add TURN server for NAT traversal
- Implement proper file storage (S3)
- Add monitoring/alerting (Prometheus + Grafana)
- Enhance error handling & logging
