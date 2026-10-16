import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;
let tokenInUse: string | null = null;

// Returns a connected, authenticated socket (or null if not logged in).
// If the token changed (new login), the old socket is replaced.
export const connectSocket = (): Socket | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  if (socket && tokenInUse === token) return socket;

  socket?.disconnect();
  tokenInUse = token;
  socket = io(SOCKET_URL, { auth: { token } });
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  return socket;
};

// Call this on logout
export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
  tokenInUse = null;
};