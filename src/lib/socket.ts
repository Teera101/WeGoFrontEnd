// safe to call without server
import { io } from 'socket.io-client';

// Use port 10000 for socket connection
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
const apiBase = apiUrl.replace(/\/api\/?$/, '');
const socketUrl = import.meta.env.VITE_SOCKET_URL || apiBase || 'http://localhost:10000';

export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});