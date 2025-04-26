import { PipeType } from "./utils";
import {
  noHalfConnectionsValidatorH,
  noHalfConnectionsValidatorV,
  noHalfConnectionsPrunerH,
  noHalfConnectionsPrunerV,
  noCyclesValidator,
  noCyclesPruner,
  connectedValidator,
  connectedPruner,
} from "./constraints";
import { CSP, Variable, Constraint } from "./csp";

/**
 * Generate a domain based on the four boolean flags:
 * if i == 0: 0 is false (top)
 * if i == n-1: 2 is false (bottom)
 * if j == 0: 3 is false (left)
 * if j == n-1: 1 is false (right)
 *
 * @param top A boolean indicating if the top of the pipe is blocked.
 * @param right A boolean indicating if the right of the pipe is blocked.
 * @param bottom A boolean indicating if the bottom of the pipe is blocked.
 * @param left A boolean indicating if the left of the pipe is blocked.
 * @returns A list of PipeType objects representing the domain.
 */
export function generateDomain(
  top: boolean,
  right: boolean,
  bottom: boolean,
  left: boolean
): PipeType[] {
  // all the possible domains for pipes in the pipes puzzle
  // [true, true, true, true] and [false, false, false, false] are omitted - they represent all connections or no connections, which are immune to rotations.
  let domain: PipeType[] = [
    [true, true, true, false],
    [true, true, false, true],
    [true, true, false, false],
    [true, false, true, true],
    [true, false, true, false],
    [true, false, false, true],
    [true, false, false, false],
    [false, true, true, true],
    [false, true, true, false],
    [false, true, false, true],
    [false, true, false, false],
    [false, false, true, true],
    [false, false, true, false],
    [false, false, false, true],
  ];

  if (top) {
    // remove pipes that point up if the pipe is at the top of the grid
    domain = domain.filter((pipe) => !pipe[0]);
  }
  if (bottom) {
    // remove pipes that point down if the pipe is at the bottom of the grid
    domain = domain.filter((pipe) => !pipe[2]);
  }
  if (right) {
    // remove pipes that point right if the pipe is on the right side of the grid
    domain = domain.filter((pipe) => !pipe[1]);
  }
  if (left) {
    // remove pipes that point left if the pipe is on the left side of the grid
    domain = domain.filter((pipe) => !pipe[3]);
  }

  return domain;
}

/**
 * Creates a CSP for the pipes puzzle
 * @param n The size of the grid (n x n)
 * @returns A CSP object representing the pipes puzzle
 */
export function createPipesCSP(n: number): CSP {
  const variables: Variable[] = [];

  // initialize variable objects
  for (let i = 0; i < n; i++) {
    const row: Variable[] = [];
    for (let j = 0; j < n; j++) {
      const top = i === 0;
      const bottom = i === n - 1;
      const left = j === 0;
      const right = j === n - 1;

      const v = new Variable(
        i * n + j,
        generateDomain(top, right, bottom, left)
      );

      row.push(v);
    }
    variables.push(...row);
  }

  const allConstraints: Constraint[] = [];

  // create binary constraints for no blocking
  const noHalfConnectionsConstraints: Constraint[] = [];

  // start with horizontal constraints
  const noHalfConnectionsH: Constraint[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - 1; j++) {
      const left = variables[i * n + j];
      const right = variables[i * n + j + 1];
      const scope = [left, right];
      const name = `no half-connections horizontal ${i * n + j}, ${
        i * n + j + 1
      }`;

      noHalfConnectionsH.push(
        new Constraint(
          name,
          noHalfConnectionsValidatorH,
          noHalfConnectionsPrunerH,
          scope
        )
      );
    }
  }

  // vertical constraints
  const noHalfConnectionsV: Constraint[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n; j++) {
      const above = variables[i * n + j];
      const below = variables[(i + 1) * n + j];
      const scope = [above, below];
      const name = `no half-connections vertical ${i * n + j}, ${
        (i + 1) * n + j
      }`;

      noHalfConnectionsV.push(
        new Constraint(
          name,
          noHalfConnectionsValidatorV,
          noHalfConnectionsPrunerV,
          scope
        )
      );
    }
  }

  // add constraints
  noHalfConnectionsConstraints.push(
    ...noHalfConnectionsH,
    ...noHalfConnectionsV
  );

  // create tree constraint
  const treeConstraint = new Constraint(
    "tree",
    noCyclesValidator,
    noCyclesPruner,
    variables
  );

  // create connected constraint
  const connectedConstraint = new Constraint(
    "connected",
    connectedValidator,
    connectedPruner,
    variables
  );

  // add all constraints
  allConstraints.push(
    ...noHalfConnectionsConstraints,
    treeConstraint,
    connectedConstraint
  );

  return new CSP(`Pipes_${n}x${n}`, variables, allConstraints);
}
