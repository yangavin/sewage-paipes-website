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
  MousePointerClick,
  GripHorizontal,
  Activity,
  Layers3,
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
  const placedPipeCount = boardState.filter((pipe) => pipe !== null).length;
  const solverDescription = {
    editing: noEmpties
      ? "Board complete. The model is ready."
      : `Place ${16 - placedPipeCount} more ${16 - placedPipeCount === 1 ? "tile" : "tiles"} to activate the model.`,
    solving: "Evaluating the network one move at a time.",
    paused: "Inference paused. Continue when you are ready.",
    solved: `Network solved in ${moveCount} moves.`,
    unsolvable: "No valid network found within the move limit.",
  }[solverStatus];

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
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
      <div className="w-full rounded-3xl border border-border bg-card/70 p-4 shadow-sm sm:p-7">
        {/* Pipe Palette */}
        <div className="mb-7">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                <Layers3 className="size-3.5" /> Components
              </div>
              <h3 className="text-xl">Pipe palette</h3>
            </div>
            <span className="hidden text-xs text-muted-foreground sm:block">Select, place, rotate</span>
          </div>
          <div className="flex justify-center gap-2 rounded-2xl border border-border bg-[#ebe8de] p-3 sm:gap-3 sm:p-4">
            {PIPES.map((openings, i) => {
              return (
                <div
                  key={i}
                  className={`aspect-square min-w-0 flex-1 max-w-28 touch-manipulation overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:border-primary ${
                    selectedPipeIndex === i
                      ? "border-primary ring-4 ring-primary/10 bg-primary/5 shadow-md"
                      : "border-border shadow-sm"
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
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Drag a pipe, or tap one and then tap board tiles to place it
          </p>
          {selectedPipeIndex !== null && (
            <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-primary">
              Pipe selected — tap it again when you want to rotate board pipes
            </p>
          )}
        </div>

        {/* Board */}
        <div className="flex justify-center">
          <div className="w-full max-w-[524px] rounded-2xl bg-foreground p-2 shadow-xl sm:p-3">
            <div
            className="inline-grid w-full overflow-hidden rounded-xl border border-white/15 bg-card"
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
                label={`Board tile ${index + 1}${pipeInstance ? ", occupied" : ", empty"}`}
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
      </div>

      <div className="w-full">
        <Card className="sticky top-24 overflow-hidden border-border/80 shadow-xl shadow-foreground/5 hover:shadow-xl">
          <CardHeader className="bg-foreground text-background">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-secondary">
                <Activity className="size-3.5" /> Model status
              </div>
              <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-[9px] tracking-[0.08em] text-white/65">
                {placedPipeCount}/16
              </span>
            </div>
            <CardTitle className="text-2xl text-white">Solver console</CardTitle>
            <CardDescription className="text-white/55">
              {solverDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="pt-6">
              <h3 className="mb-4 text-sm font-semibold tracking-normal">
                Workspace controls
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted"><GripHorizontal className="size-3.5" /></span>
                  <span>Drag pipes, or tap a type then tap board tiles</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted"><MousePointerClick className="size-3.5" /></span>
                  <span>Tap or click a placed pipe to rotate it</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted"><Trash2 className="size-3.5" /></span>
                  <span>Right-click a pipe to remove it</span>
                </li>
              </ul>
            </div>

            <div className="border-t pt-5">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Inference</span>
                  <h3 className="mt-1 text-base tracking-normal">Moves made</h3>
                </div>
                <span className="font-mono text-4xl font-medium leading-none text-primary">
                  {String(moveCount).padStart(2, "0")}
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
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Paused — continue solving or reset to the starting board.
                </p>
              )}
              {solverStatus === "solved" && (
                <p className="mt-3 text-center text-xs font-medium text-primary">
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
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    The solver stopped after {MAX_SOLVER_MOVES} moves.
                    <br />
                    Edit the board or reset it to try again.
                  </p>
                </div>
              )}
              {!noEmpties && (
                <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
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
