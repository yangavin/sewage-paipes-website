"use client";

import { Button } from "@/components/ui/button";
import { getPipeType } from "@/utils/Pipes";
import { useState } from "react";
import Image from "next/image";

export default function BuildableBoard() {
  const [currentState, setCurrentState] = useState<
    Array<Array<boolean> | null>
  >(Array(16).fill(null));
  const [rotationCounts, setRotationCounts] = useState<number[]>([]);

  const handlePipeClick = (index: number) => {
    if (currentState[index] === null) return;
    const newState = [...currentState];
    newState[index] = [
      currentState[index][3],
      currentState[index][0],
      currentState[index][1],
      currentState[index][2],
    ];
    setCurrentState(newState);

    // Update rotation count
    const newRotationCounts = [...rotationCounts];
    newRotationCounts[index] = (rotationCounts[index] + 1) % 4;
    setRotationCounts(newRotationCounts);
  };

  const handleClear = () => {
    setCurrentState(Array(16).fill(null));
    setRotationCounts(Array(16).fill(0));
  };

  return (
    <div>
      <div className="flex gap-4 justify-center mb-6">
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
      </div>
      <div
        className="grid w-1/3 aspect-square mx-auto my-4"
        style={{
          gridTemplateColumns: `repeat(${4}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${4}, minmax(0, 1fr))`,
        }}
      >
        {currentState.map((pipe, index) => (
          <div
            key={index}
            className="border border-gray-300 bg-white cursor-pointer"
            onClick={() => handlePipeClick(index)}
          >
            {pipe && (
              <Image
                src={`/type${getPipeType(pipe)}.svg`}
                className="w-full h-full transition-transform duration-200"
                style={{
                  transform: `rotate(${rotationCounts[index] * 90}deg)`,
                }}
                alt={`Pipe type ${getPipeType(pipe)}`}
                width={100}
                height={100}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
