// Implementation of CSP with iterative algorithms for better performance

import { Openings, Assignment, findAdj, printPipesGrid } from "./utils";

type Validator = (pipes: Openings[]) => boolean;
type Pruner = (scope: Variable[]) => Map<Variable, Openings[]>;

export class Variable {
  location: number;
  domain: Openings[];
  activeDomain: Openings[];
  assignment: Openings | null = null;

  constructor(
    location: number,
    domain: Openings[] = [],
    assignment: Openings | null = null
  ) {
    this.location = location;
    this.domain = domain;
    this.activeDomain = [...domain];
    if (assignment !== null) {
      this.assign(assignment);
    }
  }

  getActiveDomain(): Openings[] {
    return [...this.activeDomain];
  }

  getAssignment(): Openings | null {
    return this.assignment;
  }

  prune(toRemove: Openings[]): void {
    for (const p of toRemove) {
      const idx = this.activeDomain.findIndex((d) =>
        d.every((b, i) => b === p[i])
      );
      if (idx >= 0) this.activeDomain.splice(idx, 1);
    }
  }

  assign(value: Openings): boolean {
    if (!this.domain.some((d) => d.every((b, i) => b === value[i]))) {
      console.error("Attempted to assign variable to value not in domain");
      return false;
    }
    this.assignment = value;
    return true;
  }

  unassign(): boolean {
    if (this.assignment !== null) {
      this.assignment = null;
      return true;
    }
    return false;
  }

  toString(): string {
    const ass = this.assignment
      ? `[${this.assignment.join(",")}]`
      : "Unassigned";
    return `Variable ${this.location}: ${ass} in [${this.activeDomain
      .map((d) => "[" + d.join(",") + "]")
      .join(", ")}]`;
  }
}

export class Constraint {
  name: string;
  private validator: Validator;
  private pruner: Pruner;
  scope: Variable[];

  constructor(
    name: string,
    validator: Validator,
    pruner: Pruner,
    scope: Variable[]
  ) {
    this.name = name;
    this.validator = validator;
    this.pruner = pruner;
    this.scope = scope;
  }

  varHasActiveDomains(): boolean {
    return this.scope.every((v) => v.activeDomain.length > 0);
  }

  checkFullyAssigned(): boolean {
    return this.scope.every((v) => v.getAssignment() !== null);
  }

  violated(): boolean {
    if (!this.checkFullyAssigned()) {
      throw new Error(
        "Tried to check if a constraint with unassigned variables was violated"
      );
    }
    const pipes = this.scope.map((v) => v.getAssignment()!) as Openings[];
    return !this.validator(pipes);
  }

  prune(): Map<Variable, Openings[]> {
    return this.pruner(this.scope);
  }

  toString(): string {
    return this.name;
  }
}

export class CSP {
  name: string;
  vars: Variable[] = [];
  cons: Constraint[] = [];
  varsToCons: Map<Variable, Constraint[]> = new Map();
  assignedVars: Variable[] = [];
  unassignedVars: Variable[] = [];

  /**
   * Wall-clock cutoff (ms since epoch) for the current search. The randomized
   * search is heavy-tailed: most seeds solve a 25x25 board in a few seconds,
   * but a small fraction wander into a region that takes effectively forever.
   * Rather than let that hang the page, the search abandons the attempt once
   * this deadline passes and the caller retries with a fresh random seed.
   */
  deadline: number = Infinity;

  /** Set when a search bailed out because {@link deadline} passed. */
  timedOut: boolean = false;

  constructor(name: string, vars: Variable[], cons: Constraint[]) {
    this.name = name;
    for (const v of vars) this.addVar(v);
    for (const c of cons) this.addCon(c);
  }

  addVar(v: Variable): void {
    if (!this.vars.includes(v)) {
      this.vars.push(v);
      this.varsToCons.set(v, []);
      if (v.getAssignment() === null) {
        this.unassignedVars.push(v);
      } else {
        this.assignedVars.push(v);
      }
    }
  }

  addCon(c: Constraint): void {
    if (!this.cons.includes(c)) {
      for (const v of c.scope) {
        const arr = this.varsToCons.get(v);
        if (!arr) {
          throw new Error(
            `Trying to add constraint with unknown variable to ${this.name}`
          );
        }
        arr.push(c);
      }
      this.cons.push(c);
    }
  }

