"use client";

import BuildableBoard from "./BuildableBoard";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function Page() {
  return (
    <DndProvider backend={HTML5Backend}>
      {/* Builder Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <BuildableBoard />
        </div>
      </section>
    </DndProvider>
  );
}
