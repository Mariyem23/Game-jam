// ============================
// PUZZLE: TEXTE + MOT-CLE
// ============================
const KEYWORD = "TEMPLE";

// Texte FR (stabilise: sans accents dans la traduction finale)
const PLAINTEXT =
`FRAGMENT 09 - TRANSCRIPTION INCOMPLETE

NOUS AVONS TROUVE LA PORTE DANS UNE CHAMBRE SANS MURS.
PAS UN ENDROIT : UNE IDEE.

LES CAPTEURS JURENT QU IL N Y A RIEN. POURTANT, LE NOIR RESPIRE.
LE PORTAIL NE S OUVRE PAS AVEC UNE CLE, MAIS AVEC UN NOM.
UN SEUL MOT TIENT ENCORE LA CHARNIERE DU MONDE.

NE L ECRIS PAS TROP TOT. LA CHOSE ECOUTE.
TERMINE LA TRADUCTION, PUIS DIS LE LIEU.
LE LIEU OU L ON PRIE SANS DIEU, OU LES PIERRES RETIENNENT LES CRIS.

SI TU HESITES, L ECRAN SE REMPLIRA DE FENETRES.
SI TU REFUSES, IL VIENDRA QUAND MEME.`;

// ============================
// TIMER (10 MINUTES AVANT COLLAPSE)
// ============================
const STABLE_TIME_SEC = 600; // 10:00
let timeLeft = STABLE_TIME_SEC;

let collapseMode = false; // deviens true quand timer = 0
let influence = 0;        // 0..100
let gameOver = false;

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
  phaseTag: document.getElementById("phaseTag"),
};

// ============================
// ALPHABET GLYPHES
// ============================
const GLYPH_FOR = {
  A:"☉", B:"☍", C:"⟁", D:"⌖", E:"☽", F:"⚚", G:"⎔", H:"⎍", I:"✚",
  J:"⌬", K:"☊", L:"⟡", M:"⚔", N:"⊕", O:"⧗", P:"⟠", Q:"⨳",
  R:"⟟", S:"⚑", T:"⟐", U:"⟰", V:"⟱", W:"⟲", X:"⟴", Y:"⟵", Z:"⟶",
};
const glyphValues = Object.values(GLYPH_FOR);

// inverse: glyph -> lettre (verite du puzzle)
const LETTER_FOR_GLYPH = new Map();
for (const [letter, glyph] of Object.entries(GLYPH_FOR)) {
  LETTER_FOR_GLYPH.set(glyph, letter);
}

// ============================
// ETAT JOUEUR
// ============================
const current = new Map(); // glyph -> lettre saisie (meme si fausse)
const locked = new Set();  // glyphes verrouilles (seulement si correct)

// ============================
// ENCODAGE
// ============================
function encodeToGlyphs(text){
  const up = text.toUpperCase();
  let out = "";
  for (const ch of up){
    if (ch >= "A" && ch <= "Z") out += GLYPH_FOR[ch] ?? ch;
    else out += ch;
  }
  return out;
}

const CIPHERTEXT = encodeToGlyphs(PLAINTEXT);

// glyphes utilises (unique)
const USED_GLYPHS = Array.from(new Set(
  Array.from(CIPHERTEXT).filter(c => glyphValues.includes(c))
));

// shuffle (ordre non alphabetique)
function shuffle(arr){
  const a = arr.slice();
  for (let i=a.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================
// UI: TABLE DES SYMBOLES (MELANGEE)
// ============================
function buildGrid(){
  el.grid.innerHTML = "";
  const order = shuffle(USED_GLYPHS);

  for (const g of order){
    const item = document.createElement("div");
    item.className = "mapitem";
    item.dataset.glyph = g;

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

      // vide => efface
      if (!v) {
        current.delete(g);
        input.classList.remove("bad");
        renderPlain();
        updateItemState(item, g);
        updateStatus();
        return;
      }

      // A-Z only
      if (v < "A" || v > "Z") {
        input.classList.add("bad");
        current.set(g, v);
        renderPlain();
        updateItemState(item, g);
        updateStatus();
        return;
      }

      current.set(g, v);
      renderPlain();

      // test verite: si bonne lettre => lock
      const correct = LETTER_FOR_GLYPH.get(g);
      if (v === correct) {
        locked.add(g);
      }

      updateItemState(item, g);
      updateStatus();
    });

    item.appendChild(glyph);
    item.appendChild(input);
    item.appendChild(mark);
    el.grid.appendChild(item);

    // init state
    updateItemState(item, g);
  }
}