  getCons(): Constraint[] {
    return [...this.cons];
  }

  getVars(): Variable[] {
    return [...this.vars];
  }

  getConsWithVar(v: Variable): Constraint[] {
    return [...(this.varsToCons.get(v) || [])];
  }

  assignVar(v: Variable, val: Openings): boolean {
    if (v.assign(val)) {
      this.unassignedVars = this.unassignedVars.filter((x) => x !== v);
      this.assignedVars.push(v);
      return true;
    }
    return false;
  }

  unassignVar(v: Variable): boolean {
    if (v.unassign()) {
      this.unassignedVars.push(v);
      this.assignedVars = this.assignedVars.filter((x) => x !== v);
      return true;
    }
    return false;
  }

  getAssignment(): Assignment {
    return this.vars.map((v) => {
      const a = v.getAssignment();
      if (a === null) {
        throw new Error(
          "Tried to get assignment when some variables are unassigned"
        );
      }
      return a;
    });
  }

  // Optimized implementation of ac3 with iteration limits to prevent infinite loops
  ac3(queue: Constraint[]): Map<Variable, Openings[]> {
    const prunedAll = new Map<Variable, Openings[]>();
    const queueCopy = [...queue]; // Create a copy to avoid modifying the original

    // Safety limit: prevent infinite loops in constraint propagation
    const maxIterations = this.vars.length * this.cons.length * 10; // Reasonable upper bound
    let iterations = 0;

    while (queueCopy.length > 0 && iterations < maxIterations) {
      iterations++;

      // A single ac3 pass can itself run long on a bad branch, so honour the
      // search deadline here too rather than only between search nodes.
      if ((iterations & 0xff) === 0 && Date.now() > this.deadline) {
        this.timedOut = true;
        return prunedAll;
      }

      const con = queueCopy.shift()!;
      const pruned = con.prune();

      for (const [v, rem] of pruned.entries()) {
        if (!prunedAll.has(v)) {
          prunedAll.set(v, []);
        }

        prunedAll.get(v)!.push(...rem);

        if (v.getActiveDomain().length === 0) {
          return prunedAll;
        }

        // Add all constraints containing the modified variable to the queue
        for (const c of this.getConsWithVar(v)) {
          if (!queueCopy.includes(c)) {
            queueCopy.push(c);
          }
        }
      }
    }
    
    // If we hit the iteration limit, log a warning but continue
    if (iterations >= maxIterations) {
      console.warn(`AC3 iteration limit reached (${maxIterations}). This may indicate constraint cycles.`);
    }

    return prunedAll;
  }

