// ========= CONFIGURATION =========
// Redirection vers la nouvelle page (version inversée)
const HOME_URL = "../../kaijupedia2.html";   

const TIME_LIMIT_MS = 6 * 60 * 1000;  // 6 minutes

// Le code secret (4-2-7 d'après tes indices)
const CODE = [4, 2, 7];  
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

// ========= GESTION BARRE DE VIE (LOCALSTORAGE) =========
function updateGlobalHP(amount) {
  // 1. On récupère la valeur actuelle (ou 50 par défaut)
  let currentHP = parseInt(localStorage.getItem("kaijuHP") || "50");

  // 2. On applique le changement (+5 ou -10)
  currentHP += amount;

  // 3. On empêche de dépasser 0 ou 100
  currentHP = Math.min(100, Math.max(0, currentHP));

  // 4. On sauvegarde pour la page d'accueil
  localStorage.setItem("kaijuHP", currentHP);
  
  console.log(`Système mis à jour : ${amount > 0 ? '+' : ''}${amount}% (Total: ${currentHP}%)`);
}

// ========= CONSTRUCTION DES ROUES =========
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

// ========= VÉRIFICATION (VICTOIRE AVEC POP-UP) =========
function checkCode() {
  if (!state.locked || state.redirecting) return;

  state.attempts++;

  // Vérifie si le code est bon
  const ok = state.wheels.every((v, idx) => v === CODE[idx]);

  if (ok) {
    // 1. VICTOIRE : On augmente la barre de vie de 5%
    updateGlobalHP(5);

    // 2. Mise à jour visuelle du cadenas
    state.locked = false;
    el.status.textContent = "✔ ACCÈS AUTORISÉ";
    el.status.style.color = "rgba(160,255,190,0.95)";
    
    state.redirecting = true;
    
    // 3. Petit délai pour voir le message vert, puis POP-UP
    setTimeout(() => {
      // Le message d'alerte demandé
      alert("ANOMALIE DÉTECTÉE...\n\nMessage du système : \"Trouvez l'erreur dans la page suivante.\"");
      
      // Une fois qu'on clique sur OK, on change de page
      window.location.href = HOME_URL;
    }, 200);
    
    return;
  }

  // Code faux
  el.status.textContent = "✖ Incorrect. Relis les indices.";
  el.status.style.color = "rgba(255,140,140,0.95)";
}

// ========= TIMER + REDIRECTION (DÉFAITE) =========
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
    // DÉFAITE (TEMPS ÉCOULÉ) : On perd 10%
    updateGlobalHP(-10);

    el.status.textContent = "⏳ Temps écoulé. Retour aux archives…";
    el.status.style.color = "rgba(255,200,120,0.95)";
    goHomeSoon(600);
  }
}

// ========= INITIALISATION =========
buildWheels();
render();

el.unlockBtn.addEventListener("click", checkCode);

// Lancer le timer
tickCountdown();
setInterval(tickCountdown, 250);