function updateItemState(item, glyph){
  const inp = item.querySelector("input");
  const mark = item.querySelector(".lockmark");

  if (locked.has(glyph)){
    item.classList.add("locked");
    inp.classList.remove("bad");
    inp.value = LETTER_FOR_GLYPH.get(glyph);
    inp.style.pointerEvents = "none";
    if (mark) mark.textContent = "VERROUILLE ✓";
    return;
  }

  item.classList.remove("locked");
  inp.style.pointerEvents = "";

  const v = (inp.value || "").toUpperCase();
  const correct = LETTER_FOR_GLYPH.get(glyph);

  if (!v) {
    inp.classList.remove("bad");
    if (mark) mark.textContent = "";
    return;
  }

  // si faux => rouge, modifiable
  if (v !== correct) {
    inp.classList.add("bad");
    if (mark) mark.textContent = "";
  } else {
    // normalement lock direct, mais au cas ou
    inp.classList.remove("bad");
    if (mark) mark.textContent = "VERROUILLE ✓";
  }
}

// ============================
// TRADUCTION LIVE
// ============================
function renderPlain(){
  let out = "";
  for (const ch of CIPHERTEXT){
    if (glyphValues.includes(ch)){
      const repl = current.get(ch);
      out += repl ? repl : "•";
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
  // tout glyphe utilise doit etre locke
  for (const g of USED_GLYPHS){
    if (!locked.has(g)) return false;
  }
  return true;
}

function escapeHtml(s){
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

// ============================
// TIMER: 10:00 -> COLLAPSE
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

    if (!collapseMode){
      timeLeft = Math.max(0, timeLeft - 1);
      el.timer.textContent = formatTime(timeLeft);

      // pendant stable: intrusion quasi nulle
      if (timeLeft <= 0){
        enterCollapseMode();
      }
      return;
    }

    // collapse: intrusion monte vite + chaos
    bumpInfluence(2 + (influence >= 70 ? 2 : 0)); // accelere sur la fin
  }, 1000);
}

function enterCollapseMode(){
  collapseMode = true;
  el.phaseTag.textContent = "COLLAPSE";
  el.phaseTag.classList.add("phase--collapse");
  el.status.textContent = "Stabilite perdue... l'interface deraille.";
  el.status.style.color = "rgba(255,140,140,0.95)";

  // petit spike
  bumpInfluence(10);
  spawnPopup(true);
}

// ============================
// CHAOS: POPUPS + CONTROLES INCliCABLES + REORDER
// ============================
const POPUP_TEXTS = [
  { title:"ALERTE", body:"Le protocole se fissure." },
  { title:"ARCHIVES", body:"Le fragment refuse d'etre lu." },
  { title:"SYSTÈME", body:"Acces refuse." },
  { title:"INTRUSION", body:"Quelque chose pousse de l'autre cote." },
  { title:"ERREUR 0x09", body:"Donnees incoherentes. Correction automatique..." },
  { title:"SIGNAL", body:"La chose ecoute." },
];

function spawnPopup(force=false){
  if (gameOver) return;
  if (!collapseMode && !force) return;

  const chance = force ? 1 : (influence >= 80 ? 0.75 : influence >= 55 ? 0.45 : 0.22);
  if (Math.random() > chance) return;

  const t = POPUP_TEXTS[Math.floor(Math.random()*POPUP_TEXTS.length)];
  const p = document.createElement("div");
  p.className = "popup";

  const x = randInt(18, Math.max(24, window.innerWidth - 320));
  const y = randInt(60, Math.max(90, window.innerHeight - 220));
  p.style.left = `${x}px`;
  p.style.top = `${y}px`;

  const trap = influence >= 65 && Math.random() < 0.40;

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

  p.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      if (gameOver) return;

      if (trap){
        // le popup te "punit"
        bumpInfluence(6);
        disableControlsBriefly(900);
        nudgeGuessButton();
      }
      p.remove();
    });
  });

  el.popups.appendChild(p);

  // drift
  if (influence >= 60){
    const drift = setInterval(() => {
      if (!document.body.contains(p) || gameOver) return clearInterval(drift);
      p.style.left = `${clamp(parseInt(p.style.left,10) + randInt(-8,8), 10, window.innerWidth - 310)}px`;
      p.style.top  = `${clamp(parseInt(p.style.top,10) + randInt(-6,6), 44, window.innerHeight - 210)}px`;
    }, 240);
  }
}

function disableControlsBriefly(ms){
  if (gameOver) return;
  if (!collapseMode) return;

  // guess: inclicable
  el.guessBtn.style.pointerEvents = "none";
  el.guessInput.style.pointerEvents = "none";

  // bloque quelques inputs non lockes
  const inputs = Array.from(el.grid.querySelectorAll(".mapitem"))
    .filter(node => !locked.has(node.dataset.glyph))
    .map(node => node.querySelector("input"))
    .filter(Boolean);

  const count = Math.min(randInt(1, 4), inputs.length);
  shuffle(inputs).slice(0, count).forEach(inp => {
    inp.style.pointerEvents = "none";
    inp.style.filter = "brightness(0.75)";
    setTimeout(() => {
      if (gameOver) return;
      inp.style.pointerEvents = "";
      inp.style.filter = "";
    }, ms);
  });

  setTimeout(() => {
    if (gameOver) return;
    el.guessBtn.style.pointerEvents = "";
    el.guessInput.style.pointerEvents = "";
  }, ms);
}

