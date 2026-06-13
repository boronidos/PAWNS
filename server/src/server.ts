import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";

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

  // Attach a custom string tracking reference directly onto this specific connection
  let userActiveRoom: string | null = null;

  socket.on("create_room", (roomId: string) => {  
    if (rooms[roomId]) {
      socket.emit("error", "Room already exists! Please choose a different name.");
      return; 
    }

    rooms[roomId] = {
      players: [socket.id],
    };

    userActiveRoom = roomId; // Remember this room for this socket instance fallback
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
    userActiveRoom = roomId; // Remember this room for this socket instance fallback
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

  socket.on("disconnecting", () => {
    const activeRooms = Array.from(socket.rooms);
    if (userActiveRoom && !activeRooms.includes(userActiveRoom)) {
      activeRooms.push(userActiveRoom);
    }

    for (const roomId of activeRooms) {
      if (rooms[roomId]) {
        console.log(`Closing abandoned room framework sequence: ${roomId}`);

        io.to(roomId).emit("error", "Your opponent left the game. Room closed!");

        delete rooms[roomId];
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});