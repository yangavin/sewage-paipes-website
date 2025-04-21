import argparse
from combined import create_pipes_csp


def generate_one_state_str(state):
    output = ""
    for pipe in state:
        for dir in range(4):
            if pipe[dir]:
                output += "1"
            else:
                output += "0"
    return output


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate and print a single solution for Sewage pAIpes puzzle"
    )
    parser.add_argument(
        "-n", "--size", type=int, required=True, help="Board dimension size (2-25)"
    )

    args = parser.parse_args()

    # Validate arguments
    if args.size < 2 or args.size > 25:
        parser.error("Board size must be between 2 and 25")

    return args


def main():
    args = parse_args()
    n = args.size

    # create csp
    csp = create_pipes_csp(n)

    solutions = set()

    # Find single solution using GAC
    csp.gac_all(
        solutions=solutions, max_solutions=1, random_start=True, print_solutions=False
    )
    solutions_list = list(solutions)
    solution = solutions_list[0]
    print(generate_one_state_str(solution))
