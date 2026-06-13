# SupportVision - Visual Architecture Diagram

## System Overview

```
                            SUPPORTVISION ARCHITECTURE
                            
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                          CLIENT LAYER (Browser)                         │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Login/     │  │    Agent     │  │   Customer   │  │   Admin    │ │
│  │   Register   │  │  Dashboard   │  │   Sessions   │  │  Dashboard │ │
│  │              │  │              │  │              │  │            │ │
│  │ • JWT Auth   │  │ • Create     │  │ • Join via   │  │ • Monitor  │ │
│  │ • Role       │  │   Session    │  │   Link       │  │   Live     │ │
│  │   Select     │  │ • View       │  │ • View       │  │ • Force    │ │
│  │              │  │   History    │  │   History    │  │   End      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                 │                 │                 │        │
│         └─────────────────┴─────────────────┴─────────────────┘        │
│                                     │                                   │
│                                     │                                   │
│                    ┌────────────────┼────────────────┐                  │
│                    │                │                │                  │
│              HTTP/REST          WebSocket       WebRTC                  │
│              (Port 3001)      (Socket.IO)     (LiveKit)                 │
│                    │                │                │                  │
└────────────────────┼────────────────┼────────────────┼──────────────────┘
                     │                │                │
                     ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                        APPLICATION LAYER (Backend)                      │
│                             NestJS (Port 3001)                          │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                         REST API LAYER                            │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │                                                             │ │ │
│  │  │  ┌──────────┐  ┌───────────┐  ┌─────────┐  ┌────────────┐ │ │ │
│  │  │  │   Auth   │  │  Session  │  │  Chat   │  │ Recording  │ │ │ │
│  │  │  │  Module  │  │   Module  │  │ Module  │  │   Module   │ │ │ │
│  │  │  │          │  │           │  │         │  │            │ │ │ │
│  │  │  │ • Login  │  │ • Create  │  │ • Get   │  │ • Start    │ │ │ │
│  │  │  │ • Reg.   │  │ • Join    │  │   Msgs  │  │ • Stop     │ │ │ │
│  │  │  │ • JWT    │  │ • End     │  │ • Save  │  │ • Status   │ │ │ │
│  │  │  │          │  │ • History │  │         │  │            │ │ │ │
│  │  │  └──────────┘  └───────────┘  └─────────┘  └────────────┘ │ │ │
│  │  │                                                             │ │ │
│  │  │  ┌──────────┐  ┌───────────┐  ┌─────────────────────────┐ │ │ │
│  │  │  │  Admin   │  │  Metrics  │  │    LiveKit Service      │ │ │ │
│  │  │  │  Module  │  │   Module  │  │                         │ │ │ │
│  │  │  │          │  │           │  │ • Generate Tokens       │ │ │ │
│  │  │  │ • Stats  │  │ • JSON    │  │ • Room Management       │ │ │ │
│  │  │  │ • Force  │  │ • Prom.   │  │                         │ │ │ │
│  │  │  └──────────┘  └───────────┘  └─────────────────────────┘ │ │ │
│  │  │                                                             │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    WEBSOCKET LAYER (Socket.IO)                    │ │
│  │                                                                   │ │
│  │  Events: join_session, send_message, new_message, media_state    │ │
│  │  Purpose: Real-time chat, presence, media state sync             │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└────────────┬────────────────┬─────────────────┬────────────────────────┘
             │                │                 │
             │                │                 │
             ▼                ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                        DATA & INFRASTRUCTURE LAYER                      │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │
│  │   PostgreSQL     │  │      Redis       │  │   LiveKit SFU      │   │
│  │   (Port 5432)    │  │   (Port 6379)    │  │   (Port 7880)      │   │
│  │                  │  │                  │  │                    │   │
│  │ Tables:          │  │ Purpose:         │  │ Purpose:           │   │
│  │ • users          │  │ • Active         │  │ • Media Routing    │   │
│  │ • sessions       │  │   sessions       │  │ • WebRTC SFU       │   │
│  │ • chat_messages  │  │ • Presence       │  │ • A/V Streaming    │   │
│  │ • recordings     │  │ • Cache          │  │ • TURN/STUN        │   │
│  │ • session_events │  │ • WS scaling     │  │                    │   │
│  │                  │  │                  │  │ Ports:             │   │
│  │ Relations:       │  │                  │  │ • 7880 (HTTP/WS)   │   │
│  │ • FK agent_id    │  │                  │  │ • 7881 (HTTP)      │   │
│  │ • FK customer_id │  │                  │  │ • 7882 (UDP/RTP)   │   │
│  │ • FK session_id  │  │                  │  │                    │   │
│  └──────────────────┘  └──────────────────┘  └────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow - Session Creation & Join

```
STEP 1: AGENT CREATES SESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Agent Browser              NestJS Backend           PostgreSQL
     │                          │                       │
     │  1. POST /sessions       │                       │
     │  Authorization: Bearer   │                       │
     │  <JWT_TOKEN>             │                       │
     ├─────────────────────────>│                       │
     │                          │  2. Verify JWT        │
     │                          │     Extract userId    │
     │                          │                       │
     │                          │  3. Generate room     │
     │                          │     name & token      │
     │                          │                       │
     │                          │  4. INSERT INTO       │
     │                          │     sessions          │
     │                          ├──────────────────────>│
     │                          │                       │
     │                          │  5. session record    │
     │                          │<──────────────────────┤
     │                          │                       │
     │                          │  6. Sign join JWT     │
     │                          │     (sessionId +      │
     │                          │      role: customer)  │
     │                          │                       │
     │  7. Response:            │                       │
     │  {                       │                       │
     │    sessionId: "abc123",  │                       │
     │    joinUrl: "/session/   │                       │
     │             join?token=" │                       │
     │  }                       │                       │
     │<─────────────────────────┤                       │
     │                          │                       │
     │  8. Display link to      │                       │
     │     share with customer  │                       │
     │                          │                       │


