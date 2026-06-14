# Atomberg — System Architecture

> A detailed system design document covering data flow, component responsibilities, capacity, latency, and failure handling.

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Component Breakdown](#2-component-breakdown)
3. [Data Flow Diagrams](#3-data-flow-diagrams)
4. [Database Schema](#4-database-schema)
5. [Real-Time Architecture](#5-real-time-architecture)
6. [Video Architecture — Why Not P2P](#6-video-architecture--why-not-p2p)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Storage Architecture](#8-storage-architecture)
9. [Observability](#9-observability)
10. [Capacity & Scaling](#10-capacity--scaling)
11. [Latency Profile](#11-latency-profile)
12. [Failure Modes & Recovery](#12-failure-modes--recovery)

---

## 1. High-Level Overview

```
                          ┌─────────────────────────────────────┐
                          │           Browser (Client)           │
                          │                                       │
                          │  /home    /login   /dashboard        │
                          │  /sessions  /admin  /session/[id]    │
                          └────────┬──────────────┬──────────────┘
                                   │              │
                               HTTPS REST     WSS (Socket.IO)
                                   │              │
                          ┌────────┴──────────────┴──────────────┐
                          │         NestJS Backend  :3001         │
                          │                                       │
                          │  REST API  │  Socket.IO  │  Metrics  │
                          └────┬───────┴──────┬──────┴───────────┘
                               │              │
             ┌─────────────────┼──────────────┼──────────────────┐
             │                 │              │                   │
      ┌──────┴──────┐  ┌───────┴──────┐  ┌───┴────────┐  ┌──────┴─────┐
      │  PostgreSQL  │  │    Redis     │  │  LiveKit   │  │   MinIO    │
      │   :5432      │  │   :6379      │  │  SFU :7880 │  │   :9000    │
      │              │  │              │  │            │  │            │
      │  Persistent  │  │  Presence    │  │  Video /   │  │  File /    │
      │  data store  │  │  + Sessions  │  │  Audio     │  │  Recording │
      └──────────────┘  └──────────────┘  └────────────┘  └────────────┘
```

Every browser interaction hits **one of two paths**:

- **REST over HTTPS** — for all CRUD operations (create session, fetch history, admin actions)
- **WebSocket over WSS** — for real-time events (chat messages, presence, media state sync)

Video and audio never travel through the NestJS backend. They go directly from each browser to the **LiveKit SFU server**, which forwards streams to all other participants in the room.

---

## 2. Component Breakdown

### Frontend — Next.js (Port 3000)

| Page | Route | Who uses it |
|---|---|---|
| Landing | `/home` | Everyone |
| Auth | `/login` | Everyone |
| Agent Dashboard | `/dashboard` | Agents |
| Customer Portal | `/sessions` | Customers |
| Admin Dashboard | `/admin` | Admin |
| Live Video Room | `/session/[id]` | Agent + Customer |
| Join via link | `/session/join?token=` | Customer |

The frontend uses:
- **Zustand** for auth state (user object + JWT stored in-memory + localStorage)
- **Axios** (`api.ts`) for all REST calls — automatically attaches the JWT `Authorization` header
- **Socket.IO client** in `VideoRoom.tsx` for real-time chat + presence
- **LiveKit React SDK** (`@livekit/components-react`) to render participant video grids and manage WebRTC tracks

---

### Backend — NestJS (Port 3001)

Modular architecture. Each domain is a self-contained NestJS module:

| Module | Responsibility |
|---|---|
| `AuthModule` | Register, login, JWT generation, bcrypt password hashing |
| `SessionModule` | Create sessions, join sessions, end sessions, agent-join, session history |
| `ChatModule` | Socket.IO gateway, real-time message delivery, chat history, file uploads |
| `AdminModule` | User management, session oversight, force-end sessions, stats |
| `NotificationModule` | Send/receive in-app notifications (agents → customers, admin → all) |
| `MeetingRequestModule` | Customer schedule requests, admin approve/reject |
| `ScheduledSessionModule` | Agent-created scheduled sessions with customer assignment |
| `PresenceModule` | Redis-backed join/leave/reconnect tracking per session |
| `RecordingModule` | Recording metadata tracking |
| `StorageModule` | MinIO file upload/download for chat file attachments |
| `MetricsModule` | Prometheus metrics endpoint, Grafana integration |

---

### LiveKit SFU (Port 7880 / 7881 / 7882 UDP)

Handles all media. The NestJS backend never touches video/audio bytes — it only:
1. Generates signed **room access tokens** using the LiveKit Server SDK
2. Calls the LiveKit API to force-close a room when a session ends

Port breakdown:
- `7880` — WebSocket signalling (SDP exchange, ICE candidates)
- `7881` — HTTPS API (room management)
- `7882/UDP` — RTP media (the actual video/audio packets)

---

### Redis (Port 6379)

Used exclusively for **real-time ephemeral state** — nothing in Redis is the source of truth:

| Key Pattern | What it stores | TTL |
|---|---|---|
| `session:{id}:participants` | Hash of `userId → {name, status, audio, video, joinedAt}` | Until left |
| `reconnect:{sessionId}:{userId}` | Marker that a user disconnected but may reconnect | 60 seconds |

If Redis goes down, the app degrades gracefully — presence tracking stops but all other features continue using PostgreSQL.

---

### PostgreSQL (Port 5432)

The single source of truth for all persistent data. Uses TypeORM with UUID primary keys.

---

### MinIO (Port 9000 / 9001)

S3-compatible object storage for chat file attachments. Files are uploaded via a `multipart/form-data` POST to NestJS, which streams them to MinIO, then broadcasts the public URL over Socket.IO to all room participants.

---

## 3. Data Flow Diagrams

### 3.1 — Session Creation (Agent)

```
Agent Browser              NestJS Backend             PostgreSQL
     │                           │                         │
     │  POST /sessions           │                         │
     │  Authorization: Bearer    │                         │
     │──────────────────────────>│                         │
     │                           │  JWT validated          │
     │                           │  Generate roomName      │
     │                           │  (room-{timestamp}-{rand})
     │                           │                         │
     │                           │  INSERT sessions        │
     │                           │─────────────────────────>
     │                           │  session.id returned    │
     │                           │<─────────────────────────
     │                           │                         │
     │                           │  Sign join JWT          │
     │                           │  { sessionId, role: customer }
     │                           │  expires: 24h           │
     │                           │                         │
     │                           │  UPDATE sessions.joinToken
     │                           │─────────────────────────>
     │                           │                         │
     │                           │  LOG session_created    │
     │                           │─────────────────────────>
     │                           │                         │
     │  { sessionId, joinToken,  │                         │
     │    joinUrl }              │                         │
     │<──────────────────────────│                         │
     │                           │                         │
     │  Frontend auto-copies     │                         │
     │  joinUrl to clipboard     │                         │
```

The agent shares the `joinUrl` (e.g. via messaging app). The URL embeds the signed JWT as a query param — no separate invite system needed.

---

### 3.2 — Customer Joins via Link

```
Customer Browser        NestJS Backend          PostgreSQL       LiveKit SFU
     │                       │                       │               │
     │  /session/join        │                       │               │
     │  ?token=<jwt>         │                       │               │
     │                       │                       │               │
     │  POST /sessions/join  │                       │               │
     │  { token }            │                       │               │
     │──────────────────────>│                       │               │
     │                       │  jwtService.verify()  │               │
     │                       │  decode sessionId     │               │
     │                       │                       │               │
     │                       │  SELECT sessions      │               │
     │                       │  WHERE id=sessionId   │               │
     │                       │──────────────────────>│               │
     │                       │  session row          │               │
     │                       │<──────────────────────│               │
     │                       │                       │               │
     │                       │  status = 'created'?  │               │
     │                       │  → set customerId     │               │
     │                       │  → set status='active'│               │
     │                       │──────────────────────>│               │
     │                       │                       │               │
     │                       │  livekitService       │               │
     │                       │  .generateToken(      │               │
     │                       │    roomName,          │               │
     │                       │    customerName       │               │
     │                       │  )                    │               │
     │                       │  (signed with         │               │
     │                       │   LIVEKIT_API_SECRET) │               │
     │                       │                       │               │
     │  { roomToken,         │                       │               │
     │    roomName,          │                       │               │
     │    wsUrl,             │                       │               │
     │    sessionId }        │                       │               │
     │<──────────────────────│                       │               │
     │                       │                       │               │
     │  LiveKit SDK connects │                       │               │
     │  to ws://livekit:7880 │                       │               │
     │  with roomToken       │                       │               │
     │──────────────────────────────────────────────────────────────>│
     │                       │                       │               │
     │  WebRTC media streams │                       │               │
     │<──────────────────────────────────────────────────────────────│
```

---

### 3.3 — Real-Time Chat Message

```
Sender Browser       Socket.IO Gateway        PostgreSQL      Receiver Browser
     │                      │                      │                │
     │  emit('send_message')│                      │                │
     │  { sessionId,        │                      │                │
     │    content }         │                      │                │
     │─────────────────────>│                      │                │
     │                      │  chatService         │                │
     │                      │  .saveMessage()      │                │
     │                      │──────────────────────>               │
     │                      │  message row         │                │
     │                      │<──────────────────────               │
     │                      │                      │                │
     │                      │  server.to(sessionId)│                │
     │                      │  .emit('new_message')│                │
     │                      │  { id, content,      │                │
     │                      │    senderId,         │                │
     │                      │    senderName,       │                │
     │                      │    createdAt }       │                │
     │<─────────────────────│──────────────────────────────────────>│
     │                      │                      │                │
```

All participants in the Socket.IO room receive the message simultaneously. The sender gets it back too (for consistency — the optimistic local add is replaced by the confirmed server message).

---

### 3.4 — File Sharing in Chat

```
Sender Browser      NestJS Backend        MinIO         Receiver Browser
     │                    │                  │                  │
     │  POST /chat/       │                  │                  │
     │  {sessionId}/upload│                  │                  │
     │  multipart/form-data                  │                  │
     │───────────────────>│                  │                  │
     │                    │  storageService  │                  │
     │                    │  .upload(buffer) │                  │
     │                    │─────────────────>│                  │
     │                    │  public URL      │                  │
     │                    │<─────────────────│                  │
     │                    │  Save ChatMessage│                  │
     │                    │  type='file'     │                  │
     │                    │  fileUrl=URL     │                  │
     │  { message object }│                  │                  │
     │<───────────────────│                  │                  │
     │                    │                  │                  │
     │  emit('send_file_message')            │                  │
     │  { sessionId, messageId }             │                  │
     │───────────────────>│                  │                  │
     │                    │  fetch message   │                  │
     │                    │  broadcast to room                  │
     │                    │──────────────────────────────────────>
     │                    │                  │                  │
```

---

### 3.5 — Presence & Reconnect Flow

```
User Browser         Socket.IO Gateway          Redis
     │                      │                     │
     │  disconnect (network │                     │
     │  drop / tab closed)  │                     │
     │  [TCP FIN / timeout] │                     │
     │─────────────────────>│                     │
     │                      │  presenceService    │
     │                      │  .disconnected()    │
     │                      │  SET reconnect:     │
     │                      │  {sessionId}:{userId}
     │                      │  EX 60 (seconds)    │
     │                      │─────────────────────>
     │                      │                     │
     │                      │  emit('participant_ │
     │                      │  reconnecting') to  │
     │                      │  room               │
     │                      │                     │
     │  [reconnects within 60s]                   │
     │                      │                     │
     │  emit('join_session')│                     │
     │─────────────────────>│                     │
     │                      │  GET reconnect key  │
     │                      │─────────────────────>
     │                      │  key exists → true  │
     │                      │<─────────────────────
     │                      │                     │
     │                      │  DEL reconnect key  │
     │                      │  emit('participant_ │
     │                      │  reconnected')      │
     │                      │─────────────────────>
     │                      │                     │
     │  [does NOT reconnect within 60s]           │
     │                      │                     │
     │                      │  setTimeout 60s     │
     │                      │  check if key still │
     │                      │  exists in Redis    │
     │                      │─────────────────────>
     │                      │  key exists → mark  │
     │                      │  as truly left      │
     │                      │  emit('participant_ │
     │                      │  left') to room     │
```

This 60-second grace window prevents false "user left" notifications from brief network hiccups.

---

## 4. Database Schema

```sql
-- users
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,          -- bcrypt hashed, cost=10
    name        VARCHAR(255) NOT NULL,
    role        ENUM('agent','customer','admin') DEFAULT 'customer',
    employee_id VARCHAR(255),                   -- agents only
    is_verified BOOLEAN DEFAULT false,          -- admin must verify agents
    is_active   BOOLEAN DEFAULT true,           -- soft delete
    created_at  TIMESTAMP DEFAULT NOW()
);

-- sessions
CREATE TABLE sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id    UUID REFERENCES users(id),
    customer_id UUID REFERENCES users(id),      -- null until customer joins
    status      ENUM('created','active','ended') DEFAULT 'created',
    room_name   VARCHAR(255) NOT NULL,           -- e.g. room-1719000000-abc123
    join_token  TEXT,                            -- 24h JWT for customer to join
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW(),
    ended_at    TIMESTAMP                        -- null until session ends
);

-- chat_messages
CREATE TABLE chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID REFERENCES sessions(id),
    sender_id   UUID REFERENCES users(id),
    content     TEXT NOT NULL,                   -- message text or filename
    type        ENUM('text','file') DEFAULT 'text',
    file_url    TEXT,                            -- MinIO public URL for files
    mime_type   VARCHAR(255),                    -- e.g. image/png, application/pdf
    created_at  TIMESTAMP DEFAULT NOW()
);

-- notifications
CREATE TABLE notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id    UUID REFERENCES users(id),
    recipient_id UUID REFERENCES users(id),
    title        VARCHAR(255) NOT NULL,
    message      TEXT NOT NULL,
    type         ENUM('info','success','warning','meeting') DEFAULT 'info',
    is_read      BOOLEAN DEFAULT false,
    created_at   TIMESTAMP DEFAULT NOW()
);

-- meeting_requests (customer → admin)
CREATE TABLE meeting_requests (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id    UUID REFERENCES users(id),
    topic          VARCHAR(255) NOT NULL,
    description    TEXT,
    preferred_time TIMESTAMP NOT NULL,
    status         ENUM('pending','approved','rejected') DEFAULT 'pending',
    admin_note     TEXT,
    created_at     TIMESTAMP DEFAULT NOW()
);

-- scheduled_sessions (agent-created)
CREATE TABLE scheduled_sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id     UUID REFERENCES users(id),
    customer_id  UUID REFERENCES users(id),     -- optional
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    scheduled_at TIMESTAMP NOT NULL,
    status       ENUM('upcoming','started','cancelled') DEFAULT 'upcoming',
    created_at   TIMESTAMP DEFAULT NOW()
);

-- recordings
CREATE TABLE recordings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID REFERENCES sessions(id),
    status      ENUM('in_progress','processing','ready','failed'),
    file_url    TEXT,
    duration    INTEGER,                         -- seconds
    created_at  TIMESTAMP DEFAULT NOW()
);

-- session_events (audit log)
CREATE TABLE session_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID REFERENCES sessions(id),
    event_type  VARCHAR(100) NOT NULL,           -- session_created, agent_joined, participant_joined, etc.
    metadata    JSONB,
    created_at  TIMESTAMP DEFAULT NOW()
);
```

### Entity Relationships

```
users ──< sessions (as agent)
users ──< sessions (as customer)
sessions ──< chat_messages
sessions ──< recordings
sessions ──< session_events
users ──< notifications (as sender)
users ──< notifications (as recipient)
users ──< meeting_requests (as customer)
users ──< scheduled_sessions (as agent)
users ──< scheduled_sessions (as customer)
```

---

## 5. Real-Time Architecture

### Socket.IO Gateway

The `ChatGateway` (NestJS `@WebSocketGateway`) handles all real-time communication. It maintains an in-memory map of `socketId → { userId, userName, sessionId }`.

**Connection lifecycle:**
1. Client connects with `auth: { token: <JWT> }` in the handshake
2. Gateway verifies the JWT — disconnects immediately if invalid
3. Client emits `join_session` → gateway adds the socket to a Socket.IO room keyed by `sessionId`
4. Chat history is sent to the joining client only
5. All subsequent `send_message` events are broadcast to the entire room

**Events handled:**

| Event (inbound) | What happens |
|---|---|
| `join_session` | Join Socket.IO room, update Redis presence, send chat history |
| `leave_session` | Leave room, remove from Redis presence, notify others |
| `send_message` | Save to PostgreSQL, broadcast `new_message` to room |
| `send_file_message` | Broadcast uploaded file message to all others in room |
| `media_state` | Update Redis media state, broadcast `peer_media_state` to others |

| Event (outbound) | Triggered by |
|---|---|
| `chat_history` | Joining a session |
| `new_message` | Any message sent |
| `participant_joined` | User joins |
| `participant_left` | User cleanly leaves |
| `participant_reconnecting` | TCP disconnect detected |
| `participant_reconnected` | User reconnects within 60s |
| `participants` | Snapshot of current room participants |
| `peer_media_state` | Mic/cam toggle |

---

## 6. Video Architecture — Why Not P2P

### The Problem with P2P (Plain WebRTC)

In a direct peer-to-peer WebRTC call:
- Both browsers need to negotiate a direct connection using ICE/STUN/TURN
- Corporate firewalls and symmetric NAT frequently block direct connections
- Each new participant in the room requires each existing participant to open a new connection — at N participants, each browser manages N-1 upload streams. At 4 people, that's 3 upload streams per browser — killing bandwidth and CPU
- The server has no visibility into the call — you cannot force-end it, monitor it, or record it centrally

### LiveKit as SFU (Selective Forwarding Unit)

```
  Agent Browser                               Customer Browser
       │                                             │
       │   1. WebSocket to LiveKit :7880             │
       │   (ICE negotiation, SDP exchange)           │
       │────────────────────────────────────>        │
       │                                   LiveKit   │
       │   2. RTP video/audio uplink        SFU      │
       │   UDP :7882                                 │
       │──────────────────────────────────> │        │
       │                                   │   3. WebSocket :7880
       │                                   │<────────────────────│
       │                                   │        │
       │                                   │   4. RTP uplink :7882
       │                                   │<────────────────────│
       │                                   │        │
       │   5. RTP downlink                 │        │
       │   (customer's stream forwarded)   │   6. RTP downlink
       │<──────────────────────────────────│   (agent's stream)
       │                                   │────────────────────>│
```

**What LiveKit actually does:**
- Each browser uploads **one stream** to the SFU (regardless of how many participants are in the room)
- LiveKit selectively forwards each participant's stream to all subscribers
- If a participant has low bandwidth, LiveKit can send them a lower-quality simulcast layer
- The NestJS backend generates a signed **AccessToken** (using `LIVEKIT_API_SECRET`) that grants the holder permission to join a specific room with publish and subscribe rights
- Tokens are scoped: `{ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true }`

**Token generation flow:**

```
NestJS SessionService
  → livekitService.generateToken(roomName, participantName)
    → new AccessToken(apiKey, apiSecret, { identity, name })
    → at.addGrant({ roomJoin, room, canPublish, canSubscribe })
    → at.toJwt()  ← signed JWT returned to browser
```

The browser passes this JWT to the LiveKit SDK — the SDK uses it to connect directly to the LiveKit server. NestJS is not in the media path at all after this point.

**Admin force-end a session:**
The NestJS admin endpoint calls the LiveKit server API to delete the room, which disconnects all participants. The session status is then updated to `ended` in PostgreSQL.

---

## 7. Authentication & Authorization

### Auth Flow

```
Register/Login
    │
    ├─ bcrypt.hash(password, 10)
    ├─ INSERT user to PostgreSQL
    └─ jwtService.sign({ sub, email, name, role, isVerified })
         └─ Stored in localStorage by Zustand store
              └─ Axios interceptor attaches to every request:
                 Authorization: Bearer <token>
```

**JWT payload:**
```json
{
  "sub": "<userId UUID>",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "agent",
  "isVerified": true,
  "iat": 1719000000,
  "exp": 1719604800
}
```

**Agent verification:** Agents register with an `employeeId`. Their `isVerified` flag is `false` by default. The admin must manually verify them (sets `isVerified = true`). Until then, agents can log in but their `isVerified: false` state is visible to any guarded business logic.

### Two separate JWT types in this system:

| JWT | Signed by | Purpose | Expiry |
|---|---|---|---|
| Auth JWT | `JWT_SECRET` | Authenticate API requests | 7 days |
| Session join token | `JWT_SECRET` | Allow a customer to join a specific session | 24 hours |
| LiveKit room token | `LIVEKIT_API_SECRET` | Grant browser access to a LiveKit room | Short-lived |

### Authorization layers:

```
Request
  │
  ├── JwtAuthGuard           → validates Bearer token, attaches user to req
  │
  ├── Role check in service  → e.g. agentId !== userId → ForbiddenException
  │
  └── Resource ownership     → e.g. session.agentId !== req.user.id → reject
```

---

## 8. Storage Architecture

Chat file attachments go through the following path:

```
Browser
  → POST /chat/{sessionId}/upload   (multipart/form-data)
  → NestJS StorageService
  → MinIO bucket "supportvision"
  → Returns public URL: http://minio:9000/supportvision/{objectName}
  → URL saved in chat_messages.file_url
  → URL broadcast over Socket.IO to all room participants
```

MinIO is configured with a public-read bucket policy, so any participant can fetch the file directly from MinIO without going through NestJS.

Supported file types in the chat upload: `image/*`, `video/*`, `audio/*`, `.pdf`, `.doc`, `.docx`, `.txt`, `.zip`

---

## 9. Observability

The system exposes metrics via a dedicated `/metrics` endpoint in Prometheus text format, and a JSON summary at `/metrics/json`. These are scraped by Prometheus and visualised in Grafana.

**Metrics tracked:**

| Metric | Type | Description |
|---|---|---|
| `supportvision_active_sessions` | Gauge | Sessions currently in `active` status |
| `supportvision_connected_users` | Gauge | Estimated `active_sessions × 2` |
| `supportvision_total_sessions_total` | Counter | All sessions ever created |
| `supportvision_recordings_started_total` | Counter | Recording events |
| `supportvision_errors_total` | Counter | Server-side errors |
| `supportvision_avg_call_duration_seconds` | Gauge | Mean duration across all ended sessions |
| `node_*` | Various | Default Node.js metrics (heap, event loop lag, GC, etc.) |

Metrics are re-synced from PostgreSQL every **15 seconds** to keep gauges accurate even after restarts.

**Grafana** runs on port `3002` and comes pre-provisioned with a dashboard via `grafana/provisioning/`.

---

## 10. Capacity & Scaling

### Current single-node capacity (as deployed via Docker Compose)

This is what the current setup can handle on a single server:

| Resource | Realistic limit | Bottleneck |
|---|---|---|
| Concurrent video sessions | ~50–100 | LiveKit CPU and uplink bandwidth |
| Concurrent Socket.IO connections | ~5,000 | Node.js single-thread event loop |
| REST API requests | ~500 req/s | NestJS + PostgreSQL connection pool |
| Chat messages per second | ~200/s | PostgreSQL write throughput |
| File uploads | Limited by disk I/O to MinIO | |

**LiveKit single-server estimate:**
A single LiveKit instance on a 4-core server can handle roughly 50–100 simultaneous 2-person sessions (HD video). At 720p, each video stream uses ~1–2 Mbps. On a 1 Gbps uplink, that's ~500 simultaneous streams before bandwidth saturates. CPU is typically the limiting factor first.

**PostgreSQL:**
With default settings and a connection pool of 10–20 connections (TypeORM default), you can sustain ~300–500 simple queries/second. Adding read replicas and a connection pooler (PgBouncer) raises this to thousands of queries/second.

**Redis:**
Single Redis node handles ~100,000 commands/second. Presence operations for even 10,000 concurrent users generate far less than that — Redis is not the bottleneck in this system.

### Scaling to handle more load

```
Current (single node)
         │
         ▼
Add a load balancer (nginx / AWS ALB)
         │
         ├── NestJS instance #1
         ├── NestJS instance #2   ← All share the same Redis (Socket.IO pub/sub)
         └── NestJS instance #3     and PostgreSQL
```

**Key requirement for horizontal NestJS scaling:** Socket.IO must be configured with the Redis adapter (`@socket.io/redis-adapter`) so that a message emitted on instance #1 reaches clients connected to instance #2 or #3. This is the only code change needed.

**LiveKit scaling:** LiveKit supports a distributed cluster mode where multiple SFU nodes share room state. This is configured at the LiveKit level and is transparent to the NestJS backend.

---

## 11. Latency Profile

End-to-end latency breakdown for the most latency-sensitive operations:

### Chat message round-trip (send → receive on other browser)

```
Browser → NestJS Socket.IO       ~1–5 ms    (local network)
NestJS → PostgreSQL INSERT        ~2–10 ms   (local Docker network)
NestJS → broadcast new_message    ~1 ms
Total                             ~5–20 ms
```

### Session creation (agent clicks "New Session")

```
Browser → POST /sessions          HTTP round trip ~10–50 ms
NestJS → PostgreSQL INSERT        ~2–10 ms
NestJS → JWT sign (session token) ~1 ms
Response + clipboard copy         ~5 ms
Total perceived latency           ~20–70 ms
```

### Customer join (clicking a link)

```
Browser → POST /sessions/join     ~10–50 ms
NestJS → PostgreSQL SELECT        ~2–10 ms
NestJS → LiveKit token sign       ~1 ms
Browser receives roomToken        ~15–65 ms
LiveKit WebSocket connect         ~50–200 ms  (ICE negotiation)
First video frame visible         ~200–500 ms
```

### Video/audio (through LiveKit SFU)

```
Capture → encode → send to SFU → decode → render
Glass-to-glass latency:  ~100–300 ms  (same datacenter / LAN)
                         ~150–500 ms  (cross-region internet)
```

These numbers assume a local Docker deployment. In production with a cloud deployment, add the RTT between the user's browser and the server (typically 10–100 ms depending on geography).

---

## 12. Failure Modes & Recovery

### Redis goes down

**Impact:** Presence tracking stops. The reconnect grace-window logic fails silently. Chat history and messaging continue unaffected (they use PostgreSQL).

**Detection:** `PresenceService.onModuleInit()` logs a warning and sets `this.redis = undefined`. All Redis calls are guarded with `if (this.redis)`.

**Recovery:** When Redis comes back up, `PresenceService` does not auto-reconnect (current implementation). A NestJS restart picks it back up. In production, use `redis.on('reconnecting')` with the `createClient` retry strategy.

**Graceful degradation:** The app stays fully functional — video calls, chat, session management all work. Only presence indicators go stale.

---

### PostgreSQL goes down

**Impact:** All API calls fail. Session creation, joining, chat history, auth — everything stops.

**Detection:** TypeORM throws `QueryFailedError` / connection errors. NestJS returns 500s.

**Recovery:** TypeORM has built-in reconnection. With `retryAttempts: 10, retryDelay: 3000` in the TypeORM config, it retries automatically.

**What keeps working:** Active LiveKit video sessions already in progress continue — media traffic goes directly browser ↔ LiveKit and does not touch the backend. Active Socket.IO chat connections also stay open. Users already in a call are unaffected until they try to do something that needs an API call (like ending the session gracefully).

---

### LiveKit goes down

**Impact:** No new video sessions can start. Browsers in an active call will disconnect from the media server.

**Detection:** The LiveKit SDK fires `RoomEvent.Disconnected` in the browser. The `VideoRoom.tsx` component has no automatic reconnect — users see the call drop.

**Recovery:** LiveKit itself attempts to reconnect WebSocket connections (configurable). If the server process restarts, clients need to re-join (re-fetch a room token and reconnect).

**What keeps working:** REST API, chat via Socket.IO, session metadata in PostgreSQL — all unaffected. The session status in the database may show `active` even though the media server is down (stale state). An admin can force-end such sessions from the dashboard.

---

### NestJS goes down

**Impact:** All REST API calls and Socket.IO connections fail. Browsers in a live call lose their chat connection but **video/audio through LiveKit continues uninterrupted** — the SFU doesn't need NestJS to forward media.

**Recovery:** Restart NestJS. Socket.IO clients in `VideoRoom.tsx` are configured with `reconnection: true, reconnectionDelay: 1000, reconnectionAttempts: 10` — they automatically attempt to reconnect to the Socket.IO gateway.

---

### User loses internet mid-call (temporary disconnect)

**Socket.IO disconnect:**
- Gateway detects TCP FIN / timeout
- Sets a Redis key `reconnect:{sessionId}:{userId}` with **60-second TTL**
- Broadcasts `participant_reconnecting` to the room
- If user reconnects within 60s → `participant_reconnected`, session continues normally
- If 60s pass without reconnect → `participant_left`, user is removed from presence

**LiveKit disconnect:**
- LiveKit SDK has built-in reconnection with exponential backoff
- If reconnect fails, the `VideoRoom.tsx` shows the participant tile as "Camera off" (fallback avatar)

---

### Chat message delivery failure

Messages are saved to PostgreSQL **before** broadcasting over Socket.IO. If the socket broadcast fails after the save, the message is not lost — it will appear in chat history when the user refreshes or rejoins the session (the gateway sends full `chat_history` on every `join_session` event).

---

## Summary

```
Component          Failure impact         Recovery
─────────────────────────────────────────────────────────
PostgreSQL down    Full API outage        TypeORM auto-reconnect
Redis down         Presence only          Manual restart / auto-retry
LiveKit down       Video/audio only       Client reconnect / rejoin
NestJS down        API + chat             Auto-restart + Socket.IO reconnect
MinIO down         File sharing only      Retry upload
Network drop       Socket.IO reconnects   60s grace window
```

The most resilient path is an **active video call**: once a LiveKit room is established and both participants have their room tokens, the call can continue even if NestJS, PostgreSQL, and Redis all go offline — because media traffic goes directly between the browsers and the LiveKit SFU.

---

**Architecture Version**: 2.0
**Stack**: Next.js · NestJS · PostgreSQL · Redis · LiveKit SFU · MinIO · Prometheus · Grafana
