import 'dotenv/config'; // must stay the first import
import express, { NextFunction, Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initSocket } from './socket';
import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import interactionRoutes from './routes/interaction.routes';
import userRoutes from './routes/user.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';
import multer from 'multer';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in .env');
}

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const PORT = Number(process.env.PORT) || 5000;

initSocket(server, CLIENT_URL);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller' : err.message,
    });
  }
  if (err.message?.startsWith('Only JPG')) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});