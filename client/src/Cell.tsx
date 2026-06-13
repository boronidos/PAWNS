import Pawn from "./Pawn.tsx";

interface CellProps {
  x: number;
  y: number;
  pawn: number;
  selected: boolean;
  highlighted: boolean;
  role: number | null;
  onCellClick: (x: number, y: number) => void;
}

function Cell({ x, y, pawn, selected, highlighted, role, onCellClick }: CellProps) {
  const hasPawn = pawn !== -1;
  
  // Counter-rotate cell if player is Black (role === 1) so assets don't sit upside down
  const isFlipped = role === 1;

  // Row 0 and Row 8 are your invisible/border-free placement zones
  const isOuterRow = y === 0 || y === 8;

  return (
    <td
      className={`transition-all duration-500 text-center items-center justify-center
        ${isOuterRow ? "border-none h-16 w-16" : "border-[rgb(145,129,118)] border-2 w-16 h-16 cursor-pointer"}
        ${isFlipped ? "rotate-180" : ""}
        ${highlighted && (y != 0 || role != 1) && (y != 8 || role != 0)
          ? "bg-gray-600/20" 
          : ((y === 0 && role === 0) || (y === 8 && role === 1) ? "hover:bg-gray-400/20" : "")
        }
      `}
      onClick={() => onCellClick(x, y)}
    >
      {hasPawn ? (
        <Pawn player={pawn} selected={selected} />
      ) : (
        <p className="text-center text-text2 text-xs font-normal"></p>
      )}
    </td>
  );
}

export default Cell;