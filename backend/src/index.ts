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

const PORT = Number(process.env.PORT) || 5000;

// Define allowed origins list
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean) as string[];

// Dynamic origin checker function
const corsOriginChecker = (
  origin: string | undefined, 
  callback: (err: Error | null, allow?: boolean) => void
) => {
  // Allow requests with no origin (like mobile apps, Postman, or curl)
  if (!origin) return callback(null, true);
  
  // Allow listed origins OR any Vercel deployment preview URL
  if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    return callback(null, true);
  }
  
  return callback(new Error('Not allowed by CORS'));
};

// Initialize Socket.IO before routes
initSocket(server, process.env.CLIENT_URL || 'http://localhost:5173');

// 1. Security & CORS Middlewares (Must be declared before routes)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: corsOriginChecker,
    credentials: true,
  })
);

// 2. Body Parsing Middlewares
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Health Check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// 4. Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// 6. 404 for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// 7. Global error handler
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

// 8. Start Server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});