import { Openings } from "../utils";
import { Variable } from "../csp";

/**
 * Ensures that two horizontally-adjacent pipes are not blocking each other
 * @param pipes A tuple of two pipes. pipes[0] is the one on the left, pipes[1] is the one on the right
 */
export function validatorH(pipes: Openings[]): boolean {
  const left = pipes[0];
  const right = pipes[1];
  // check if the left pipe's right opening is the same as the right pipe's left opening
  return left[1] === right[3];
}

/**
 * Ensures that two vertically-adjacent pipes are not blocking each other
 * @param pipes A tuple of two pipes. pipes[0] is the one above, pipes[1] is the one below
 */
export function validatorV(pipes: Openings[]): boolean {
  const above = pipes[0];
  const below = pipes[1];
  // check if the top pipe's bottom opening is the same as the bottom pipe's top opening
  return above[2] === below[0];
}

/**
 * Prunes values from 2 variables that would result in one of the pipes being blocked by an exit of another pipe
 * @param pipes Tuple of two pipes where pipes[0] is to the left of pipes[1]
 * @returns A map of the variables to the values to remove from their active domain
 */
export function prunerH(pipes: Variable[]): Map<Variable, Openings[]> {
  const left = pipes[0];
  const right = pipes[1];

  const leftAssignment = left.getAssignment();
  const rightAssignment = right.getAssignment();

  const toPrune = new Map<Variable, Openings[]>();

  if (leftAssignment !== null && rightAssignment === null) {
    for (const pipeType of right.getActiveDomain()) {
      // there is a path to the right pipe, prune all PipeTypes for the right pipe where the pipe doesn't connect with the left
      // or
      // there is no path to the right pipe, prune all PipeTypes for the right pipe where the pipe tries to connect with the left pipe
      if (leftAssignment[1] !== pipeType[3]) {
        if (toPrune.has(right)) {
          toPrune.get(right)!.push(pipeType);
        } else {
          toPrune.set(right, [pipeType]);
        }
      }
    }
  } else if (rightAssignment !== null && leftAssignment === null) {
    for (const pipeType of left.getActiveDomain()) {
      // there is a path to the left pipe, prune all PipeTypes for the left pipe where the pipe doesn't connect with the right
      // or
      // there is no path to the left pipe, prune all PipeTypes for the left pipe where the pipe tries to connect with the right pipe
      if (rightAssignment[3] !== pipeType[1]) {
        if (toPrune.has(left)) {
          toPrune.get(left)!.push(pipeType);
        } else {
          toPrune.set(left, [pipeType]);
        }
      }
    }
  }

  // if there are no assignments for either pipe, nothing should be pruned.
  // if both pipes are assigned, don't prune
  for (const [variable, prunedValues] of toPrune.entries()) {
    variable.prune(prunedValues);
  }

  return toPrune;
}

/**
 * Prunes values from 2 variables that would result in one of the pipes being blocked by an exit of another pipe
 * @param pipes Tuple of two pipes where pipes[0] is above pipes[1]
 * @returns A map of the variables to the values to remove from their active domain
 */
export function prunerV(pipes: Variable[]): Map<Variable, Openings[]> {
  const top = pipes[0];
  const bottom = pipes[1];

  const topAssignment = top.getAssignment();
  const bottomAssignment = bottom.getAssignment();

  const toPrune = new Map<Variable, Openings[]>();

  if (topAssignment !== null && bottomAssignment === null) {
    for (const pipeType of bottom.getActiveDomain()) {
      // there is a path to the bottom pipe, prune all PipeTypes for the bottom pipe where the pipe doesn't connect with the top
      // or
      // there is no path to the bottom pipe, prune all PipeTypes for the bottom pipe where the pipe tries to connect with the top pipe
      if (topAssignment[2] !== pipeType[0]) {
        if (toPrune.has(bottom)) {
          toPrune.get(bottom)!.push(pipeType);
        } else {
          toPrune.set(bottom, [pipeType]);
        }
      }
    }
  } else if (bottomAssignment !== null && topAssignment === null) {
    for (const pipeType of top.getActiveDomain()) {
      // there is a path to the top pipe, prune all PipeTypes for the top pipe where the pipe doesn't connect with the bottom
      // or
      // there is no path to the top pipe, prune all PipeTypes for the top pipe where the pipe tries to connect with the bottom pipe
      if (bottomAssignment[0] !== pipeType[2]) {
        if (toPrune.has(top)) {
          toPrune.get(top)!.push(pipeType);
        } else {
          toPrune.set(top, [pipeType]);
        }
      }
    }
  }

  // if there are no assignments for either pipe, nothing should be pruned.
  // if both pipes are assigned, don't prune
  for (const [variable, prunedValues] of toPrune.entries()) {
    variable.prune(prunedValues);
  }

  return toPrune;
}
