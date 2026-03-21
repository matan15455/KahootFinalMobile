import { io } from 'socket.io-client';

let socket = null;

export const SERVER_URL = 'http://192.168.7.4:5000'; // שנה ל-IP שלך

export function connectSocket(token) {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SERVER_URL, {
    auth: token ? { token } : {}
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}