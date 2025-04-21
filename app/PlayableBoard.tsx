import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { PlayableBoard, getPipeType, getPipeOrientation } from "@/utils/Pipes";
import { useState } from "react";

const fetcher = (n: number): (() => Promise<Array<string>>) => {
  return () => fetch(`/${n}.json`).then((res) => res.json());
};

export default function GameBoard({ n }: { n: number }) {
  const { data: solutions } = useSWR<Array<string>>(String(n), fetcher(n));
  const [board, setBoard] = useState<PlayableBoard | null>(null);
  const [rotationCounts, setRotationCounts] = useState<number[]>([]);

  if (!solutions) return null;

  // Initialize board if solutions are available and board is null
  if (!board && solutions.length > 0) {
    const randomSolution =
      solutions[Math.floor(Math.random() * solutions.length)];
    const newBoard = new PlayableBoard(randomSolution);
    setBoard(newBoard);
    // Initialize rotation counts based on getPipeOrientation
    const initialRotations = newBoard.state.map((pipe) =>
      getPipeOrientation(pipe)
    );
    setRotationCounts(initialRotations);
    return null;
  }

  if (!board) return null;

  const handlePipeClick = (index: number) => {
    const newBoard = new PlayableBoard(
      solutions[Math.floor(Math.random() * solutions.length)]
    );
    newBoard.state = [...board.state];
    newBoard.turn(index);
    setBoard(newBoard);

    // Update rotation count for the clicked pipe
    const newRotationCounts = [...rotationCounts];
    newRotationCounts[index] = rotationCounts[index] + 1;
    setRotationCounts(newRotationCounts);
  };

  return (
    <div>
      <Button>See Solution</Button>
      <Button>Reset</Button>
      <div
        className="grid w-1/2 aspect-square mx-auto my-4"
        style={{
          gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${n}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: n * n }).map((_, index) => (
          <div
            key={index}
            className="border border-gray-300 bg-white cursor-pointer"
            onClick={() => handlePipeClick(index)}
          >
            <img
              src={`/type${getPipeType(board.state[index])}.svg`}
              className="w-full h-full transition-transform duration-200"
              style={{
                transform: `rotate(${rotationCounts[index] * 90}deg)`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
