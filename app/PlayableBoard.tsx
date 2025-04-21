import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { PlayableBoard, getPipeType } from "@/utils/Pipes";

const fetcher = (n: number): (() => Promise<Array<string>>) => {
  return () => fetch(`/${n}.json`).then((res) => res.json());
};

export default function GameBoard({ n }: { n: number }) {
  const { data: solutions } = useSWR<Array<string>>(String(n), fetcher(n));
  if (!solutions) return null;
  // pick a random element from solutions
  const randomSolution =
    solutions[Math.floor(Math.random() * solutions.length)];

  const board = new PlayableBoard(randomSolution);

  console.log(board);

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
          <div key={index} className="border border-gray-300 bg-white">
            <img
              src={`/type${getPipeType(board.state[index])}.svg`}
              className="w-full h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
