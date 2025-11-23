"use client";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import DroppableBox from "./DroppableBox";
import DraggablePipe from "./DraggablePipe";
import { Openings } from "@/utils/csp/utils";
import { getPipeRotation, isSolved, pickMove } from "@/utils/Pipes";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlayCircle,
  StopCircle,
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

export default function BuildableBoard() {
  const [boardState, setBoardState] = useState<Array<PipeInstance | null>>(() =>
    Array(16).fill(null)
  );
  console.log(boardState);
  const [attemptedMoves, setAttemptedMoves] = useState<{
    [key: string]: number[];
  }>({});
  const [isSolving, setIsSolving] = useState(false);
  const [moveCount, setMoveCount] = useState(0);

  const handlePipeTurn = useCallback(
    (index: number) => {
      console.log("TURNING: ", index);
      if (boardState[index] === null) return;
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
    [boardState]
  );

  useEffect(() => {
    if (!isSolving) return;

    // already done?
    if (isSolved(boardState)) {
      console.log("SOLVED:", boardState);
      setIsSolving(false);
      setAttemptedMoves({});
      return;
    }

    // run ONE move, then let the next render/effect decide again
    let cancelled = false;
    (async () => {
      const output = await pickMove(boardState, attemptedMoves);
      if (cancelled) return; // board changed meanwhile – abort

      setTimeout(() => {
        if (cancelled) return;
        setAttemptedMoves(output.attemptedMoves);
        handlePipeTurn(output.move); // triggers next render
        setMoveCount((prev) => prev + 1);
      }, 200);
    })();

    // if boardState or isSolving changes before pickMove resolves, abort
    return () => {
      cancelled = true;
    };
  }, [isSolving, boardState, attemptedMoves, handlePipeTurn]); // deps

  const noEmpties = boardState.every((pipe) => pipe !== null);

  const handleClearBoard = () => {
    setBoardState(Array(16).fill(null));
  };

  const handleDeletePipe = (index: number) => {
    setBoardState((prevState) => {
      const newState = [...prevState];
      newState[index] = null;
      return newState;
    });
  };

  const handleReplacePipe = (index: number, pipe: Openings) => {
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
  };

  const handleSolveToggle = () => {
    if (!isSolving) {
      setAttemptedMoves({});
      setMoveCount(0);
    }
    setIsSolving(!isSolving);
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
                  className="border-2 border-grid-line bg-background rounded-md overflow-hidden hover:border-primary transition-colors"
                >
                  <DraggablePipe
                    pipe={[...openings]}
                    rotations={0}
                    onTurn={() => {}}
                    onDelete={() => {}}
                    isSolving={isSolving}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground text-center mt-3 handwritten">
            Drag these pipes onto the board below
          </p>
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
                isSolving={isSolving}
              >
                {pipeInstance && (
                  <DraggablePipe
                    key={pipeInstance.id}
                    pipe={pipeInstance.openings}
                    rotations={pipeInstance.rotations}
                    onTurn={() => handlePipeTurn(index)}
                    onDelete={() => handleDeletePipe(index)}
                    isSolving={isSolving}
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
                  <span>Drag pipes from above onto the board</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MousePointerClick className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Left-click a pipe to rotate it</span>
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
                  onClick={handleSolveToggle}
                >
                  {isSolving ? (
                    <>
                      <StopCircle className="mr-2 h-4 w-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Solve
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  disabled={isSolving}
                  onClick={handleClearBoard}
                  size="icon"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
