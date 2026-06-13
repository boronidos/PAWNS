interface PawnProps {
  player: number;
  selected: boolean;
}

function Pawn({ player, selected }: PawnProps) {
  return (
    <p
      className={`flex justify-center items-center text-[40px] h-full
        ${selected ? "bg-gray-300/30" : ""}
        ${player === 0
          ? "text-amber-500"
          : player === 1
          ? "text-purple-600"
          : "text-white"}
      `}
    >
      ⬤
    </p>
  );
}

export default Pawn