STEP 2: CUSTOMER JOINS SESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Customer Browser       NestJS Backend      PostgreSQL      LiveKit SFU
      │                     │                   │               │
      │  1. GET /session/   │                   │               │
      │     join?token=xyz  │                   │               │
      ├────────────────────>│                   │               │
      │                     │  2. Verify join   │               │
      │                     │     token JWT     │               │
      │                     │                   │               │
      │                     │  3. POST /join    │               │
      │                     │     { token }     │               │
      │                     │                   │               │
      │                     │  4. UPDATE        │               │
      │                     │     sessions      │               │
      │                     │     SET customer  │               │
      │                     ├──────────────────>│               │
      │                     │                   │               │
      │                     │  5. Get room info │               │
      │                     │<──────────────────┤               │
      │                     │                   │               │
      │                     │  6. Generate      │               │
      │                     │     LiveKit token │               │
      │                     │     for customer  │               │
      │                     │                   │               │
      │  7. Response:       │                   │               │
      │  {                  │                   │               │
      │    roomToken: "...",│                   │               │
      │    roomName: "...", │                   │               │
      │    wsUrl: "..."     │                   │               │
      │  }                  │                   │               │
      │<────────────────────┤                   │               │
      │                     │                   │               │
      │  8. Connect WebRTC  │                   │               │
      │     with roomToken  │                   │               │
      ├─────────────────────────────────────────────────────────>│
      │                     │                   │               │
      │  9. Media stream    │                   │               │
      │<─────────────────────────────────────────────────────────┤
      │                     │                   │               │
```

## Real-Time Communication Flow

```
AGENT & CUSTOMER IN VIDEO CALL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────┐                    ┌─────────────┐
│   Agent     │                    │  Customer   │
│   Browser   │                    │   Browser   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │          VIDEO/AUDIO             │
       │◄─────────────────────────────────┤
       │          (via LiveKit SFU)       │
       │─────────────────────────────────►│
       │                                  │
       │           CHAT MESSAGES          │
       │◄─────────────────────────────────┤
       │        (via Socket.IO)           │
       │─────────────────────────────────►│
       │                                  │
       │        MEDIA STATE SYNC          │
       │◄─────────────────────────────────┤
       │    (mute/unmute via Socket.IO)   │
       │─────────────────────────────────►│
       │                                  │

LiveKit SFU:
┌─────────────────────────────────────────┐
│  • Receives media from both participants│
│  • Forwards to other participant        │
│  • Handles bandwidth adaptation         │
│  • Manages quality switching            │
│  • No media stored (real-time only)     │
└─────────────────────────────────────────┘

