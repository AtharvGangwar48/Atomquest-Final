# SupportVision - Demo Script

## Pre-Demo Setup Checklist

- [ ] Start Docker Desktop
- [ ] Run `docker-compose up -d` (PostgreSQL, Redis, LiveKit)
- [ ] Start backend: `cd backend && npm run start:dev`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Open http://localhost:3000 in Chrome
- [ ] Open http://localhost:3000 in Firefox (for 2nd user)
- [ ] Clear localStorage in both browsers (optional, for clean start)

## Demo Flow (5-7 minutes)

### Part 1: User Registration & Authentication (1 min)

**Browser 1 (Chrome) - Agent:**
1. Go to http://localhost:3000
2. Click "Register"
3. Fill in:
   - Name: "Sarah Agent"
   - Email: "sarah@supportvision.com"
   - Password: "demo123"
   - Role: "Agent"
4. Click "Create Account"
5. ✅ Should redirect to Dashboard

**Browser 2 (Firefox) - Customer:**
1. Go to http://localhost:3000
2. Click "Register"
3. Fill in:
   - Name: "John Customer"
   - Email: "john@customer.com"
   - Password: "demo123"
   - Role: "Customer"
4. Click "Create Account"
5. ✅ Should redirect to Sessions page

### Part 2: Session Creation (1 min)

**Browser 1 (Agent):**
1. On Dashboard, click "Create New Session"
2. Alert appears with join link
3. Copy the entire link (e.g., `http://localhost:3000/session/join?token=...`)
4. ✅ Session appears in "Session History" with status "created"
5. Paste link in notepad/notes for customer

### Part 3: Customer Joins Session (1 min)

**Browser 2 (Customer):**
1. Paste the copied link in address bar
2. Press Enter
3. ✅ Should automatically redirect to video room
4. Allow camera and microphone permissions when prompted

**Browser 1 (Agent):**
1. In Dashboard, session status changes to "active"
2. Click "Join" button on the active session
3. Allow camera and microphone permissions
4. ✅ Both participants now in video call

### Part 4: Video Call Features (2 min)

**Demonstrate in either browser:**

1. **Video/Audio Controls:**
   - Click microphone icon to mute/unmute
   - Click camera icon to turn video on/off
   - ✅ Other participant sees the changes

2. **Chat Feature:**
   - Type "Hi, how can I help you today?" in chat
   - Press Enter or click Send
   - ✅ Message appears on both sides in real-time
   - Send another message from other browser
   - ✅ Bi-directional chat working

3. **Recording (Agent only):**
   - Click "Start Recording" button
   - ✅ Button changes to "Stop Recording" with pulse animation
   - Wait 5 seconds
   - Click "Stop Recording"
   - ✅ Alert: "Recording stopped and processing"

4. **Chat Toggle:**
   - Click "Hide Chat" button
   - ✅ Chat panel hides, video area expands
   - Click "Show Chat"
   - ✅ Chat panel reappears

### Part 5: Session Termination (1 min)

**Browser 1 (Agent):**
1. Click "End Call" button
2. ✅ Redirects to Dashboard
3. ✅ Session status changes to "ended"

**Browser 2 (Customer):**
1. ✅ Automatically disconnected (or manually click "End Call")
2. ✅ Redirects to Sessions page

### Part 6: Admin Dashboard (Optional - 1 min)

**Browser 1:**
1. Go to http://localhost:3000/admin
2. ✅ See dashboard with metrics:
   - Total Sessions count
   - Active Sessions (should be 0 now)
   - Ended Today count
3. ✅ See "Live Sessions" section (empty now)

**To demonstrate live monitoring:**
1. Create another session and have both join
2. Refresh admin dashboard
3. ✅ See active session with participant details
4. Click "Force End" button
5. ✅ Session terminates for both participants

### Part 7: Metrics API (Optional - 30 sec)

1. Open new tab: http://localhost:3001/metrics
2. ✅ See JSON metrics:
   ```json
   {
     "active_sessions": 0,
     "total_sessions": 2,
     "ended_sessions": 2,
     "connected_participants": 0,
     "error_rate": 0
   }
   ```

3. Open: http://localhost:3001/metrics/prometheus
4. ✅ See Prometheus-format metrics

## Demo Talking Points

### While showing registration:
> "SupportVision supports two distinct user roles: Agents who provide support, and Customers who receive it. Each role has its own dashboard and permissions."

### While creating session:
> "Agents can instantly create video support sessions. The system generates a secure, time-limited token that can be shared via any channel - email, SMS, chat, or ticketing system."

### While joining:
> "Customers simply click the link - no app installation required. The system uses WebRTC for real-time video, but unlike peer-to-peer solutions, all media routes through our self-hosted LiveKit SFU server for better quality and security."

### While in video call:
> "During the call, both participants have full control over their audio and video. The integrated chat allows text communication for links, references, or when audio isn't convenient. All chat messages are persisted for future reference."

### While recording:
> "Agents can record sessions for quality assurance and training. The system tracks recording status - in progress, processing, and ready - and makes recordings available for download once processed."

### While showing admin:
> "The admin dashboard provides real-time operational visibility. Admins can monitor all active sessions, view participant details, and force-end any session if needed. The system also exposes metrics in Prometheus format for integration with standard monitoring tools."

## Common Issues & Solutions

### Camera/Mic Not Working
- Check browser permissions
- Ensure no other app is using camera
- Try different browser

### Video Not Connecting
- Verify LiveKit container is running: `docker ps`
- Check browser console for errors
- Ensure ports 7880, 7881, 7882 are not blocked

### Backend Not Responding
- Check backend logs
- Verify PostgreSQL is running: `docker ps | grep postgres`
- Check port 3001 is not in use

### Database Errors
- Reset database: `docker-compose down -v && docker-compose up -d`
- Wait 10 seconds for DB to be ready
- Restart backend

## Quick Reset (Between Demos)

```bash
# Stop all
docker-compose down -v
# Restart infrastructure
docker-compose up -d
# Wait 10 seconds
# Restart backend and frontend
```

## Screen Recording Tips

If recording demo video:
1. Use OBS Studio or QuickTime
2. Record at 1920x1080 resolution
3. Enable system audio for voice-over
4. Hide desktop clutter
5. Close unnecessary applications
6. Use Chrome incognito for clean browser
7. Prepare link in notepad beforehand

## Presentation Flow Optimization

**5-minute version:**
- Skip admin dashboard
- Skip metrics API
- Focus on: Register → Create → Join → Video Chat → End

**7-minute version:**
- Include all parts
- Brief admin dashboard
- Show metrics endpoint

**10-minute version:**
- Add file sharing demo (if implemented)
- Show session history
- Demonstrate reconnect (disconnect WiFi briefly)
- Show recording download

## Demo Script Summary

```
1. Register Agent & Customer (1 min)
2. Agent creates session (30 sec)
3. Customer joins via link (30 sec)
4. Video call demonstration (2 min)
   - Video/audio toggle
   - Chat messaging
   - Recording
5. End session (30 sec)
6. Admin dashboard (1 min)
7. Metrics API (30 sec)
```

---

**Total Demo Time**: 5-7 minutes  
**With Q&A**: 10-15 minutes  
**Status**: Production Demo Ready ✅
