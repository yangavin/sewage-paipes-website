"use client";

import { Button } from "@/components/ui/button";
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
import { generatePipesState } from "./utils/pyodideUtils";

export default function PlayableBoard() {
  const [n, setN] = useState<number>(4);
  const [solution_str, setSolutionStr] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // State for board management
  const [currentState, setCurrentState] = useState<Array<Array<boolean>>>([]);
  const [initialState, setInitialState] = useState<Array<Array<boolean>>>([]);
  const [solution, setSolution] = useState<Array<Array<boolean>>>([]);
  const [rotationCounts, setRotationCounts] = useState<number[]>([]);

  // Function to fetch new puzzle
  const fetchNewPuzzle = async () => {
    setIsLoading(true);
    try {
      const newSolution = await generatePipesState(n);
      setSolutionStr(newSolution);
    } catch (error) {
      console.error("Error generating puzzle:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeNewPuzzle = (solution_str: string) => {
    // Decode solution string into array of boolean arrays
    const decodedSolution: Array<Array<boolean>> = [];
    for (let i = 0; i < solution_str.length; i += 4) {
      const pipe: Array<boolean> = [];
      for (let j = 0; j < 4; j++) {
        pipe.push(solution_str[i + j] === "1");
      }
      decodedSolution.push(pipe);
    }
    console.log(decodedSolution);
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

  // Initialize board when n changes
  useEffect(() => {
    setCurrentState([]);
    setInitialState([]);
    setSolution([]);
    setRotationCounts([]);
    fetchNewPuzzle();
  }, [n]);

  // Initialize board when solutions are available
  useEffect(() => {
    if (solution_str && solution_str.length > 0) {
      initializeNewPuzzle(solution_str);
    }
  }, [solution_str]);

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
    fetchNewPuzzle();
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
        <Button
          variant="outline"
          onClick={handleNewPuzzle}
          disabled={isLoading}
        >
          New Puzzle
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={isLoading}>
          Reset
        </Button>
        <Button
          variant="outline"
          onClick={handleShowSolution}
          disabled={isLoading}
        >
          See Solution
        </Button>
      </div>
      {isLoading || !solution_str || currentState.length !== n * n ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
