"use client";

import BuildableBoard from "./BuildableBoard";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function Page() {
  return (
    <DndProvider backend={HTML5Backend}>
      <h1 className="text-4xl font-bold my-8 text-center">
        Sewage pAIpes AI Solver
      </h1>
      <BuildableBoard />
    </DndProvider>
  );
}
