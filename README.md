<div align="center">

<img src="https://img.shields.io/badge/Atomberg-Personal%20Video%20Chat-3B82F6?style=for-the-badge&logo=video&logoColor=white" alt="Atomberg" />

<h1>📹 Atomberg</h1>
<h3>Personal Video Chat Application</h3>

<p>A self-hosted, secure video calling platform for customer support teams.<br/>Agents create sessions, customers join via link, admins manage everything.</p>

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Socket.io](https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)

</div>

---

## ⚡ Quick Start

> **Requirements:** Docker, Node.js 18+

```bash
# 1. Start infrastructure (DB, Redis, LiveKit, MinIO)
docker-compose up -d

# 2. Backend
cd backend && npm install && npm run start:dev

# 3. Frontend
cd frontend && npm install && npm run dev
```

🌐 Open **[http://localhost:3000](http://localhost:3000)**

### 🔑 Demo Credentials

| Role | Email | Password |
|:---:|:---:|:---:|
| 🔴 Admin | `admin@atomberg.com` | `admin123` |
| 🔵 Agent | `agent@atomberg.com` | `agent123` |
| 🟢 Customer | `customer@atomberg.com` | `customer123` |

---

## 🛠️ Tech Stack

| Technology | Badge | Role |
|:---|:---|:---|
| **Next.js + React** | ![Next.js](https://img.shields.io/badge/Next.js-000?style=flat-square&logo=nextdotjs&logoColor=white) | Frontend UI & routing |
| **NestJS** | ![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white) | Backend REST API |
| **PostgreSQL** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white) | Persistent database |
| **LiveKit SFU** | ![LiveKit](https://img.shields.io/badge/LiveKit-FF4719?style=flat-square&logoColor=white) | Video & audio engine |
| **Socket.IO** | ![Socket.io](https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white) | Real-time chat & presence |
| **Redis** | ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white) | Caching & pub/sub |
| **MinIO** | ![MinIO](https://img.shields.io/badge/MinIO-C72E49?style=flat-square&logo=minio&logoColor=white) | File & recording storage |
| **JWT + Bcrypt** | ![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) | Auth & security |
| **Prometheus + Grafana** | ![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat-square&logo=grafana&logoColor=white) | Metrics & monitoring |

---

## 👥 User Roles

<table>
<tr>
<td width="33%">

### 🟢 Customer
- Join calls via agent-shared link
- Submit meeting requests
- Track request status
- View session history

</td>
<td width="33%">

### 🔵 Agent
- Create & manage sessions
- Share join links with customers
- Schedule future sessions
- Send in-app notifications
- Record calls locally

</td>
<td width="33%">

### 🔴 Admin
- Verify & manage agent accounts
- Approve or reject meeting requests
- Monitor all live sessions
- Force-end any active call
- Send platform-wide notifications

</td>
</tr>
</table>

---

## 🚀 How to Use

### 1. 🔐 Sign Up / Log In  — `/login`

- **Customer** → register with name, email, password
- **Agent** → same as above + **Employee ID** (admin must verify before first login)
- **Admin** → pre-seeded account, no registration needed

After login you are automatically redirected to your role's dashboard.

---

### 2. 🖥️ Agent Dashboard — `/dashboard`

<table>
<tr><td width="30%"><b>📹 New Session</b></td><td>Click to create a session — the join link is instantly copied to your clipboard. Share it with the customer.</td></tr>
<tr><td><b>🟢 Join Call</b></td><td>Once the customer joins the link, the session turns Active. Click <b>Join Call</b> to enter the live video room.</td></tr>
<tr><td><b>📅 Schedule</b></td><td>Pick a date, time, and optionally assign a customer. Appears under the Scheduled tab.</td></tr>
<tr><td><b>🔔 Notify</b></td><td>Send in-app notifications (Info / Success / Warning / Meeting) to selected customers or all at once.</td></tr>
<tr><td><b>📋 History</b></td><td>All sessions with live status badges — <code>🟡 Waiting</code> → <code>🟢 Active</code> → <code>⚫ Ended</code></td></tr>
</table>

---

### 3. 👤 Customer Portal — `/sessions`

<table>
<tr><td width="30%"><b>🔗 Join a Meeting</b></td><td>Paste the full link or token your agent sent you → click <b>Join Now</b>.</td></tr>
<tr><td><b>📅 Schedule a Meeting</b></td><td>Submit a topic, description, and preferred time. The admin reviews and approves/rejects it.</td></tr>
<tr><td><b>🕐 Request Tracking</b></td><td>Track your submitted requests — <code>🕐 Pending</code> / <code>✅ Approved</code> / <code>❌ Rejected</code></td></tr>
<tr><td><b>📋 Session History</b></td><td>View all past calls. Active sessions show a <b>Join Call</b> button to re-enter.</td></tr>
</table>

---

### 4. 🎥 Live Video Room — `/session/[id]`

The call interface — available to both agents and customers.

| Button | Action |
|:---:|:---|
| 🎤 | Toggle microphone on / off |
| 📷 | Toggle camera on / off |
| 💬 | Open / close the side chat panel |
| ⏺ | Start / stop screen recording — saves as `.webm` locally |
| 📞 | End call and return to your dashboard |
| 📋 | Copy room link to share |

> 💡 The **chat panel** supports text messages and file sharing — images, videos, audio, PDFs, and documents. Files are uploaded to storage and broadcast to all participants in real time.

---

### 5. 🛡️ Admin Dashboard — `/admin`

| Tab | What you can do |
|:---:|:---|
| 📊 **Stats** | Live counts — total customers, agents, active meetings, pending requests |
| 👤 **Customers** | View all customers, delete accounts |
| 🔵 **Agents** | Verify pending agents to activate accounts, delete agents, see verified badges |
| 🔔 **Notifications** | Send messages to All Users / Agents Only / Customers Only |
| 📅 **Meetings** | Approve or reject meeting requests · Force-end live sessions · View full session history |

---

## 🎬 How Video Works — Not P2P

> Atomberg does **not** use peer-to-peer video. All media is server-routed through LiveKit — running entirely on your own infrastructure.

### ❌ Why not P2P?

| Problem | Detail |
|:---|:---|
| 🔥 Firewall failures | Direct browser-to-browser connections fail behind corporate NAT |
| 📈 Doesn't scale | Each new participant multiplies upload streams for every other participant |
| 🚫 No control | Can't force-end, monitor, or record calls without a server in the middle |

### ✅ How LiveKit SFU works

```
  Agent Browser  ──▶  LiveKit SFU  ◀──  Customer Browser
                            │
              All media routes through the server
                  (never browser-to-browser)
```

1. Agent creates a session → NestJS backend generates a **signed room token** via LiveKit SDK
2. Both browsers connect to the LiveKit server using their tokens — **not to each other**
3. LiveKit **selectively forwards** each participant's stream to all others
4. When the call ends → backend signals LiveKit to close the room

### P2P vs LiveKit SFU

| Feature | P2P WebRTC | Atomberg (LiveKit) |
|:---|:---:|:---:|
| Works behind firewalls | ❌ Often fails | ✅ Always |
| Admin can force-end a call | ❌ No | ✅ Yes |
| Scales beyond 2 people | ❌ Poor | ✅ Yes |
| Media stays in your infra | ❌ No | ✅ Yes |
| Recording support | ❌ Complex | ✅ Built-in |

> 🔒 Since LiveKit runs in your own Docker container, **no video or audio ever leaves your infrastructure**.

---

## 🔒 Security

| | Measure |
|:---:|:---|
| 🔑 | Passwords hashed with **Bcrypt** (cost factor 10) |
| 🛡️ | All API routes protected with **JWT** tokens |
| ⏱️ | Session join tokens expire after **24 hours** |
| 👁️ | Role-based access — users only see their own data |
| 🏠 | No third-party video services — LiveKit runs on **your server** |

---

## 📁 Project Structure

```
Atomquest-Final/
│
├── frontend/                  ← Next.js application
│   ├── app/
│   │   ├── home/              Landing page
│   │   ├── login/             Authentication
│   │   ├── dashboard/         Agent dashboard
│   │   ├── sessions/          Customer portal
│   │   ├── admin/             Admin dashboard
│   │   └── session/[id]/      Live video room
│   └── components/
│       └── VideoRoom.tsx      LiveKit + Socket.IO integration
│
├── backend/                   ← NestJS API
│   └── src/
│       ├── auth/              Login & registration
│       ├── session/           Video session management
│       ├── chat/              Real-time messaging (Socket.IO)
│       ├── admin/             Admin controls
│       ├── notification/      In-app notifications
│       ├── presence/          Redis-backed user presence
│       ├── storage/           MinIO file storage
│       └── metrics/           Prometheus metrics
│
├── grafana/                   ← Pre-provisioned dashboards
├── prometheus/                ← Metrics scrape config
└── docker-compose.yml         ← Full local stack
```

---

<div align="center">

**Atomberg v1.0** &nbsp;·&nbsp; Built for AtomQuest Hackathon &nbsp;·&nbsp; ![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)

</div>
