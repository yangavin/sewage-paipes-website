import { createPipesCSP } from "./combined";
import { PipeType } from "./utils";

/**
 * Generates a string representation of a pipe state
 * @param state An array of PipeType objects representing the puzzle state
 * @returns A string of 0s and 1s representing the state
 */
function generateOneStateStr(state: PipeType[]): string {
  let output = "";
  for (const pipe of state) {
    for (let dir = 0; dir < 4; dir++) {
      output += pipe[dir] ? "1" : "0";
    }
  }
  return output;
}

/**
 * Generates a valid pipe puzzle solution for an n×n grid
 * @param n The size of the grid (n x n)
 * @returns A string representation of a valid puzzle solution
 */
export function generateSolution(n: number): string {
  // Create CSP
  const csp = createPipesCSP(n);

  // Find single solution using GAC
  const solutions = new Set<string>();
  csp.gacAll(solutions, 1, false, true);

  // Get the solution
  if (solutions.size > 0) {
    const solutionArr = Array.from(solutions);
    const solution = JSON.parse(solutionArr[0]);
    return generateOneStateStr(solution);
  }

  return "No solution found";
}
