// ============================
// TEXTE 1 (FR) + MOT-CLE
// ============================
const KEYWORD = "TEMPLE";

const PLAINTEXT =
`FRAGMENT 09 — TRANSCRIPTION INCOMPLÈTE

Nous avons trouvé la porte dans une chambre sans murs.
Pas un endroit : une idée.

Les capteurs jurent qu’il n’y a rien. Pourtant, le noir respire.
Le portail ne s’ouvre pas avec une clé, mais avec un nom.
Un seul mot tient encore la charnière du monde.

Ne l’écris pas trop tôt. La chose écoute.
Termine la traduction, puis dis le lieu.
Le lieu où l’on prie sans dieu, où les pierres retiennent les cris.

Si tu hésites, l’écran se remplira de fenêtres.
Si tu refuses, il viendra quand même.`;

// ============================
// TIMER + INTRUSION
// ============================
const TIME_LIMIT_SEC = 600; // 1:50 (modifie si tu veux)
let timeLeft = TIME_LIMIT_SEC;

let influence = 0; // 0..100
let gameOver = false;

// mapping joueur
const mapping = new Map(); // glyph -> letter
const locked = new Set();  // glyphes verrouillés

// ============================
// DOM
// ============================
const el = {
  cipher: document.getElementById("cipherText"),
  plain: document.getElementById("plainText"),
  grid: document.getElementById("mapGrid"),
  status: document.getElementById("statusLine"),
  guessInput: document.getElementById("guessInput"),
  guessBtn: document.getElementById("guessBtn"),
  corruptFill: document.getElementById("corruptFill"),
  glitch: document.getElementById("glitchLayer"),
  timer: document.getElementById("timer"),
  popups: document.getElementById("popups"),
  panel: document.getElementById("panel"),
};

// ============================
// ALPHABET DE GLYPHES
// (tu peux changer les glyphes si tu veux)
// ============================
const GLYPH_FOR = {
  A:"☉", B:"☍", C:"⟁", D:"⌖", E:"☽", F:"⚚", G:"⎔", H:"⎍", I:"✚",
  J:"⌬", K:"☊", L:"⟡", M:"⚔", N:"⊕", O:"⧗", P:"⟠", Q:"⨳",
  R:"⟟", S:"⚑", T:"⟐", U:"⟰", V:"⟱", W:"⟲", X:"⟴", Y:"⟵", Z:"⟶",
};

const glyphValues = Object.values(GLYPH_FOR);

// ============================
// ENCODAGE -> TEXTE CHIFFRÉ
// ============================
function normalizeFR(str){
  // garde lettres A-Z (enlevant accents pour que ce soit stable)
  // ex: È/É -> E, Ç -> C, ’ -> '
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // enlève diacritiques
    .replace(/’/g, "'");              // apostrophe typographique
}

function encodeToGlyphs(text){
  const up = normalizeFR(text).toUpperCase();
  let out = "";
  for (const ch of up){
    if (ch >= "A" && ch <= "Z") out += GLYPH_FOR[ch] ?? ch;
    else out += ch;
  }
  return out;
}

const CIPHERTEXT = encodeToGlyphs(PLAINTEXT);

// Liste de glyphes utilisés (unique)
const USED_GLYPHS = Array.from(new Set(
  Array.from(CIPHERTEXT).filter(c => glyphValues.includes(c))
));

