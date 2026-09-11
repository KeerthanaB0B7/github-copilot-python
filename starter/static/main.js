// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const SCOREBOARD_KEY = 'sudokuTopScores';
const THEME_KEY = 'sudokuTheme';
let puzzle = [];
let difficulty = 'medium';
let gameStartedAt = null;
let timerHandle = null;
let hintsUsed = 0;
let gameCompleted = false;

/** Return the elapsed game time in whole seconds. */
function getElapsedSeconds() {
  return gameStartedAt === null
    ? 0
    : Math.floor((Date.now() - gameStartedAt) / 1000);
}

/** Format a duration in seconds as MM:SS for the game UI. */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

/** Update the visible timer with the current elapsed game time. */
function updateTimer() {
  document.getElementById('timer').innerText = formatTime(getElapsedSeconds());
}

/** Start the game timer and clear any timer from the previous puzzle. */
function startTimer() {
  window.clearInterval(timerHandle);
  gameStartedAt = Date.now();
  updateTimer();
  timerHandle = window.setInterval(updateTimer, 1000);
}

/** Stop the game timer after a puzzle has been completed. */
function stopTimer() {
  window.clearInterval(timerHandle);
  timerHandle = null;
  updateTimer();
}

/** Read valid scoreboard entries from localStorage without breaking the game. */
function loadScores() {
  try {
    const savedScores = JSON.parse(localStorage.getItem(SCOREBOARD_KEY) || '[]');
    if (!Array.isArray(savedScores)) return [];
    return savedScores.filter((score) => (
      typeof score.name === 'string'
      && typeof score.time === 'number'
      && typeof score.difficulty === 'string'
      && (typeof score.hintsUsed === 'number' || typeof score.hints === 'number')
    ));
  } catch (error) {
    return [];
  }
}

/** Render the persisted top ten scores in the scoreboard table. */
function renderScoreboard() {
  const scoreboardBody = document.getElementById('scoreboard-body');
  scoreboardBody.innerHTML = '';
  loadScores().forEach((score, index) => {
    const hintsUsedValue = typeof score.hintsUsed === 'number'
      ? score.hintsUsed
      : score.hints;
    const row = document.createElement('tr');
    [index + 1, score.name, formatTime(score.time), score.difficulty, hintsUsedValue]
      .forEach((value) => {
        const cell = document.createElement('td');
        cell.innerText = value;
        row.appendChild(cell);
      });
    scoreboardBody.appendChild(row);
  });
}

/** Save a completed game, keeping only the ten fastest entries. */
function saveScore(name) {
  const scores = loadScores();
  scores.push({name, time: getElapsedSeconds(), difficulty, hintsUsed});
  scores.sort((first, second) => first.time - second.time);
  try {
    localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(scores.slice(0, 10)));
  } catch (error) {
    // Scoreboard rendering still works when browser storage is unavailable.
  }
  renderScoreboard();
}

