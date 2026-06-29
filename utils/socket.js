import { io } from 'socket.io-client';

let socket = null;

export const SERVER_URL = 'http://192.168.7.18:5000'; 

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