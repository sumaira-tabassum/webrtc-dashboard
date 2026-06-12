// Socket.io frontend package.
import { io } from "socket.io-client";

// Immediately connect to your signaling server.
export const socket = io("http://192.168.1.8:3001", {

  // Connection methods. Socket tries: WebSocket and falls back to Polling if needed.
  transports: ["websocket", "polling"],
});