function nudgeGuessButton(){
  if (!collapseMode) return;
  const max = influence >= 80 ? 26 : 14;
  el.guessBtn.style.transform = `translate(${rand(-max,max)}px, ${rand(-max,max)}px)`;
  setTimeout(() => { el.guessBtn.style.transform = "translate(0,0)"; }, 240);
}

function reorderSymbolTable(){
  if (!collapseMode) return;
  // re-shuffle visuel de la table (super perturbant)
  const nodes = Array.from(el.grid.children);
  const sh = shuffle(nodes);
  sh.forEach(n => el.grid.appendChild(n));
}

// ============================
// INFLUENCE / GAMEOVER
// ============================
function bumpInfluence(amount){
  if (gameOver) return;
  influence = clamp(influence + amount, 0, 100);
  el.corruptFill.style.width = `${influence}%`;

  // overlay glitch + shake
  el.glitch.style.opacity = String(Math.min(0.85, influence / 110));
  const amp = influence >= 70 ? 2.0 : influence >= 40 ? 1.0 : 0.4;
  el.panel.style.transform = `translate(${rand(-amp,amp)}px, ${rand(-amp,amp)}px)`;

  // chaos events
  spawnPopup(false);

  if (influence >= 40 && Math.random() < 0.25) disableControlsBriefly(700);
  if (influence >= 55 && Math.random() < 0.22) nudgeGuessButton();
  if (influence >= 60 && Math.random() < 0.12) reorderSymbolTable();

  // si trop haut: verrouille/controle perdu
  if (influence >= 100){
    loseControl();
  }
}

function loseControl(){
  if (gameOver) return;
  gameOver = true;

  el.corruptFill.style.width = "100%";
  el.glitch.style.opacity = "0.92";
  el.phaseTag.textContent = "PERDU";
  el.phaseTag.classList.add("phase--collapse");

  el.status.textContent = "Controle perdu... intrusion totale.";
  el.status.style.color = "rgba(255,140,140,0.95)";

  // spam popups
  for (let i=0; i<7; i++) spawnPopup(true);

  // disable tout
  el.guessBtn.disabled = true;
  el.guessInput.disabled = true;
  el.grid.querySelectorAll("input").forEach(inp => inp.disabled = true);
}

// ============================
// MOT-CLE
// ============================
function checkKeyword(){
  if (gameOver) return;

  const guess = (el.guessInput.value || "").trim().toUpperCase();

  // si pas tout traduit
  if (!isFullyTranslated()){
    // punition si TEMPLE trop tot
    if (guess === KEYWORD){
      el.status.textContent = "Trop tot. La chose ecoute...";
      el.status.style.color = "rgba(255,140,140,0.95)";
      if (!collapseMode) {
        // meme en stable, ca declenche le collapse plus vite
        timeLeft = Math.min(timeLeft, 10);
        el.timer.textContent = formatTime(timeLeft);
      }
      if (!collapseMode) enterCollapseMode();
      bumpInfluence(12);
      spawnPopup(true);
      return;
    }

    el.status.textContent = "Traduction incomplete. Termine d'abord.";
    el.status.style.color = "rgba(255,140,140,0.95)";
    if (collapseMode) bumpInfluence(4);
    return;
  }

  if (guess === KEYWORD){
    // victoire
    el.status.textContent = "Protocole valide ✔ Le lieu a ete nomme.";
    el.status.style.color = "rgba(160,255,190,0.95)";

    // stop chaos
    collapseMode = false;
    influence = 0;
    el.corruptFill.style.width = "0%";
    el.glitch.style.opacity = "0";
    el.panel.style.transform = "translate(0,0)";
    el.phaseTag.textContent = "STABLE";
    el.phaseTag.classList.remove("phase--collapse");

    // supprime popups
    el.popups.querySelectorAll(".popup").forEach(p => p.remove());

    // option: redirect
    // setTimeout(() => window.location.href = "kaijupedia.html", 900);
  } else {
    el.status.textContent = "Mot-cle incorrect.";
    el.status.style.color = "rgba(255,140,140,0.95)";
    if (collapseMode) bumpInfluence(8);
    if (collapseMode) spawnPopup(false);
  }
}

el.guessBtn.addEventListener("click", checkKeyword);
el.guessInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkKeyword();
});

// ============================
// STATUS
// ============================
function updateStatus(){
  if (gameOver) return;

  const total = USED_GLYPHS.length;
  let ok = 0;
  for (const g of USED_GLYPHS) if (locked.has(g)) ok++;

  if (!collapseMode){
    el.status.textContent = `Stabilite OK. Traduction: ${ok}/${total} symboles corrects.`;
    el.status.style.color = "rgba(231,220,199,0.82)";
  } else {
    el.status.textContent = `COLLAPSE. Traduction: ${ok}/${total}. L'interface deraille.`;
    el.status.style.color = "rgba(255,140,140,0.95)";
  }
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
updateStatus();
startTimer();
