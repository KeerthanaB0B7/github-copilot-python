# Copilot Instructions — Sudoku Refactor Project

## Project Overview
This is a Flask-based Sudoku game being refactored from a basic legacy
version into a full-featured game with difficulty levels, a timer, hints,
live validation, and a top-10 scoreboard. Follow these guidelines for any
code you generate or suggest.

## Code Style
- Python: follow PEP 8. Use type hints on function signatures where practical.
- JavaScript: use modern ES6+ syntax (const/let, arrow functions, template
  literals). Avoid var.
- Use descriptive variable and function names — no single-letter names
  except loop indices (i, j) in tight nested loops.
- Keep functions short and single-purpose. If a function is doing more than
  one job, split it.

## Structure
- Keep Sudoku game logic (puzzle generation, validation, solving) inside
  `sudoku_logic.py` — do not put game logic directly in `app.py`.
- Keep `app.py` focused on Flask routes and request/response handling only.
- Keep client-side concerns separated in `static/`: board rendering and DOM
  interaction in `main.js`, styling in `styles.css`. If new JS features grow
  large (timer, scoreboard, dark mode), split them into their own modules
  under `static/js/` and import them into `main.js`.
- Store the top-10 scoreboard data in the browser's localStorage — do not
  add server-side persistence for this.

## Comments and Documentation
- Every function should have a short docstring (Python) or comment block
  (JS) explaining what it does, its parameters, and its return value.
- Comment non-obvious logic, especially puzzle generation/validation
  (uniqueness checking) and any solver logic.

## Error Handling
- Validate all user input on both client and server side.
- Flask routes should return meaningful HTTP status codes and JSON error
  messages on failure — never let an unhandled exception crash the server.
- Client-side, guard against invalid or missing localStorage data (e.g. a
  corrupted or empty top-10 list) so the app doesn't break on load.

## Testing
- Use pytest for backend logic (especially puzzle generation and validation).
- Do not break existing tests when adding new features — run the full test
  suite after every change.

## Working with Copilot
- Prefer smaller, focused prompts over one giant "build everything" request.
- Review every suggestion before accepting — reject or edit anything that
  doesn't fit this file's conventions or that introduces unnecessary
  complexity.
- If a suggestion is unclear, ask Copilot to explain it before accepting.