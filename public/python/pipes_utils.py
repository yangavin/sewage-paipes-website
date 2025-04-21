from math import sqrt
from typing import Optional

# Contains some general functions used in various other Pipes CSP function implementations

PipeType = tuple[bool, bool, bool, bool]
Assignment = list[PipeType]
PartialAssignment = list[Optional[PipeType]]

# mapping of PipeTypes to a character that represents them visually.
PIPE_CHAR: dict[PipeType, str] = {
    (True, False, False, False): "╵",  # Open at the top
    (False, True, False, False): "╶",  # Open at the right
    (False, False, True, False): "╷",  # Open at the bottom
    (False, False, False, True): "╴",  # Open at the left
    (True, True, False, False): "└",  # Elbow (bottom-left)
    (True, False, True, False): "│",  # Vertical pipe
    (True, False, False, True): "┘",  # Elbow (bottom-right)
    (False, True, True, False): "┌",  # Elbow (top-left)
    (False, True, False, True): "─",  # Horizontal pipe
    (False, False, True, True): "┐",  # Elbow (top-right)
    (True, True, True, False): "├",  # T-junction (left, down, up)
    (True, True, False, True): "┴",  # T-junction (left, right, down)
    (True, False, True, True): "┤",  # T-junction (right, down, up)
    (False, True, True, True): "┬",  # T-junction (left, right, up)
}


def print_pipes_grid(pipes: list[PipeType]) -> None:
    """
    Prints a visual representation of a grid of pipes

    :params pipes: grid to be visualized
    """
    n = int(sqrt(len(pipes)))
    for i in range(len(pipes)):
        # print the pipe character corresponding to current pipe
        print(PIPE_CHAR[pipes[i]], end="")
        # print a new line after each row of pipes
        if i % n == n - 1:
            print()


def find_adj(center: int, n: int) -> tuple[int, int, int, int]:
    """
    :param center: Index of the pipe to compute the adjacent indices from
    :param n: dimension of the grid of the pipes puzzle
    :return: A tuple of four ints, the first representing the index of the value above, going clockwise from there. A value of -1 as one of the elements of the tuple indicates that there is no adjacent pipe in that direction (i.e. The center pipe is on an edge in that direction)
    """
    above = center - n
    right = center + 1
    below = center + n
    left = center - 1

    if above < 0:
        above = -1

    if right % n == 0:
        right = -1

    if below >= (n * n):
        below = -1

    if left % n == n - 1:
        left = -1

    return (above, right, below, left)


def check_connections(
    center: PipeType,
    adj: tuple[
        Optional[PipeType], Optional[PipeType], Optional[PipeType], Optional[PipeType]
    ],
) -> tuple[bool, bool, bool, bool]:
    """
    :param center: the "center" pipe
    :param adj: holds pipes adjacent to the main variable, with adj[0] is above main, and going clockwise from there
    :return connections: a tuple holding the connection directions from the main variable, following the same direction format as the adj parameter
    """
    connections: list[bool] = [False] * 4
    for i in range(len(center)):
        # iterate through the surrounding pipes
        if center[i]:
            adj_pipe = adj[i]
            # check if the current adjacent pipe has an opening facing towards the center pipe
            if adj_pipe is not None and adj_pipe[(i + 2) % 4]:
                connections[i] = True

    connected_up = connections[0]
    connected_right = connections[1]
    connected_down = connections[2]
    connected_left = connections[3]

    return (connected_up, connected_right, connected_down, connected_left)
