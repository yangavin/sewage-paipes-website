import { Button } from "@/components/ui/button";
import useSWR from "swr";
import {
  getPipeType,
  getPipeOrientation as getPipeRotations,
} from "@/utils/Pipes";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fetcher = (n: number): (() => Promise<Array<string>>) => {
  return () => fetch(`/${n}.json`).then((res) => res.json());
};

export default function PlayableBoard() {
  const [n, setN] = useState<number>(4);
  const { data: solutions, isLoading } = useSWR<Array<string>>(
    String(n),
    fetcher(n)
  );

  // State for board management
  const [currentState, setCurrentState] = useState<Array<Array<boolean>>>([]);
  const [initialState, setInitialState] = useState<Array<Array<boolean>>>([]);
  const [solution, setSolution] = useState<Array<Array<boolean>>>([]);
  const [rotationCounts, setRotationCounts] = useState<number[]>([]);

  const initializeNewPuzzle = (solutions: string[]) => {
    const randomSolution =
      solutions[Math.floor(Math.random() * solutions.length)];

    // Decode solution string into array of boolean arrays
    const decodedSolution: Array<Array<boolean>> = [];
    for (let i = 0; i < randomSolution.length; i += 4) {
      const pipe: Array<boolean> = [];
      for (let j = 0; j < 4; j++) {
        pipe.push(randomSolution[i + j] === "1");
      }
      decodedSolution.push(pipe);
    }

    // Create initial state by randomly rotating pipes
    const scrambledState = decodedSolution.map((pipe) => {
      const numTurns = Math.floor(Math.random() * 4);
      let rotatedPipe = [...pipe];
      for (let t = 0; t < numTurns; t++) {
        rotatedPipe = [
          rotatedPipe[3],
          rotatedPipe[0],
          rotatedPipe[1],
          rotatedPipe[2],
        ];
      }
      return rotatedPipe;
    });

    setSolution(decodedSolution);
    setCurrentState(scrambledState);
    setInitialState(scrambledState);
    setRotationCounts(scrambledState.map((pipe) => getPipeRotations(pipe)));
  };

  // Clear state when n changes
  useEffect(() => {
    setCurrentState([]);
    setInitialState([]);
    setSolution([]);
    setRotationCounts([]);
  }, [n]);

  // Initialize board when solutions are available
  useEffect(() => {
    if (solutions && solutions.length > 0) {
      initializeNewPuzzle(solutions);
    }
  }, [solutions, n]);

  // Show loading state while fetching new data
  if (isLoading || !solutions || currentState.length !== n * n) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const handlePipeClick = (index: number) => {
    const newState = [...currentState];
    // Rotate the pipe at index
    newState[index] = [
      currentState[index][3],
      currentState[index][0],
      currentState[index][1],
      currentState[index][2],
    ];
    setCurrentState(newState);

    // Update rotation count
    const newRotationCounts = [...rotationCounts];
    newRotationCounts[index] = rotationCounts[index] + 1;
    setRotationCounts(newRotationCounts);
  };

  const handleReset = () => {
    setCurrentState(initialState);
    setRotationCounts(initialState.map((pipe) => getPipeRotations(pipe)));
  };

  const handleShowSolution = () => {
    setCurrentState(solution);
    setRotationCounts(solution.map((pipe) => getPipeRotations(pipe)));
  };

  const handleNewPuzzle = () => {
    if (solutions) {
      initializeNewPuzzle(solutions);
    }
  };

  return (
    <div>
      <div className="w-full flex justify-center gap-4 items-center mb-4">
        <h2>Board Dimension: </h2>
        <Select
          value={String(n)}
          onValueChange={(value) => setN(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a number" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {Array.from({ length: 24 }, (_, i) => (
              <SelectItem key={i} value={`${i + 2}`}>
                {`${i + 2}x${i + 2}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-4 justify-center mb-6">
        <Button variant="outline" onClick={handleNewPuzzle}>
          New Puzzle
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button variant="outline" onClick={handleShowSolution}>
          See Solution
        </Button>
      </div>
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
            <Image
              src={`/type${getPipeType(currentState[index])}.svg`}
              className="w-full h-full transition-transform duration-200"
              style={{
                transform: `rotate(${rotationCounts[index] * 90}deg)`,
              }}
              alt={`Pipe type ${getPipeType(currentState[index])}`}
              width={100}
              height={100}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
