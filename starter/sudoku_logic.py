import copy
import random

SIZE = 9
EMPTY = 0


def deep_copy(board):
    """Return an independent copy of a Sudoku board."""
    return copy.deepcopy(board)


def create_empty_board():
    """Create and return a blank Sudoku board."""
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]


def is_safe(board, row, col, num):
    """Return whether ``num`` can be placed at ``row`` and ``col``."""
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True


def fill_board(board):
    """Fill a board with a valid randomized Sudoku solution."""
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True


def count_solutions(board, limit=2):
    """Count valid solutions, stopping when ``limit`` solutions are found."""
    solutions_found = 0

    def search():
        nonlocal solutions_found
        if solutions_found >= limit:
            return

        for row in range(SIZE):
            for col in range(SIZE):
                if board[row][col] == EMPTY:
                    for candidate in range(1, SIZE + 1):
                        if is_safe(board, row, col, candidate):
                            board[row][col] = candidate
                            search()
                            board[row][col] = EMPTY
                            if solutions_found >= limit:
                                return
                    return

        solutions_found += 1

    search()
    return solutions_found


def remove_cells(board, clues):
    """Remove cells while preserving a unique solution.

    Return whether the requested number of clues was reached. A failed pass
    leaves the board partially reduced so the caller can regenerate it.
    """
    cells = [(row, col) for row in range(SIZE) for col in range(SIZE)]
    random.shuffle(cells)

    for row, col in cells:
        if sum(cell != EMPTY for line in board for cell in line) <= clues:
            return True

        original_value = board[row][col]
        board[row][col] = EMPTY
        if count_solutions(board) != 1:
            board[row][col] = original_value

    return sum(cell != EMPTY for line in board for cell in line) <= clues


def generate_puzzle(clues=35):
    """Generate a puzzle with ``clues`` entries and exactly one solution."""
    if not 17 <= clues <= SIZE * SIZE:
        raise ValueError('clues must be between 17 and 81')

    while True:
        solution = create_empty_board()
        fill_board(solution)
        puzzle = deep_copy(solution)
        if remove_cells(puzzle, clues):
            return puzzle, solution
