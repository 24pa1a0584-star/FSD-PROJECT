import { io } from 'socket.io-client';

// In production, when frontend and backend are hosted on the same origin on Render,
// use same-origin (window.location.origin or relative connection).
// In development, fall back to localhost:5000 if VITE_SOCKET_URL is unset.
const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.PROD) {
    return typeof window !== 'undefined' ? window.location.origin : undefined;
  }
  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

let socket = null;

export const initSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token: token || localStorage.getItem('token') },
    withCredentials: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    // Socket connected
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket.IO] Connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