// ============================
// MELANGE (pas alphabetique)
// ============================
function shuffle(arr){
  const a = arr.slice();
  for (let i=a.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================
// BUILD GRID
// ============================
function buildGrid(){
  el.grid.innerHTML = "";
  const order = shuffle(USED_GLYPHS); // <- mélangé

  for (const g of order){
    const item = document.createElement("div");
    item.className = "mapitem";

    const glyph = document.createElement("div");
    glyph.className = "glyph";
    glyph.textContent = g;

    const input = document.createElement("input");
    input.maxLength = 1;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.inputMode = "text";

    const mark = document.createElement("div");
    mark.className = "lockmark";
    mark.textContent = "";

    input.addEventListener("input", () => {
      if (gameOver) return;
      if (locked.has(g)) return;

      const v = (input.value || "").toUpperCase();

      if (!v){
        mapping.delete(g);
        input.classList.remove("bad");
        renderPlain();
        validateAndLock();
        return;
      }

      if (v < "A" || v > "Z"){
        input.classList.add("bad");
        bumpInfluence(4);
        return;
      }

      mapping.set(g, v);
      input.classList.remove("bad");
      renderPlain();
      validateAndLock();
    });

    item.appendChild(glyph);
    item.appendChild(input);
    item.appendChild(mark);
    el.grid.appendChild(item);
  }
}

// ============================
// VALIDATION + LOCK
// ============================
function validateAndLock(){
  const nodes = el.grid.querySelectorAll(".mapitem");
  const letterToGlyph = new Map();

  // reset bad on non-locked
  nodes.forEach(node => {
    const g = node.querySelector(".glyph").textContent;
    const inp = node.querySelector("input");
    if (!locked.has(g)) inp.classList.remove("bad");
  });

  // detect doublons
  nodes.forEach(node => {
    const g = node.querySelector(".glyph").textContent;
    const inp = node.querySelector("input");
    const v = (inp.value || "").toUpperCase();
    if (!v) return;

    if (v < "A" || v > "Z"){
      if (!locked.has(g)) inp.classList.add("bad");
      return;
    }

    if (letterToGlyph.has(v) && letterToGlyph.get(v) !== g){
      if (!locked.has(g)) inp.classList.add("bad");
    } else {
      letterToGlyph.set(v, g);
    }
  });

  // lock si ok
  nodes.forEach(node => {
    const g = node.querySelector(".glyph").textContent;
    const inp = node.querySelector("input");
    const mark = node.querySelector(".lockmark");

    if (locked.has(g)){
      node.classList.add("locked");
      if (mark) mark.textContent = "VERROUILLÉ ✓";
      return;
    }

    if (inp.value && !inp.classList.contains("bad")){
      locked.add(g);
      node.classList.add("locked");
      if (mark) mark.textContent = "VERROUILLÉ ✓";
    } else {
      node.classList.remove("locked");
      if (mark) mark.textContent = "";
    }
  });

  updateStatus();
}

// ============================
// TRADUCTION LIVE
// ============================
function renderPlain(){
  let out = "";
  for (const ch of CIPHERTEXT){
    if (glyphValues.includes(ch)){
      out += mapping.get(ch) ? mapping.get(ch) : "•";
    } else {
      out += ch;
    }
  }

  const complete = isFullyTranslated();
  el.plain.innerHTML = complete
    ? `<span class="hot">${escapeHtml(out)}</span>`
    : `<span class="unk">${escapeHtml(out)}</span>`;
}

function isFullyTranslated(){
  const inputs = el.grid.querySelectorAll(".mapitem input");
  for (const inp of inputs){
    if (!inp.value) return false;
    if (inp.classList.contains("bad")) return false;
  }
  return true;
}

function escapeHtml(s){
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function updateStatus(){
  if (gameOver){
    el.status.textContent = "Contrôle perdu… intrusion totale.";
    el.status.style.color = "rgba(255,140,140,0.95)";
    return;
  }

  const inputs = el.grid.querySelectorAll(".mapitem input");
  let filled = 0;
  let bad = 0;

  inputs.forEach(inp => {
    if (inp.value) filled++;
    if (inp.classList.contains("bad")) bad++;
  });

  if (bad > 0){
    el.status.textContent = `Conflits détectés (${bad}) — corrige.`;
    el.status.style.color = "rgba(255,140,140,0.95)";
  } else {
    el.status.textContent = `Traduction: ${filled}/${inputs.length} symboles verrouillés.`;
    el.status.style.color = "rgba(231,220,199,0.82)";
  }
}

// ============================
// POPUPS + PERTE DE CONTROLE
// ============================
const POPUP_TEXTS = [
  { title:"ALERTE", body:"L’intégrité du protocole chute." },
  { title:"ARCHIVES", body:"Le fragment résiste. Ne fais pas confiance aux fenêtres." },
  { title:"SYSTÈME", body:"Entrée non autorisée." },
  { title:"INTRUSION", body:"Quelque chose pousse de l’autre côté." },
  { title:"ERREUR 0x09", body:"Données incohérentes. Recalcul en cours…" },
  { title:"SIGNAL", body:"La chose écoute." },
];

function spawnPopup(force=false){
  if (gameOver) return;

  // plus influence est haut, plus ça spawn
  const chance = force ? 1 : (influence >= 80 ? 0.7 : influence >= 55 ? 0.35 : 0.10);
  if (Math.random() > chance) return;

  const t = POPUP_TEXTS[Math.floor(Math.random()*POPUP_TEXTS.length)];
  const p = document.createElement("div");
  p.className = "popup";

  const x = randInt(20, Math.max(30, window.innerWidth - 320));
  const y = randInt(60, Math.max(80, window.innerHeight - 220));
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
      <button data-act="close">FERMER</button>
    </div>
  `;

  // certaines fenêtres sont "pièges" (au-dessus de 70)
  const isTrap = influence >= 70 && Math.random() < 0.35;

  p.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      if (gameOver) return;

      // piège : cliquer augmente l’intrusion ou désactive un bouton
      if (isTrap){
        bumpInfluence(8);
        disableControlsBriefly(900);
        el.status.textContent = "Mauvaise fenêtre… interférence accrue.";
        el.status.style.color = "rgba(255,140,140,0.95)";
      }
      p.remove();
    });
  });

  el.popups.appendChild(p);

  // drift (ça bouge tout seul) si influence haute
  if (influence >= 60){
    const drift = setInterval(() => {
      if (!document.body.contains(p) || gameOver) return clearInterval(drift);
      p.style.left = `${clamp(parseInt(p.style.left,10) + randInt(-8,8), 10, window.innerWidth - 310)}px`;
      p.style.top  = `${clamp(parseInt(p.style.top,10) + randInt(-6,6), 44, window.innerHeight - 210)}px`;
    }, 220);
  }
}

// rend les boutons inclicables (perte de contrôle)
function disableControlsBriefly(ms){
  if (gameOver) return;

  el.guessBtn.style.pointerEvents = "none";
  el.guessInput.style.pointerEvents = "none";

  // random: désactiver quelques inputs non verrouillés
  const inputs = Array.from(el.grid.querySelectorAll(".mapitem input"))
    .filter(inp => !inp.closest(".mapitem").classList.contains("locked"));

  inputs.slice(0, randInt(1, Math.min(4, inputs.length))).forEach(inp => {
    inp.style.pointerEvents = "none";
    inp.style.filter = "brightness(0.8)";
    setTimeout(() => {
      if (gameOver) return;
      inp.style.pointerEvents = "";
      inp.style.filter = "";
    }, ms);
  });

  // remet guess
  setTimeout(() => {
    if (gameOver) return;
    el.guessBtn.style.pointerEvents = "";
    el.guessInput.style.pointerEvents = "";
  }, ms);
}

// bouton qui “fuit”
function nudgeGuessButton(){
  const max = influence >= 80 ? 24 : 12;
  el.guessBtn.style.transform = `translate(${rand(-max,max)}px, ${rand(-max,max)}px)`;
  setTimeout(() => { el.guessBtn.style.transform = "translate(0,0)"; }, 240);
}

// sabotage: efface une entrée non verrouillée
function sabotage(){
  if (gameOver) return;

  const candidates = Array.from(el.grid.querySelectorAll(".mapitem"))
    .filter(node => {
      const g = node.querySelector(".glyph").textContent;
      const inp = node.querySelector("input");
      return !locked.has(g) && inp && inp.value && !inp.classList.contains("bad");
    });

  if (!candidates.length) return;

  const node = candidates[Math.floor(Math.random()*candidates.length)];
  const g = node.querySelector(".glyph").textContent;
  const inp = node.querySelector("input");

  inp.value = "";
  mapping.delete(g);

  el.status.textContent = "Interférence… une correspondance s’est effacée.";
  el.status.style.color = "rgba(255,140,140,0.95)";

  renderPlain();
  validateAndLock();
}

// ============================
// INTRUSION
// ============================
function bumpInfluence(amount){
  if (gameOver) return;

  influence = clamp(influence + amount, 0, 100);
  el.corruptFill.style.width = `${influence}%`;

  // glitch & shake
  el.glitch.style.opacity = String(Math.min(0.80, influence / 110));
  const amp = influence >= 70 ? 1.8 : influence >= 40 ? 0.9 : 0;
  el.panel.style.transform = amp > 0
    ? `translate(${rand(-amp,amp)}px, ${rand(-amp,amp)}px)`
    : "translate(0,0)";

  // perte de contrôle progressive
  if (influence >= 35 && Math.random() < 0.30) spawnPopup(false);
  if (influence >= 55 && Math.random() < 0.30) disableControlsBriefly(700);
  if (influence >= 65 && Math.random() < 0.35) nudgeGuessButton();
  if (influence >= 75 && Math.random() < 0.25) sabotage();
  if (influence >= 90 && Math.random() < 0.45) spawnPopup(true);

  if (influence >= 100){
    loseControl();
  }
}

// ============================
// TIMER
// ============================
function formatTime(s){
  const m = Math.floor(s/60);
  const r = s % 60;
  return `${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`;
}

function startTimer(){
  el.timer.textContent = formatTime(timeLeft);

  setInterval(() => {
    if (gameOver) return;

    timeLeft = Math.max(0, timeLeft - 1);
    el.timer.textContent = formatTime(timeLeft);

    // montée automatique (accélère vers la fin)
    const elapsed = TIME_LIMIT_SEC - timeLeft;
    const p = elapsed / TIME_LIMIT_SEC;
    const gain = p < 0.4 ? 1 : p < 0.7 ? 2 : 4;
    bumpInfluence(gain);

    if (timeLeft <= 0){
      loseControl();
    }
  }, 1000);
}

// ============================
// MOT-CLE + “ne l'écris pas trop tôt”
// ============================
function checkKeyword(){
  if (gameOver) return;

  const guess = normalizeFR((el.guessInput.value || "").trim()).toUpperCase();

  // pénalité si trop tôt
  if (!isFullyTranslated()){
    if (guess === KEYWORD){
      el.status.textContent = "Trop tôt. La chose écoute…";
      el.status.style.color = "rgba(255,140,140,0.95)";
      bumpInfluence(22);
      spawnPopup(true);
      disableControlsBriefly(1200);
      return;
    }

    el.status.textContent = "Traduction incomplète. Termine d’abord.";
    el.status.style.color = "rgba(255,140,140,0.95)";
    bumpInfluence(10);
    return;
  }

  if (guess === KEYWORD){
    el.status.textContent = "Protocole validé ✔ Le lieu a été nommé.";
    el.status.style.color = "rgba(160,255,190,0.95)";

    // stabilise un peu
    influence = Math.max(0, influence - 35);
    el.corruptFill.style.width = `${influence}%`;

    // option: redirection
    // setTimeout(() => window.location.href = "kaijupedia.html", 900);
  } else {
    el.status.textContent = "Mot-clé incorrect…";
    el.status.style.color = "rgba(255,140,140,0.95)";
    bumpInfluence(18);
    spawnPopup(false);
  }
}

el.guessBtn.addEventListener("click", checkKeyword);
el.guessInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkKeyword();
});

// ============================
// DEFAITE (controle perdu)
// ============================
function loseControl(){
  if (gameOver) return;
  gameOver = true;
  influence = 100;

  el.corruptFill.style.width = "100%";
  el.glitch.style.opacity = "0.90";
  el.panel.style.transform = "translate(0,0)";

  // spam popups
  for (let i=0; i<6; i++) spawnPopup(true);

  el.status.textContent = "Contrôle perdu… intrusion totale.";
  el.status.style.color = "rgba(255,140,140,0.95)";

  // désactive tout
  el.guessBtn.disabled = true;
  el.guessInput.disabled = true;
  el.grid.querySelectorAll("input").forEach(inp => inp.disabled = true);
}

// ============================
// HELPERS
// ============================
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function rand(min,max){ return Math.random()*(max-min)+min; }
function randInt(min,max){ return Math.floor(rand(min, max+1)); }

// ============================
// INIT
// ============================
el.cipher.textContent = CIPHERTEXT;
buildGrid();
renderPlain();
validateAndLock();
el.corruptFill.style.width = "0%";
updateStatus();
startTimer();
