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
      socket.emit(
        "error",
        "Room already exists! Please choose a different name.",
      );
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

  socket.on("move", ({ roomId, from, to, value, newPoints }) => {
    socket.to(roomId).emit("move", { from, to, value, newPoints });
  });

  // 1. Update your server placement relay
  socket.on("place", ({ roomId, at, value, pointsLeft }) => {
    // Relays the placement and the placer's updated score directly to the opponent
    socket.to(roomId).emit("place", { at, value, pointsLeft });
  });

  // 2. Update your server turn swap event handler
  socket.on("endTurn", ({ roomId, value, enemyPointsTally }) => {
    // Tells the opponent it's their turn, passing their local point configuration calculations
    socket.to(roomId).emit("endTurn", { currentPoints: enemyPointsTally });

    // Simultaneously alerts the opponent to update their interface tracking values
    socket
      .to(roomId)
      .emit("enemy_turn_started", { enemyPointsTally: enemyPointsTally });
  });

  socket.on("disconnecting", () => {
    const activeRooms = Array.from(socket.rooms);
    if (userActiveRoom && !activeRooms.includes(userActiveRoom)) {
      activeRooms.push(userActiveRoom);
    }

    for (const roomId of activeRooms) {
      if (rooms[roomId]) {
        console.log(`Closing abandoned room framework sequence: ${roomId}`);

        io.to(roomId).emit(
          "error",
          "Your opponent left the game. Room closed!",
        );

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
