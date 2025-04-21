from typing import Optional
from pipes_utils import Assignment, PipeType, PartialAssignment
from csp import Variable
from math import sqrt
from pipes_utils import check_connections, find_adj

# Constraint to ensure that there are no cycles in the pipes
# implementation details can be found in the Constraints/no_cycles.py section in the report


def assignment_has_cycle(
    curr: int,
    assignment: Assignment,
    visited: set[int],
    prev: Optional[int] = None,
) -> bool:
    if curr in visited:
        return True
    visited.add(curr)

    adj_indexes = find_adj(curr, int(sqrt(len(assignment))))

    center_pipe = assignment[curr]
    top_pipe, right_pipe, bottom_pipe, left_pipe = [
        assignment[i] if i != -1 else None for i in adj_indexes
    ]

    pipe_tuple = (top_pipe, right_pipe, bottom_pipe, left_pipe)

    adj_connections = check_connections(center_pipe, pipe_tuple)

    for adj_i, adj_is_connected in zip(adj_indexes, adj_connections):
        if adj_is_connected and adj_i != prev:
            if assignment_has_cycle(adj_i, assignment, visited, curr):
                return True
    return False


def validator(assignment: Assignment) -> bool:
    return not assignment_has_cycle(0, assignment, set())


def get_duplicated_touched(
    curr: int,
    assignment: PartialAssignment,
    visited: set[int],
    touched: dict[int, int],
    prev: Optional[int] = None,
) -> Optional[tuple[int, int, int]]:
    """
    Creates a tree from assignment, checks if any squares are touched twice.
    A square is "touched" if a pipe's opening is pointing towards it.

    :param curr: the current square index
    :param assignment: the assignment
    :param touched: the set of touched squares indices
    :param prev: the previous square index

    :return: index of the square touched twice, or None if no square is touched twice
    """
    visited.add(curr)
    center_pipe = assignment[curr]
    if center_pipe is None:
        raise Exception("Traversed to an unassigned pipe")

    adj_indexes = find_adj(curr, int(sqrt(len(assignment))))

    for i, adj_i in enumerate(adj_indexes):
        if center_pipe[i]:
            if adj_i == -1:
                raise Exception(
                    f"Pipe pointing to edge of grid in the direction of {i}"
                )

            if adj_i != prev and adj_i in touched:
                return (adj_i, curr, touched[adj_i])

            touched[adj_i] = curr

    top_pipe, right_pipe, bottom_pipe, left_pipe = [
        assignment[i] if i != -1 else None for i in adj_indexes
    ]
    pipe_tuple = (top_pipe, right_pipe, bottom_pipe, left_pipe)

    adj_connections = check_connections(center_pipe, pipe_tuple)

    for adj_i, adj_is_connected in zip(adj_indexes, adj_connections):
        if adj_is_connected and adj_i != prev:
            duplicate_touch = get_duplicated_touched(
                curr=adj_i,
                assignment=assignment,
                touched=touched,
                visited=visited,
                prev=curr,
            )
            if duplicate_touch:
                return duplicate_touch
    return None


def pruner(variables: list[Variable]) -> dict[Variable, list[PipeType]]:
    assignment: PartialAssignment = [var.get_assignment() for var in variables]
    n = int(sqrt(len(assignment)))

    visited: set[int] = set()
    for assignment_index, assignment_value in enumerate(assignment):
        if assignment_value != None and not assignment_index in visited:
            duplicate_touch = get_duplicated_touched(
                curr=assignment_index,
                assignment=assignment,
                visited=visited,
                touched={},
            )

            if duplicate_touch:
                variable_to_prune = next(
                    (var for var in variables if var.location == duplicate_touch[0]),
                )

                top, right, bottom, left = find_adj(duplicate_touch[0], n)
                directions = [top, right, bottom, left]
                touches = [duplicate_touch[1], duplicate_touch[2]]
                touched_directions: list[int] = []

                for i, direction_value in enumerate(directions):
                    for touch_value in touches:
                        if direction_value == touch_value:
                            touched_directions.append(i)

                pruned_values: list[PipeType] = []
                for active_domain in variable_to_prune.active_domain:
                    if (
                        active_domain[touched_directions[0]]
                        and active_domain[touched_directions[1]]
                    ):
                        pruned_values.append(active_domain)

                pruned_dict: dict[Variable, list[PipeType]] = {
                    variable_to_prune: pruned_values
                }

                variable_to_prune.prune(pruned_values)

                return pruned_dict
    return {}
