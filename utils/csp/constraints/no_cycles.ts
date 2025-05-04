import { Openings, Assignment, findAdj, checkConnections } from "../utils";
import { Variable } from "../csp";

function assignmentHasCycle(
  curr: number,
  assignment: Assignment,
  visited: Set<number>,
  prev: number | null = null
): boolean {
  if (visited.has(curr)) {
    return true;
  }

  visited.add(curr);
  const adjIndexes = findAdj(curr, Math.sqrt(assignment.length));

  const centerPipe = assignment[curr];
  const pipes = adjIndexes.map((i) => (i !== -1 ? assignment[i] : null));

  const adjConnections = checkConnections(centerPipe, pipes);

  for (let i = 0; i < 4; i++) {
    if (adjConnections[i] && adjIndexes[i] !== prev) {
      if (assignmentHasCycle(adjIndexes[i], assignment, visited, curr)) {
        return true;
      }
    }
  }

  return false;
}

export function validator(assignment: Assignment): boolean {
  return !assignmentHasCycle(0, assignment, new Set<number>());
}

function getDuplicatedTouched(
  curr: number,
  assignment: Array<Openings | null>,
  visited: Set<number>,
  touched: Map<number, number>,
  prev: number | null = null
): [number, number, number] | null {
  visited.add(curr);

  const centerPipe = assignment[curr];
  if (centerPipe === null) {
    throw new Error("Traversed to an unassigned pipe");
  }

  const adjIndexes = findAdj(curr, Math.sqrt(assignment.length));

  for (let i = 0; i < 4; i++) {
    if (centerPipe[i]) {
      if (adjIndexes[i] === -1) {
        throw new Error(
          `Pipe pointing to edge of grid in the direction of ${i}`
        );
      }

      if (adjIndexes[i] !== prev && touched.has(adjIndexes[i])) {
        return [adjIndexes[i], curr, touched.get(adjIndexes[i])!];
      }

      touched.set(adjIndexes[i], curr);
    }
  }

  const pipes = adjIndexes.map((i) => (i !== -1 ? assignment[i] : null));
  const adjConnections = checkConnections(centerPipe, pipes);

  for (let i = 0; i < 4; i++) {
    if (adjConnections[i] && adjIndexes[i] !== prev) {
      const duplicateTouch = getDuplicatedTouched(
        adjIndexes[i],
        assignment,
        visited,
        touched,
        curr
      );

      if (duplicateTouch) {
        return duplicateTouch;
      }
    }
  }

  return null;
}

export function pruner(variables: Variable[]): Map<Variable, Openings[]> {
  const assignment: Array<Openings | null> = variables.map((v) =>
    v.getAssignment()
  );
  const n = Math.sqrt(assignment.length);

  const visited: Set<number> = new Set();
  for (
    let assignmentIndex = 0;
    assignmentIndex < assignment.length;
    assignmentIndex++
  ) {
    const assignmentValue = assignment[assignmentIndex];

    if (assignmentValue !== null && !visited.has(assignmentIndex)) {
      const duplicateTouch = getDuplicatedTouched(
        assignmentIndex,
        assignment,
        visited,
        new Map<number, number>()
      );

      if (duplicateTouch) {
        const variableToPrune = variables.find(
          (v) => v.location === duplicateTouch[0]
        );

        if (!variableToPrune) continue;

        const [top, right, bottom, left] = findAdj(duplicateTouch[0], n);
        const directions = [top, right, bottom, left];
        const touches = [duplicateTouch[1], duplicateTouch[2]];
        const touchedDirections: number[] = [];

        for (let i = 0; i < directions.length; i++) {
          for (const touchValue of touches) {
            if (directions[i] === touchValue) {
              touchedDirections.push(i);
            }
          }
        }

        const prunedValues: Openings[] = [];
        for (const activeDomain of variableToPrune.getActiveDomain()) {
          if (
            activeDomain[touchedDirections[0]] &&
            activeDomain[touchedDirections[1]]
          ) {
            prunedValues.push(activeDomain);
          }
        }

        const prunedDict = new Map<Variable, Openings[]>();
        prunedDict.set(variableToPrune, prunedValues);

        variableToPrune.prune(prunedValues);

        return prunedDict;
      }
    }
  }

  return new Map<Variable, Openings[]>();
}
