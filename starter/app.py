from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

# Keep a simple in-memory store for the current puzzle and solution.
CURRENT = {
    'puzzle': None,
    'solution': None,
}

DIFFICULTY_CLUES = {
    'easy': 45,
    'medium': 35,
    'hard': 25,
}


def _validate_board_payload(board):
    """Return a normalized 9x9 board or raise ValueError for malformed input."""
    if not isinstance(board, list) or len(board) != sudoku_logic.SIZE:
        raise ValueError('Invalid board payload')

    normalized_board = []
    for row in board:
        if not isinstance(row, list) or len(row) != sudoku_logic.SIZE:
            raise ValueError('Invalid board payload')

        normalized_row = []
        for value in row:
            if not isinstance(value, int) or isinstance(value, bool) or value < 0 or value > sudoku_logic.SIZE:
                raise ValueError('Invalid board payload')
            normalized_row.append(value)

        normalized_board.append(normalized_row)

    return normalized_board


@app.route('/')
def index():
    """Render the Sudoku game home page."""
    return render_template('index.html')


@app.route('/new')
def new_game():
    """Generate and return a new puzzle for the requested difficulty."""
    difficulty = request.args.get('difficulty', 'medium').lower()
    clues = DIFFICULTY_CLUES.get(difficulty)
    if clues is None:
        return jsonify({'error': 'Invalid difficulty'}), 400

    puzzle, solution = sudoku_logic.generate_puzzle(clues)
    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution
    return jsonify({'difficulty': difficulty, 'puzzle': puzzle})


@app.route('/check', methods=['POST'])
def check_solution():
    """Check the submitted board and return the locations of incorrect cells."""
    data = request.get_json(silent=True) or {}
    board = data.get('board')

    try:
        validated_board = _validate_board_payload(board)
    except ValueError:
        return jsonify({'error': 'Invalid board payload'}), 400

    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400

    incorrect = []
    for i in range(sudoku_logic.SIZE):
        for j in range(sudoku_logic.SIZE):
            if validated_board[i][j] != solution[i][j]:
                incorrect.append([i, j])

    return jsonify({'incorrect': incorrect})


@app.route('/hint')
def hint():
    """Reveal one unrevealed cell from the current puzzle solution."""
    puzzle = CURRENT.get('puzzle')
    solution = CURRENT.get('solution')
    if puzzle is None or solution is None:
        return jsonify({'error': 'No game in progress'}), 400

    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):
            if puzzle[row][col] == sudoku_logic.EMPTY:
                puzzle[row][col] = solution[row][col]
                return jsonify({'row': row, 'col': col, 'value': solution[row][col]})

    return jsonify({'error': 'No empty cells remain'}), 400


if __name__ == '__main__':
    app.run(debug=True)