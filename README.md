# 🎥 Atomberg - Personal Video Chat Service

```
═══════════════════════════════════════════════════════════════
  Secure • Private • Self-Hosted • Real-Time Video Calling
═══════════════════════════════════════════════════════════════
```

---

## 💡 What is Atomberg?

Atomberg is a **personal video chat service** that lets you have video calls with complete privacy and control. Everything runs on your own servers—no third-party services, no data shared with external companies.

### Simple Explanation

Think of Atomberg like a **private phone call system** but with video. 

- **Person A** (Agent) creates a chat session and sends a link
- **Person B** (Customer) clicks the link and joins
- They can video call, text chat, and even record the conversation
- **Everything stays private** on your server

---

## ✨ What Can You Do?

### 👤 Customers
- Join video calls via a link
- See and hear the agent clearly
- Send text messages during the call
- Leave whenever you want

### 💼 Agents (Support Staff)
- Create video call sessions
- Share links with customers
- Record conversations for quality assurance
- See performance stats
- Send text messages to customers

### 👨‍💼 Admins
- See all conversations happening
- Manage users and their roles
- View system health and metrics
- Monitor call quality
- Access all recordings

---

## 🚀 How It Works (3 Steps)

### 1️⃣ Agent Creates Session
```
Agent clicks "New Chat" → Link is generated → Link is sent to customer
```

### 2️⃣ Customer Joins
```
Customer opens link in browser → Automatically connected → Video starts
```

### 3️⃣ Real-time Communication
```
Video ✅  Audio ✅  Chat ✅  Recording ✅
```

**No installation needed. Just open in browser.**

---

## 🔧 Tech Stack (What Powers It)

| Layer | Technology |
|-------|-----------|
| **Website** | Next.js + React |
| **Server** | NestJS |
| **Database** | PostgreSQL |
| **Video** | LiveKit (Self-hosted) |
| **Real-time Messages** | Socket.IO |
| **Cache** | Redis |

**In Simple Terms:** Everything is built with modern, reliable technologies. LiveKit handles the video calling, and we store data securely on PostgreSQL.

---

## 🎯 Key Features

### Core Features
- ✅ HD Video Calling
- ✅ Clear Audio
- ✅ Text Chat During Calls
- ✅ Session History
- ✅ Secure Links (Tokens expire after 24 hours)

### Premium Features
- ✅ Call Recording
- ✅ Admin Dashboard
- ✅ System Monitoring
- ✅ User Management
- ✅ Performance Metrics

---

## 🔒 Security & Privacy

```
✅ NO Third-Party APIs
   Your data never leaves your server

✅ Self-Hosted
   Complete control and ownership

✅ Encrypted Connections
   All data is encrypted

✅ Role-Based Access
   Each user only sees what they should

✅ Token Expiration
   Links expire automatically (24 hours)
```

---

## ⚠️ NOT Peer-to-Peer (This is Good!)

### What's the Difference?

**Peer-to-Peer (❌ Old Way):**
- Direct connection between users
- Fails behind firewalls
- Unreliable in corporate networks

**Atomberg (✅ Better Way):**
- Server routes all video
- Works everywhere (behind any firewall)
- Reliable and stable
- Can record conversations
- Multiple people can join later

---

## 📹 LiveKit - The Video Engine

LiveKit is the technology that handles all video calling. Think of it as a sophisticated switchboard operator for video calls:

- **Receives** video from Customer
- **Receives** video from Agent
- **Optimizes** quality based on connection speed
- **Sends** best video to each person
- **Records** the conversation

**Why LiveKit?** It's:
- ✅ Self-hosted (runs on your server)
- ✅ Production-grade (used by companies worldwide)
- ✅ Open-source (no vendor lock-in)
- ✅ Easy to set up (Docker image)

---

## 🚀 Quick Start

### Requirements
- Docker installed
- ~5 minutes

### Setup

**1. Start Everything**
```bash
docker-compose up -d
```

**2. Run Backend**
```bash
cd backend
npm install
npm run start:dev
```

**3. Run Frontend**
```bash
cd frontend
npm install
npm run dev
```

**4. Open in Browser**
```
http://localhost:3000
```

### Demo Accounts

```
ADMIN:
  Email: admin@atomberg.com
  Password: admin123

AGENT:
  Email: agent@atomberg.com
  Password: agent123

CUSTOMER:
  Email: customer@atomberg.com
  Password: customer123
```

---

## 📊 The Three User Types

### 🟢 Customer
**What they do:** Join video calls

**Can:**
- Join a session via link
- Turn camera/mic on/off
- Send messages
- See call history

**Cannot:**
- Create new sessions
- See other people's calls
- Access admin panel

---

### 🟡 Agent
**What they do:** Support customers through video

**Can:**
- Create new sessions
- Share links with customers
- Start recording
- See their performance stats
- Send messages
- View their own call history

