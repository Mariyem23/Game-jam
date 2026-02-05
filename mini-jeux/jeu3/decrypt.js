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
// TIMER (10 MINUTES)
// ============================
const STABLE_TIME_SEC = 600; // 10:00
let timeLeft = STABLE_TIME_SEC;

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
  panel: document.getElementById("panel"),
  phaseTag: document.getElementById("phaseTag"),
  abandonBtn: document.getElementById("abandonBtn"),
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
  for (const g of USED_GLYPHS){
    if (!locked.has(g)) return false;
  }
  return true;
}

function escapeHtml(s){
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

// ============================
// TIMER: 10:00 -> REDIRECT
// ============================
function formatTime(s){
  const m = Math.floor(s/60);
  const r = s % 60;
  return `${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`;
}

function endAndRedirect(reason){
  if (gameOver) return;
  gameOver = true;

  el.phaseTag.textContent = "FIN";
  el.status.textContent = reason || "Fin.";
  el.status.style.color = "rgba(255,140,140,0.95)";

  // petit glitch visuel OK, mais pas de popups
  el.glitch.style.opacity = "0.35";

  setTimeout(() => {
    window.location.href = "kaijupedia.html";
  }, 700);
}

function startTimer(){
  el.timer.textContent = formatTime(timeLeft);

  setInterval(() => {
    if (gameOver) return;

    timeLeft = Math.max(0, timeLeft - 1);
    el.timer.textContent = formatTime(timeLeft);

    if (timeLeft <= 0){
      endAndRedirect("Temps écoulé… retour aux archives.");
    }
  }, 1000);
}

// ============================
// MOT-CLE
// (fix: accepte aussi si l'utilisateur tape avec espaces)
// + victoire => redirect kaijupedia
// ============================
function normalizeGuess(s){
  return (s || "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ""); // enlève espaces
}

function checkKeyword(){
  if (gameOver) return;

  const guess = normalizeGuess(el.guessInput.value);
  const target = normalizeGuess(KEYWORD);

  // Ici: tu veux que TEMPLE marche vraiment => on valide le mot-cle
  // même si la traduction n'est pas 100% finie (sinon ça frustre).
  if (guess === target){
    el.status.textContent = "Protocole valide ✔ Retour aux archives…";
    el.status.style.color = "rgba(160,255,190,0.95)";

    el.glitch.style.opacity = "0";
    setTimeout(() => {
      window.location.href = "kaijupedia.html";
    }, 700);
    return;
  }

  el.status.textContent = "Mot-cle incorrect.";
  el.status.style.color = "rgba(255,140,140,0.95)";
}

el.guessBtn.addEventListener("click", checkKeyword);
el.guessInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkKeyword();
});

// ============================
// ABANDONNER (-15% progression)
// ============================
function applyProgressPenalty(percent){
  const p = Number(percent) || 0;

  // On supporte plusieurs clés au cas où tu changes plus tard
  const keys = ["kaiju_progress", "kaijuProgress", "progress"];
  let foundKey = null;
  let value = null;

  for (const k of keys){
    const raw = localStorage.getItem(k);
    if (raw !== null && raw !== "" && !Number.isNaN(Number(raw))){
      foundKey = k;
      value = Number(raw);
      break;
    }
  }

  // si rien n'existe, on part de 100 (ou 0 si tu préfères)
  if (value === null) {
    foundKey = "kaiju_progress";
    value = 100;
  }

  const next = Math.max(0, value - p);
  localStorage.setItem(foundKey, String(next));

  // trace optionnelle
  localStorage.setItem("kaiju_lastPenalty", String(p));
}

if (el.abandonBtn){
  el.abandonBtn.addEventListener("click", () => {
    applyProgressPenalty(15);
    window.location.href = "kaijupedia.html";
  });
}

// ============================
// STATUS
// ============================
function updateStatus(){
  if (gameOver) return;

  const total = USED_GLYPHS.length;
  let ok = 0;
  for (const g of USED_GLYPHS) if (locked.has(g)) ok++;

  el.status.textContent = `Stabilité OK. Traduction: ${ok}/${total} symboles corrects. Mot-cle attendu: ${KEYWORD}`;
  el.status.style.color = "rgba(231,220,199,0.82)";
}

// ============================
// INIT
// ============================
el.cipher.textContent = CIPHERTEXT;
buildGrid();
renderPlain();
updateStatus();
startTimer();
