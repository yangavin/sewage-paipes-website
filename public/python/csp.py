from math import sqrt
import random
from pipes_utils import find_adj
from pipes_utils import PipeType, Assignment, print_pipes_grid
from typing import Optional, Callable

# Classes for CSP
# Implementation details can be found in the csp.py section in the report


class Variable:
    """
    A class representing a variable for a pipe at each location in the CSP.

    Attributes:
        location: int used to identify the object
        domain: values that the variable can take on
        active_domain: values that the variable can take on without backtracking
        assignment: current value of the variable
    """

    def __init__(
        self,
        location: int,
        domain: list[PipeType] = [],
        assignment: Optional[PipeType] = None,
    ):
        """
        Initialize a Variable with a location, domain, and an optional assignment.

        :param location: An int used to identify the Variable.
        :param domain: A list of PipeType objects representing the domain of the variable.
        :param assignment: An optional PipeType object representing the current assignment.
        """
        self.location = location
        self.domain = domain
        self.active_domain = domain.copy()
        self.assignment: Optional[PipeType] = None
        if assignment is not None:
            self.assign(assignment)

    def get_active_domain(self):
        """
        Get the domain of the variable.

        :return: A list of PipeType objects representing the active domain.
        """
        return list(self.active_domain)

    def get_assignment(self) -> PipeType | None:
        """
        Get the current assignment of the variable.

        :return: A PipeType object representing the current assignment.
        """
        return self.assignment

    def prune(self, to_remove: list[PipeType]):
        """
        Prune the active domain by removing specified PipeType objects.

        :param to_remove: A list of PipeType to be removed from the active domain.
        """
        for pipe in to_remove:
            self.active_domain.remove(pipe)

    def assign(self, assignment: PipeType) -> bool:
        """
        Assign a PipeType to the variable.
        In the context of a csp, you probably don't want to call this function. Instead, call the csp's assign function with the Variable object as a parameter. That way, the csp can track which variables have been assigned.

        :param assignment: A PipeType to be assigned to the variable.
        :returns: True if assignment is successful, False if not
        """

        if assignment not in self.domain:
            print("Attempted to assign variable to value not in domain")
            return False
        self.assignment = assignment
        return True

    def unassign(self) -> bool:
        """
        Unassign the variable by setting the assignment to None.
        In the context of a csp, you probably don't want to call this function. Instead, call the csp's unassign function with the Variable object as a parameter. That way, the csp can track which variables have been assigned.

        :returns: True if variable had an assignment that was removed, false if not
        """
        if self.assignment is not None:
            self.assignment = None
            return True
        return False

    def __repr__(self):
        """
        Return a string representation of the variable.

        :return: A string representing the variable.
        """
        ass = "Unassigned" if self.assignment is None else self.assignment
        return f"Variable {self.location}: {ass} in {self.active_domain}"


class Constraint:
    """
    A class representing a constraint for a CSP.

    Attributes:
        name: name of the constraint
        _validator: function that validates whether the assignment of variables in this constraint satisfies the constraint
        _pruner: function that determines, based on the currently assigned Variable objects in the constraint, what values can be pruned from the active domain of the unassigned Variable objects in the constraint
        scope: list of Variable objects that are impacted by this constraint
    """

    def __init__(
        self,
        name: str,
        validator: Callable[[list[PipeType]], bool],
        pruner: Callable[[list[Variable]], dict[Variable, list[PipeType]]],
        scope: list[Variable],
    ):
        """
        Initialize a Constraint with a name, validation function, pruning function, and scope.

        :param name: A string representing the name of the constraint.
        :param validator: A callable function that takes a list of PipeTypes and returns a list of active domains for each variable in scope
        :param pruner: A callable function that takes a list of assigned or unassigned variables and prunes their active domains, returns {var -> pruned_domains}
        :param scope: A list of Variable objects representing the scope of the constraint.
        """
        self.name = name
        self._validator = validator
        self._pruner = pruner
        self.scope = scope

    def get_scope(self):
        """
        Get the scope of the constraint.

        :return: A list of Variable objects representing the scope.
        """
        return list(self.scope)

    def var_has_active_domains(self):
        """
        Check if all variables in the scope have non-empty active domains.

        :return: True if all variables have non-empty active domains, False otherwise.
        """
        for var in self.scope:
            if not len(var.active_domain):
                return False
        return True

    def check_fully_assigned(self):
        """
        check if all the variables in the constraint have been assigned

        :returns: True if all variables in the constraint's scope have been assigned, false if there are some variables that are unassigned
        """
        for var in self.scope:
            if var.get_assignment() is None:
                return False
        return True

    def violated(self):
        """
        Check if the constraint is violated.

        :returns: True if the constraint is violated, False if not.
        """
        if not self.check_fully_assigned():
            raise Exception(
                "Tried to check if a constraint with unassigned variables was violated"
            )
        pipes: list[PipeType] = []
        for var in self.scope:
            var_assignment = var.get_assignment()
            assert var_assignment is not None
            pipes.append(var_assignment)
        return not self._validator(pipes)

    def prune(self) -> dict[Variable, list[PipeType]]:
        """
        Prune the active domains of the variables in the constraint's scope.

        :returns: Active domains of the variables in the constraint's scope before pruning
        """
        return self._pruner(self.scope)

    def __repr__(self):
        return self.name


