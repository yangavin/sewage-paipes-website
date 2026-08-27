"use client";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import DroppableBox from "./DroppableBox";
import DraggablePipe from "./DraggablePipe";
import { Openings } from "@/utils/csp/utils";
import { getPipeRotation, isSolved, pickMove } from "@/utils/Pipes";
import { preloadModel } from "./model";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Trash2,
  RotateCw,
  MousePointerClick,
  GripHorizontal,
} from "lucide-react";

const PIPES: Openings[] = [
  [true, false, false, false], // Type 1
  [true, false, true, false], // Type 2
  [true, true, false, false], // Type 3
  [true, true, false, true], // Type 4
];
export interface PipeInstance {
  id: string;
  openings: Openings;
  rotations: number;
}

type SolverStatus =
  | "editing"
  | "solving"
  | "paused"
  | "solved"
  | "unsolvable";

const MAX_SOLVER_MOVES = 50;

function cloneBoard(
  board: Array<PipeInstance | null>
): Array<PipeInstance | null> {
  return board.map((pipe) =>
    pipe === null
      ? null
      : {
          ...pipe,
          openings: [...pipe.openings],
        }
  );
}

export default function BuildableBoard() {
  const [boardState, setBoardState] = useState<Array<PipeInstance | null>>(() =>
    Array(16).fill(null)
  );
  console.log(boardState);
  const [attemptedMoves, setAttemptedMoves] = useState<{
    [key: string]: number[];
  }>({});
  const [solverStatus, setSolverStatus] =
    useState<SolverStatus>("editing");
  const [sessionStartBoard, setSessionStartBoard] = useState<
    Array<PipeInstance | null> | null
  >(null);
  const [moveCount, setMoveCount] = useState(0);
  const [selectedPipeIndex, setSelectedPipeIndex] = useState<number | null>(
    null
  );
  const isSolving = solverStatus === "solving";
  const isBoardLocked = isSolving || solverStatus === "paused";

  useEffect(() => {
    void preloadModel().catch((error) => {
      console.error("Failed to preload the AI model:", error);
    });
  }, []);

  const turnPipe = useCallback(
    (index: number) => {
      setBoardState((prevState) => {
        const newState = [...prevState];
        const currentPipe = prevState[index];
        if (currentPipe === null) return newState;
        newState[index] = {
          id: currentPipe.id,
          openings: [
            currentPipe.openings[3],
            currentPipe.openings[0],
            currentPipe.openings[1],
            currentPipe.openings[2],
          ],
          rotations: currentPipe.rotations + 1,
        };
        return newState;
      });
    },
    []
  );

  useEffect(() => {
    if (!isSolving) return;

    // already done?
    if (isSolved(boardState)) {
      console.log("SOLVED:", boardState);
      setSolverStatus("solved");
      setAttemptedMoves({});
      return;
    }

    if (moveCount >= MAX_SOLVER_MOVES) {
      setSolverStatus("unsolvable");
      setAttemptedMoves({});
      return;
    }

    // run ONE move, then let the next render/effect decide again
    let cancelled = false;
    let moveTimer: ReturnType<typeof setTimeout> | null = null;
    (async () => {
      const output = await pickMove(boardState, attemptedMoves);
      if (cancelled) return; // board changed meanwhile – abort

      moveTimer = setTimeout(() => {
        if (cancelled) return;
        setAttemptedMoves(output.attemptedMoves);
        turnPipe(output.move); // triggers next render
        setMoveCount((prev) => prev + 1);
      }, 200);
    })();

    // if boardState or isSolving changes before pickMove resolves, abort
    return () => {
      cancelled = true;
      if (moveTimer !== null) {
        clearTimeout(moveTimer);
      }
    };
  }, [isSolving, boardState, attemptedMoves, moveCount, turnPipe]);

  const noEmpties = boardState.every((pipe) => pipe !== null);

  const handleClearBoard = () => {
    if (isBoardLocked) return;
    setBoardState(Array(16).fill(null));
    setAttemptedMoves({});
    setMoveCount(0);
    setSolverStatus("editing");
  };

  const handleDeletePipe = (index: number) => {
    if (isBoardLocked) return;
    setBoardState((prevState) => {
      const newState = [...prevState];
      newState[index] = null;
      return newState;
    });
    setAttemptedMoves({});
    setSolverStatus("editing");
  };

  const handleReplacePipe = (index: number, pipe: Openings) => {
    if (isBoardLocked) return;
    setBoardState((prevState) => {
      const newState = [...prevState];
      const rotations = getPipeRotation(pipe);
      newState[index] = {
        id: uuidv4(),
        openings: [...pipe],
        rotations,
      };
      return newState;
    });
    setAttemptedMoves({});
    setSolverStatus("editing");
  };

  const handleUserPipeTurn = (index: number) => {
    if (isBoardLocked) return;
    turnPipe(index);
    setAttemptedMoves({});
    setSolverStatus("editing");
  };

  const handleSolverControl = () => {
    if (solverStatus === "solving") {
      setSolverStatus("paused");
      return;
    }

    if (solverStatus === "paused") {
      setSolverStatus("solving");
      return;
    }

    setSessionStartBoard(cloneBoard(boardState));
    setAttemptedMoves({});
    setMoveCount(0);
    setSelectedPipeIndex(null);
    setSolverStatus("solving");
  };

  const handleSessionReset = () => {
    if (sessionStartBoard === null || isSolving) return;

    setBoardState(cloneBoard(sessionStartBoard));
    setAttemptedMoves({});
    setMoveCount(0);
    setSelectedPipeIndex(null);
    setSolverStatus("editing");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12 justify-center items-center">
      <div className="w-full lg:w-1/2">
        {/* Pipe Palette */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Pipe Types</h3>
          </div>
          <div className="flex gap-2 justify-center bg-card rounded-lg p-4 border-2 border-border shadow-sm">
            {PIPES.map((openings, i) => {
              return (
                <div
                  key={i}
                  className={`aspect-square min-w-0 flex-1 max-w-28 border-2 bg-background rounded-md overflow-hidden hover:border-primary transition-colors touch-manipulation ${
                    selectedPipeIndex === i
                      ? "border-primary ring-2 ring-primary/30 bg-accent/30"
                      : "border-grid-line"
                  }`}
                >
                  <DraggablePipe
                    pipe={[...openings]}
                    rotations={0}
                    onTurn={() =>
                      setSelectedPipeIndex((selectedIndex) =>
                        selectedIndex === i ? null : i
                      )
                    }
                    onDelete={() => {}}
                    isLocked={isBoardLocked}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground text-center mt-3 handwritten">
            Drag a pipe, or tap one and then tap board tiles to place it
          </p>
          {selectedPipeIndex !== null && (
            <p className="text-xs text-primary text-center mt-1 handwritten">
              Pipe selected — tap it again when you want to rotate board pipes
            </p>
          )}
        </div>

        {/* Board */}
        <div className="flex justify-center">
          <div
            className="inline-grid bg-card rounded-lg shadow-lg border-2 border-border overflow-hidden"
            style={{
              gridTemplateColumns: `repeat(${4}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${4}, minmax(0, 1fr))`,
              maxWidth: "500px",
              width: "100%",
              aspectRatio: "1",
            }}
          >
            {boardState.map((pipeInstance, index) => (
              <DroppableBox
                key={index}
                onDrop={(pipe: Openings) => handleReplacePipe(index, pipe)}
                onClick={() => {
                  if (
                    pipeInstance === null &&
                    selectedPipeIndex !== null
                  ) {
                    handleReplacePipe(index, PIPES[selectedPipeIndex]);
                  }
                }}
                isLocked={isBoardLocked}
              >
                {pipeInstance && (
                  <DraggablePipe
                    key={pipeInstance.id}
                    pipe={pipeInstance.openings}
                    rotations={pipeInstance.rotations}
                    onTurn={() => {
                      if (selectedPipeIndex === null) {
                        handleUserPipeTurn(index);
                      } else {
                        handleReplacePipe(index, PIPES[selectedPipeIndex]);
                      }
                    }}
                    onDelete={() => handleDeletePipe(index)}
                    isLocked={isBoardLocked}
                  />
                )}
              </DroppableBox>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/3">
        <Card className="sticky top-24">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🧠</span>
              <CardTitle>AI Solver</CardTitle>
            </div>
            <CardDescription>
              Create a pipe puzzle and watch the AI solve it step by step
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <span>📖</span>
                Instructions
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <GripHorizontal className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Drag pipes, or tap a type then tap board tiles</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MousePointerClick className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Tap or click a placed pipe to rotate it</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Trash2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Right-click a pipe to remove it</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <RotateCw className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Drag between squares to copy pipes</span>
                </li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Moves Made</h3>
                <span className="text-3xl font-mono bg-accent/30 px-4 py-1 rounded-md">
                  {moveCount}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={!noEmpties}
                  variant={isSolving ? "outline" : "default"}
                  onClick={handleSolverControl}
                >
                  {isSolving ? (
                    <>
                      <PauseCircle className="mr-2 h-4 w-4" />
                      Pause
                    </>
                  ) : solverStatus === "paused" ? (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Continue
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Solve
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  disabled={sessionStartBoard === null || isSolving}
                  onClick={handleSessionReset}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  variant="destructive"
                  disabled={isBoardLocked}
                  onClick={handleClearBoard}
                  size="icon"
                  aria-label="Clear board"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {solverStatus === "paused" && (
                <p className="text-xs text-muted-foreground mt-3 text-center handwritten">
                  Paused — continue solving or reset to the starting board.
                </p>
              )}
              {solverStatus === "solved" && (
                <p className="text-xs text-primary mt-3 text-center handwritten">
                  Solved in {moveCount} moves!
                </p>
              )}
              {solverStatus === "unsolvable" && (
                <div
                  className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center"
                  role="status"
                >
                  <p className="text-sm font-semibold text-destructive">
                    This puzzle is unsolvable
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground handwritten">
                    The solver stopped after {MAX_SOLVER_MOVES} moves.
                    <br />
                    Edit the board or reset it to try again.
                  </p>
                </div>
              )}
              {!noEmpties && (
                <p className="text-xs text-muted-foreground mt-3 text-center handwritten">
                  Fill the board to start solving!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
