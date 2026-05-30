const LEVELS = [
  { size: 3, name: "启航岛", mission: "完成 1 次数字热身", intro: "先从最简单的 1 到 9 开始热身吧。" },
  { size: 4, name: "观察林", mission: "完成 1 次专注观察", intro: "多看一眼，再快一点点。" },
  { size: 5, name: "侦探营", mission: "完成 1 次数字侦探", intro: "这是经典关卡，适合稳定练习。" },
  { size: 6, name: "闪电湾", mission: "完成 1 次快速搜寻", intro: "找到节奏，别急，越稳越快。" },
  { size: 7, name: "专注塔", mission: "完成 1 次耐心挑战", intro: "眼睛和手一起配合，慢慢也能变快。" },
  { size: 8, name: "探索谷", mission: "完成 1 次高阶探索", intro: "数字变多了，保持专注就能通关。" },
  { size: 9, name: "勇气港", mission: "完成 1 次勇气试炼", intro: "看起来更难，但你已经有经验了。" },
  { size: 10, name: "星光城", mission: "完成 1 次终极挑战", intro: "最后的大关卡，试试把整张图都装进眼里。" }
];
const PROFILE_STORAGE_KEY = "schulte-grid-growth-profile";
const DAILY_GOAL = 3;
const START_BUTTON_TEXT = "开始闯关";
const INITIAL_STATUS = "点击“开始闯关”后，按顺序找出 1 到 25。";
const FEEDBACK_TITLE = "【建议反馈】舒尔特方格训练";
const FEEDBACK_ENDPOINT = "https://feedback.ksjbm.com/";
const FEEDBACK_TIMEOUT_MS = 8000;
const ENCOURAGEMENTS = [
  "很好，继续按顺序找下一个数字。",
  "你找得很稳，我们继续。",
  "太棒了，这一格找对了。",
  "做得不错，再往下一个前进。"
];
const MISTAKE_MESSAGES = [
  "还没轮到这个数字，我们继续找一找。",
  "没关系，已经很接近了，再看看目标数字。",
  "这次先跳过它，去找正确的数字吧。"
];
const FINISH_MESSAGES = [
  "通关成功，你把这一关完整做完了。",
  "闯关完成，今天的专注力又长高了一点。",
  "太好了，这一轮已经顺利结束。"
];
const HINT_DELAY_MS = 4500;

const boardPanel = document.querySelector(".board-panel");
const boardShell = document.getElementById("board-shell");
const board = document.getElementById("board");
const gridSizeSelect = document.getElementById("grid-size");
const gentleHintsInput = document.getElementById("gentle-hints");
const feedbackToggle = document.getElementById("feedback-toggle");
const feedbackDialog = document.getElementById("feedback-dialog");
const feedbackForm = document.getElementById("feedback-form");
const feedbackCancelButton = document.getElementById("feedback-cancel");
const feedbackMessageInput = document.getElementById("feedback-message");
const feedbackDeviceInput = document.getElementById("feedback-device");
const feedbackNameInput = document.getElementById("feedback-name");
const feedbackCompanyInput = document.getElementById("feedback-company");
const feedbackSubmitButton = document.getElementById("feedback-submit");
const feedbackStatusElement = document.getElementById("feedback-status");
const startButton = document.getElementById("start-button");
const shuffleButton = document.getElementById("shuffle-button");
const timerElement = document.getElementById("timer");
const progressElement = document.getElementById("progress");
const starsElement = document.getElementById("stars-earned");
const statusElement = document.getElementById("status");
const coachMessageElement = document.getElementById("coach-message");
const missionNameElement = document.getElementById("mission-name");
const missionProgressElement = document.getElementById("mission-progress");
const streakCountElement = document.getElementById("streak-count");

let currentSize = 5;
let nextNumber = 1;
let totalCount = currentSize * currentSize;
let startTimestamp = 0;
let timerId = null;
let hintTimerId = null;
let gameActive = false;
let mistakeCount = 0;
let hintUsedThisRound = false;
let isFeedbackSubmitting = false;
let growthProfile = loadGrowthProfile();
const boardResizeObserver = new ResizeObserver(resizeBoard);

init();

function init() {
  buildSizeOptions();
  configureFeedbackDialog();
  bindEvents();
  resetRunStats();
  updateSummaryForCurrentSize();
  setStatus(INITIAL_STATUS);
  setCoachMessage(getCurrentLevel().intro);
  boardResizeObserver.observe(boardPanel);
  resizeBoard();
  createGrid();
}