class CSP:
    """
    A representation of a constraint satisfaction problem

    Attributes:
        name: String to identify the csp
        vars: list of Variable objects that are within the csp
        cons: list of Constraint objects that act on the variables within the csp
        vars_to_cons: mapping of Variables to the Constraints that they are affected by
        unassigned_vars: list of Variables that are currently unassigned
    """

    def __init__(self, name: str, vars: list[Variable], cons: list[Constraint]):
        """
        Initialize a CSP with a name, Variables, and Constraints.

        :param name: A string representing the name of the CSP.
        :param vars: list of Variable objects within the csp
        :param cons: list of Constraint objects that the Variables in the csp are affected by
        """
        self.name = name
        self.vars: list[Variable] = []
        self.cons: list[Constraint] = []
        self.vars_to_cons: dict[Variable, list[Constraint]] = {}
        self.assigned_vars: list[Variable] = []
        self.unassigned_vars: list[Variable] = []

        # add the variables
        for var in vars:
            self.add_var(var)

        # add the constraints
        for con in cons:
            self.add_con(con)

    def add_var(self, var: Variable):
        """
        Adds a variable object to the csp.

        :params var: Variable object to add
        """
        # ensure that the variable is not already in the csp
        if var not in self.vars:
            self.vars.append(var)
            self.vars_to_cons[var] = []
            if var.assignment is None:
                self.unassigned_vars.append(var)
            else:
                self.assigned_vars.append(var)

    def add_con(self, con: Constraint):
        """
        Adds a constraint object to the csp. Ensures that all Variables in the scope of the constraint are in the csp too.

        :params con: Constraint object to add
        """
        # ensure that the constraint has not yet been added
        if con not in self.cons:
            # ensure that all Variables that the constraint operates on have been added to the CSP
            for var in con.scope:
                if var not in self.vars_to_cons:
                    raise Exception(
                        "Trying to add constraint with unknown variable to", self.name
                    )
                # Map the variables in this constraint to the constraint
                self.vars_to_cons[var].append(con)
            self.cons.append(con)

    def get_cons(self):
        """
        Get a copy of the constraints in this csp

        :returns: list of constraints in the csp
        """
        return self.cons.copy()

    def get_vars(self):
        """
        Get a copy of the variables in this csp

        :returns: list of variables in the csp
        """
        return self.vars.copy()

    def get_cons_with_var(self, var: Variable):
        """
        Get a mapping of variables to constraints from this csp

        :returns: map of variables to constraints
        """
        return self.vars_to_cons[var].copy()

    def assign_var(self, var: Variable, assignment: PipeType) -> bool:
        """
        Assign a value to a specified variable

        :param var: Variable that gets assigned to a value
        :param assignment: PipeType value to assign to the variable
        :returns: True if assignment successful, False if not
        """
        if var.assign(assignment):
            self.unassigned_vars.remove(var)
            self.assigned_vars.append(var)
            return True
        return False

    def unassign_var(self, var: Variable) -> bool:
        """
        Unassign a value from a variable

        :param var: Variable to remove the assignment from
        :returns: True if value was removed, False if there was no value to remove
        """
        if var.unassign():
            self.unassigned_vars.append(var)
            self.assigned_vars.remove(var)
            return True
        return False

    def get_assignment(self) -> Assignment:
        """
        Get the current assignment of the variables in the csp.

        :returns: A list of PipeType objects representing the assignment of the variables.
        """
        assignment: Assignment = []
        for var in self.vars:
            value = var.get_assignment()
            if value is None:
                raise Exception(
                    "Tried to get assignment when some variables are unassigned"
                )
            assignment.append(value)

        return assignment

    def bt_all(self, solutions: list[Assignment]) -> None:
        """
        Recursively finds all solutions to the csp using backtracking search.

        :params solutions: list of solutions that have been found so far
        """
        if not self.unassigned_vars:
            # if all the variables have been assigned, ensure that no constraint is violated, then add the solution to the list of solutions
            curr_assignment = self.get_assignment()
            if curr_assignment not in solutions:
                for con in self.cons:
                    violated = con.violated()
                    if violated:
                        return
                solutions.append(curr_assignment)

                print_pipes_grid(curr_assignment)
                print(len(solutions))
                print()
            return

        # get an unassigned variable to assign next
        curr_var = self.unassigned_vars[0]
        # try every active assignment for the variable
        for assignment in curr_var.active_domain:
            self.assign_var(curr_var, assignment)

            # check if the newly assigned variable violates any constraints
            violated = False
            for con in self.get_cons_with_var(curr_var):
                if con.check_fully_assigned():
                    if con.violated():
                        violated = True
                        break

            # continue backtracking search if nothing has been violated
            if not violated:
                self.bt_all(solutions)
            # once all solutions have been found with all assignments for the current variable, unassign the variable and go back to the last variable
            self.unassign_var(curr_var)

    def fc_one(self) -> bool:
        """
        Solves the csp using forward checking. Solution will be stored in the variable objects related to this csp.

        :returns: True if a solution was found, false if not.
        """
        # if there are no unassigned variables in the csp and it's not already in solutions, then this is a new solution
        if not self.unassigned_vars:
            curr_assignment = self.get_assignment()
            print_pipes_grid(curr_assignment)
            return True

        # get an unassigned variable to assign next
        curr_var = self.unassigned_vars[0]
        # try every active assignment for the variable
        for assignment in curr_var.active_domain:
            self.unassign_var(curr_var)
            self.assign_var(curr_var, assignment)

            # prune values and accumulate pruned values
            pruned_domains: dict[Variable, list[PipeType]] = {}
            no_active_domains = False
            for con in self.get_cons_with_var(curr_var):
                pruned = con.prune()
                for var in pruned:
                    if var in pruned_domains:
                        pruned_domains[var] += pruned[var]
                    else:
                        pruned_domains[var] = pruned[var]

                if not con.var_has_active_domains():
                    no_active_domains = True
                    break

            if not no_active_domains and self.fc_one():
                # solution found, return True
                return True

            # solution not found, restore the active domains and try another variable
            for var in pruned_domains:
                var.active_domain += pruned_domains[var]
        # if the code gets here, then none of the assignable values for the variable work.
        # return False to indicate that the csp is unsolvable from this state of assignments.
        self.unassign_var(curr_var)
        return False

    def fc_all(
        self,
        solutions: list[Assignment],
        max_solutions: int = -1,
        print_solutions: bool = False,
        randomize_order: bool = False,
    ) -> int:
        """
        Finds all solutions to the csp using forward checking. Solutions will be stored in the solutions list that is passed in as a parameter.

        :params solutions: a list where the solutions will be stored
        :params max_solutions: the maximum number of solutions to generate
        :params print_solutions: whether to print a visual representation of the solutions or not
        :params randomize_order: whether to make the order that solutions are generated in more random
        :returns: the number of solutions generated
        """
        # check if enough solutions have been generated
        if max_solutions != -1 and len(solutions) >= max_solutions:
            return len(solutions)
        # check if all variables in the csp have been assigned
        if not self.unassigned_vars:
            curr_assignment = self.get_assignment()
            if curr_assignment not in solutions:

                for con in self.cons:
                    violated = con.violated()
                    if violated:
                        raise Exception(
                            f"constraint {con.name} violated: {con.violated()}"
                        )

                solutions.append(curr_assignment)
                if print_solutions:
                    print_pipes_grid(curr_assignment)
                    print(len(solutions))
                    print()
            return len(solutions)

        # get an unassigned variable to assign next using manhattan distance heuristic
        curr_var = self.manhattan_dist_to_connection(randomize_order)

        # if the order should be randomized, shuffle the active domain such that assignments are chosen in a random order
        active_domain = curr_var.active_domain
        if randomize_order:
            random.shuffle(active_domain)

        # try every active assignment for the variable
        for assignment in active_domain:
            self.unassign_var(curr_var)
            self.assign_var(curr_var, assignment)

            # prune values and accumulate pruned values
            pruned_domains: dict[Variable, list[PipeType]] = {}
            no_active_domains = False
            for con in self.get_cons_with_var(curr_var):
                pruned = con.prune()
                for var in pruned:
                    if var in pruned_domains:
                        pruned_domains[var] += pruned[var]
                    else:
                        pruned_domains[var] = pruned[var]

                if not con.var_has_active_domains():
                    no_active_domains = True
                    break

            # continue adding to solutions. Don't return so that all solutions are found.
            if not no_active_domains:
                self.fc_all(solutions, max_solutions, print_solutions)

            # restore the active domains and try another variable
            for var in pruned_domains:
                var.active_domain += pruned_domains[var]
        # if the code gets here, then all solutions for all assignments of this variable have been found.
        # Backtrack and try another assignment for a variable that was assigned earlier.
        self.unassign_var(curr_var)
        return len(solutions)

    def gac_one(self) -> bool:
        """
        Solves the csp using generalized arc consistency. Solution will be stored in the variable objects related to this csp.

        :returns: True if a solution was found, false if not.
        """
        # all variables in the csp have been assigned
        if not self.unassigned_vars:
            curr_assignment = self.get_assignment()
            print_pipes_grid(curr_assignment)
            return True
        # get an unassigned variable to assign next
        curr_var = self.unassigned_vars[0]
        # try every active assignment for the variable
        for assignment in curr_var.active_domain:
            # print(f"assigning value {assignment} to variable {curr_var}")
            self.unassign_var(curr_var)
            self.assign_var(curr_var, assignment)
            pruned_domains: dict[Variable, list[PipeType]] = {}

            # check if the assignment leads to a dead end (i.e. any variable having no active domains)
            no_active_domains = False
            pruned_domains = self.ac3(self.get_cons_with_var(curr_var))
            for var in pruned_domains:
                if not var.get_active_domain():
                    no_active_domains = True
                    break
            # this assignment will give a full solution once everything else is assigned
            # the variables will stay assigned after returning
            if not no_active_domains and self.gac_one():
                return True

            # dead-end (no active domains for some variable) reached, restore the active domains
            for var in pruned_domains:
                var.active_domain += pruned_domains[var]

        # if the code gets here, then none of the assignable values for the variable work.
        # return False to indicate that the csp is unsolvable from this state of assignments.
        self.unassign_var(curr_var)
        return False

    def gac_all(
        self,
        solutions: set[tuple[PipeType, ...]],
        max_solutions: int = -1,
        print_solutions: bool = False,
        random_start: bool = False,
    ) -> int:
        """
        Finds all solutions to the csp using generalized arc consistency. Solutions will be stored in the solutions list that is passed in as a parameter.

        :params solutions: a list where the solutions will be stored
        :params max_solutions: the maximum number of solutions to generate
        :params print_solutions: whether to print a visual representation of the solutions or not
        :params randomize_order: whether to make the order that solutions are generated in more random
        :returns: the number of solutions generated
        """
        # check if enough solutions have been generated
        if max_solutions != -1 and len(solutions) >= max_solutions:
            return len(solutions)
        # check if all variables in the csp have been assigned
        if not self.unassigned_vars:
            curr_assignment = self.get_assignment()
            if tuple(curr_assignment) not in solutions:

                for con in self.cons:
                    violated = con.violated()
                    if violated:
                        raise Exception(
                            f"constraint {con.name} violated: {con.violated()}"
                        )

                solutions.add(tuple(curr_assignment))
                if print_solutions:
                    print_pipes_grid(curr_assignment)
                    print(len(solutions))
                    print()
            return len(solutions)

        # get an unassigned variable to assign next using manhattan distance heuristic
        curr_var = self.manhattan_dist_to_connection(random_start)

        # if the order should be randomized, shuffle the active domain such that assignments are chosen in a random order
        active_domain = curr_var.active_domain
        if random_start:
            random.shuffle(active_domain)

        # try every active assignment for the variable
        for assignment in active_domain:
            domain_backup = {v: v.active_domain[:] for v in self.vars}
            # print(f"assigning value {assignment} to variable {curr_var}")
            self.unassign_var(curr_var)
            self.assign_var(curr_var, assignment)
            pruned_domains: dict[Variable, list[PipeType]] = {}

            # check if the assignment leads to a dead end (i.e. any variable having no active domains)
            no_active_domains = False
            pruned_domains = self.ac3(self.get_cons_with_var(curr_var))
            for var in pruned_domains:
                if not var.get_active_domain():
                    no_active_domains = True
                    break
            # this assignment will give a full solution once everything else is assigned
            # the variables will stay assigned after returning
            if not no_active_domains:
                self.gac_all(solutions, max_solutions, print_solutions, random_start)

            # dead-end (no active domains for some variable) reached, restore the active domains
            for var in pruned_domains:
                var.active_domain += pruned_domains[var]
            for v in self.vars:
                v.active_domain = domain_backup[v]

        # if the code gets here, then all solutions for all assignments of this variable have been found.
        # Backtrack and try another assignment for a variable that was assigned earlier.
        self.unassign_var(curr_var)
        return len(solutions)

    def ac3(self, q: list[Constraint]) -> dict[Variable, list[PipeType]]:
        pruned_domains: dict[Variable, list[PipeType]] = {}
        while len(q):
            # get the variables pruned when checking for satisfying tuples with the first constraint
            cur_con: Constraint = q.pop(0)
            pruned: dict[Variable, list[PipeType]] = cur_con.prune()
            for var in pruned:
                if var in pruned_domains:
                    pruned_domains[var] += pruned[var]
                else:
                    pruned_domains[var] = pruned[var]
                if not len(var.get_active_domain()):
                    # the active domain of a variable is empty, no need to bother computing any more for this assignment
                    return pruned_domains
                cons_to_add = self.get_cons_with_var(var)
                for c in cons_to_add:
                    if c not in q:
                        q.append(c)
        return pruned_domains

    def manhattan_dist_to_connection(self, randomize_order: bool) -> Variable:
        """
        A heuristic for selecting which Variable to assign next that is specific to the Pipes puzzle. Determines which pipes are closest to the empty grid spaces that form half-connections with the currently assigned pipes using the Manhattan distance. One of the closest pipes (optionally a random selection from the closest ones) is selected and returned.
        The minimum closest distance of any unassigned pipe to a location with a half-connection should always be 0 as long as there is at least one assigned pipe. If there are no assigned pipes, there are no half-connections and therefore the minimum distance to a half-connection is unimportant, but should be considered to be the same across all Variable objects. This means that, in the case that no variable have been assigned, the heuristic will still return a random variable object to assign if a random order is desired.

        :params randomize_order: whether the pipe selected should be randomly chosen from the closest pipes to half-connections with
        :returns: a Variable object to assign next
        """
        n = int(sqrt(len(self.assigned_vars) + len(self.unassigned_vars)))
        # get locations and assignments of assigned variables
        loc_to_pipe: dict[int, PipeType] = {}
        for var in self.assigned_vars:
            pipe = var.get_assignment()
            assert pipe is not None
            loc_to_pipe[var.location] = pipe

        unassigned_locs: list[int] = []
        loc_to_unassigned_var: dict[int, Variable] = {}
        for var in self.unassigned_vars:
            unassigned_locs.append(var.location)
            loc_to_unassigned_var[var.location] = var

        direct_connections: set[int] = set()

        # get assignments from each assigned pipe
        for loc in loc_to_pipe:
            # get adjacent indices
            (up, right, down, left) = find_adj(loc, n)
            pipe_up: Optional[PipeType] = (
                None if up == -1 or up not in loc_to_pipe else loc_to_pipe[up]
            )
            pipe_right: Optional[PipeType] = (
                None if right == -1 or right not in loc_to_pipe else loc_to_pipe[right]
            )
            pipe_down: Optional[PipeType] = (
                None if down == -1 or down not in loc_to_pipe else loc_to_pipe[down]
            )
            pipe_left: Optional[PipeType] = (
                None if left == -1 or left not in loc_to_pipe else loc_to_pipe[left]
            )

            # check if there is an unassigned pipe in the adjacent spaces
            # if there isn't, then that space is a direct connection, meaning that it is distance 0 from a connection to an assigned pipe
            if up != -1 and pipe_up is None:
                direct_connections.add(up)
            if right != -1 and pipe_right is None:
                direct_connections.add(right)
            if down != -1 and pipe_down is None:
                direct_connections.add(down)
            if left != -1 and pipe_left is None:
                direct_connections.add(left)

        manhattan_dist: dict[int, list[int]] = {}
        lowest_dist = 2 * n
        # iterate through unassigned locations, for each one find the lowest manhattan distance
        for loc in unassigned_locs:
            min_dist = 2 * n
            for connection in direct_connections:
                dist_x = abs((loc % n) - (connection % n))
                dist_y = abs((loc // n) - (connection // n))

                min_dist = min(min_dist, dist_x + dist_y)

            if min_dist in manhattan_dist:
                manhattan_dist[min_dist].append(loc)
            else:
                manhattan_dist[min_dist] = [loc]
            lowest_dist = min(min_dist, lowest_dist)
            if min_dist == 0:
                break

        loc_to_return = 0
        if randomize_order:
            loc_to_return = random.randint(0, len(manhattan_dist[lowest_dist]) - 1)

        return loc_to_unassigned_var[manhattan_dist[lowest_dist][loc_to_return]]
