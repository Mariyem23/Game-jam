// ========= CONFIG (VERSION SIMPLE) =========
const HOME_URL = "http://127.0.0.1:5500/kaijupedia.html";   
const TIME_LIMIT_MS = 6 * 60 * 1000;  // 6 minutes

const CODE = [4, 2, 7];  // 🔐 code secret de l’exemple
const WHEEL_COUNT = 3;

let state = {
  wheels: Array(WHEEL_COUNT).fill(0),
  locked: true,
  attempts: 0,
  startedAt: Date.now(),
  redirecting: false,
};

const el = {
  wheels: document.getElementById("wheels"),
  unlockBtn: document.getElementById("unlockBtn"),
  status: document.getElementById("statusLine"),
  countdown: document.getElementById("countdown"),
};

// ========= UI BUILD =========
function buildWheels() {
  el.wheels.innerHTML = "";

  state.wheels.forEach((n, i) => {
    const w = document.createElement("div");
    w.className = "wheel";

    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "▲";
    up.addEventListener("click", () => incWheel(i, +1));

    const num = document.createElement("div");
    num.className = "num";
    num.id = `num-${i}`;
    num.textContent = String(n);

    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "▼";
    down.addEventListener("click", () => incWheel(i, -1));

    w.appendChild(up);
    w.appendChild(num);
    w.appendChild(down);
    el.wheels.appendChild(w);
  });
}

function render() {
  state.wheels.forEach((n, i) => {
    const num = document.getElementById(`num-${i}`);
    if (num) num.textContent = String(n);
  });
}

function incWheel(i, delta) {
  if (!state.locked || state.redirecting) return;
  state.wheels[i] = (state.wheels[i] + delta + 10) % 10;
  render();
}

// ========= CHECK =========
function checkCode() {
  if (!state.locked || state.redirecting) return;

  state.attempts++;

  const ok = state.wheels.every((v, idx) => v === CODE[idx]);

  if (ok) {
    state.locked = false;
    el.status.textContent = "✔ Cadenas déverrouillé. Retour aux archives…";
    el.status.style.color = "rgba(160,255,190,0.95)";
    goHomeSoon(900);
    return;
  }

  el.status.textContent = "✖ Incorrect. Relis les indices.";
  el.status.style.color = "rgba(255,140,140,0.95)";
}

// ========= TIMER + REDIRECTION =========
function formatMMSS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function goHomeSoon(delay = 0) {
  if (state.redirecting) return;
  state.redirecting = true;
  setTimeout(() => {
    window.location.href = HOME_URL;
  }, delay);
}

function tickCountdown() {
  const elapsed = Date.now() - state.startedAt;
  const left = TIME_LIMIT_MS - elapsed;

  if (el.countdown) el.countdown.textContent = formatMMSS(left);

  if (left <= 0) {
    el.status.textContent = "⏳ Temps écoulé. Retour aux archives…";
    el.status.style.color = "rgba(255,200,120,0.95)";
    goHomeSoon(600);
  }
}

// ========= INIT =========
buildWheels();
render();

el.unlockBtn.addEventListener("click", checkCode);

// tick toutes les 250ms (fluide et léger)
tickCountdown();
setInterval(tickCountdown, 250);
