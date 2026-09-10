import pytest

import sudoku_logic


def test_generated_puzzle_has_one_solution_and_requested_clues():
    puzzle, solution = sudoku_logic.generate_puzzle(clues=35)

    assert sudoku_logic.count_solutions(puzzle) == 1
    assert sudoku_logic.count_solutions(solution) == 1
    assert sum(cell != sudoku_logic.EMPTY for row in puzzle for cell in row) == 35


def test_generate_puzzle_rejects_impossible_clue_counts():
    with pytest.raises(ValueError):
        sudoku_logic.generate_puzzle(clues=16)