Socket.IO Gateway:
┌─────────────────────────────────────────┐
│  • Maintains WebSocket connections      │
│  • Broadcasts chat messages             │
│  • Tracks presence (who's online)       │
│  • Syncs media state (mute status)      │
│  • Persists messages to PostgreSQL      │
└─────────────────────────────────────────┘
```

## Database Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA (ERD)                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│      users       │
├──────────────────┤
│ id (PK)          │
│ email (UNIQUE)   │
│ password (hash)  │
│ name             │
│ role (enum)      │
│ created_at       │
└────────┬─────────┘
         │
         │ 1                Many
         ├──────────────────────────┐
         │                          │
         │                          │
    ┌────┴──────────────┐    ┌─────┴─────────────┐
    │    sessions       │    │  chat_messages    │
    ├───────────────────┤    ├───────────────────┤
    │ id (PK)           │    │ id (PK)           │
    │ agent_id (FK)     │────┤ session_id (FK)   │
    │ customer_id (FK)  │    │ sender_id (FK)    │
    │ room_name         │    │ content (text)    │
    │ join_token        │    │ type (enum)       │
    │ status (enum)     │    │ file_url          │
    │ created_at        │    │ created_at        │
    │ updated_at        │    └───────────────────┘
    │ ended_at          │
    └────────┬──────────┘
             │
             │ 1           Many
             ├──────────────────────────┐
             │                          │
             │                          │
      ┌──────┴────────────┐      ┌─────┴─────────────┐
      │   recordings      │      │  session_events   │
      ├───────────────────┤      ├───────────────────┤
      │ id (PK)           │      │ id (PK)           │
      │ session_id (FK)   │      │ session_id (FK)   │
      │ status (enum)     │      │ event_type        │
      │ file_url          │      │ metadata (jsonb)  │
      │ duration          │      │ created_at        │
      │ created_at        │      └───────────────────┘
      └───────────────────┘

Relationships:
• users 1:N sessions (as agent)
• users 1:N sessions (as customer)
• sessions 1:N chat_messages
• sessions 1:N recordings
• sessions 1:N session_events
• users 1:N chat_messages (as sender)
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────────┘

  REQUEST FLOW                    SECURITY MEASURE
  ════════════                    ════════════════

1. Browser Request               • HTTPS (prod)
   │                            • CORS policy
   ▼
2. NestJS Guard Layer           • JWT validation
   │                            • Token expiration check
   │                            • Signature verification
   ▼
3. Controller Layer             • DTO validation
   │                            • Input sanitization
   ▼
4. Service Layer                • Authorization check
   │                            • Resource ownership
   │                            • Role validation
   ▼
5. Repository Layer             • TypeORM protection
   │                            • Parameterized queries
   │                            • No SQL injection
   ▼
6. Database                     • Encrypted at rest
                                • Access control

Authentication Flow:
━━━━━━━━━━━━━━━━━━━
1. User provides credentials
2. Backend validates with bcrypt
3. Generate JWT (7-day expiry)
   Payload: { userId, email, role }
4. Client stores in localStorage
5. Include in Authorization header
6. Backend verifies on each request

Session Join Security:
━━━━━━━━━━━━━━━━━━━━━
1. Agent creates session
2. Backend generates join token (24h)
   Contains: { sessionId, role: 'customer' }
3. Token expires after 24 hours
4. One-time use per customer
5. Validated before LiveKit token
```

## Deployment Architecture (Recommended Production)

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRODUCTION DEPLOYMENT                       │
└─────────────────────────────────────────────────────────────────┘

                        ┌─────────────┐
                        │   Route53   │
                        │     DNS     │
                        └──────┬──────┘
                               │
                        ┌──────┴──────┐
                        │ CloudFront  │
                        │     CDN     │
                        └──────┬──────┘
                               │
                        ┌──────┴──────┐
                        │     ALB     │
                        │Load Balancer│
                        └──────┬──────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
         ┌──────┴──────┐┌─────┴──────┐┌─────┴──────┐
         │  Next.js    ││  Next.js   ││  Next.js   │
         │   (EC2)     ││   (EC2)    ││   (EC2)    │
         │  Instance 1 ││ Instance 2 ││ Instance 3 │
         └─────────────┘└────────────┘└────────────┘
                               │
                        ┌──────┴──────┐
                        │     ALB     │
                        │  API Load   │
                        └──────┬──────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
         ┌──────┴──────┐┌─────┴──────┐┌─────┴──────┐
         │  NestJS     ││  NestJS    ││  NestJS    │
         │   (ECS)     ││   (ECS)    ││   (ECS)    │
         │Container 1  ││Container 2 ││Container 3 │
         └─────────────┘└────────────┘└────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
  ┌──────┴─────┐      ┌────────┴────────┐   ┌──────┴──────┐
  │    RDS     │      │ ElastiCache     │   │   LiveKit   │
  │PostgreSQL  │      │     Redis       │   │   Cluster   │
  │Multi-AZ    │      │   Cluster       │   │   (EC2)     │
  └────────────┘      └─────────────────┘   └─────────────┘

Additional Services:
• S3: Static assets, recordings
• CloudWatch: Logs & metrics
• Secrets Manager: Credentials
• WAF: DDoS protection
• Certificate Manager: SSL/TLS
```

---

**Diagram Version:** 1.0  
**Created For:** AtomQuest Hackathon Submission  
**Last Updated:** 2024
