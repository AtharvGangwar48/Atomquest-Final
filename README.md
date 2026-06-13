# Atomberg — Self-Hosted Video Chat Platform

Atomberg is a self-hosted, secure video calling platform built for customer support teams. Agents create sessions and share join links with customers, while administrators oversee the entire platform from a single dashboard.

---

## Tech Stack

| Technology | Role |
|---|---|
| Next.js + React | Frontend UI |
| NestJS | Backend API |
| PostgreSQL | Database |
| LiveKit | Video engine (SFU) |
| Socket.IO | Real-time chat |
| Redis | Caching and pub/sub |
| JWT + Bcrypt | Authentication and security |

---

## User Roles

**Customer**
Joins video calls using a link shared by an agent. Can submit meeting requests and view past session history.

**Agent**
Creates sessions, shares join links with customers, schedules sessions, sends in-app notifications, and can record calls.

**Admin**
Has full system oversight — manages user accounts, approves or rejects meeting requests, monitors live sessions, and sends platform-wide notifications.

---

## Application Walkthrough

### 1. Registration and Login

Navigate to `/login` to register or log in.

- Customers register with their name, email, and password.
- Agents register the same way, plus an Employee ID. An admin must verify and activate the account before the agent can log in.
- The admin account is pre-seeded — no registration required.

After login, users are automatically redirected to their respective dashboards.

---

### 2. Agent Dashboard (`/dashboard`)

**Session Management**
Clicking "New Session" creates a session and automatically copies the join link to the clipboard. The agent shares this link with the customer. Once the customer joins, the session turns Active and the agent can click "Join Call" to enter the video room.

**Scheduling**
Agents can schedule future sessions by selecting a date, time, and optionally assigning a specific customer. Scheduled sessions appear under a dedicated tab.

**Notifications**
Agents can send in-app notifications (categorized as Info, Success, Warning, or Meeting) to selected customers or all customers at once.

**Session History**
All past and active sessions are listed with status indicators: Waiting, Active, and Ended.

---

### 3. Customer Portal (`/sessions`)

**Joining a Meeting**
Customers paste the full join link or token provided by the agent and click "Join Now."

**Scheduling a Meeting**
Customers can submit a meeting request with a topic, description, and preferred time. The request is sent to the admin for approval.

**Request Tracking**
Customers can track the status of their submitted requests: Pending, Approved, or Rejected.

**Session History**
All past sessions are listed. Active sessions display a "Join Call" button to re-enter the room.

---

### 4. Video Room (`/session/[id]`)

The live call interface, accessible to both agents and customers.

| Control | Function |
|---|---|
| Microphone button | Toggle microphone on or off |
| Camera button | Toggle camera on or off |
| Chat button | Open or close the side chat panel |
| Record button | Start or stop screen recording (saved locally as `.webm`) |
| End Call button | Leave the session and return to the dashboard |
| Share Room button | Copy the room link to clipboard |

The chat panel supports text messages and file sharing — images, video, audio, PDFs, and documents. Files are uploaded to storage and shared with all participants in real time.

---

### 5. Admin Dashboard (`/admin`)

The admin dashboard is organized into five tabs:

| Tab | Contents |
|---|---|
| Stats | Summary counts: total customers, total agents, live meetings, pending requests |
| Customers | All registered customers — name, email, join date. Admins can delete accounts. |
| Agents | All agents — verify pending agents to activate their accounts, delete agents. Verified agents are marked accordingly. |
| Notifications | Send a notification to all users, agents only, or customers only. Requires a title and message body. |
| Meetings | Three sections: Meeting Requests (approve or reject with optional note), Live Sessions (force-end any active call), All Sessions (complete history with statuses) |

---

## Quick Start

**Requirements:** Docker, Node.js 18+

```bash
# 1. Start the database, Redis, and LiveKit
docker-compose up -d

# 2. Start the backend
cd backend
npm install
npm run start:dev

# 3. Start the frontend
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@atomberg.com | admin123 |
| Agent | agent@atomberg.com | agent123 |
| Customer | customer@atomberg.com | customer123 |

---

## How Video Works — Server-Routed via LiveKit (Not Peer-to-Peer)

Atomberg does not use peer-to-peer video. All video and audio traffic is routed through a LiveKit server that runs entirely within your own infrastructure via Docker.

### Why Not Peer-to-Peer?

In a standard P2P WebRTC setup, browsers connect directly to each other. This approach has significant limitations:

- Connections frequently fail behind firewalls or NAT
- It does not scale beyond two participants — each additional participant multiplies the number of direct connections
- There is no server-side control, so calls cannot be monitored, force-ended, or recorded centrally

### How LiveKit Works

LiveKit is an SFU — a Selective Forwarding Unit. It acts as a media server in the middle of every call:

```
  Agent Browser  -->  LiveKit Server  <--  Customer Browser
                           |
              All media routes through the server
```

1. The agent creates a session. The NestJS backend calls the LiveKit API and generates a signed room token.
2. Both participants join using their tokens. Their browsers connect to the LiveKit server, not to each other.
3. LiveKit forwards each participant's video and audio streams to all others in the room.
4. When the call ends, the backend signals LiveKit to close the room.

### Comparison

| Feature | P2P WebRTC | Atomberg with LiveKit |
|---|---|---|
| Works behind firewalls | Often fails | Always works |
| Admin can force-end a call | No | Yes |
| Scales beyond two participants | Poor | Yes |
| Media stays within your infrastructure | No (direct between browsers) | Yes (LiveKit on your own server) |
| Recording support | Complex | Built-in |

Since LiveKit runs on your own Docker container, no video or audio ever reaches any third-party service.

---

## Security

- Passwords are hashed using Bcrypt
- All API routes are protected with JWT tokens
- Session join tokens expire after 24 hours
- Role-based access control ensures users only see their own data
- No third-party video services — LiveKit runs entirely on your own server

---

## Project Structure

```
Atomquest-Final/
├── frontend/              Next.js application
│   ├── app/
│   │   ├── home/          Landing page
│   │   ├── login/         Authentication
│   │   ├── dashboard/     Agent dashboard
│   │   ├── sessions/      Customer portal
│   │   ├── admin/         Admin dashboard
│   │   └── session/       Live video room
│   └── components/
│       └── VideoRoom.tsx
├── backend/               NestJS API
│   └── src/
│       ├── auth/          Login and registration
│       ├── session/       Video session management
│       ├── chat/          Real-time messaging
│       ├── admin/         Admin controls
│       └── ...
└── docker-compose.yml
```

---

**Atomberg v1.0** · Built for AtomQuest Hackathon
