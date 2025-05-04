// Contains some general functions used in various other Pipes CSP function implementations

export type Openings = [boolean, boolean, boolean, boolean];
export type Assignment = Openings[];
export type PartialAssignment = Array<Openings | null>;

// mapping of PipeTypes to a character that represents them visually.
const PIPE_CHAR: { [key: string]: string } = {
  "true,false,false,false": "╵", // Open at the top
  "false,true,false,false": "╶", // Open at the right
  "false,false,true,false": "╷", // Open at the bottom
  "false,false,false,true": "╴", // Open at the left
  "true,true,false,false": "└", // Elbow (bottom-left)
  "true,false,true,false": "│", // Vertical pipe
  "true,false,false,true": "┘", // Elbow (bottom-right)
  "false,true,true,false": "┌", // Elbow (top-left)
  "false,true,false,true": "─", // Horizontal pipe
  "false,false,true,true": "┐", // Elbow (top-right)
  "true,true,true,false": "├", // T-junction (left, down, up)
  "true,true,false,true": "┴", // T-junction (left, right, down)
  "true,false,true,true": "┤", // T-junction (right, down, up)
  "false,true,true,true": "┬", // T-junction (left, right, up)
};

function pipeTypeKey(pipe: Openings): string {
  return pipe.join(",");
}

export function printPipesGrid(pipes: Openings[]): void {
  const n = Math.sqrt(pipes.length);
  for (let i = 0; i < pipes.length; i++) {
    const key = pipeTypeKey(pipes[i]);
    // Node.js: write a single character (fallback to space if missing)
    process.stdout.write(PIPE_CHAR[key] || " ");
    if (i % n === n - 1) {
      process.stdout.write("\n");
    }
  }
}

export function findAdj(
  center: number,
  n: number
): [number, number, number, number] {
  let above = center - n;
  let right = center + 1;
  let below = center + n;
  let left = center - 1;

  if (above < 0) {
    above = -1;
  }
  if (right % n === 0) {
    right = -1;
  }
  if (below >= n * n) {
    below = -1;
  }
  if (left % n === n - 1) {
    left = -1;
  }

  return [above, right, below, left];
}

export function checkConnections(
  center: Openings,
  adj: Array<Openings | null>
): [boolean, boolean, boolean, boolean] {
  const connections: boolean[] = [false, false, false, false];

  for (let i = 0; i < center.length; i++) {
    if (center[i]) {
      const adjPipe = adj[i];
      if (adjPipe !== null && adjPipe[(i + 2) % 4]) {
        connections[i] = true;
      }
    }
  }

  const [connectedUp, connectedRight, connectedDown, connectedLeft] =
    connections;
  return [connectedUp, connectedRight, connectedDown, connectedLeft];
}
