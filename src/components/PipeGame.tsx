"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Select, SelectOption } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type PipePosition = {
  type: string;
  rotation: number;
};

// Available pipe types
const PIPE_TYPES = ["type1", "type2", "type3", "type4"];

export default function PipeGame() {
  const [boardSize, setBoardSize] = useState(4);
  const [board, setBoard] = useState<PipePosition[][]>([]);

  // Generate dimensions options
  const dimensionOptions = Array.from({ length: 24 }, (_, i) => i + 2);

  // Get random pipe type
  const getRandomPipeType = () => {
    const randomIndex = Math.floor(Math.random() * PIPE_TYPES.length);
    return PIPE_TYPES[randomIndex];
  };

  // Initialize board when size changes
  const initializeBoard = useCallback((size: number) => {
    const newBoard = Array(size)
      .fill(0)
      .map(() =>
        Array(size)
          .fill(0)
          .map(() => ({
            type: getRandomPipeType(),
            rotation: Math.floor(Math.random() * 4) * 90, // Random rotation: 0, 90, 180, or 270 degrees
          }))
      );
    setBoard(newBoard);
  }, []);

  // Handle board size change
  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = parseInt(e.target.value, 10);
    setBoardSize(size);
    initializeBoard(size);
  };

  // Handle pipe rotation
  const handlePipeClick = (row: number, col: number) => {
    setBoard((prevBoard) => {
      const newBoard = [...prevBoard];
      newBoard[row] = [...prevBoard[row]];
      newBoard[row][col] = {
        ...prevBoard[row][col],
        rotation: prevBoard[row][col].rotation + 90,
      };
      return newBoard;
    });
  };

  // Reset the board with new random pipes
  const handleResetBoard = () => {
    initializeBoard(boardSize);
  };

  // Initialize board on first render
  useEffect(() => {
    initializeBoard(boardSize);
  }, [boardSize, initializeBoard]);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Sewage Pipes Puzzle</h1>
        <div className="flex items-center gap-4 mb-4">
          <label htmlFor="boardSize" className="text-lg">
            Board Size:
          </label>
          <div className="w-40">
            <Select
              id="boardSize"
              value={boardSize.toString()}
              onChange={handleSizeChange}
            >
              {dimensionOptions.map((size) => (
                <SelectOption key={size} value={size.toString()}>
                  {size} x {size}
                </SelectOption>
              ))}
            </Select>
          </div>
          <Button onClick={handleResetBoard} variant="outline">
            Reset Board
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Click on pipes to rotate them clockwise.
        </p>
      </div>

      <div className="max-w-[800px] mx-auto">
        <div
          className="grid gap-0 border border-border"
          style={{
            gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((pipe, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="aspect-square cursor-pointer border border-border flex items-center justify-center overflow-hidden"
                onClick={() => handlePipeClick(rowIndex, colIndex)}
              >
                <div
                  className="w-full h-full transition-transform duration-200"
                  style={{
                    transform: `rotate(${pipe.rotation}deg)`,
                  }}
                >
                  <img
                    src={`/${pipe.type}.svg`}
                    alt={`Pipe type ${pipe.type}`}
                    className="w-full h-full"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
