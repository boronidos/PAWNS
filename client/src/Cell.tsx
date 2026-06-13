import Pawn from "./Pawn.tsx";

interface CellProps {
  x: number;
  y: number;
  pawn: number;
  selected: boolean;
  highlighted: boolean;
  onCellClick: (x: number, y: number) => void;
}

function Cell({ x, y, pawn, selected, highlighted, onCellClick }: CellProps) {
  const hasPawn = pawn !== -1;
  return (
    <td
      className={`border-gray-300 border-2 w-16 h-16 cursor-pointer transition-colors
    ${highlighted ? "bg-gray-300/20" : "hover:bg-gray-700"}
  `}
      onClick={() => onCellClick(x, y)}
    >
      {hasPawn ? (
        <Pawn player={pawn} selected={selected} />
      ) : (
        <p className="text-center text-gray-500 text-xs font-normal">
          {x}, {y}
        </p>
      )}
    </td>
  );
}

export default Cell;
