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
      className={` ${y == 0 || y == 8 ? "border-none h-16 w-16" : "border-[rgb(145,129,118)] border-2 w-16 h-16 cursor-pointer transition-colors"}
      ${highlighted ? "bg-gray-600/20" : "hover:bg-gray-800/20"}}
  `}
      onClick={() => onCellClick(x, y)}
    >
      {hasPawn ? (
        <Pawn player={pawn} selected={selected} />
      ) : (
        <p className="text-center text-text2 text-xs font-normal">
          
        </p>
      )}
    </td>
  );
}

export default Cell;
