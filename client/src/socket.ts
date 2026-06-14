// src/socket.ts
import { io } from "socket.io-client";

const PRODUCTION_URL = "localhost:3000" //"https://pawns-6b0v.onrender.com"; 

export const socket = io(PRODUCTION_URL, {
  transports: ["websocket", "polling"]
});