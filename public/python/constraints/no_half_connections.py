from pipes_utils import PipeType
from csp import Variable

# Constraint to ensure no "half-connections"
# information about half-connections can be found in the Constraint/ section in the report
# implementation details can be found in the Constraints/no_half_connections.py section in the report


def validator_h(pipes: list[PipeType]) -> bool:
    """
    Ensures that two horizontally-adjacent pipes are not blocking each other

    :param pipes: a tuple of two pipes. pipes[0] is the one on the left, pipes[1] is the one on the right.
    """
    left = pipes[0]
    right = pipes[1]
    # check if the left pipe's right opening is the same as the right pipe's left opening
    if left[1] != right[3]:
        return False
    return True


def validator_v(pipes: list[PipeType]) -> bool:
    """
    Ensures that two vertically-adjacent pipes are not blocking each other

    :param pipes: a tuple of two pipes. pipes[0] is the one above, pipes[1] is the one below.
    """
    above = pipes[0]
    below = pipes[1]
    # check if the top pipe's bottom opening is the same as the bottom pipe's top opening
    if above[2] != below[0]:
        return False
    return True


def pruner_h(pipes: list[Variable]) -> dict[Variable, list[PipeType]]:
    """
    prunes values from 2 variables that would result in one of the pipes being blocked by an exit of another pipe

    :params pipes: tuple of two pipes where pipes[0] is to the left of pipes[1]
    :returns: A list of the active domains of the pipes prior to pruning
    """
    left = pipes[0]
    right = pipes[1]

    left_assignment = left.get_assignment()
    right_assignment = right.get_assignment()

    to_prune: dict[Variable, list[PipeType]] = {}
    if left_assignment is not None and right_assignment is None:
        for pipe_type in right.get_active_domain():
            # there is a path to the right pipe, prune all PipeTypes for the right pipe where the pipe doesn't connect with the left
            # or
            # there is no path to the right pipe, prune all PipeTypes for the right pipe where the pipe tries to connect with the left pipe
            if left_assignment[1] != pipe_type[3]:
                if right in to_prune:
                    if pipe_type not in to_prune[right]:
                        to_prune[right].append(pipe_type)
                else:
                    to_prune[right] = [pipe_type]

    elif right_assignment is not None and left_assignment is None:
        for pipe_type in left.get_active_domain():
            # there is a path to the left pipe, prune all PipeTypes for the left pipe where the pipe doesn't connect with the right
            # or
            # there is no path to the left pipe, prune all PipeTypes for the left pipe where the pipe tries to connect with the right pipe
            if right_assignment[3] != pipe_type[1]:
                if left in to_prune:
                    if pipe_type not in to_prune[left]:
                        to_prune[left].append(pipe_type)
                else:
                    to_prune[left] = [pipe_type]

    # if there are no assignments for either pipe, nothing should be pruned.
    # if both pipes are assigned, don't prune
    for var in to_prune:
        var.prune(to_prune[var])
    return to_prune


def pruner_v(pipes: list[Variable]) -> dict[Variable, list[PipeType]]:
    """
    prunes values from 2 variables that would result in one of the pipes being blocked by an exit of another pipe

    :params pipes: tuple of two pipes where pipes[0] is above pipes[1]
    :returns: A dict mapping the variables to the values to remove from their active domain
    """
    top = pipes[0]
    bottom = pipes[1]

    top_assignment = top.get_assignment()
    bottom_assignment = bottom.get_assignment()

    to_prune: dict[Variable, list[PipeType]] = {}
    if top_assignment is not None and bottom_assignment is None:
        for pipe_type in bottom.get_active_domain():
            # there is a path to the bottom pipe, prune all PipeTypes for the bottom pipe where the pipe doesn't connect with the top
            # or
            # there is no path to the bottom pipe, prune all PipeTypes for the bottom pipe where the pipe tries to connect with the top pipe
            if top_assignment[2] != pipe_type[0]:
                if bottom in to_prune:
                    if pipe_type not in to_prune[bottom]:
                        to_prune[bottom].append(pipe_type)
                else:
                    to_prune[bottom] = [pipe_type]

    elif bottom_assignment is not None and top_assignment is None:
        for pipe_type in top.get_active_domain():
            # there is a path to the top pipe, prune all PipeTypes for the top pipe where the pipe doesn't connect with the bottom
            # or
            # there is no path to the top pipe, prune all PipeTypes for the top pipe where the pipe tries to connect with the bottom pipe
            if bottom_assignment[0] != pipe_type[2]:
                if top in to_prune:
                    if pipe_type not in to_prune[top]:
                        to_prune[top].append(pipe_type)
                else:
                    to_prune[top] = [pipe_type]

    # if there are no assignments for either pipe, nothing should be pruned.
    # if both pipes are assigned, don't prune
    for var in to_prune:
        var.prune(to_prune[var])
    return to_prune
