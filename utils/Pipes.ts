import { PipeInstance } from "@/app/ai/BuildableBoard";

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

export function getPipeRotation(arr: Array<boolean>): number {
  const type = getPipeType(arr);
  if (type === "1") {
    if (arr[0]) {
      return 0;
    } else if (arr[1]) {
      return 1;
    } else if (arr[2]) {
      return 2;
    } else if (arr[3]) {
      return 3;
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
      return 0;
    } else if (arr[1] && arr[2]) {
      return 1;
    } else if (arr[2] && arr[3]) {
      return 2;
    } else if (arr[3] && arr[0]) {
      return 3;
    }
  }

  if (type === "4") {
    if (!arr[0]) {
      return 2;
    } else if (!arr[1]) {
      return 3;
    } else if (!arr[2]) {
      return 0;
    } else {
      return 1;
    }
  }

  throw new Error("My function is wrong I guess");
}

export function decodeStateStr(solutionStr: string): Array<Array<boolean>> {
  const decodedSolution: Array<Array<boolean>> = [];
  for (let i = 0; i < solutionStr.length; i += 4) {
    const pipe: Array<boolean> = [];
    for (let j = 0; j < 4; j++) {
      pipe.push(solutionStr[i + j] === "1");
    }
    decodedSolution.push(pipe);
  }
  return decodedSolution;
}

export function scrambleState(
  solution: Array<Array<boolean>>
): Array<Array<boolean>> {
  return solution.map((pipe) => {
    const numTurns = Math.floor(Math.random() * 4);
    let rotatedPipe = [...pipe];
    for (let t = 0; t < numTurns; t++) {
      rotatedPipe = [
        rotatedPipe[3],
        rotatedPipe[0],
        rotatedPipe[1],
        rotatedPipe[2],
      ];
    }
    return rotatedPipe;
  });
}

export function encodeBoardState(boardState: Array<PipeInstance | null>) {
  return boardState
    .map((pipe) => {
      if (pipe === null) {
        throw new Error("Pipe is null");
      }
      return pipe.pipe.map((val) => (val ? "1" : "0")).join("");
    })
    .join("");
}
