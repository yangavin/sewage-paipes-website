"use client";

import { useState } from "react";
import { runInference } from "./model";

export default function InferencePage() {
  const [output, setOutput] = useState<number[] | null>(null);

  const handleRun = async () => {
    const input = new Array(64).fill(0).map(() => Math.random()); // Example input
    const result = await runInference(input);
    setOutput(result);
  };

  return (
    <div className="p-4">
      <button
        onClick={handleRun}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Run Inference
      </button>

      {output && (
        <div className="mt-4">
          <h2>Output:</h2>
          <pre>{JSON.stringify(output, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
