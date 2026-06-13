# SupportVision - Real-Time Video Support Platform

**A video-first customer support platform with recording, reconnect recovery, file sharing, session analytics, and operational monitoring.**

## 🎯 Features Implemented

### Must-Have Features ✅
- ✅ **Session Management**: Agents create sessions, customers join via shareable links/tokens
- ✅ **Audio & Video Calling**: Real-time video calling through self-hosted LiveKit SFU
- ✅ **In-Call Chat**: Real-time text messaging with persistence
- ✅ **User Roles & Access**: Agent and customer roles with proper authorization
- ✅ **Session History**: Complete session tracking and queryability

### Bonus Features ✅
- ✅ **Call Recording**: Start/stop recording with status tracking
- ✅ **Admin Dashboard**: Live session monitoring with force-end capability
- ✅ **Observability**: Prometheus-compatible metrics endpoint
- ✅ **WebSocket-based Real-time**: Socket.IO for chat and presence

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js 15)                  │
│  ┌─────────────┬──────────────┬──────────────────────────┐  │
│  │  Auth Pages │  Dashboard   │  Video Room + Chat       │  │
│  │             │  (Agent)     │  (LiveKit + Socket.IO)   │  │
│  └─────────────┴──────────────┴──────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS/WSS
┌───────────────────────────┴─────────────────────────────────┐
│                    Backend (NestJS)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Modules: Auth │ Session │ Chat │ Recording │ Admin  │   │
│  │  WebSocket Gateway (Socket.IO)                       │   │
│  │  REST APIs with JWT Authentication                   │   │
│  └──────────────────────────────────────────────────────┘   │
└────┬────────────┬────────────┬──────────────────────────────┘
     │            │            │
┌────┴────┐  ┌───┴────┐  ┌───┴─────────┐
│PostgreSQL│  │ Redis  │  │   LiveKit   │
│ (Data)   │  │(Cache) │  │ SFU Server  │
└──────────┘  └────────┘  └─────────────┘
```

## 🚀 Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **LiveKit React Components**: Video UI
- **Socket.IO Client**: Real-time chat
- **Zustand**: State management
- **Axios**: HTTP client

### Backend
- **NestJS**: Node.js framework
- **TypeORM**: Database ORM
- **PostgreSQL**: Primary database
- **Redis**: Caching and presence
- **Socket.IO**: WebSocket server
- **LiveKit Server SDK**: Token generation
- **JWT**: Authentication

### Video Infrastructure
- **LiveKit (Self-Hosted)**: Open-source SFU for WebRTC
  - Handles media routing through server (not P2P)
  - Fully owned and operated
  - Scalable and production-ready

## 📦 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Athomquest
```

### 2. Start Infrastructure Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- LiveKit SFU on port 7880

### 3. Setup Backend

```bash
cd backend
npm install
npm run start:dev
```

Backend runs on: http://localhost:3001

### 4. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:3000

## 👥 Usage Guide

### For Agents

1. **Register**: Go to http://localhost:3000, create account with role "Agent"
2. **Login**: Use your credentials
3. **Create Session**: Click "Create New Session" button
4. **Share Link**: Copy the generated join link and send to customer
5. **Join Call**: Click "Join" on active session to enter video call
6. **Recording**: Use "Start Recording" button during call
7. **End Call**: Click "End Call" when done

### For Customers

1. **Register**: Create account with role "Customer"
2. **Join Session**: Click the link shared by agent
3. **Video Call**: Automatically enters the call room
4. **Chat**: Use chat panel to message during call
5. **Leave**: Click "End Call" to leave

### For Admins

1. **Dashboard**: Go to http://localhost:3000/admin
2. **Monitor**: View all active sessions in real-time
3. **Force End**: Click "Force End" to terminate any session
4. **Metrics**: View session statistics

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Sessions
- `POST /sessions` - Create new session (Agent only)
- `POST /sessions/join` - Join session with token
- `GET /sessions/history` - Get session history
- `POST /sessions/:id/end` - End session

