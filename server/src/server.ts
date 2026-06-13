import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";

// example comment

const app = express();
const server = http.createServer(app);

type Room = {
  players: string[];
};

const rooms: Record<string, Room> = {};

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket: Socket) => {
  console.log("user connected", socket.id);

  socket.on("create_room", (roomId: string) => {  
    if (rooms[roomId]) {
      socket.emit("error", "Room already exists! Please choose a different name.");
      return; 
    }

    rooms[roomId] = {
      players: [socket.id],
    };

    socket.join(roomId);
    socket.emit("player_assigned", 0);
  });

  socket.on("join_room", (roomId: string) => {
    const room = rooms[roomId];

    if (!room || room.players.length >= 2) {
      socket.emit("error", "Room full or doesn't exist");
      return;
    }

    room.players.push(socket.id);
    socket.join(roomId);

    socket.emit("player_assigned", 1);
    io.to(roomId).emit("start_game");
  });

  socket.on("move", ({ roomId, from, to, value }) => {
    socket.to(roomId).emit("move", { from, to, value });
  });

  socket.on("place", ({ roomId, at, value }) => {
    socket.to(roomId).emit("place", { at, value });
  });

    socket.on("endTurn", ({ roomId, value }) => {
    socket.to(roomId).emit("endTurn", { value });
  });
});

server.listen(3000, () => {
  console.log("Server running on 3000");
});
