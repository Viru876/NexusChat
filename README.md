# NexusChat 💬

<div align="center">

### Real-Time Team Collaboration Platform

> **Where Teams Connect, Create, and Collaborate**

[![Live Demo](https://img.shields.io/badge/Live_Demo-nexuschat--viru876.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://nexuschat-viru876.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Viru876/NexusChat-181717?style=for-the-badge&logo=github)](https://github.com/Viru876/NexusChat)

</div>

---

## 📌 About

NexusChat is a full-stack, enterprise-grade, Slack-inspired collaboration platform built from scratch. It supports real-time messaging across workspaces and channels, multi-party WebRTC video/audio calling with mesh topology, Kanban task management, file sharing via Cloudinary, message threading, reactions, user presence, and an immersive 3D landing page.

---

## 👤 Developer

| Field | Details |
|-------|---------|
| **Name** | Virendra Singh |
| **Enrollment** | IEC2024015 |
| **College** | IIIT Allahabad (IIITA) |
| **Email** | shekhawatvirendrasingh876@gmail.com |
| **GitHub** | [github.com/Viru876](https://github.com/Viru876) |

---

## 🌐 Live Demo

**Frontend:** https://nexuschat-viru876.vercel.app  
**Backend API:** https://nexuschat-server-production-1c58.up.railway.app/api/health

---

## ✨ Features

### Communication
- ⚡ **Real-time messaging** — instant delivery via Socket.IO with typing indicators
- 🧵 **Message threading** — slide-in thread panel for focused discussions
- 😄 **Emoji reactions** — react to any message with emoji picker
- 📌 **Message pinning** — pin important messages, view pinned panel per channel
- 🔍 **Global search** — search across all messages, files, and channels
- 💬 **Direct messages** — 1-on-1 private conversations

### Video & Audio
- 📹 **Multi-party WebRTC calling** — mesh topology group video/audio calls
- 🔄 **TURN relay** — server-generated HMAC-SHA1 credentials for NAT traversal
- 🎛️ **Call controls** — mute, camera toggle, minimize/maximize, end call
- 📲 **Incoming call UI** — ring notification with accept/reject

### Workspace Management
- 🏢 **Multiple workspaces** — create, join, delete, leave workspaces
- 📢 **Channels** — public, private, and announcement channels
- 👥 **Role-based access** — Owner / Admin / Member with permission enforcement
- ✉️ **Invite system** — invite by email with tokenized links (via Resend API)
- 🚪 **Join flow** — shareable workspace join links

### Task Management
- 📋 **Kanban board** — drag-and-drop columns (To Do → In Progress → In Review → Done)
- 🏷️ **Priority levels** — Low / Medium / High / Urgent with color coding
- 👤 **Task assignment** — assign to workspace members with due dates

### Files & Media
- 📁 **File sharing** — upload and share files/images via Cloudinary
- 🖼️ **Inline previews** — images render inline, files show download cards
- 📎 **Paste-to-upload** — paste images from clipboard directly into chat
- 🗂️ **Shared files gallery** — browse all shared files/media per channel

### User Experience
- 🟢 **Presence system** — Online / Away / DND / Offline with custom status messages
- 🔐 **Google OAuth 2.0** — one-click sign-in with ID token verification
- 🔑 **Forgot password** — secure reset flow with SHA-256 hashed tokens
- 🎨 **3D landing page** — animated torus-knot, particle fields, orbital geometries
- 🌙 **Dark premium theme** — glassmorphism UI with indigo/violet accents
- 📱 **Mobile responsive** — collapsible sidebars, touch-friendly on all devices

---

## 🧱 Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| React 18 + TypeScript | UI framework with type safety |
| Vite | Build tool and dev server |
| TailwindCSS | Utility-first styling |
| Framer Motion | Animations and transitions |
| React Three Fiber + Three.js | 3D landing page scene |
| Socket.IO Client | Real-time WebSocket communication |
| simple-peer | WebRTC peer connections |
| Zustand | Lightweight state management |
| @dnd-kit | Drag-and-drop for Kanban |
| @react-oauth/google | Google Sign-In |
| @emoji-mart/react | Emoji picker |
| react-dropzone | File upload drag-and-drop |
| date-fns | Date formatting |
| lucide-react | Icon library |
| axios | HTTP client |
| react-hot-toast | Toast notifications |

### Backend

| Technology | Purpose |
|-----------|---------|
| Node.js + Express + TypeScript | REST API server |
| Socket.IO | Real-time event broadcasting |
| PostgreSQL + Prisma ORM | Database and type-safe queries |
| JWT + bcryptjs | Authentication and password hashing |
| google-auth-library | Google OAuth token verification |
| Cloudinary + Multer | File upload and CDN storage |
| Resend | Transactional email (password reset, invites) |
| Zod | Request validation schemas |
| helmet + cors + express-rate-limit | Security middleware |

---

## 📁 Project Structure

```
nexuschat/
├── server/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema (12 models)
│   ├── src/
│   │   ├── config/                # Database & Cloudinary config
│   │   ├── controllers/           # Route handlers (auth, workspace, channel, message, dm, task)
│   │   ├── middleware/            # Auth, error handling, rate limiting, file upload
│   │   ├── routes/                # Express route definitions
│   │   ├── socket/                # Socket.IO handlers (chat, presence, video signaling)
│   │   ├── utils/                 # JWT, email, validators
│   │   └── index.ts              # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── api/                   # Axios instance
│   │   ├── store/                 # Zustand stores (auth, workspace, message, call, socket)
│   │   ├── hooks/                 # Custom hooks (useSocket, useWebRTC, usePresence)
│   │   ├── components/
│   │   │   ├── layout/            # AppLayout, WorkspaceSidebar, ChannelSidebar
│   │   │   ├── chat/              # MessageList, MessageItem, MessageInput, Thread, Search, Pinned, SharedFiles
│   │   │   ├── video/             # VideoCall, VideoGrid, CallControls
│   │   │   ├── tasks/             # KanbanBoard, TaskCard, TaskModal
│   │   │   ├── three/             # HeroScene, FloatingCubes (3D)
│   │   │   ├── landing/           # Navbar, ChatPreview, DemoSection, Testimonials
│   │   │   └── ui/                # Avatar, Badge, Modal, Tooltip, Loader, GoogleSignInButton
│   │   ├── pages/                 # Landing, Login, Register, Workspace, Channel, DM, Profile, ForgotPassword, ResetPassword, JoinWorkspace
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── App.tsx               # Router setup
│   │   └── main.tsx              # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── vercel.json               # SPA rewrite rules
├── .gitignore
└── README.md
```

---

## 🗄️ Database Schema

PostgreSQL with Prisma ORM — 12 interconnected models:

| Model | Description |
|-------|-------------|
| `User` | Accounts with avatar, status, custom status |
| `Workspace` | Team spaces with slug, icon, owner |
| `WorkspaceMember` | Many-to-many with roles (OWNER/ADMIN/MEMBER) |
| `Channel` | Public/Private/Announcement channels within workspaces |
| `ChannelMember` | Channel membership with lastReadAt tracking |
| `Message` | Text/File/Image/System messages with threading support |
| `Reaction` | Emoji reactions (unique per user+message+emoji) |
| `DirectMessage` | 1-on-1 DM conversations |
| `Task` | Kanban tasks with status, priority, assignee, due date |
| `PasswordResetToken` | SHA-256 hashed tokens with expiry |

---

## 🔌 Socket.IO Events

### Chat
| Client Emits | Server Broadcasts |
|-------------|-------------------|
| `join_channel` | — |
| `send_message` | `message:new` |
| `edit_message` | `message:edited` |
| `delete_message` | `message:deleted` |
| `add_reaction` / `remove_reaction` | `reaction:updated` |
| `typing_start` / `typing_stop` | `typing:start` / `typing:stop` |

### Presence
| Client Emits | Server Broadcasts |
|-------------|-------------------|
| `set_status` | `presence:update` |
| `set_custom_status` | `presence:update` |
| (connect) | `presence:update` (ONLINE) |
| (disconnect) | `presence:update` (OFFLINE) |

### Video Calling (WebRTC Signaling)
| Client Emits | Server Relays |
|-------------|---------------|
| `call_initiate` | `call:incoming` (to callees) |
| `call_join` | `call:existing_participants` + `call:participant_joined` |
| `call_leave` | `call:participant_left` |
| `call_reject` | `call:rejected` |
| `offer` / `answer` / `ice_candidate` | relayed peer-to-peer |

---

## 📹 WebRTC Architecture

```
┌─────────────┐         Socket.IO          ┌─────────────┐
│   Peer A    │◄──── signaling relay ──────►│   Peer B    │
│ (initiator) │                             │ (responder) │
└──────┬──────┘                             └──────┬──────┘
       │          TURN Server (relay)              │
       │     (staticauth.openrelay.metered.ca)     │
       └──────────── media stream ─────────────────┘
```

- **Mesh topology**: each participant maintains a direct peer connection to every other participant
- **TURN credentials**: server generates time-limited HMAC-SHA1 credentials per call
- **Singleton engine**: module-level peer management avoids React lifecycle race conditions
- **simple-peer**: wraps RTCPeerConnection with a clean stream-based API

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL (local or cloud — [Neon](https://neon.tech) recommended)
- Cloudinary account ([free signup](https://cloudinary.com/users/register_free))

### 1. Clone

```bash
git clone https://github.com/Viru876/NexusChat.git
cd NexusChat
```

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env      # Fill in your values (see .env.example for all keys)
npx prisma generate       # Generate Prisma client
npx prisma db push        # Push schema to database
npm run dev               # Starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd client
npm install
cp .env.example .env      # Set VITE_API_URL and VITE_SOCKET_URL
npm run dev               # Starts on http://localhost:5173
```

### 4. Use It

1. Open `http://localhost:5173`
2. Register an account
3. Create a workspace
4. Invite friends or open in another browser/incognito
5. Chat, call, manage tasks!

---

## 🔐 Environment Variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RESEND_API_KEY` | Resend.com API key for emails |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `CLIENT_URL` | Frontend URL (CORS) |

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Socket.IO server URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

---

## 📡 API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create account |
| POST | `/login` | Email/password login |
| POST | `/google` | Google OAuth sign-in |
| POST | `/logout` | Clear session |
| GET | `/me` | Current user |
| PUT | `/profile` | Update profile/avatar |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password` | Reset password with token |

### Workspaces — `/api/workspaces`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create workspace |
| GET | `/` | List my workspaces |
| GET | `/:id` | Workspace details |
| GET | `/:id/preview` | Public preview (for join page) |
| POST | `/:id/join` | Join workspace |
| POST | `/:id/invite` | Invite by email |
| POST | `/:id/leave` | Leave workspace |
| DELETE | `/:id` | Delete workspace (owner only) |
| DELETE | `/:id/members/:userId` | Remove member |

### Channels — `/api/channels`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create channel |
| GET | `/workspace/:wid` | List channels |
| GET | `/:id/messages` | Paginated messages |
| DELETE | `/:id` | Delete channel |

### Messages — `/api/messages`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Send message (with file) |
| GET | `/:id/thread` | Thread replies |
| GET | `/search` | Search messages |
| POST | `/:id/pin` | Pin/unpin message |
| GET | `/pinned` | Pinned messages |
| GET | `/files` | Shared files gallery |

### Direct Messages — `/api/dms`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Get or create DM |
| GET | `/` | List my DMs |
| GET | `/:id/messages` | DM messages |

### Tasks — `/api/tasks`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create task |
| GET | `/workspace/:wid` | Tasks by workspace |
| PUT | `/:id` | Update task |
| POST | `/:id/assign` | Assign task |
| DELETE | `/:id` | Delete task |

---

## 🏗️ Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://nexuschat-viru876.vercel.app |
| Backend | Railway | https://nexuschat-server-production-1c58.up.railway.app |
| Database | Neon (PostgreSQL) | Managed cloud |
| File Storage | Cloudinary | CDN delivery |
| Email | Resend | Transactional API |

---

## 📸 Screenshots

| Landing Page | Chat Interface |
|:---:|:---:|
| 3D animated hero with torus-knot | Real-time messaging with reactions |

| Video Call | Kanban Board |
|:---:|:---:|
| Multi-party mesh WebRTC | Drag-and-drop task management |

---

## 📄 License

MIT — Virendra Singh, 2025

---

<div align="center">

**Crafted with ❤️ by Virendra Singh**  
IEC2024015 | IIIT Allahabad  
[GitHub](https://github.com/Viru876) · [Email](mailto:shekhawatvirendrasingh876@gmail.com)

</div>
