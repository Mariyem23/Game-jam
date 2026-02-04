// ========= CONFIG =========
const CODE = [2, 4, 1, 6]; // ton code secret (à changer)
const WHEEL_COUNT = 4;

let state = {
  wheels: Array(WHEEL_COUNT).fill(0),
  influence: 0, // 0 → 100
  locked: true,
  attempts: 0,
};

const el = {
  wheels: document.getElementById("wheels"),
  unlockBtn: document.getElementById("unlockBtn"),
  status: document.getElementById("statusLine"),
  popups: document.getElementById("popups"),
  glitch: document.getElementById("glitchLayer"),
  corruptFill: document.getElementById("corruptFill"),
};

// ========= UI BUILD =========
function buildWheels() {
  el.wheels.innerHTML = "";
  state.wheels.forEach((n, i) => {
    const w = document.createElement("div");
    w.className = "wheel";

    const up = document.createElement("button");
    up.textContent = "▲";
    up.addEventListener("click", () => incWheel(i, +1));

    const num = document.createElement("div");
    num.className = "num";
    num.id = `num-${i}`;
    num.textContent = String(n);

    const down = document.createElement("button");
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

  el.corruptFill.style.width = `${Math.max(0, Math.min(100, state.influence))}%`;
  el.glitch.style.opacity = String(Math.min(0.55, state.influence / 180));

  // un léger “shake” global via transform (cheap mais efficace)
  const amp = state.influence >= 60 ? 1.5 : state.influence >= 30 ? 0.8 : 0;
  document.body.style.transform =
    amp > 0 ? `translate(${rand(-amp, amp)}px, ${rand(-amp, amp)}px)` : "none";
}

function incWheel(i, delta) {
  if (!state.locked) return;

  // corruption: parfois le clic n'affecte pas la bonne roue
  const chaos = state.influence >= 70 && Math.random() < 0.18;
  const targetIndex = chaos ? (i + (Math.random() < 0.5 ? 1 : -1) + WHEEL_COUNT) % WHEEL_COUNT : i;

  state.wheels[targetIndex] = (state.wheels[targetIndex] + delta + 10) % 10;

  // corruption: parfois on affiche un chiffre fake (visuel seulement)
  if (state.influence >= 85 && Math.random() < 0.12) {
    const num = document.getElementById(`num-${targetIndex}`);
    if (num) {
      const real = state.wheels[targetIndex];
      num.textContent = String((real + randInt(1, 8)) % 10);
      setTimeout(render, 180);
    }
  } else {
    render();
  }
}

// ========= UNLOCK / CHECK =========
function checkCode() {
  if (!state.locked) return;

  state.attempts++;
  const ok = state.wheels.every((v, idx) => v === CODE[idx]);

  if (ok) {
    state.locked = false;
    el.status.textContent = "Confinement scellé ✔";
    el.status.style.color = "rgba(160,255,190,0.95)";
    clearSomePopups(true);
    stabilize();
    // ici tu peux rediriger vers kaijupedia ou une autre étape
    // setTimeout(() => (window.location.href = "kaijupedia.html"), 900);
    return;
  }

  el.status.textContent = "Combinaison incorrecte… intrusion en hausse.";
  el.status.style.color = "rgba(255,140,140,0.95)";
  rampInfluence(+18);
  spawnWeirdness();
}

function rampInfluence(amount) {
  state.influence = Math.max(0, Math.min(100, state.influence + amount));
  render();
}

// ========= WEIRD POPUPS =========
const POPUP_TEXTS = [
  { title: "ALERTE", body: "Breach détectée. La barrière faiblit." },
  { title: "ARCHIVES", body: "Indice mis à jour : (données corrompues)" },
  { title: "SYSTÈME", body: "Ne faites pas confiance à l’interface." },
  { title: "INTRUSION", body: "Il pousse de l’autre côté." },
  { title: "ERREUR 0x148", body: "Confinement instable. Corrigez le code." },
];

function spawnPopup({ forced = false } = {}) {
  if (!forced) {
    const chance = state.influence >= 80 ? 0.65 : state.influence >= 50 ? 0.35 : 0.15;
    if (Math.random() > chance) return;
  }

  const t = POPUP_TEXTS[randInt(0, POPUP_TEXTS.length - 1)];
  const p = document.createElement("div");
  p.className = "popup";

  const x = randInt(40, window.innerWidth - 320);
  const y = randInt(60, window.innerHeight - 220);
  p.style.left = `${x}px`;
  p.style.top = `${y}px`;

  p.innerHTML = `
    <div class="popup__title">
      <span>${t.title}</span>
      <span style="opacity:.55">#${randInt(100,999)}</span>
    </div>
    <div class="popup__body">${t.body}</div>
    <div class="popup__actions">
      <button data-act="ok">OK</button>
      <button data-act="ignore">IGNORER</button>
    </div>
  `;

  // comportements bizarres selon influence
  const btns = p.querySelectorAll("button");
  btns.forEach((b) => {
    b.addEventListener("click", (e) => {
      const act = e.currentTarget.getAttribute("data-act");

      // à haute influence, IGNORER peut punir (le kaiju troll)
      if (state.influence >= 75 && act === "ignore" && Math.random() < 0.35) {
        el.status.textContent = "Mauvaise action… le système se corrompt.";
        rampInfluence(+8);
        nudgeUnlockButton();
      }

      // OK peut parfois fermer un autre popup au lieu de celui-ci
      if (state.influence >= 70 && act === "ok" && Math.random() < 0.25) {
        clearSomePopups(false);
      }

      p.remove();
    });
  });

  el.popups.appendChild(p);

  // auto-move / drift
  if (state.influence >= 60) {
    const drift = setInterval(() => {
      if (!document.body.contains(p)) return clearInterval(drift);
      p.style.left = `${clamp(parseInt(p.style.left, 10) + randInt(-6, 6), 10, window.innerWidth - 310)}px`;
      p.style.top = `${clamp(parseInt(p.style.top, 10) + randInt(-4, 4), 44, window.innerHeight - 210)}px`;
    }, 220);
  }
}

function clearSomePopups(all) {
  const items = Array.from(el.popups.querySelectorAll(".popup"));
  if (all) {
    items.forEach((p) => p.remove());
    return;
  }
  // supprime 1-2 au hasard
  items
    .sort(() => Math.random() - 0.5)
    .slice(0, randInt(1, 2))
    .forEach((p) => p.remove());
}

// ========= OTHER WEIRDNESS =========
function spawnWeirdness() {
  // popups + déplacement bouton + mini “glitch burst”
  spawnPopup();
  if (state.influence >= 40 && Math.random() < 0.5) nudgeUnlockButton();

  if (state.influence >= 55) {
    el.glitch.style.opacity = String(Math.min(0.7, state.influence / 120));
    setTimeout(() => render(), 260);
  }
}

function nudgeUnlockButton() {
  // bouge légèrement le bouton (mais pas trop)
  const max = state.influence >= 80 ? 22 : 10;
  el.unlockBtn.style.transform = `translate(${rand(-max, max)}px, ${rand(-max, max)}px)`;
  setTimeout(() => (el.unlockBtn.style.transform = "translate(0,0)"), 220);
}

function stabilize() {
  // réduit l’influence progressivement
  const timer = setInterval(() => {
    state.influence = Math.max(0, state.influence - 8);
    render();
    if (state.influence === 0) clearInterval(timer);
  }, 120);
}

// ========= HELPERS =========
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// ========= INIT =========
buildWheels();
render();

el.unlockBtn.addEventListener("click", checkCode);

// petit “événement” régulier : à haute influence, le kaiju spam des popups tout seul
setInterval(() => {
  if (!state.locked) return;
  if (state.influence >= 55) spawnPopup();
}, 900);

// resize : garder dans l’écran
window.addEventListener("resize", () => {
  // optionnel: tu pourrais repositionner les popups qui sortent
});
