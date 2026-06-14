// src/socket.ts
import { io } from "socket.io-client";

const PRODUCTION_URL = "https://pawns-6b0v.onrender.com"; 

export const socket = io(PRODUCTION_URL, {
  transports: ["websocket", "polling"]
});