**Cannot:**
- See other agents' calls
- Manage users
- Access system metrics

---

### 🔴 Admin
**What they do:** Manage the entire system

**Can:**
- See ALL calls happening
- Manage users (add, remove, change roles)
- View system health
- Access all recordings
- See performance metrics
- Monitor who's online

**Cannot:**
- Modify core system settings (direct database access)

---

## 📱 Dashboards Overview

### Customer Dashboard
```
┌─────────────────────────┐
│ Welcome, John!          │
├─────────────────────────┤
│ 🔗 Join Session         │
│ 📋 My Call History      │
│ ⏱️  Total Support Time   │
└─────────────────────────┘
```

### Agent Dashboard
```
┌─────────────────────────┐
│ Agent Panel             │
├─────────────────────────┤
│ ➕ Create New Chat      │
│ 📹 Active Sessions      │
│ 📊 My Stats             │
│ 🎥 Recordings           │
└─────────────────────────┘
```

### Admin Dashboard
```
┌─────────────────────────┐
│ System Administration   │
├─────────────────────────┤
│ 👥 User Management      │
│ 🎥 All Sessions         │
│ 📊 System Health        │
│ 📈 Metrics              │
└─────────────────────────┘
```

---

## 🔐 How Your Data Stays Safe

1. **Password Protection** - Passwords are hashed (cannot be read)
2. **Token-Based Login** - Secure login without sending passwords
3. **Encrypted Connections** - All data travels through secure channels
4. **Role-Based Access** - Users only access their own data
5. **No Third Parties** - Data never leaves your server

---

## 📋 Features Checklist

| Feature | Status | Who Uses It |
|---------|--------|-----------|
| Video Calling | ✅ | Everyone |
| Audio Calling | ✅ | Everyone |
| Text Chat | ✅ | Everyone |
| Recording | ✅ | Agents + Admins |
| Call History | ✅ | Everyone |
| User Management | ✅ | Admins |
| System Metrics | ✅ | Admins |
| Mute Controls | ✅ | Everyone |
| Session Links | ✅ | Agents |
| Role-Based Access | ✅ | All Roles |

---

## 🎯 System Status

```
✅ Backend: NestJS (Node.js)
✅ Frontend: Next.js + React
✅ Database: PostgreSQL
✅ Video: LiveKit (Self-hosted)
✅ Real-time: Socket.IO + Redis
✅ Security: JWT + Bcrypt
✅ Status: Production Ready
```

---

## 💬 How to Use - Simple Example

### Scenario: Customer Needs Help

**Step 1: Agent Perspective**
1. Agent logs in
2. Clicks "Create New Chat"
3. Gets a link: `atomberg.com/join/abc123`
4. Sends link to customer

**Step 2: Customer Perspective**
1. Customer clicks the link
2. Browser opens automatically
3. See agent's camera and hear audio
4. Can send text messages
5. Agent can record the call

**Step 3: After the Call**
1. Recording is saved
2. Both see it in their history
3. Customer can rate the support
4. Agent can review the recording

---

## ❓ FAQ

**Q: Is my data safe?**  
A: Yes! Everything stays on your own server. No data goes to external companies.

**Q: Do customers need to install anything?**  
A: No! Just click the link and use their browser.

**Q: Can I use this for business?**  
A: Yes! It's perfect for customer support teams.

**Q: What if I have 100 customers?**  
A: Atomberg can handle multiple calls simultaneously.

**Q: Can I record calls?**  
A: Yes! Agents and admins can record for quality assurance.

**Q: What happens if someone's internet is slow?**  
A: The video quality automatically adjusts to work smoothly.

---

## 📞 Support

- **Setup Issues?** Check the full `ARCHITECTURE.md` guide
- **Demo Problems?** See `DEMO_SCRIPT.md` for step-by-step walkthrough
- **API Documentation?** Check backend controllers in `src/` folder

---

## 🎓 Understanding the Architecture (Simple Version)

**Without getting technical:**

```
Customer → Clicks Link → Frontend Website → Backend Server → LiveKit Video Service
                ↑                                              ↓
                └──────────── Sends Live Video ──────────────┘
```

That's it! The backend connects customers to the video service, and LiveKit handles the video calling.

---

## 📦 File Structure

```
Atomberg/
├── frontend/          - Website (what users see)
├── backend/           - Server (handles requests)
├── docker-compose.yml - Database & video setup
└── README.md          - This file
```

---

## ✨ Summary

Atomberg is a **simple, secure video chat service** for businesses.

- 🎯 **Easy to use** - Just click a link
- 🔒 **Completely private** - Everything on your server
- 💼 **Professional** - Perfect for customer support
- ✅ **Works everywhere** - Behind firewalls, corporate networks, etc.

**Ready to get started?** Follow the Quick Start section above!

---

**Atomberg v1.0.0 • Production Ready ✅**

*A personal video chat service with complete control and privacy.*
