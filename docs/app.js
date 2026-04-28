const GRID_SIZE_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10];
const BEST_TIME_STORAGE_KEY = "schulte-grid-best-times";
const START_BUTTON_TEXT = "开始训练";
const INITIAL_STATUS = "点击“开始训练”后，按顺序找出 1 到 25。";

const boardPanel = document.querySelector(".board-panel");
const boardShell = document.getElementById("board-shell");
const board = document.getElementById("board");
const gridSizeSelect = document.getElementById("grid-size");
const startButton = document.getElementById("start-button");
const shuffleButton = document.getElementById("shuffle-button");
const timerElement = document.getElementById("timer");
const progressElement = document.getElementById("progress");
const bestTimeElement = document.getElementById("best-time");
const statusElement = document.getElementById("status");

let currentSize = 5;
let nextNumber = 1;
let totalCount = currentSize * currentSize;
let startTimestamp = 0;
let timerId = null;
let gameActive = false;
let bestTimes = loadBestTimes();
const boardResizeObserver = new ResizeObserver(resizeBoard);

init();

function init() {
  buildSizeOptions();
  bindEvents();
  updateSummaryForCurrentSize();
  setStatus(INITIAL_STATUS);
  boardResizeObserver.observe(boardPanel);
  resizeBoard();
  createGrid();
}

function buildSizeOptions() {
  const fragment = document.createDocumentFragment();

  GRID_SIZE_OPTIONS.forEach((size) => {
    const option = document.createElement("option");
    option.value = String(size);
    option.textContent = `${size} x ${size}`;
    if (size === currentSize) {
      option.selected = true;
    }
    fragment.appendChild(option);
  });

  gridSizeSelect.appendChild(fragment);
}

function bindEvents() {
  gridSizeSelect.addEventListener("change", handleSizeChange);
  startButton.addEventListener("click", startGame);
  shuffleButton.addEventListener("click", shuffleOnly);
  window.addEventListener("resize", resizeBoard);
}

function handleSizeChange() {
  currentSize = Number(gridSizeSelect.value);
  totalCount = currentSize * currentSize;
  nextNumber = 1;
  gameActive = false;
  stopTimer();
  updateSummaryForCurrentSize();
  setStatus(`已切换到 ${currentSize} x ${currentSize}，点击“${START_BUTTON_TEXT}”开始。`);
  createGrid();
}

function updateSummaryForCurrentSize() {
  progressElement.textContent = `0 / ${totalCount}`;
  timerElement.textContent = "0.00 秒";
  const bestTime = bestTimes[currentSize];
  bestTimeElement.textContent = typeof bestTime === "number" ? `${bestTime.toFixed(2)} 秒` : "暂无";
}

function createGrid() {
  board.replaceChildren();
  board.style.gridTemplateColumns = `repeat(${currentSize}, minmax(0, 1fr))`;
  board.style.gridTemplateRows = `repeat(${currentSize}, minmax(0, 1fr))`;

  const numbers = Array.from({ length: totalCount }, (_, index) => index + 1);
  shuffle(numbers);

  numbers.forEach((number, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cell";
    button.textContent = String(number);
    button.style.animationDelay = `${Math.min(index * 8, 180)}ms`;
    button.addEventListener("click", () => handleCellClick(number, button));
    board.appendChild(button);
  });

  resizeBoard();
  updateCellFontSize();
}

function resizeBoard() {
  const panelRect = boardPanel.getBoundingClientRect();
  const panelStyle = getComputedStyle(boardPanel);
  const horizontalPadding = parseFloat(panelStyle.paddingLeft) + parseFloat(panelStyle.paddingRight);
  const verticalPadding = parseFloat(panelStyle.paddingTop) + parseFloat(panelStyle.paddingBottom);
  const side = Math.max(Math.min(panelRect.width - horizontalPadding, panelRect.height - verticalPadding), 0);
  boardShell.style.width = `${side}px`;
  boardShell.style.height = `${side}px`;
}

function updateCellFontSize() {
  const boardRect = board.getBoundingClientRect();
  const base = Math.min(boardRect.width, boardRect.height) / Math.max(currentSize, 1);
  const fontSize = Math.max(12, Math.min(34, base * 0.34));
  board.style.setProperty("--cell-font-size", `${fontSize}px`);
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.style.fontSize = `${fontSize}px`;
  });
}

function startGame() {
  totalCount = currentSize * currentSize;
  nextNumber = 1;
  gameActive = true;
  startTimestamp = performance.now();
  progressElement.textContent = `0 / ${totalCount}`;
  setStatus(`训练开始，请先找到数字 ${nextNumber}。`);
  createGrid();
  stopTimer();
  timerId = window.setInterval(updateTimer, 50);
}

function shuffleOnly() {
  gameActive = false;
  nextNumber = 1;
  stopTimer();
  updateSummaryForCurrentSize();
  setStatus(`方格已重新洗牌，点击“${START_BUTTON_TEXT}”后再计时。`);
  createGrid();
}

function handleCellClick(value, cell) {
  if (!gameActive) {
    setStatus(`请先点击“${START_BUTTON_TEXT}”。`);
    return;
  }

  if (value !== nextNumber) {
    flashCell(cell, "wrong");
    setStatus(`当前应点击 ${nextNumber}，你点到了 ${value}。`);
    return;
  }

  cell.disabled = true;
  cell.classList.add("correct");
  progressElement.textContent = `${value} / ${totalCount}`;

  if (value === totalCount) {
    finishGame();
    return;
  }

  nextNumber += 1;
  setStatus(`正确，继续找到数字 ${nextNumber}。`);
}

function finishGame() {
  gameActive = false;
  stopTimer();
  const elapsed = (performance.now() - startTimestamp) / 1000;
  timerElement.textContent = `${elapsed.toFixed(2)} 秒`;

  const bestTime = bestTimes[currentSize];
  if (typeof bestTime !== "number" || elapsed < bestTime) {
    bestTimes[currentSize] = elapsed;
    persistBestTimes();
    bestTimeElement.textContent = `${elapsed.toFixed(2)} 秒`;
    setStatus(`训练完成，用时 ${elapsed.toFixed(2)} 秒，已刷新当前难度最佳成绩。`);
    return;
  }

  bestTimeElement.textContent = `${bestTime.toFixed(2)} 秒`;
  setStatus(`训练完成，用时 ${elapsed.toFixed(2)} 秒。`);
}

function updateTimer() {
  if (!gameActive) {
    return;
  }
  const elapsed = (performance.now() - startTimestamp) / 1000;
  timerElement.textContent = `${elapsed.toFixed(2)} 秒`;
}

function stopTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function setStatus(message) {
  statusElement.textContent = message;
}

function flashCell(cell, className) {
  cell.classList.add(className);
  window.setTimeout(() => {
    cell.classList.remove(className);
  }, 180);
}

function shuffle(values) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
}

function loadBestTimes() {
  try {
    const rawValue = window.localStorage.getItem(BEST_TIME_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : {};
  } catch {
    return {};
  }
}

function persistBestTimes() {
  window.localStorage.setItem(BEST_TIME_STORAGE_KEY, JSON.stringify(bestTimes));
}