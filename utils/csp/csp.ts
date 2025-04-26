// Implementation of CSP with iterative algorithms for better performance

import { PipeType, Assignment, findAdj, printPipesGrid } from "./utils";

type Validator = (pipes: PipeType[]) => boolean;
type Pruner = (scope: Variable[]) => Map<Variable, PipeType[]>;

export class Variable {
  location: number;
  domain: PipeType[];
  activeDomain: PipeType[];
  assignment: PipeType | null = null;

  constructor(
    location: number,
    domain: PipeType[] = [],
    assignment: PipeType | null = null
  ) {
    this.location = location;
    this.domain = domain;
    this.activeDomain = [...domain];
    if (assignment !== null) {
      this.assign(assignment);
    }
  }

  getActiveDomain(): PipeType[] {
    return [...this.activeDomain];
  }

  getAssignment(): PipeType | null {
    return this.assignment;
  }

  prune(toRemove: PipeType[]): void {
    for (const p of toRemove) {
      const idx = this.activeDomain.findIndex((d) =>
        d.every((b, i) => b === p[i])
      );
      if (idx >= 0) this.activeDomain.splice(idx, 1);
    }
  }

  assign(value: PipeType): boolean {
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
    const pipes = this.scope.map((v) => v.getAssignment()!) as PipeType[];
    return !this.validator(pipes);
  }

  prune(): Map<Variable, PipeType[]> {
    return this.pruner(this.scope);
  }

  toString(): string {
    return this.name;
  }
}

// Interface for stack frames in the iterative gacAll implementation
interface GacStackFrame {
  currVar: Variable;
  domainIndex: number;
  active: PipeType[];
  backup: Map<Variable, PipeType[]>;
}

export class CSP {
  name: string;
  vars: Variable[] = [];
  cons: Constraint[] = [];
  varsToCons: Map<Variable, Constraint[]> = new Map();
  assignedVars: Variable[] = [];
  unassignedVars: Variable[] = [];

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

  assignVar(v: Variable, val: PipeType): boolean {
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

  // Optimized implementation of ac3
  ac3(queue: Constraint[]): Map<Variable, PipeType[]> {
    const prunedAll = new Map<Variable, PipeType[]>();
    const queueCopy = [...queue]; // Create a copy to avoid modifying the original

    while (queueCopy.length > 0) {
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

    return prunedAll;
  }

  gacAll(
    solutions: Set<string>,
    maxSolutions: number = -1,
    printSolutions: boolean = false,
    randomStart: boolean = false
  ): number {
    // Stack to track search state
    interface SearchState {
      variable: Variable;
      domainIndex: number;
      activeDomain: PipeType[];
      pruned: Map<Variable, PipeType[]>;
    }

    const stack: SearchState[] = [];

    // Initial state
    if (this.unassignedVars.length > 0) {
      const initialVar = this.manhattanDistToConnection(randomStart);
      const activeDomain = [...initialVar.getActiveDomain()];
      if (randomStart) {
        this.shuffle(activeDomain);
      }

      if (activeDomain.length > 0) {
        stack.push({
          variable: initialVar,
          domainIndex: 0,
          activeDomain,
          pruned: new Map(),
        });
      }
    }

    while (stack.length > 0) {
      // Check if max solutions reached
      if (maxSolutions !== -1 && solutions.size >= maxSolutions) {
        return solutions.size;
      }

      // If no unassigned vars, we have a solution
      if (this.unassignedVars.length === 0) {
        const currAssignment = this.getAssignment();
        const solutionStr = JSON.stringify(currAssignment);

        if (!solutions.has(solutionStr)) {
          // Verify no constraints are violated
          let valid = true;
          for (const con of this.cons) {
            if (con.violated()) {
              valid = false;
              break;
            }
          }

          if (valid) {
            solutions.add(solutionStr);
            if (printSolutions) {
              printPipesGrid(currAssignment);
              console.log(solutions.size);
              console.log();
            }
          }
        }

        // Backtrack to try next value
        const state = stack[stack.length - 1];
        this.unassignVar(state.variable);

        // Restore pruned domains
        for (const [var_, pruned] of state.pruned.entries()) {
          var_.activeDomain.push(...pruned);
        }

        // Move to next value in domain
        state.domainIndex++;
        state.pruned = new Map();

        // If we've tried all values, pop the state
        if (state.domainIndex >= state.activeDomain.length) {
          stack.pop();
        }

        continue;
      }

      // Get current state
      const state = stack[stack.length - 1];

      // If we've tried all values in the domain, backtrack
      if (state.domainIndex >= state.activeDomain.length) {
        stack.pop();

        // If stack not empty, restore variable and prepare for next value
        if (stack.length > 0) {
          const prevState = stack[stack.length - 1];
          this.unassignVar(prevState.variable);

          // Restore pruned domains
          for (const [var_, pruned] of prevState.pruned.entries()) {
            var_.activeDomain.push(...pruned);
          }

          // Move to next value
          prevState.domainIndex++;
          prevState.pruned = new Map();
        }

        continue;
      }

      // Try current value in domain
      const assignment = state.activeDomain[state.domainIndex];

      // Ensure variable is unassigned before assigning
      this.unassignVar(state.variable);
      this.assignVar(state.variable, assignment);

      // Check if assignment leads to a dead end
      const prunedDomains = this.ac3(this.getConsWithVar(state.variable));
      let noActiveDomains = false;

      for (const [var_, pruned] of prunedDomains.entries()) {
        if (var_.getActiveDomain().length === 0) {
          noActiveDomains = true;
          break;
        }
      }

      // Update pruned domains in current state
      state.pruned = prunedDomains;

      if (noActiveDomains) {
        // Restore domains and try next value
        for (const [var_, pruned] of prunedDomains.entries()) {
          var_.activeDomain.push(...pruned);
        }
        state.domainIndex++;
        state.pruned = new Map();
      } else if (this.unassignedVars.length > 0) {
        // Move deeper in search tree
        const nextVar = this.manhattanDistToConnection(randomStart);
        const nextActiveDomain = [...nextVar.getActiveDomain()];

        if (randomStart) {
          this.shuffle(nextActiveDomain);
        }

        stack.push({
          variable: nextVar,
          domainIndex: 0,
          activeDomain: nextActiveDomain,
          pruned: new Map(),
        });
      }
      // If unassignedVars is empty, loop will continue to solution handling
    }

    return solutions.size;
  }

  manhattanDistToConnection(randomizeOrder: boolean): Variable {
    const n = Math.sqrt(this.vars.length) | 0;
    const locPipe = new Map<number, PipeType>();
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
      const neighbors: (PipeType | null)[] = [
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