function buildSizeOptions() {
  const fragment = document.createDocumentFragment();

  LEVELS.forEach((level) => {
    const option = document.createElement("option");
    option.value = String(level.size);
    option.textContent = `${level.name} · ${level.size} x ${level.size}`;
    if (level.size === currentSize) {
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
  gentleHintsInput.addEventListener("change", handleHintModeChange);
  feedbackToggle.addEventListener("click", openFeedbackDialog);
  feedbackCancelButton.addEventListener("click", closeFeedbackDialog);
  feedbackForm.addEventListener("submit", handleFeedbackSubmit);
  feedbackDialog.addEventListener("close", syncFeedbackDialogState);
  window.addEventListener("resize", resizeBoard);
}

function configureFeedbackDialog() {
  feedbackForm.reset();
  feedbackDeviceInput.value = detectDeviceType();
  setFeedbackStatus("");
  syncFeedbackDialogState();
}

function openFeedbackDialog() {
  setFeedbackStatus("");
  feedbackDeviceInput.value = detectDeviceType();
  if (!feedbackDialog.open) {
    feedbackDialog.showModal();
  }
  syncFeedbackDialogState();
  window.setTimeout(() => {
    feedbackMessageInput.focus();
  }, 0);
}

function closeFeedbackDialog() {
  if (isFeedbackSubmitting) {
    return;
  }

  if (!feedbackDialog.open) {
    syncFeedbackDialogState();
    return;
  }
  feedbackDialog.close();
}

function syncFeedbackDialogState() {
  feedbackToggle.setAttribute("aria-expanded", feedbackDialog.open ? "true" : "false");
}

function finishFeedbackSuccess(message) {
  feedbackForm.reset();
  feedbackDeviceInput.value = detectDeviceType();
  setFeedbackStatus("");
  setFeedbackSubmitting(false);
  window.alert(message);
  if (feedbackDialog.open) {
    feedbackDialog.close();
  }
  syncFeedbackDialogState();
}

async function handleFeedbackSubmit(event) {
  event.preventDefault();

  if (isFeedbackSubmitting) {
    return;
  }

  const message = feedbackMessageInput.value.trim();
  if (!message) {
    setFeedbackStatus("先写下你的想法，我再帮你发送。", true);
    feedbackMessageInput.focus();
    return;
  }

  if (feedbackCompanyInput.value.trim()) {
    finishFeedbackSuccess("建议已发送，谢谢。");
    return;
  }

  const payload = {
    title: FEEDBACK_TITLE,
    message,
    nickname: feedbackNameInput.value.trim(),
    device: getDeviceLabel(feedbackDeviceInput.value),
    deviceType: feedbackDeviceInput.value,
    deviceLabel: getDeviceLabel(feedbackDeviceInput.value),
    level: getCurrentLevel().name,
    currentLevel: getCurrentLevel().name,
    levelName: getCurrentLevel().name,
    size: `${currentSize} x ${currentSize}`,
    gridSize: currentSize,
    boardSize: currentSize,
    currentGridSize: currentSize,
    gentleHints: gentleHintsInput.checked ? "开启" : "关闭",
    gentleHintsEnabled: gentleHintsInput.checked,
    company: feedbackCompanyInput.value.trim(),
    browser: detectBrowserName(),
    page: `${document.title} (${window.location.href})`,
    pageUrl: window.location.href,
    pageTitle: document.title,
    ua: navigator.userAgent,
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    submittedAt: new Date().toISOString()
  };

  setFeedbackSubmitting(true);
  setFeedbackStatus("正在发送建议…");

  try {
    const feedbackRequestController = new AbortController();
    const feedbackRequestTimeoutId = window.setTimeout(() => {
      feedbackRequestController.abort();
    }, FEEDBACK_TIMEOUT_MS);

    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: feedbackRequestController.signal
    });
    window.clearTimeout(feedbackRequestTimeoutId);
    const responseBody = await readFeedbackResponse(response);

    if (!response.ok || responseBody?.ok === false) {
      throw new Error(responseBody?.message || "发送失败，请稍后再试。");
    }

    finishFeedbackSuccess(responseBody?.message || "建议已发送，谢谢。", false);
    return;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      setFeedbackStatus("反馈服务连接超时，请稍后再试或切换网络。", true);
      return;
    }

    if (error instanceof TypeError && /Failed to fetch/i.test(error.message)) {
      setFeedbackStatus("反馈服务当前不可达，请稍后再试。", true);
      return;
    }

    setFeedbackStatus(error instanceof Error ? error.message : "发送失败，请稍后再试。", true);
  } finally {
    if (isFeedbackSubmitting) {
      setFeedbackSubmitting(false);
    }
  }
}

