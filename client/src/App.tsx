import { useState, useEffect } from "react";
import Cell from "./Cell";
import { socket } from "./socket";

function App() {
  // Room & Network State
  const [roomInput, setRoomInput] = useState("");
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [playerRole, setPlayerRole] = useState<number | null>(null); // 0 = Player 1 (White), 1 = Player 2 (Black)
  const [gameStarted, setGameStarted] = useState(false);

  // Gameplay State
  const [playing, setPlaying] = useState(false);
  const [actions, setActions] = useState(2);
  const [state, setState] = useState("placing");
  const [selectedPawn, setSelectedPawn] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [board, setBoard] = useState(() =>
    Array.from({ length: 9 }, () => Array(7).fill(-1)),
  );

  const isFlipped = playerRole === 1;

  //#region networking

  // Socket Event Listeners
  useEffect(() => {
    socket.on("player_assigned", (role: number) => {
      setPlayerRole(role);
      setPlaying(role === 0);
    });

    socket.on("start_game", () => {
      setGameStarted(true);
      alert("Game started! Player 0's turn.");
    });

    socket.on("error", (msg: string) => {
      alert(msg);
      setCurrentRoom(null);
      setPlayerRole(null);
    });

    socket.on("place", ({ at, value }) => {
      setBoard((prev) => {
        const newBoard = prev.map((row) => [...row]);
        newBoard[at.y][at.x] = value;
        return newBoard;
      });
    });

    socket.on("move", ({ from, to, value }) => {
      setBoard((prev) => {
        const newBoard = prev.map((row) => [...row]);
        newBoard[from.y][from.x] = -1;
        newBoard[to.y][to.x] = value;
        return newBoard;
      });
    });

    socket.on("endTurn", () => {
      setPlaying(true);
      setActions(2);
      setState("placing");
    });

    return () => {
      socket.off("player_assigned");
      socket.off("start_game");
      socket.off("error");
      socket.off("place");
      socket.off("move");
      socket.off("endTurn");
    };
  }, []);

  // Lobby Handlers
  function handleCreateRoom() {
    if (!roomInput.trim()) return;
    setCurrentRoom(roomInput);
    socket.emit("create_room", roomInput);
  }

  function handleJoinRoom() {
    if (!roomInput.trim()) return;
    setCurrentRoom(roomInput);
    socket.emit("join_room", roomInput);
  }

  //#endregion

  const highlighted = new Set(
    selectedPawn
      ? getAdjacentCells(selectedPawn.x, selectedPawn.y).map(
          (c) => `${c.x},${c.y}`,
        )
      : [],
  );

  function getAdjacentCells(x: number, y: number) {
    return [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ];
  }

  // Game Logic Handlers
  function toggleTurn() {
    if (!playing) return;

    setPlaying(false);
    setSelectedPawn(null);
    socket.emit("endTurn", { roomId: currentRoom, value: playerRole });
  }

  function onCellClick(x: number, y: number) {
    if (!playing || !gameStarted) return;

    if (state === "placing") placePawn(x, y);
    else if (state === "selecting") selectPawn(x, y);
    else if (state === "moving") movePawn(x, y);
  }

  function placePawn(x: number, y: number) {
    if (actions <= 0) return;
    if (board[y][x] !== -1) return;

    if (playerRole === 1 && y !== 7) return;
    if (playerRole === 1 && y !== 0) return;

    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((row) => [...row]);
      newBoard[y][x] = playerRole;
      return newBoard;
    });

    setActions((prev) => prev - 1);

    socket.emit("place", {
      roomId: currentRoom,
      at: { x, y },
      value: playerRole,
    });
  }

  function movePawn(x: number, y: number) {
    if (!selectedPawn) return;
    if (actions <= 0) return;

    const fromX = selectedPawn.x;
    const fromY = selectedPawn.y;

    if (Math.abs(y - fromY) + Math.abs(x - fromX) > 1) return;
    if (board[y][x] == board[fromY][fromX]) return;

    setBoard((prev) => {
      const newBoard = prev.map((row) => [...row]);
      const value = newBoard[fromY][fromX];
      newBoard[fromY][fromX] = -1;
      newBoard[y][x] = value;
      return newBoard;
    });

    setSelectedPawn(null);
    setState("selecting");
    setActions((prev) => prev - 1);

    socket.emit("move", {
      roomId: currentRoom,
      from: { x: fromX, y: fromY },
      to: { x, y },
      value: playerRole,
    });
  }

  function selectPawn(x: number, y: number) {
    if (board[y][x] !== playerRole) return;

    setSelectedPawn({ x, y });
    setState("moving");
  }

  // Lobby View
  if (!currentRoom) {
    return (
      <section className="bg-bg w-screen h-screen flex flex-col items-center justify-center font-bold text-text">
        <h1 className="text-4xl mb-8">PAWNS</h1>
        <div className="bg-card-bg p-8 rounded-2xl shadow-2xl flex flex-col gap-4 w-80">
          <label className="text-sm tracking-wide text-lobby-text">
            ROOM ID
          </label>
          <input
            type="text"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            placeholder="Enter room code..."
            className="p-3 rounded-xl bg-bg text-text outline-none border border-input-border focus:border-text transition-colors"
          />
          <div className="flex gap-2 mt-2 text-white">
            <button
              onClick={handleCreateRoom}
              className="flex-1 bg-accent1 hover:bg-accent1-hover p-3 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              Create
            </button>
            <button
              onClick={handleJoinRoom}
              className="flex-1 bg-accent2 hover:bg-accent2-hover p-3 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              Join
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Game View
  return (
    <section className="bg-bg w-screen h-screen p-10 font-bold flex flex-col items-center justify-center relative">
      {/* Top Status Bar */}
      <div className="absolute top-6 flex flex-col items-center gap-1 text-white">
        <p className="text-xl text-text2">
          {/* Room: {currentRoom} | You: Player {playerRole} ({playerRole === 0 ? "White" : "Black"}) */}
        </p>
        {!gameStarted ? (
          <p className="text-accent1 animate-pulse">
            Waiting for an opponent to join...
          </p>
        ) : (
          <p className="text-2xl text-text2">
            {playing ? "Your Turn" : "Enemy Turn"} | Actions Left: {actions}
          </p>
        )}
      </div>

      {/* Game Table — Flipped via CSS rotation if player is Player 1 */}
      <table 
        className={`transition-transform duration-500 ${
          !gameStarted ? "opacity-30 pointer-events-none" : ""
        } ${isFlipped ? "rotate-180" : ""}`}
      >
        <tbody>
          {board.map((row, y) => (
            <tr key={y}>
              {row.map((pawn, x) => (
                <td 
                  key={`${x}-${y}`} 
                  className={` ${y == 0 || y== 6}transition-transform duration-500 ${isFlipped ? "rotate-180" : ""}`}
                >
                  <Cell
                    x={x}
                    y={y}
                    pawn={pawn}
                    selected={selectedPawn?.x === x && selectedPawn?.y === y}
                    highlighted={highlighted.has(`${x},${y}`)}
                    onCellClick={onCellClick}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Action Buttons */}
      <div
        className={`mt-8 flex gap-4 ${!playing || !gameStarted ? "opacity-50 pointer-events-none" : ""}`}
      >
        <button
          type="button"
          onClick={() => setState("placing")}
          className={`p-4 rounded-xl font-bold transition-all w-36 shadow-lg cursor-pointer ${
            state === "placing"
              ? "bg-accent1 text-white"
              : "bg-gray-400 text-gray-800"
          }`}
        >
          Place mode
        </button>

        <button
          type="button"
          onClick={() => setState("selecting")}
          className={`p-4 rounded-xl font-bold transition-all w-36 shadow-lg cursor-pointer ${
            state === "selecting" || state === "moving"
              ? "bg-accent1 text-white"
              : "bg-gray-400 text-gray-800"
          }`}
        >
          Move mode
        </button>

        <button
          type="button"
          onClick={toggleTurn}
          className="p-4 rounded-xl bg-accent2 hover:bg-accent2-hover text-white font-bold transition-all w-36 shadow-lg cursor-pointer active:scale-95"
        >
          End Turn
        </button>
      </div>
    </section>
  );
}

export default App;