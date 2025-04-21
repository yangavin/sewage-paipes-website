export class PlayableBoard {
  n: number;
  state: Array<Array<boolean>>;
  initialState: Array<Array<boolean>>;
  solution: Array<Array<boolean>>;

  constructor(solution_encoding: string) {
    this.n = Math.sqrt(solution_encoding.length / 4);

    // Decoding the solution into array
    const res: Array<Array<boolean>> = [];
    for (let i = 0; i < solution_encoding.length; i += 4) {
      const pipe: Array<boolean> = [];
      for (let j = 0; j < 4; j++) {
        pipe.push(solution_encoding[i + j] === "1");
      }
      res.push(pipe);
    }
    this.solution = res;

    // Initialize state with a copy of the solution
    this.state = res.map((pipe) => [...pipe]);

    // Scrambling solution by randomly rotating each pipe
    for (let i = 0; i < this.state.length; i++) {
      const numTurns = Math.floor(Math.random() * 4); // Random number between 0 and 3
      for (let t = 0; t < numTurns; t++) {
        this.turn(i);
      }
    }

    this.initialState = this.state.map((pipe) => [...pipe]);
  }

  public turn(index: number): void {
    this.state[index] = [
      this.state[index][3],
      this.state[index][0],
      this.state[index][1],
      this.state[index][2],
    ];
  }
}

export class EditableBoard {
  n: number;
  state: Array<Array<boolean> | null>;

  constructor(n: number) {
    this.n = n;
    // Create a array of size n^2 with all null values
    this.state = Array.from({ length: n * n }, () => null);
  }

  public turn(index: number): void {
    if (this.state[index] !== null) {
      this.state[index] = [
        this.state[index][3],
        this.state[index][0],
        this.state[index][1],
        this.state[index][2],
      ];
    }
  }

  public assign(index: number, pipe: Array<boolean> | null): void {
    this.state[index] = pipe;
  }
}

export function getPipeType(arr: Array<boolean>): string {
  if (arr.length !== 4) {
    throw new Error("Input array must be exactly 4 booleans");
  }

  const trueIndices = arr
    .map((val, idx) => (val ? idx : -1))
    .filter((idx) => idx !== -1);

  const trueCount = trueIndices.length;

  if (trueCount === 1) {
    return "1";
  }

  if (trueCount === 3) {
    return "4";
  }

  if (trueCount === 2) {
    const [first, second] = trueIndices;
    return second - first === 1 ? "3" : "2";
  }

  // Optional: handle other cases (e.g., all true or all false)
  return "Invalid input based on rules";
}
