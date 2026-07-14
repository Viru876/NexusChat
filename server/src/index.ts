import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';

import { connectDatabase } from './config/database';
import { initSocket } from './socket';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFound } from './middleware/errorHandler';
import prisma from './config/database';

import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspace';
import channelRoutes from './routes/channel';
import messageRoutes from './routes/message';
import dmRoutes from './routes/dm';
import taskRoutes from './routes/task';

const app: Application = express();
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Trust the first hop proxy (Railway, Render, etc. sit in front of the app
// and set X-Forwarded-For). Required for express-rate-limit to correctly
// identify client IPs behind a reverse proxy.
app.set('trust proxy', 1);

// ---------- Global Middleware ----------
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api', apiLimiter);

// ---------- Health Check ----------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'NexusChat API',
    developer: 'Virendra Singh (IEC2024015)',
    timestamp: new Date().toISOString(),
  });
});

// ---------- REST Routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dms', dmRoutes);
app.use('/api/tasks', taskRoutes);

// ---------- Error Handling ----------
app.use(notFound);
app.use(errorHandler);

// ---------- HTTP + Socket.IO Server ----------
const httpServer = createServer(app);
initSocket(httpServer);

// ---------- Scheduled Jobs ----------
// Every 10 minutes, mark users AWAY if they've been ONLINE but idle beyond a window
// is handled client-side; here we simply keep a heartbeat log.
cron.schedule('*/30 * * * *', async () => {
  try {
    const count = await prisma.user.count();
    console.log(`[cron] Heartbeat — ${count} registered users.`);
  } catch {
    // ignore cron errors
  }
});

// ---------- Start ----------
async function start(): Promise<void> {
  await connectDatabase();

  httpServer.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║      NEXUSCHAT SERVER STARTED        ║
║  Developer: Virendra Singh           ║
║  Enrollment: IEC2024015              ║
║  GitHub: github.com/Viru876          ║
║  College: IIIT Allahabad             ║
╚══════════════════════════════════════╝
Running on port ${PORT}
`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
