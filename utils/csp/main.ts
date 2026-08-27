import { createPipesCSP } from "./combined";
import { Openings } from "./utils";

/**
 * Generates a string representation of a pipe state
 * @param state An array of PipeType objects representing the puzzle state
 * @returns A string of 0s and 1s representing the state
 */
function generateOneStateStr(state: Openings[]): string {
  let output = "";
  for (const pipe of state) {
    for (let dir = 0; dir < 4; dir++) {
      output += pipe[dir] ? "1" : "0";
    }
  }
  return output;
}

/**
 * How long a single search attempt is allowed to run before it is abandoned
 * and retried with a fresh random seed.
 *
 * The randomized GAC search is heavy-tailed: on a 25x25 board the large
 * majority of random seeds produce a solution in a couple of seconds, but a
 * small fraction wander into a part of the search space that takes
 * effectively forever, which is what used to hang the page. Restarting is far
 * cheaper than waiting out a bad seed, and it leaves the common case
 * untouched — a typical attempt finishes well inside this budget and never
 * sees the timeout at all.
 */
const ATTEMPT_BUDGET_MS = 1000;

/** Number of restarts before giving up entirely. */
const MAX_ATTEMPTS = 12;

/** Yields to the event loop so the browser can paint between attempts. */
function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Generates a valid pipe puzzle solution for an n×n grid.
 *
 * Runs the CSP search under a time budget, restarting with a fresh random seed
 * if an attempt overruns it, so generation cannot hang indefinitely.
 *
 * @param n The size of the grid (n x n)
 * @returns A Promise with a string representation of a valid puzzle solution
 */
export async function generateSolution(n: number): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // let the browser paint the loading state before we block the thread
    await yieldToBrowser();

    const csp = createPipesCSP(n);
    csp.deadline = Date.now() + ATTEMPT_BUDGET_MS;

    const solutions = new Set<string>();
    csp.gacAll(solutions, 1, false, true);

    if (solutions.size > 0) {
      const solution = JSON.parse(Array.from(solutions)[0]);
      return generateOneStateStr(solution);
    }

    // Ran out of time on this seed - fall through and retry with a new one.
    // A search that finished without timing out and still found nothing means
    // the board genuinely has no solution, so retrying would not help.
    if (!csp.timedOut) {
      throw new Error(`No solution found for ${n}x${n}`);
    }
  }

  throw new Error(
    `Could not generate a ${n}x${n} puzzle in ${MAX_ATTEMPTS} attempts`
  );
}
