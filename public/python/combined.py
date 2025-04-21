from pipes_utils import PipeType
from constraints.no_half_connections import (
    validator_h as no_half_connections_validator_h,
    validator_v as no_half_connections_validator_v,
    pruner_h as no_half_connections_pruner_h,
    pruner_v as no_half_connections_pruner_v,
)
from constraints.no_cycles import validator as tree_validator, pruner as tree_pruner
from constraints.connected import (
    validator as connected_validator,
    pruner as connected_pruner,
)
from csp import CSP, Variable, Constraint

# Creates CSP object
# implementation details can be found in the combined.py section in the report


def generate_domain(top: bool, right: bool, bottom: bool, left: bool) -> list[PipeType]:
    """
    Generate a domain based on the four boolean flags:
    if i == 0: 0 is false (top)
    if i == n-1: 2 is false (bottom)

    if j == 0: 3 is false (left)
    if j == n-1: 1 is false (right)

    :param top: A boolean indicating if the top of the pipe is blocked.
    :param right: A boolean indicating if the right of the pipe is blocked.
    :param bottom: A boolean indicating if the bottom of the pipe is blocked.
    :param left: A boolean indicating if the left of the pipe is blocked.
    :return: A list of PipeType objects representing the domain.

    """
    # all the possible domains for pipes in the pipes puzzle
    # (True, True, True, True) and (False, False, False, False) are omitted - they represent all connections or no connections, which are immune to rotations.
    domain: list[PipeType] = [
        (True, True, True, False),
        (True, True, False, True),
        (True, True, False, False),
        (True, False, True, True),
        (True, False, True, False),
        (True, False, False, True),
        (True, False, False, False),
        (False, True, True, True),
        (False, True, True, False),
        (False, True, False, True),
        (False, True, False, False),
        (False, False, True, True),
        (False, False, True, False),
        (False, False, False, True),
    ]
    if top:
        # remove pipes that point up if the pipe is at the top of the grid
        domain = [pipe for pipe in domain if not pipe[0]]
    if bottom:
        # remove pipes that point down if the pipe is at the bottom of the grid
        domain = [pipe for pipe in domain if not pipe[2]]
    if right:
        # remove pipes that point right if the pipe is on the right side of the grid
        domain = [pipe for pipe in domain if not pipe[1]]
    if left:
        # remove pipes that point left if the pipe is on the left side of the grid
        domain = [pipe for pipe in domain if not pipe[3]]
    return domain


def create_pipes_csp(
    n: int,
) -> CSP:
    variables: list[Variable] = []

    # initialize variable objects
    for i in range(n):
        row: list[Variable] = []
        for j in range(n):
            top = i == 0
            bottom = i == n - 1
            left = j == 0
            right = j == n - 1
            var = Variable(
                location=i * n + j,
                domain=generate_domain(top, right, bottom, left),
            )
            row.append(var)
        variables += row

    all_cons: list[Constraint] = []

    # create binary constraints for no blocking
    no_half_connections_cons: list[Constraint] = []
    # start with horizontal cons
    no_half_connections_h: list[Constraint] = []
    for i in range(n):
        for j in range(n - 1):
            left = variables[i * n + j]
            right = variables[i * n + j + 1]
            scope = [left, right]
            name = f"no half-connections horizontal {i * n + j, i * n + j + 1}"
            no_half_connections_h.append(
                Constraint(
                    name,
                    no_half_connections_validator_h,
                    no_half_connections_pruner_h,
                    scope,
                )
            )

    # vertical cons
    no_half_connections_v: list[Constraint] = []
    for i in range(n - 1):
        for j in range(n):
            above = variables[i * n + j]
            below = variables[(i + 1) * n + j]
            scope = [above, below]
            name = f"no half-connections vertical {i * n + j, (i + 1) * n + j}"
            no_half_connections_v.append(
                Constraint(
                    name,
                    no_half_connections_validator_v,
                    no_half_connections_pruner_v,
                    scope,
                )
            )

    # add cons
    no_half_connections_cons += no_half_connections_h + no_half_connections_v

    # create tree constraint
    tree_con: Constraint = Constraint("tree", tree_validator, tree_pruner, variables)

    connected_con: Constraint = Constraint(
        "connected", connected_validator, connected_pruner, variables
    )
    all_cons = no_half_connections_cons + [tree_con, connected_con]

    return CSP(f"Pipes_{n}x{n}", variables, all_cons)
