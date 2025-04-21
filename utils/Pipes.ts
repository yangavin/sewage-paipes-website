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

export function getPipeType(boolArray: Array<boolean>): string {
  // Count the number of true values
  const trueCount = boolArray.filter((value) => value === true).length;

  // Case: 1 true
  if (trueCount === 1) {
    return "1";
  }

  // Case: 3 trues
  if (trueCount === 3) {
    return "4";
  }

  // Case: 2 trues
  if (trueCount === 2) {
    // Check if they're adjacent (including wrap-around)
    // We'll check all possible adjacent pairs
    if (
      (boolArray[0] && boolArray[1]) ||
      (boolArray[1] && boolArray[2]) ||
      (boolArray[2] && boolArray[3]) ||
      (boolArray[3] && boolArray[0])
    ) {
      return "3";
    } else {
      return "2";
    }
  }

  // Default case (0 or 4 trues)
  return "0";
}

export function getPipeOrientation(arr: Array<boolean>): number {
  const type = getPipeType(arr);
  if (type === "1") {
    if (arr[0]) {
      return 1;
    } else if (arr[1]) {
      return 2;
    } else if (arr[2]) {
      return 3;
    } else if (arr[3]) {
      return 0;
    }
  }

  if (type === "2") {
    if (arr[0]) {
      return 0;
    } else {
      return 1;
    }
  }

  if (type === "3") {
    if (arr[0] && arr[1]) {
      return 3;
    } else if (arr[1] && arr[2]) {
      return 0;
    } else if (arr[2] && arr[3]) {
      return 1;
    } else if (arr[3] && arr[0]) {
      return 2;
    }
  }

  if (type === "4") {
    if (!arr[0]) {
      return 0;
    } else if (!arr[1]) {
      return 1;
    } else if (!arr[2]) {
      return 2;
    } else {
      return 3;
    }
  }

  throw new Error("My function is wrong I guess");
}
