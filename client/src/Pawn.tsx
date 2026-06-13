interface PawnProps {
  player: number;
  selected: boolean;
}

function Pawn({ player, selected }: PawnProps) {
  return (
    <p
      className={`flex justify-center items-center text-[40px] h-full
        ${selected ? "bg-gray-900/30" : ""}
        ${player === 0
          ? "text-accent1"
          : player === 1
          ? "text-accent2"
          : "text-white"}
      `}
    >
      ⬤
    </p>
  );
}

export default Pawn