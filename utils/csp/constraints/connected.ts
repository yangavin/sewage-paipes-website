import { Openings, findAdj, checkConnections } from "../utils";
import { Variable } from "../csp";

export function validator(pipes: Openings[]): boolean {
  const visited: number[] = [];
  dft(pipes, 0, visited);
  return visited.length === pipes.length;
}

function dft(pipes: Openings[], loc: number, visited: number[]): void {
  visited.push(loc);
  const adjVals = findAdj(loc, Math.sqrt(pipes.length));

  const topVal = adjVals[0] !== -1 ? pipes[adjVals[0]] : null;
  const rightVal = adjVals[1] !== -1 ? pipes[adjVals[1]] : null;
  const bottomVal = adjVals[2] !== -1 ? pipes[adjVals[2]] : null;
  const leftVal = adjVals[3] !== -1 ? pipes[adjVals[3]] : null;

  const connections = checkConnections(pipes[loc], [
    topVal,
    rightVal,
    bottomVal,
    leftVal,
  ]);

  for (let i = 0; i < 4; i++) {
    if (connections[i] && !visited.includes(adjVals[i])) {
      dft(pipes, adjVals[i], visited);
    }
  }
}

export function pruner(variables: Variable[]): Map<Variable, Openings[]> {
  const pruned = new Map<Variable, Openings[]>();
  const pseudoAssignment = pseudoAssign(variables);

  const canBeConnected = validator(pseudoAssignment);
  if (!canBeConnected) {
    for (const v of variables) {
      if (v.getAssignment() === null) {
        const domain = v.getActiveDomain();
        pruned.set(v, [...domain]);
        v.prune(domain);
        break;
      }
    }
  } else {
    for (let i = 0; i < pseudoAssignment.length; i++) {
      findIsolatedPath(variables, pseudoAssignment, i, -1, pruned);
    }
  }

  return pruned;
}

function pseudoAssign(variables: Variable[]): Openings[] {
  const pseudoAssignment: Openings[] = [];

  for (const v of variables) {
    const assignment = v.getAssignment();
    if (assignment !== null) {
      pseudoAssignment.push(assignment);
    } else {
      const pseudoPipe: boolean[] = [false, false, false, false];
      let allTrue = false;

      for (const activeDomain of v.getActiveDomain()) {
        for (let direction = 0; direction < 4; direction++) {
          if (activeDomain[direction]) {
            pseudoPipe[direction] = true;
            if (pseudoPipe.filter(Boolean).length === 4) {
              allTrue = true;
              break;
            }
          }
        }
        if (allTrue) break;
      }

      pseudoAssignment.push(pseudoPipe as Openings);
    }
  }

  return pseudoAssignment;
}

function findIsolatedPath(
  variables: Variable[],
  pseudoAssignment: Openings[],
  i: number,
  lastDir: number,
  pruned: Map<Variable, Openings[]>
): void {
  const mainPipe = pseudoAssignment[i];
  const mainVar = variables[i];
  const adjIndex = findAdj(i, Math.sqrt(pseudoAssignment.length));
  const toPrune: Openings[] = [];

  // holds adjacent PipeTypes, not including the pipe that came before in the path
  const adjPipeList: Array<Openings | null> = [null, null, null, null];
  for (let i = 0; i < 4; i++) {
    if (adjIndex[i] !== -1 && i !== lastDir) {
      adjPipeList[i] = pseudoAssignment[adjIndex[i]];
    }
  }

  const adjPipes: Array<Openings | null> = [
    adjPipeList[0],
    adjPipeList[1],
    adjPipeList[2],
    adjPipeList[3],
  ];

  const connections = checkConnections(mainPipe, adjPipes);
  let numConnections = 0;
  let curDir = 0;

  for (let i = 0; i < 4; i++) {
    if (connections[i]) {
      numConnections++;
      curDir = i;
    }
  }

  if (numConnections === 1) {
    // the path continues, prune from current variable
    let pathDir = 0;
    for (let i = 0; i < 4; i++) {
      if (connections[i] && i !== lastDir) {
        pathDir = i;
        break;
      }
    }

    if (mainVar.getAssignment() === null) {
      const activeDomain = mainVar.getActiveDomain();
      for (const assignment of activeDomain) {
        if (!assignment[curDir] || (lastDir !== -1 && !assignment[lastDir])) {
          toPrune.push(assignment);
          if (pruned.has(mainVar)) {
            pruned.get(mainVar)!.push(assignment);
          } else {
            pruned.set(mainVar, [assignment]);
          }
        }
      }
      mainVar.prune(toPrune);
    }

    findIsolatedPath(
      variables,
      pseudoAssignment,
      adjIndex[pathDir],
      (pathDir + 2) % 4,
      pruned
    );
  }
}
