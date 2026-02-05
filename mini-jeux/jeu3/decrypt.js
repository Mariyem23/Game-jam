// ============================
// CONFIGURATION DU JEU
// ============================
const KEYWORD = "TEMPLE";

// Liens de redirection
const WIN_URL = "../../kaijupedia4.html";    // Page suivante
const LOSE_URL = "../../kaijupedia3.html";   // Page précédente (retour)

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
let timerInterval = null;

// ============================
// DOM
// ============================
const el = {
  cipher: document.getElementById("cipherText"), // Si tu as cet ID dans le HTML
  plain: document.getElementById("plainText"),   // La zone de traduction
  grid: document.getElementById("mapGrid"),
  status: document.getElementById("statusLine"),
  guessInput: document.getElementById("guessInput"),
  guessBtn: document.getElementById("guessBtn"),
  glitch: document.getElementById("glitchLayer"),
  abandonBtn: document.getElementById("abandonBtn"),
  // Si tu as un timer affiché quelque part (optionnel)
  timerDisplay: document.getElementById("timerDisplay") 
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
const current = new Map(); // glyph -> lettre saisie
const locked = new Set();  // glyphes verrouilles

// ============================
// GESTION BARRE DE VIE (HP) - NOUVEAU
// ============================
function updateGlobalHP(amount) {
  // 1. Récupérer la valeur actuelle
  let currentHP = parseInt(localStorage.getItem("kaijuHP") || "50");

  // 2. Appliquer le changement
  currentHP += amount;

  // 3. Bornes (0 à 100)
  currentHP = Math.min(100, Math.max(0, currentHP));

  // 4. Sauvegarder
  localStorage.setItem("kaijuHP", currentHP);
  
  console.log(`HP mis à jour : ${amount > 0 ? '+' : ''}${amount}% (Total: ${currentHP}%)`);
}

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
// UI: TABLE DES SYMBOLES
// ============================
function buildGrid(){
  if(!el.grid) return;
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
        return;
      }

      // A-Z only
      if (v < "A" || v > "Z") {
        input.classList.add("bad");
        current.set(g, v);
        renderPlain();
        updateItemState(item, g);
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
    if (mark) mark.textContent = "✓";
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

  // si faux => rouge
  if (v !== correct) {
    inp.classList.add("bad");
    if (mark) mark.textContent = "";
  } else {
    inp.classList.remove("bad");
    if (mark) mark.textContent = "✓";
  }
}

// ============================
// TRADUCTION LIVE
// ============================
function renderPlain(){
  if(!el.plain) return;
  
  let out = "";
  for (const ch of CIPHERTEXT){
    if (glyphValues.includes(ch)){
      const repl = current.get(ch);
      out += repl ? repl : "•";
    } else {
      out += ch;
    }
  }
  
  el.plain.textContent = out;
}

// ============================
// TIMER & FINS DE JEU
// ============================
function startTimer(){
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    if (gameOver) return;

    timeLeft = Math.max(0, timeLeft - 1);
    
    // Si tu as un élément pour afficher le temps
    if(el.timerDisplay) {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        el.timerDisplay.innerText = `${m}:${s}`;
    }

    if (timeLeft <= 0){
      endGame("lose", "Temps écoulé… retour aux archives.");
    }
  }, 1000);
}

function normalizeGuess(s){
  return (s || "").toUpperCase().trim().replace(/\s+/g, "");
}

function checkKeyword(){
  if (gameOver) return;

  const guess = normalizeGuess(el.guessInput.value);
  const target = normalizeGuess(KEYWORD);

  // VICTOIRE
  if (guess === target){
    endGame("win", "Protocole valide ✔ Accès autorisé.");
    return;
  }

  // Erreur
  el.status.textContent = "Mot-cle incorrect.";
  el.status.style.color = "rgba(255,140,140,0.95)";
  el.guessInput.classList.add("error");
  setTimeout(() => el.guessInput.classList.remove("error"), 500);
}

// ============================
// FONCTION CENTRALE DE FIN
// ============================
function endGame(type, message) {
    gameOver = true;
    clearInterval(timerInterval);
    
    el.status.textContent = message;

    if (type === "win") {
        // GAGNE : +5% -> Page 4
        updateGlobalHP(5);
        el.status.style.color = "rgba(160,255,190,0.95)";
        if(el.glitch) el.glitch.style.opacity = "0";
        
        setTimeout(() => {
            window.location.href = WIN_URL;
        }, 1500);

    } else if (type === "lose") {
        // PERDU (Temps) : -10% -> Page 3
        updateGlobalHP(-10);
        el.status.style.color = "rgba(255,140,140,0.95)";
        if(el.glitch) el.glitch.style.opacity = "0.5";

        setTimeout(() => {
             window.location.href = LOSE_URL;
        }, 1500);

    } else if (type === "abandon") {
        // ABANDON : -15% -> Page 3
        updateGlobalHP(-15);
        window.location.href = LOSE_URL;
    }
}


// ============================
// EVENTS
// ============================
if(el.guessBtn) el.guessBtn.addEventListener("click", checkKeyword);
if(el.guessInput) {
    el.guessInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkKeyword();
    });
}

if(el.abandonBtn){
  el.abandonBtn.addEventListener("click", () => {
    if(confirm("Abandonner ? Stabilité -15%.")) {
        endGame("abandon", "Abandon du protocole.");
    }
  });
}

function updateStatus(){
  if (gameOver) return;
  const total = USED_GLYPHS.length;
  let ok = 0;
  for (const g of USED_GLYPHS) if (locked.has(g)) ok++;
  el.status.textContent = `Traduction: ${ok}/${total} symboles.`;
}

// ============================
// INIT
// ============================
// Affichage initial du texte codé si nécessaire, ou juste setup
if(el.cipher) el.cipher.textContent = CIPHERTEXT;

buildGrid();
renderPlain();
updateStatus();
startTimer();
console.log("Système de décryptage prêt.");