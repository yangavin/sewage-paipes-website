"use client";

import { Button } from "@/components/ui/button";
import {
  getPipeType,
  getPipeRotation as getPipeRotations,
  decodeStateStr,
  isSolvedAssignment,
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
import { Dices, Grid3X3, Lightbulb, RotateCcw } from "lucide-react";

type PuzzleStatus = "playing" | "won" | "revealed";

export default function PlayableBoard() {
  const [n, setN] = useState<number>(4);
  const [solution_str, setSolutionStr] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [puzzleStatus, setPuzzleStatus] =
    useState<PuzzleStatus>("playing");

  // State for board management
  const [currentState, setCurrentState] = useState<Array<Array<boolean>>>([]);
  const [rotationCounts, setRotationCounts] = useState<number[]>([]);
  const [solution, setSolution] = useState<Array<Array<boolean>>>([]);
  const [initialState, setInitialState] = useState<Array<Array<boolean>>>([]);

  // Initial load and when n changes
  useEffect(() => {
    const fetchSolution = async () => {
      setIsLoading(true);
      setPuzzleStatus("playing");
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
    setPuzzleStatus("playing");
    setIsLoading(false);
  }, [solution_str]);

  const handlePipeClick = (index: number) => {
    if (puzzleStatus !== "playing") return;

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

    if (isSolvedAssignment(newState)) {
      setPuzzleStatus("won");
    }
  };

  const handleReset = () => {
    setCurrentState(initialState);
    setRotationCounts(initialState.map((pipe) => getPipeRotations(pipe)));
    setPuzzleStatus("playing");
  };

  const handleShowSolution = () => {
    setCurrentState(solution);
    setRotationCounts(solution.map((pipe) => getPipeRotations(pipe)));
    setPuzzleStatus("revealed");
  };

  const handleNewPuzzle = async () => {
    setIsLoading(true);
    setPuzzleStatus("playing");
    try {
      const newSolution = await generateSolution(n);
      setSolutionStr(newSolution);
    } catch (error) {
      console.error("Error generating new puzzle:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-3 shadow-2xl shadow-black/20 sm:p-6">
      {/* Controls Section */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-[#f4f1e8] p-4 text-foreground shadow-xl sm:p-5">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex w-full sm:w-auto items-center justify-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Grid3X3 className="size-4" />
            </span>
            <div className="mr-1">
              <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Board</span>
              <span className="block text-sm font-semibold">Grid size</span>
            </div>
            <Select
              value={String(n)}
              onValueChange={(value) => setN(parseInt(value))}
            >
              <SelectTrigger className="w-28 border-border bg-white">
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
          
          <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-3">
            <Button
              variant="outline"
              onClick={handleNewPuzzle}
              disabled={isLoading}
              className="w-full gap-2"
            >
              <Dices />
              New Puzzle
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset} 
              disabled={isLoading}
              className="w-full gap-2"
            >
              <RotateCcw />
              Reset
            </Button>
            <Button
              variant="default"
              onClick={handleShowSolution}
              disabled={isLoading || puzzleStatus !== "playing"}
              className="col-span-2 w-full gap-2 sm:col-span-1"
            >
              <Lightbulb />
              Show Solution
            </Button>
          </div>
        </div>
      </div>

      {/* Puzzle Board */}
      {isLoading ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 animate-ping rounded-full border-4 border-secondary/50"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-secondary border-t-transparent"></div>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-white/60">Generating network...</p>
        </div>
      ) : !solution_str || currentState.length !== n * n ? (
        <div className="flex flex-col justify-center items-center min-h-[400px] gap-4">
          <span className="text-5xl">⚠</span>
          <p className="text-center text-white/60">
            No valid solution found. Try a different board size.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center py-3 sm:py-6">
          <div className="w-full max-w-[648px] rounded-2xl bg-[#071a19] p-2 shadow-2xl sm:p-3">
            <div
            className={`inline-grid w-full overflow-hidden rounded-xl border-2 bg-card transition-all duration-300 ${
              puzzleStatus === "won"
                ? "border-secondary ring-4 ring-secondary/20"
                : "border-white/15"
            }`}
            style={{
              gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${n}, minmax(0, 1fr))`,
              maxWidth: '620px',
              width: '100%',
              aspectRatio: '1',
            }}
          >
            {Array.from({ length: n * n }).map((_, index) => (
              <div
                key={index}
                className={`group relative border border-[#d6d3c8] transition-all duration-200 ${
                  puzzleStatus === "playing"
                    ? "cursor-pointer bg-[#f7f5ed] hover:bg-secondary/25"
                    : "bg-muted/50 cursor-not-allowed"
                }`}
                onClick={() => handlePipeClick(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handlePipeClick(index);
                  }
                }}
                role="button"
                tabIndex={puzzleStatus === "playing" ? 0 : -1}
                aria-label={`Rotate pipe at row ${Math.floor(index / n) + 1}, column ${(index % n) + 1}`}
                aria-disabled={puzzleStatus !== "playing"}
              >
                <div
                  className={`absolute inset-0 z-20 pointer-events-none transition-opacity ${
                    puzzleStatus === "playing"
                      ? "bg-primary/10 opacity-0 group-hover:opacity-100"
                      : "bg-black/10 opacity-100"
                  }`}
                ></div>
                <Image
                  src={`/type${getPipeType(currentState[index])}.svg`}
                  className="relative z-10 h-full w-full transition-transform duration-200"
                  style={{
                    transform: `rotate(${rotationCounts[index] * 90}deg)`,
                    filter: "invert(40%) sepia(24%) saturate(1773%) hue-rotate(128deg) brightness(84%)",
                  }}
                  alt={`Pipe type ${getPipeType(currentState[index])}`}
                  width={100}
                  height={100}
                />
              </div>
            ))}
            </div>
          </div>

          {puzzleStatus === "won" && (
            <div
              className="bloom-in mt-6 w-full max-w-xl rounded-xl border border-secondary/50 bg-secondary px-5 py-4 text-center text-foreground shadow-lg"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl" aria-hidden="true">
                  🎉
                </span>
                <div className="text-left">
                  <p className="font-semibold text-foreground">
                    Puzzle solved!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Every pipe is connected. Nicely done!
                  </p>
                </div>
              </div>
            </div>
          )}

          {puzzleStatus === "revealed" && (
            <div
              className="mt-6 w-full max-w-xl rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-center shadow-sm"
              role="status"
            >
              <p className="font-medium text-white">Solution revealed</p>
              <p className="text-sm text-white/60">
                Press Reset to try this puzzle yourself.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Helpful hint */}
      {!isLoading && solution_str && currentState.length === n * n && (
        <div className="mt-4 pb-2 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/45">
            {puzzleStatus === "playing"
              ? "Click any pipe to rotate it. Connect them all!"
              : "Reset or start a new puzzle to play again."}
          </p>
        </div>
      )}
    </div>
  );
}
