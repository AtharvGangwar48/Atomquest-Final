# SupportVision - System Architecture

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                              │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │  Login/Register │  │  Agent Dashboard│  │  Video Call Room    │ │
│  │                 │  │                 │  │  - LiveKit Video    │ │
│  │  - JWT Auth     │  │  - Create Sessions│ │  - Socket.IO Chat │ │
│  │  - Role Select  │  │  - Session List │  │  - Recording       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
└────────────────────┬────────────────┬──────────────┬────────────────┘
                     │                │              │
                  HTTPS            WSS (Socket.IO)  WebRTC
                     │                │              │
┌────────────────────┴────────────────┴──────────────┴────────────────┐
│                         NestJS Backend (Port 3001)                   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      REST API Layer                           │  │
│  │  ┌────────────┬────────────┬────────────┬──────────────────┐ │  │
│  │  │Auth Module │Session Mod.│Chat Module │Recording Module  │ │  │
│  │  │- Register  │- Create    │- Get History│- Start/Stop     │ │  │
│  │  │- Login     │- Join      │            │- Get Status     │ │  │
│  │  │- JWT       │- End       │            │                 │ │  │
│  │  └────────────┴────────────┴────────────┴──────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  WebSocket Gateway (Socket.IO)                │  │
│  │  - Real-time chat messaging                                  │  │
│  │  - Presence tracking                                         │  │
│  │  - Media state sync (mute/unmute)                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  LiveKit Service Integration                  │  │
│  │  - Generate access tokens for video sessions                 │  │
│  │  - Room management via LiveKit SDK                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────┬─────────────┬─────────────┬──────────────────────────────────┘
       │             │             │
       │             │             │
┌──────┴──────┐ ┌───┴──────┐ ┌───┴────────────┐
│ PostgreSQL  │ │  Redis   │ │ LiveKit SFU    │
│   (5432)    │ │  (6379)  │ │   (7880)       │
│             │ │          │ │                │
│ - users     │ │ - Active │ │ - Media Routing│
│ - sessions  │ │   session│ │ - WebRTC SFU   │
│ - messages  │ │ - Presence│ │ - TURN/STUN   │
│ - recordings│ │ - Cache  │ │                │
└─────────────┘ └──────────┘ └────────────────┘
```

## Data Flow Diagrams

### 1. Session Creation Flow (Agent)

```
Agent Browser          Backend API           PostgreSQL        LiveKit
     │                      │                     │              │
     │  POST /sessions      │                     │              │
     │─────────────────────>│                     │              │
     │                      │  INSERT session     │              │
     │                      │────────────────────>│              │
     │                      │  session record     │              │
     │                      │<────────────────────│              │
     │                      │  Generate JWT token │              │
     │                      │  (contains sessionId)│             │
     │  { sessionId, url }  │                     │              │
     │<─────────────────────│                     │              │
     │                      │                     │              │
```

### 2. Customer Join Flow

```
Customer Browser      Backend API        PostgreSQL      LiveKit SFU
     │                     │                  │              │
     │  POST /join         │                  │              │
     │  { token }          │                  │              │
     │────────────────────>│                  │              │
     │                     │  Verify JWT      │              │
     │                     │  Update session  │              │
     │                     │─────────────────>│              │
     │                     │  Generate        │              │
     │                     │  LiveKit token   │              │
     │                     │─────────────────────────────────>│
     │  { roomToken,       │                  │              │
     │    wsUrl,           │                  │              │
     │    roomName }       │                  │              │
     │<────────────────────│                  │              │
     │                     │                  │              │
     │  Connect WebRTC     │                  │              │
     │────────────────────────────────────────────────────────>│
     │  <media streams>    │                  │              │
     │<────────────────────────────────────────────────────────│
```

### 3. Real-Time Chat Flow

```
User A Browser    Socket.IO Gateway    PostgreSQL    User B Browser
     │                    │                 │               │
     │  send_message      │                 │               │
     │───────────────────>│                 │               │
     │                    │  INSERT message │               │
     │                    │────────────────>│               │
     │                    │  message saved  │               │
     │                    │<────────────────│               │
     │                    │  new_message    │               │
     │                    │─────────────────────────────────>│
     │  new_message       │                 │               │
     │<───────────────────│                 │               │
```

### 4. Recording Flow

```
Agent Browser      Recording API      PostgreSQL      File Storage
     │                   │                 │               │
     │  POST /start      │                 │               │
     │──────────────────>│                 │               │
     │                   │  INSERT recording│              │
     │                   │  status: in_progress            │
     │                   │────────────────>│               │
     │  { recordingId }  │                 │               │
     │<──────────────────│                 │               │
     │                   │                 │               │
     │  POST /stop       │                 │               │
     │──────────────────>│                 │               │
     │                   │  UPDATE status  │               │
     │                   │  = processing   │               │
     │                   │────────────────>│               │
     │                   │                 │               │
     │                   │  [Background]   │               │
     │                   │  Process video  │               │
     │                   │─────────────────────────────────>│
     │                   │  UPDATE status  │               │
     │                   │  = ready        │               │
     │                   │────────────────>│               │
