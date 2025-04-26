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
      return 1;
    } else {
      return 0;
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
