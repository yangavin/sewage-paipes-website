"use client";

import BuildableBoard from "./BuildableBoard";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function AiSolverSection() {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="mb-14 grid gap-6 lg:grid-cols-[1fr_.7fr] lg:items-end">
        <div>
          <div className="eyebrow">Model workspace / 02</div>
          <h2 className="mt-4">Make the puzzle.<br />Let the model think.</h2>
        </div>
        <p className="max-w-xl text-base leading-7 text-muted-foreground lg:justify-self-end">
          Compose a custom 4×4 network, rotate it into any starting state, then
          watch the trained model choose each move in real time.
        </p>
      </div>
      <BuildableBoard />
    </DndProvider>
  );
}
