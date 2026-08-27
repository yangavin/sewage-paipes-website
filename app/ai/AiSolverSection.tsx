"use client";

import BuildableBoard from "./BuildableBoard";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function AiSolverSection() {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="text-center mb-12">
        <h2 className="mb-4">AI Solver</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Build your own puzzle by dragging pipes onto the board, then watch
          the AI solve it move by move.
        </p>
      </div>
      <BuildableBoard />
    </DndProvider>
  );
}
