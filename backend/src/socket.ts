import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server | null = null;

export const initSocket = (server: http.Server, clientUrl: string): Server => {
  io = new Server(server, {
    cors: { origin: clientUrl, methods: ['GET', 'POST'], credentials: true },
  });

  // Authenticate every socket using the JWT sent in the handshake
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('Unauthorized'));

      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id?: string;
        userId?: string;
      };
      // ASSUMPTION: adjust to match what your auth controller signs into the token
      const userId = payload.id ?? payload.userId;
      if (!userId) return next(new Error('Unauthorized'));

      socket.data.userId = userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;

    // Each user gets a private room named after their own id
    socket.join(userId);

    socket.on('typing', ({ receiverId }: { receiverId?: string }) => {
      if (typeof receiverId === 'string') {
        io!.to(receiverId).emit('user_typing', { senderId: userId });
      }
    });

    socket.on('stop_typing', ({ receiverId }: { receiverId?: string }) => {
      if (typeof receiverId === 'string') {
        io!.to(receiverId).emit('user_stop_typing', { senderId: userId });
      }
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.IO has not been initialised');
  return io;
};