```

## Database Schema

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('agent', 'customer') NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions Table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES users(id),
    customer_id UUID REFERENCES users(id),
    room_name VARCHAR(255) NOT NULL,
    join_token TEXT,
    status ENUM('created', 'active', 'ended') DEFAULT 'created',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- Chat Messages Table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    type ENUM('text', 'file') DEFAULT 'text',
    file_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Recordings Table
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    status ENUM('in_progress', 'processing', 'ready', 'failed'),
    file_url TEXT,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Session Events Table
CREATE TABLE session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    event_type VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Architecture

### Authentication Flow

```
1. User Registration/Login
   ↓
2. Backend validates credentials
   ↓
3. Generate JWT token (7 days expiry)
   ↓
4. Token includes: { userId, email, role }
   ↓
5. Client stores in localStorage
   ↓
6. All API requests include: Authorization: Bearer <token>
   ↓
7. Backend validates JWT on each request
```

### Authorization Layers

```
┌─────────────────────────────────────┐
│  Route Protection (Guards)          │
│  - JWT validation                   │
│  - User authentication              │
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│  Business Logic (Services)          │
│  - Role validation                  │
│  - Resource ownership check         │
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│  Database Layer                     │
│  - SQL injection prevention         │
│  - Parameterized queries            │
└─────────────────────────────────────┘
```

## WebRTC Media Flow

```
Agent Browser                    LiveKit SFU                Customer Browser
     │                                │                            │
     │  1. Connect with token         │                            │
     │───────────────────────────────>│                            │
     │                                │  2. Connect with token     │
     │                                │<───────────────────────────│
     │  3. Publish A/V tracks         │                            │
     │───────────────────────────────>│                            │
     │                                │  4. Publish A/V tracks     │
     │                                │<───────────────────────────│
     │                                │                            │
     │  5. Subscribe to remote tracks │                            │
     │<───────────────────────────────│                            │
     │                                │  6. Subscribe to remote    │
     │                                │───────────────────────────>│
     │                                │                            │
     │        Bidirectional Media Streams (encrypted)              │
     │<──────────────────────────────────────────────────────────>│
```

## Deployment Architecture (Production)

```
                         ┌─────────────┐
                         │   DNS/CDN   │
                         └──────┬──────┘
                                │
                         ┌──────┴──────┐
                         │ Load Balancer│
                         └──────┬──────┘
                                │
                 ┌──────────────┼──────────────┐
                 │              │              │
          ┌──────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
          │ Next.js #1 │ │ Next.js #2│ │ Next.js #3│
          └────────────┘ └───────────┘ └───────────┘
                                │
                         ┌──────┴──────┐
                         │ API Gateway │
                         └──────┬──────┘
                                │
                 ┌──────────────┼──────────────┐
                 │              │              │
          ┌──────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
          │ NestJS #1  │ │ NestJS #2 │ │ NestJS #3 │
          └──────┬─────┘ └─────┬─────┘ └─────┬─────┘
                 │              │              │
                 └──────────────┼──────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
  ┌──────┴─────┐      ┌─────────┴─────────┐   ┌──────┴──────┐
  │ PostgreSQL │      │  Redis Cluster    │   │   LiveKit   │
  │  (Primary +│      │  (Master/Replica) │   │   Cluster   │
  │   Replica) │      └───────────────────┘   └─────────────┘
  └────────────┘
```

## Technology Decisions

### Why NestJS?
- Enterprise-grade Node.js framework
- Built-in dependency injection
- TypeORM integration
- WebSocket support (Socket.IO)
- Easy module organization

### Why Next.js 15?
- Server-side rendering (SSR) for SEO
- App Router for better routing
- API routes for backend integration
- Optimized production builds
- React 18 with latest features

### Why LiveKit?
- ✅ Self-hosted (meets requirement)
- ✅ Production-ready SFU
- ✅ Open-source (no vendor lock-in)
- ✅ Better than building custom SFU
- ✅ WebRTC media routing through server

### Why PostgreSQL?
- ACID compliance for critical data
- Rich query capabilities
- JSONB support for flexible data
- Excellent performance at scale
- Strong ecosystem

### Why Redis?
- Fast in-memory operations
- Pub/Sub for real-time features
- Session caching
- Presence tracking
- WebSocket scaling

## Scalability Considerations

### Horizontal Scaling
- Multiple NestJS instances behind load balancer
- Redis for session sharing across instances
- PostgreSQL read replicas for queries
- LiveKit cluster for media distribution

### Performance Optimizations
- Database indexing on foreign keys
- Redis caching for frequent queries
- CDN for static assets
- WebSocket connection pooling
- Lazy loading in frontend

### Monitoring Points
- Active session count
- Database connection pool
- API response times
- WebSocket connections
- LiveKit media quality metrics

---

**Architecture Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production Ready (with recommended enhancements)