async function readFeedbackResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function setFeedbackSubmitting(isSubmitting) {
  isFeedbackSubmitting = isSubmitting;
  feedbackForm.setAttribute("aria-busy", String(isSubmitting));
  feedbackSubmitButton.disabled = isSubmitting;
  feedbackCancelButton.disabled = isSubmitting;
  feedbackMessageInput.disabled = isSubmitting;
  feedbackDeviceInput.disabled = isSubmitting;
  feedbackNameInput.disabled = isSubmitting;
  feedbackCompanyInput.disabled = isSubmitting;
}

function setFeedbackStatus(message, isError = false) {
  feedbackStatusElement.textContent = message;
  feedbackStatusElement.dataset.state = message ? (isError ? "error" : "success") : "idle";
}

function detectDeviceType() {
  if (window.matchMedia("(max-width: 560px)").matches) {
    return "mobile";
  }

  if (window.matchMedia("(max-width: 900px)").matches) {
    return "tablet";
  }

  return "desktop";
}

function detectBrowserName() {
  const userAgent = navigator.userAgent;
  const browserMatch = userAgent.match(/(Edg|OPR|Chrome|Safari|Firefox)\/[^\s]+/);
  return browserMatch ? browserMatch[0].replace("Edg", "Edge").replace("OPR", "Opera") : "";
}

function getDeviceLabel(device) {
  switch (device) {
    case "mobile":
      return "手机";
    case "tablet":
      return "平板";
    case "desktop":
      return "电脑";
    default:
      return "不确定";
  }
}

function handleSizeChange() {
  currentSize = Number(gridSizeSelect.value);
  totalCount = currentSize * currentSize;
  nextNumber = 1;
  mistakeCount = 0;
  hintUsedThisRound = false;
  gameActive = false;
  stopTimer();
  updateSummaryForCurrentSize();
  setCoachMessage(getCurrentLevel().intro);
  setStatus(`已进入${getCurrentLevel().name}，点击“${START_BUTTON_TEXT}”开始。`);
  createGrid();
}

function updateSummaryForCurrentSize() {
  const todayCount = getTodayProgressCount();
  const currentLevel = getCurrentLevel();
  starsElement.textContent = `${growthProfile.stars} 颗`;
  missionNameElement.textContent = currentLevel.mission;
  missionProgressElement.textContent = `今日完成 ${Math.min(todayCount, DAILY_GOAL)} / ${DAILY_GOAL} 次`;
  streakCountElement.textContent = `${growthProfile.streak} 次`;
}

function resetRunStats() {
  progressElement.textContent = `0 / ${totalCount}`;
  timerElement.textContent = "0.00 秒";
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
  mistakeCount = 0;
  hintUsedThisRound = false;
  gameActive = true;
  startTimestamp = performance.now();
  resetRunStats();
  setCoachMessage(`我们从 ${nextNumber} 开始，慢一点也没关系。`);
  setStatus(`闯关开始，请先找到数字 ${nextNumber}。`);
  createGrid();
  stopTimer();
  timerId = window.setInterval(updateTimer, 50);
  scheduleHint();
}

function shuffleOnly() {
  gameActive = false;
  nextNumber = 1;
  mistakeCount = 0;
  hintUsedThisRound = false;
  stopTimer();
  resetRunStats();
  updateSummaryForCurrentSize();
  setCoachMessage("数字位置已经换好了，我们随时可以再来一轮。");
  setStatus(`方格已重新洗牌，点击“${START_BUTTON_TEXT}”后再开始。`);
  createGrid();
}

