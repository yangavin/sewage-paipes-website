"use client";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import DroppableBox from "./DroppableBox";
import DraggablePipe from "./DraggablePipe";
import { Openings } from "@/utils/csp/utils";
import { getPipeRotation, isSolved, pickMove } from "@/utils/Pipes";
import { v4 as uuidv4 } from "uuid";

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
      <div className="border-2 w-1/2">
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

      <div className="flex flex-col justify-around mb-6 gap-4 border-2 w-1/4">
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-4xl">How it Works</h1>
          <p>
            Drag the pieces to create a create a puzzle, then click
            &quot;Solve&quot; to start the AI solver.
          </p>
          <h2 className="text-3xl">Controls</h2>
          <ol>
            <li>
              Drag and drop pipes from the top of the board to place pipes
            </li>
            <li>Click on a pipe to rotate it</li>
            <li>Right click on a pipe to remove it</li>
            <li>
              Dragging a pipe to another square copies the pipe to that square
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-center mb-5">Moves: {moveCount}</h2>
          <div className="flex justify-center gap-4">
            <Button
              disabled={!noEmpties}
              variant={isSolving ? "outline" : "default"}
              onClick={handleSolveToggle}
            >
              {isSolving ? "Stop" : "Solve"}
            </Button>
            <Button
              variant="destructive"
              disabled={isSolving}
              onClick={handleClearBoard}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