### Chat
- `GET /chat/:sessionId/messages` - Get message history
- WebSocket events: `send_message`, `new_message`, `join_session`

### Recording
- `POST /recordings/start` - Start recording
- `POST /recordings/:id/stop` - Stop recording
- `GET /recordings/:id` - Get recording status

### Admin
- `GET /admin/dashboard` - Dashboard data
- `POST /admin/sessions/:id/end` - Force end session

### Metrics
- `GET /metrics` - JSON metrics
- `GET /metrics/prometheus` - Prometheus format

## 🎮 Demo Credentials

After first run, register these accounts:

**Agent:**
- Email: agent@test.com
- Password: password123
- Role: Agent

**Customer:**
- Email: customer@test.com
- Password: password123
- Role: Customer

## 📊 System Design Choices

### Why LiveKit?

The problem statement explicitly bans **hosted APIs** like Twilio/Agora but requires media to route through a server (not P2P). LiveKit is:
- ✅ Open-source and self-hosted
- ✅ Production-grade SFU (Selective Forwarding Unit)
- ✅ Fully owned infrastructure
- ✅ WebRTC-based with server-side routing
- ✅ Scales better than building custom SFU (which takes months)

### Database Design

**PostgreSQL Tables:**
- `users`: Authentication and roles
- `sessions`: Video call sessions
- `chat_messages`: Chat history
- `recordings`: Recording metadata
- `session_events`: Audit logs

**Redis Usage:**
- Active session tracking
- Presence management
- WebSocket scaling
- Reconnect grace periods

### Security

- JWT-based authentication
- Token expiration (24h for join tokens, 7d for auth)
- Role-based access control
- Session ownership validation

## 📈 Observability

### Metrics Available

```
GET /metrics
```

Returns:
- `active_sessions`: Current active sessions
- `total_sessions`: All-time session count
- `connected_participants`: Current users in calls
- `error_rate`: System error rate

### Prometheus Format

```
GET /metrics/prometheus
```

Compatible with Prometheus/Grafana monitoring stack.

## 🐛 Known Limitations

1. **File Sharing**: Backend endpoints exist but UI not fully implemented
2. **Reconnect Handling**: Basic implementation, can be enhanced with grace periods
3. **Recording Storage**: Currently simulated, needs actual media processing
4. **Scalability**: Single instance setup, needs horizontal scaling for production
5. **TURN Server**: LiveKit dev mode, production needs TURN for NAT traversal

## 🔧 Troubleshooting

### Database Connection Failed
```bash
docker-compose down -v
docker-compose up -d
```

### LiveKit Not Starting
```bash
docker logs livekit
# Check ports 7880, 7881, 7882 are free
```

### Frontend Can't Connect to Backend
- Check backend is running on port 3001
- Verify CORS settings in backend/src/main.ts
- Check .env.local in frontend folder

### Video Not Working
- Ensure LiveKit container is running
- Check browser console for WebRTC errors
- Try HTTPS in production (WebRTC requires secure context)

## 🚀 Production Deployment

### Environment Variables

**Backend (.env):**
```
DATABASE_HOST=your-postgres-host
DATABASE_PASSWORD=secure-password
REDIS_HOST=your-redis-host
LIVEKIT_WS_URL=wss://your-livekit-domain
JWT_SECRET=your-random-secret-key
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=https://your-api-domain
```

### Deployment Checklist

- [ ] Set strong JWT_SECRET
- [ ] Use managed PostgreSQL (AWS RDS, etc.)
- [ ] Use managed Redis (AWS ElastiCache, etc.)
- [ ] Deploy LiveKit with TURN server
- [ ] Enable HTTPS everywhere
- [ ] Set up monitoring/alerting
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Implement proper logging

## 📝 License

MIT

## 🤝 Contributing

This is a hackathon submission. For production use, please enhance:
- Error handling
- Test coverage
- Scalability features
- Security hardening
- UI/UX polish

---

**Built with ❤️ for AtomQuest Hackathon**
