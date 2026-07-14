# NexusChat 💬

### Real-Time Team Collaboration Platform

> Where Teams Connect, Create, and Collaborate

NexusChat is a Slack-inspired, production-ready real-time collaboration platform featuring workspaces, channels, direct messages, WebRTC video/audio calling, a Kanban task board, file sharing, message reactions, threading, presence, and a stunning 3D landing page.

---

**Developer:** Virendra Singh
**Enrollment:** IEC2024015
**College:** IIIT Allahabad (IIITA)
**Email:** shekhawatvirendrasingh876@gmail.com
**GitHub:** https://github.com/Viru876
**Live Demo:** https://nexuschat.vercel.app

---

## ✨ Features

- ⚡ **Real-time messaging** with Socket.IO (typing indicators, reactions, threading)
- 📹 **WebRTC video/audio calling** powered by `simple-peer`
- 📋 **Kanban task management** with drag & drop (`@dnd-kit`)
- 📁 **File sharing** with Cloudinary uploads and inline previews
- 😄 **Message reactions** with an emoji picker
- 🧵 **Message threading** in a slide-in panel
- 🟢 **User presence** (Online / Away / DND / Offline) with custom statuses
- 🏢 **Multiple workspaces** and public/private channels
- 💬 **Direct messaging** (1-on-1)
- 🔍 **Message search** across channels
- 🎨 **Beautiful 3D landing page** built with React Three Fiber

## 🧱 Tech Stack

| Layer      | Technologies                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------- |
| Frontend   | React 18, TypeScript, Vite, TailwindCSS, Framer Motion, React Three Fiber, Three.js          |
| Realtime   | Socket.IO (client + server), simple-peer (WebRTC)                                            |
| State      | Zustand                                                                                       |
| Backend    | Node.js, Express, TypeScript, Socket.IO                                                       |
| Database   | PostgreSQL, Prisma ORM                                                                        |
| Auth       | JWT, bcryptjs, httpOnly cookies                                                              |
| Uploads    | Cloudinary, Multer                                                                           |
| Security   | helmet, cors, express-rate-limit, zod validation                                            |
| Email      | nodemailer                                                                                    |

## 🚀 Setup

### Prerequisites

- Node.js >= 18
- PostgreSQL database (local or hosted, e.g. Neon/Supabase)
- Cloudinary account (for file uploads)

### 1. Clone the repository

```bash
git clone https://github.com/Viru876/nexuschat.git
cd nexuschat
```

### 2. Backend setup

```bash
cd server
npm install
cp .env.example .env      # then fill in your values
npm run db:generate       # generate Prisma client
npm run db:push           # push schema to your database
npm run dev               # starts server on http://localhost:5000
```

### 3. Frontend setup

```bash
cd client
npm install
cp .env.example .env      # then fill in your values
npm run dev               # starts client on http://localhost:5173
```

### 4. Open the app

Visit `http://localhost:5173`, register an account, create a workspace, and start collaborating.

## 📡 API Documentation

Base URL: `/api`

### Auth (`/api/auth`)

| Method | Endpoint          | Description                       |
| ------ | ----------------- | --------------------------------- |
| POST   | `/register`       | Register a new user               |
| POST   | `/login`          | Login and receive JWT cookie      |
| POST   | `/logout`         | Clear auth cookie                 |
| GET    | `/me`             | Get the current authenticated user|
| PUT    | `/profile`        | Update profile + avatar upload    |

### Workspaces (`/api/workspaces`)

| Method | Endpoint            | Description                     |
| ------ | ------------------- | ------------------------------- |
| POST   | `/`                 | Create a workspace              |
| GET    | `/`                 | Get my workspaces               |
| GET    | `/:id`              | Get a workspace with details    |
| POST   | `/:id/join`         | Join a workspace                |
| POST   | `/:id/invite`       | Invite a member (ADMIN/OWNER)   |

### Channels (`/api/channels`)

| Method | Endpoint                        | Description                  |
| ------ | ------------------------------- | ---------------------------- |
| POST   | `/`                             | Create a channel             |
| GET    | `/workspace/:workspaceId`       | Get channels for a workspace |
| GET    | `/:id/messages`                 | Get paginated channel messages |

### Messages (`/api/messages`)

| Method | Endpoint                    | Description                 |
| ------ | --------------------------- | --------------------------- |
| POST   | `/`                         | Send a message (with file)  |
| GET    | `/:id/thread`               | Get thread replies          |
| GET    | `/search`                   | Search messages             |

### Direct Messages (`/api/dms`)

| Method | Endpoint            | Description                 |
| ------ | ------------------- | --------------------------- |
| POST   | `/`                 | Get or create a DM          |
| GET    | `/`                 | Get my DMs                  |
| GET    | `/:id/messages`     | Get paginated DM messages   |

### Tasks (`/api/tasks`)

| Method | Endpoint                      | Description                 |
| ------ | ----------------------------- | --------------------------- |
| POST   | `/`                           | Create a task               |
| GET    | `/workspace/:workspaceId`     | Get tasks grouped by status |
| PUT    | `/:id`                        | Update a task               |
| POST   | `/:id/assign`                 | Assign a task               |
| DELETE | `/:id`                        | Delete a task               |

## 🧩 Architecture

### Socket.IO events

Client and server agree on the following event names:

- `join_workspace`, `join_channel`, `leave_channel`
- `send_message` → `message:new`
- `edit_message` → `message:edited`
- `delete_message` → `message:deleted`
- `add_reaction` / `remove_reaction` → `reaction:updated`
- `typing_start` → `typing:start`, `typing_stop` → `typing:stop`
- `mark_read`
- `set_status`, `set_custom_status` → `presence:update`
- `channel:created`, `member:joined`

### WebRTC flow

1. Caller emits `call_initiate` → callee receives `call:incoming`.
2. Callee emits `call_answer` → caller receives `call:answered`.
3. Peers exchange `offer`, `answer`, and `ice_candidate` events relayed by the server.
4. Either side emits `call_end` → both receive `call:ended`.

Media is captured via `getUserMedia` and the peer connection is managed by `simple-peer`.

## 📄 License

MIT — Virendra Singh, 2025