  /**
   * Finds all solutions to the csp using generalized arc consistency. Solutions are
   * accumulated into the `solutions` set passed in as a parameter.
   *
   * This is a direct port of the recursive `gac_all` from the Python implementation
   * (see csp.py). It intentionally mirrors that recursion (including the full
   * domain backup/restore per branch) rather than a hand-rolled iterative stack
   * machine, since a previous iterative rewrite of this method diverged from the
   * Python semantics on backtracking and could get stuck in an unbounded loop.
   *
   * @param solutions Set where solutions (as JSON strings) are accumulated
   * @param maxSolutions the maximum number of solutions to generate, -1 for unlimited
   * @param printSolutions whether to print a visual representation of each solution
   * @param randomStart whether to randomize variable/value selection order
   * @returns the number of solutions generated so far
   */
  gacAll(
    solutions: Set<string>,
    maxSolutions: number = -1,
    printSolutions: boolean = false,
    randomStart: boolean = false
  ): number {
    // check if enough solutions have been generated
    if (maxSolutions !== -1 && solutions.size >= maxSolutions) {
      return solutions.size;
    }

    // abandon this attempt if it has outrun its time budget
    if (this.timedOut || Date.now() > this.deadline) {
      this.timedOut = true;
      return solutions.size;
    }

    // check if all variables in the csp have been assigned
    if (this.unassignedVars.length === 0) {
      const currAssignment = this.getAssignment();
      const solutionStr = JSON.stringify(currAssignment);

      if (!solutions.has(solutionStr)) {
        for (const con of this.cons) {
          if (con.violated()) {
            throw new Error(`constraint ${con.name} violated`);
          }
        }

        solutions.add(solutionStr);
        if (printSolutions) {
          printPipesGrid(currAssignment);
          console.log(solutions.size);
          console.log();
        }
      }
      return solutions.size;
    }

    // get an unassigned variable to assign next using manhattan distance heuristic
    const currVar = this.manhattanDistToConnection(randomStart);

    // if the order should be randomized, shuffle the active domain such that assignments are chosen in a random order
    const activeDomain = currVar.getActiveDomain();
    if (randomStart) {
      this.shuffle(activeDomain);
    }

    // try every active assignment for the variable
    for (const assignment of activeDomain) {
      // full snapshot of every variable's active domain, restored after this branch
      const domainBackup = new Map<Variable, Openings[]>();
      for (const v of this.vars) {
        domainBackup.set(v, [...v.activeDomain]);
      }

      this.unassignVar(currVar);
      this.assignVar(currVar, assignment);

      // prune values and accumulate pruned values
      const prunedDomains = this.ac3(this.getConsWithVar(currVar));
      let noActiveDomains = false;
      for (const v of prunedDomains.keys()) {
        if (v.getActiveDomain().length === 0) {
          noActiveDomains = true;
          break;
        }
      }

      // continue adding to solutions. Don't return so that all solutions are found.
      if (!noActiveDomains) {
        this.gacAll(solutions, maxSolutions, printSolutions, randomStart);
      }

      // restore the active domains and try another value
      for (const [v, pruned] of prunedDomains.entries()) {
        v.activeDomain.push(...pruned);
      }
      for (const v of this.vars) {
        v.activeDomain = domainBackup.get(v)!;
      }

      // stop trying further values once the attempt is out of time or done
      if (this.timedOut) break;
      if (maxSolutions !== -1 && solutions.size >= maxSolutions) break;
    }
    // if the code gets here, then all solutions for all assignments of this variable have been found.
    // Backtrack and try another assignment for a variable that was assigned earlier.
    this.unassignVar(currVar);
    return solutions.size;
  }

  manhattanDistToConnection(randomizeOrder: boolean): Variable {
    const n = Math.sqrt(this.vars.length) | 0;
    const locPipe = new Map<number, Openings>();
    for (const v of this.assignedVars) {
      locPipe.set(v.location, v.getAssignment()!);
    }
    const unassignedLocs: number[] = [];
    const locVar = new Map<number, Variable>();
    for (const v of this.unassignedVars) {
      unassignedLocs.push(v.location);
      locVar.set(v.location, v);
    }

    const direct = new Set<number>();
    for (const [loc, pipe] of locPipe) {
      const [up, right, down, left] = findAdj(loc, n);
      const neighbors: (Openings | null)[] = [
        up >= 0 && locPipe.has(up) ? locPipe.get(up)! : null,
        right >= 0 && locPipe.has(right) ? locPipe.get(right)! : null,
        down >= 0 && locPipe.has(down) ? locPipe.get(down)! : null,
        left >= 0 && locPipe.has(left) ? locPipe.get(left)! : null,
      ];
      [up, right, down, left].forEach((idx, i) => {
        if (idx !== -1 && neighbors[i] === null) direct.add(idx);
      });
    }

    const distMap = new Map<number, number[]>();
    let lowest = 2 * n;
    for (const loc of unassignedLocs) {
      let minD = 2 * n;
      for (const conn of direct) {
        const dx = Math.abs((loc % n) - (conn % n));
        const dy = Math.abs(Math.floor(loc / n) - Math.floor(conn / n));
        minD = Math.min(minD, dx + dy);
      }
      if (!distMap.has(minD)) distMap.set(minD, []);
      distMap.get(minD)!.push(loc);
      lowest = Math.min(lowest, minD);
      if (minD === 0) break;
    }

    const choices = distMap.get(lowest)!;
    const pick =
      randomizeOrder && choices.length > 1
        ? choices[Math.floor(Math.random() * choices.length)]
        : choices[0];
    return locVar.get(pick)!;
  }

  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}