function handleCellClick(value, cell) {
  if (!gameActive) {
    setStatus(`请先点击“${START_BUTTON_TEXT}”。`);
    return;
  }

  if (value !== nextNumber) {
    mistakeCount += 1;
    flashCell(cell, "wrong");
    setCoachMessage(`目标是 ${nextNumber}，我们再找找看。`);
    setStatus(pickRandom(MISTAKE_MESSAGES));
    scheduleHint();
    return;
  }

  cell.disabled = true;
  cell.classList.add("correct");
  progressElement.textContent = `${value} / ${totalCount}`;
  clearHintHighlight();

  if (value === totalCount) {
    finishGame();
    return;
  }

  nextNumber += 1;
  setCoachMessage(`下一步去找 ${nextNumber}，你已经越来越顺了。`);
  setStatus(pickRandom(ENCOURAGEMENTS));
  scheduleHint();
}

function finishGame() {
  gameActive = false;
  stopTimer();
  clearHintHighlight();
  const elapsed = (performance.now() - startTimestamp) / 1000;
  const starsGained = calculateStars();

  growthProfile.stars += starsGained;
  growthProfile.streak += 1;
  updateTodayProgress();
  persistGrowthProfile();

  timerElement.textContent = `${elapsed.toFixed(2)} 秒`;
  updateSummaryForCurrentSize();
  setCoachMessage(`本轮拿到 ${starsGained} 颗星，我们下次还能继续积累。`);
  setStatus(`${pickRandom(FINISH_MESSAGES)} 用时 ${elapsed.toFixed(2)} 秒，获得 ${starsGained} 颗星。`);
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

  if (hintTimerId !== null) {
    window.clearTimeout(hintTimerId);
    hintTimerId = null;
  }
}

function setStatus(message) {
  statusElement.textContent = message;
}

function setCoachMessage(message) {
  coachMessageElement.textContent = message;
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

function handleHintModeChange() {
  if (!gentleHintsInput.checked) {
    clearHintHighlight();
    if (hintTimerId !== null) {
      window.clearTimeout(hintTimerId);
      hintTimerId = null;
    }
    setCoachMessage("已关闭轻提示，我们照样可以慢慢找。");
    return;
  }

  setCoachMessage("轻提示已开启，卡住时我会悄悄提醒你。");
  scheduleHint();
}

function scheduleHint() {
  clearHintHighlight();

  if (!gameActive || !gentleHintsInput.checked) {
    return;
  }

  if (hintTimerId !== null) {
    window.clearTimeout(hintTimerId);
  }

  hintTimerId = window.setTimeout(() => {
    const nextCell = findCellByNumber(nextNumber);
    if (!gameActive || !nextCell) {
      return;
    }
    hintUsedThisRound = true;
    nextCell.classList.add("hint");
    setCoachMessage(`小提醒：目标数字是 ${nextNumber}。`);
  }, HINT_DELAY_MS);
}

function clearHintHighlight() {
  document.querySelectorAll(".cell.hint").forEach((cell) => {
    cell.classList.remove("hint");
  });
}

function findCellByNumber(value) {
  return Array.from(document.querySelectorAll(".cell")).find((cell) => Number(cell.textContent) === value);
}

function calculateStars() {
  let stars = 1;
  if (mistakeCount === 0) {
    stars += 1;
  }
  if (!hintUsedThisRound) {
    stars += 1;
  }
  return stars;
}

function getCurrentLevel() {
  return LEVELS.find((level) => level.size === currentSize) ?? LEVELS[0];
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getTodayProgressCount() {
  const todayKey = getTodayKey();
  return growthProfile.daily?.date === todayKey ? growthProfile.daily.count : 0;
}

function updateTodayProgress() {
  const todayKey = getTodayKey();
  if (growthProfile.daily?.date !== todayKey) {
    growthProfile.daily = { date: todayKey, count: 0 };
  }
  growthProfile.daily.count += 1;
}

function loadGrowthProfile() {
  try {
    const rawValue = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!rawValue) {
      return {
        stars: 0,
        streak: 0,
        daily: { date: getTodayKey(), count: 0 }
      };
    }

    const savedProfile = JSON.parse(rawValue);
    return {
      stars: Number(savedProfile.stars) || 0,
      streak: Number(savedProfile.streak) || 0,
      daily: savedProfile.daily && typeof savedProfile.daily.count === "number"
        ? savedProfile.daily
        : { date: getTodayKey(), count: 0 }
    };
  } catch {
    return {
      stars: 0,
      streak: 0,
      daily: { date: getTodayKey(), count: 0 }
    };
  }
}

function persistGrowthProfile() {
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(growthProfile));
}

function pickRandom(values) {
  return values[Math.floor(Math.random() * values.length)];
}