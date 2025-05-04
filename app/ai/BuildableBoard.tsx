"use client";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import DroppableBox from "./DroppableBox";
import DraggablePipe from "./DraggablePipe";
import { PipeType } from "@/utils/csp/utils";
import { isSolved, pickMove } from "@/utils/Pipes";

const PIPES: PipeType[] = [
  [true, false, false, false], // Type 1
  [true, false, true, false], // Type 2
  [true, true, false, false], // Type 3
  [true, true, false, true], // Type 4
];

export interface PipeInstance {
  id: string;
  pipe: PipeType;
  rotation: number;
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

  const handlePipeTurn = useCallback(
    (index: number) => {
      console.log("TURNING: ", index);
      if (boardState[index] === null) return;
      setBoardState((prevState) => {
        const newState = [...prevState];
        const currentPipe = prevState[index];
        if (currentPipe === null) return newState;
        newState[index] = {
          ...currentPipe,
          pipe: [
            currentPipe.pipe[3],
            currentPipe.pipe[0],
            currentPipe.pipe[1],
            currentPipe.pipe[2],
          ],
          rotation: currentPipe.rotation + 1,
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

      setAttemptedMoves(output.attemptedMoves);
      handlePipeTurn(output.move); // triggers next render
    })();

    // if boardState or isSolving changes before pickMove resolves, abort
    return () => {
      cancelled = true;
    };
  }, [isSolving, boardState, attemptedMoves, handlePipeTurn]); // deps

  const noEmpties = boardState.every((pipe) => pipe !== null);

  const generatePipeId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

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

  const handleReplacePipe = (
    index: number,
    pipeData: { pipe: PipeType; id?: string }
  ) => {
    setBoardState((prevState) => {
      const newState = [...prevState];
      // If an ID is provided, it means we're moving an existing pipe
      const rotation = pipeData.id
        ? prevState.find((p) => p?.id === pipeData.id)?.rotation || 0
        : 0;

      newState[index] = {
        id: generatePipeId(),
        pipe: [...pipeData.pipe],
        rotation,
      };
      return newState;
    });
  };

  const handleSolveToggle = () => {
    if (isSolving) setAttemptedMoves({});
    setIsSolving(!isSolving);
  };

  return (
    <div>
      <div className="flex justify-center mb-6 gap-4">
        <Button disabled={!noEmpties} onClick={handleSolveToggle}>
          {isSolving ? "Stop" : "Solve"}
        </Button>
        <Button variant="destructive" onClick={handleClearBoard}>
          Clear
        </Button>
      </div>

      <div className="flex w-1/5 mx-auto">
        {[1, 2, 3, 4].map((pipeType) => {
          return (
            <div
              key={pipeType}
              className="border border-gray-300 bg-white cursor-pointer"
            >
              <DraggablePipe
                id={`template-${pipeType}`}
                pipe={PIPES[pipeType - 1]}
                rotation={0}
                onTurn={() => {}}
                onDelete={() => {}}
                isTemplate={true}
              />
            </div>
          );
        })}
      </div>

      <div
        className="grid w-1/3 aspect-square mx-auto my-4"
        style={{
          gridTemplateColumns: `repeat(${4}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${4}, minmax(0, 1fr))`,
        }}
      >
        {boardState.map((pipeInstance, index) => (
          <DroppableBox
            onDrop={(pipe: PipeType, id?: string) =>
              handleReplacePipe(index, { pipe, id })
            }
            key={index}
          >
            {pipeInstance && (
              <DraggablePipe
                id={pipeInstance.id}
                pipe={pipeInstance.pipe}
                rotation={pipeInstance.rotation}
                onTurn={() => handlePipeTurn(index)}
                onDelete={() => handleDeletePipe(index)}
                isTemplate={false}
              />
            )}
          </DroppableBox>
        ))}
      </div>
    </div>
  );
}
