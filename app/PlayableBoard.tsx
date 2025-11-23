"use client";

import { Button } from "@/components/ui/button";
import {
  getPipeType,
  getPipeRotation as getPipeRotations,
  decodeStateStr,
  scrambleState,
} from "@/utils/Pipes";
import { generateSolution } from "@/utils/csp/main";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PlayableBoard() {
  const [n, setN] = useState<number>(4);
  const [solution_str, setSolutionStr] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // State for board management
  const [currentState, setCurrentState] = useState<Array<Array<boolean>>>([]);
  const [rotationCounts, setRotationCounts] = useState<number[]>([]);
  const [solution, setSolution] = useState<Array<Array<boolean>>>([]);
  const [initialState, setInitialState] = useState<Array<Array<boolean>>>([]);

  // Initial load and when n changes
  useEffect(() => {
    const fetchSolution = async () => {
      setIsLoading(true);
      try {
        const newSolution = await generateSolution(n);
        setSolutionStr(newSolution);
      } catch (error) {
        console.error("Error generating solution:", error);
      }
    };

    fetchSolution();
  }, [n]);

  // Process the solution string whenever it changes
  useEffect(() => {
    if (!solution_str || solution_str === "No solution found") {
      setIsLoading(false);
      return;
    }

    const decodedSolution = decodeStateStr(solution_str);
    const scrambledState = scrambleState(decodedSolution);

    setSolution(decodedSolution);
    setInitialState(scrambledState);
    setCurrentState(scrambledState);
    setRotationCounts(scrambledState.map((pipe) => getPipeRotations(pipe)));
    setIsLoading(false);
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

  const handleNewPuzzle = async () => {
    setIsLoading(true);
    try {
      const newSolution = await generateSolution(n);
      setSolutionStr(newSolution);
    } catch (error) {
      console.error("Error generating new puzzle:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Controls Section */}
      <div className="bg-card rounded-xl p-6 mb-8 shadow-sm border border-border">
        <div className="flex flex-col md:flex-row justify-center items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Canvas Size:</span>
            <Select
              value={String(n)}
              onValueChange={(value) => setN(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={`${i + 2}`}>
                    {`${i + 2}×${i + 2}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleNewPuzzle}
              disabled={isLoading}
              className="gap-2"
            >
              <span>🎲</span>
              New Puzzle
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset} 
              disabled={isLoading}
              className="gap-2"
            >
              <span>🔄</span>
              Reset
            </Button>
            <Button
              variant="default"
              onClick={handleShowSolution}
              disabled={isLoading}
              className="gap-2"
            >
              <span>💡</span>
              Show Solution
            </Button>
          </div>
        </div>
      </div>

      {/* Puzzle Board */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-accent animate-ping"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground handwritten text-lg">Generating your puzzle...</p>
        </div>
      ) : !solution_str || currentState.length !== n * n ? (
        <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
          <span className="text-6xl">⚠️</span>
          <p className="text-muted-foreground text-center">
            No valid solution found. Try a different board size.
          </p>
        </div>
      ) : (
        <div className="flex justify-center">
          <div
            className="inline-grid bg-card rounded-lg shadow-lg border-2 border-border overflow-hidden"
            style={{
              gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${n}, minmax(0, 1fr))`,
              maxWidth: '600px',
              width: '100%',
              aspectRatio: '1',
            }}
          >
            {Array.from({ length: n * n }).map((_, index) => (
              <div
                key={index}
                className="border border-grid-line bg-background cursor-pointer hover:bg-accent/20 transition-all duration-200 relative group"
                onClick={() => handlePipeClick(index)}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-accent/10"></div>
                <Image
                  src={`/type${getPipeType(currentState[index])}.svg`}
                  className="w-full h-full transition-transform duration-200 relative z-10"
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
      )}
      
      {/* Helpful hint */}
      {!isLoading && solution_str && currentState.length === n * n && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground handwritten">
            Click any pipe to rotate it. Connect them all!
          </p>
        </div>
      )}
    </div>
  );
}
