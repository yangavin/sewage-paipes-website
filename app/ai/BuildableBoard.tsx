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
    <div className="flex gap-24 justify-center">
      <div className="w-1/2">
        <div className="flex w-1/3 mx-auto">
          {PIPES.map((openings, i) => {
            return (
              <div
                key={i}
                className="border border-gray-300 bg-white cursor-pointer"
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
        <div
          className="grid w-2/3 aspect-square mx-auto my-4"
          style={{
            gridTemplateColumns: `repeat(${4}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${4}, minmax(0, 1fr))`,
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

      <div className="w-1/4">
        <Card>
          <CardHeader>
            <CardTitle>How it Works</CardTitle>
            <CardDescription>
              Create a puzzle and let the AI solve it for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Controls</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GripHorizontal className="h-4 w-4" />
                  Drag and drop pipes from the top to place them
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MousePointerClick className="h-4 w-4" />
                  Click on a pipe to rotate it
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Trash2 className="h-4 w-4" />
                  Right click on a pipe to remove it
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RotateCw className="h-4 w-4" />
                  Dragging a pipe to another square copies it
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Moves</h3>
                <span className="text-2xl font-mono">{moveCount}</span>
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
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