/** Show a custom modal form for recording the player's name after a completed puzzle. */
function showCompletionModal() {
  const existingModal = document.getElementById('completion-modal');
  if (existingModal) return;

  const modal = document.createElement('div');
  modal.id = 'completion-modal';
  modal.className = 'completion-modal';
  modal.innerHTML = `
    <div class="completion-modal-content" role="dialog" aria-modal="true" aria-labelledby="completion-modal-title">
      <h2 id="completion-modal-title">Puzzle Complete!</h2>
      <p>Enter your name for the Top 10 scoreboard.</p>
      <form id="completion-form">
        <label for="completion-name-input">Name</label>
        <input id="completion-name-input" type="text" maxlength="40" placeholder="Your name" required>
        <button type="submit">Save Score</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const form = document.getElementById('completion-form');
  const input = document.getElementById('completion-name-input');
  input.focus();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const playerName = input.value.trim();
    if (!playerName) {
      input.focus();
      return;
    }

    modal.remove();
    saveScore(playerName);
  });
}

/** Apply a light or dark theme using CSS variables and store it for later reloads. */
function applyTheme(theme) {
  const selectedTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = selectedTheme;

  const toggleButton = document.getElementById('theme-toggle');
  if (toggleButton) {
    toggleButton.innerText = selectedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }

  try {
    localStorage.setItem(THEME_KEY, selectedTheme);
  } catch (error) {
    // Theme persistence is best-effort when browser storage is unavailable.
  }
}

/** Toggle between light and dark themes. */
function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

/** Record the score after a successful completion using a custom in-page form. */
function recordCompletion() {
  if (gameCompleted) return;
  gameCompleted = true;
  stopTimer();
  showCompletionModal();
}

/** Create the editable 9x9 board and assign each cell its sub-grid class. */
function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      const subgridRow = Math.floor(i / 3);
      const subgridColumn = Math.floor(j / 3);
      const subgridColor = (subgridRow + subgridColumn) % 2 === 0
        ? 'subgrid-light'
        : 'subgrid-dark';
      input.className = `sudoku-cell ${subgridColor}`;
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

/** Render a generated puzzle and reset the state for a new game. */
function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.className += ' prefilled';
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
  hintsUsed = 0;
  gameCompleted = false;
  document.getElementById('hint-count').innerText = hintsUsed;
  startTimer();
}

/** Fetch and display a new puzzle for the selected difficulty. */
async function newGame() {
  difficulty = document.getElementById('difficulty').value;
  const msg = document.getElementById('message');

  try {
    const res = await fetch(`/new?difficulty=${encodeURIComponent(difficulty)}`);
    const data = await res.json();
    if (!res.ok || data.error) {
      msg.style.color = '#d32f2f';
      msg.innerText = data.error || 'Unable to load a new puzzle.';
      return;
    }
    renderPuzzle(data.puzzle);
    msg.innerText = '';
  } catch (error) {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Unable to load a new puzzle.';
  }
}

/** Reveal one cell using the server's solution and increment the hint count. */
async function useHint() {
  const message = document.getElementById('message');

  try {
    const res = await fetch('/hint');
    const data = await res.json();
    if (!res.ok || data.error) {
      message.style.color = '#d32f2f';
      message.innerText = data.error || 'Unable to use a hint.';
      return;
    }

    const input = document.querySelector(
      `.sudoku-cell[data-row="${data.row}"][data-col="${data.col}"]`,
    );
    if (!input || input.disabled) return;
    input.value = data.value;
    input.disabled = true;
    input.classList.add('hinted');
    hintsUsed += 1;
    document.getElementById('hint-count').innerText = hintsUsed;
  } catch (error) {
    message.style.color = '#d32f2f';
    message.innerText = 'Unable to use a hint.';
  }
}

/** Submit the current board and display validation feedback. */
async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }

  const msg = document.getElementById('message');

  try {
    const res = await fetch('/check', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({board})
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      msg.style.color = '#d32f2f';
      msg.innerText = data.error || 'Unable to validate the puzzle.';
      return;
    }

    const incorrect = new Set(data.incorrect.map(x => x[0] * SIZE + x[1]));
    const boardIsComplete = Array.from(inputs).every((inp) => inp.value !== '');
    for (let idx = 0; idx < inputs.length; idx++) {
      const inp = inputs[idx];
      if (inp.disabled) continue;
      inp.classList.toggle('incorrect', incorrect.has(idx));
    }

    if (incorrect.size === 0 && boardIsComplete) {
      msg.style.color = '#388e3c';
      msg.innerText = 'Congratulations! You solved it!';
      recordCompletion();
      return;
    }

    if (incorrect.size === 0) {
      msg.style.color = '#d32f2f';
      msg.innerText = 'All filled cells are correct, but the puzzle is not complete yet.';
      return;
    }

    msg.style.color = '#d32f2f';
    msg.innerText = 'Some cells are incorrect.';
  } catch (error) {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Unable to validate the puzzle.';
  }
}

// Wire buttons
window.addEventListener('load', () => {
  renderScoreboard();

  let preferredTheme = 'light';
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      preferredTheme = savedTheme;
    } else {
      preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  } catch (error) {
    preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  applyTheme(preferredTheme);

  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('difficulty').addEventListener('change', newGame);
  document.getElementById('hint').addEventListener('click', useHint);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  // initialize
  newGame();
});