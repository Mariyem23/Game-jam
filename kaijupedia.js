window.addEventListener("DOMContentLoaded", () => {
  // ============================================================
  // PARTIE 1 : BOUTON QUI FUIT (Archive)
  // ============================================================
  const btn = document.getElementById("archivesBtn");
  const hero = document.querySelector(".hero");

  if (btn && hero) {
    let timer = null;
    let hasMoved = false;
    const PADDING = 12;

    btn.addEventListener("mouseenter", () => {
      const delays = [40, 90, 140];
      const delay = delays[Math.floor(Math.random() * delays.length)];

      timer = setTimeout(() => {
        const hr = hero.getBoundingClientRect();
        const maxX = hr.width - btn.offsetWidth - PADDING * 2;
        const maxY = hr.height - btn.offsetHeight - PADDING * 2;

        if (maxX <= 0 || maxY <= 0) return;

        const x = PADDING + Math.random() * maxX;
        const y = PADDING + Math.random() * maxY;

        if (!hasMoved) {
          btn.style.bottom = "auto";
          hasMoved = true;
        }

        btn.style.left = x + "px";
        btn.style.top = y + "px";
        btn.style.transform = "none";
      }, delay);
    });

    btn.addEventListener("mouseleave", () => clearTimeout(timer));
  }

  // ============================================================
  // PARTIE 2 : LE SYSTÈME "LIFT" (Soulever l'image)
  // ============================================================
  const lift = document.getElementById("kaijuLift");
  const cover = document.getElementById("kaijuCover");
  const input = document.getElementById("kaijuWord");
  const go = document.getElementById("kaijuGo");
  const msg = document.getElementById("kaijuMsg");

  // Si les éléments n'existent pas sur la page, on arrête ici pour éviter les erreurs
  if (!lift || !cover || !input || !go || !msg) return;

  let dragging = false;
  let startY = 0;
  let current = 0;
  let unlocked = false;

  // Calculer combien on peut soulever (environ 70% de la hauteur)
  function maxLiftPx() {
    return Math.floor(lift.offsetHeight * 0.75);
  }

  function setCover(y) {
    current = y;
    cover.style.transform = `translateY(${y}px)`;
  }

  function unlock() {
    unlocked = true;
    lift.classList.add("is-unlocked");
    setCover(-maxLiftPx()); // On bloque l'image en haut
    cover.style.cursor = "default";
    input.focus(); // On met le curseur dans la case texte
    msg.textContent = "";
  }

  function onDown(clientY) {
    if (unlocked) return;
    dragging = true;
    // On calcule la position de la souris par rapport à l'image
    startY = clientY - current;
    cover.style.transition = "none"; // On enlève l'animation pour que ça suive la souris instantanément
  }

  function onMove(clientY) {
    if (!dragging || unlocked) return;

    const maxLift = maxLiftPx();
    let y = clientY - startY;

    // On limite le mouvement : pas plus bas que 0, pas plus haut que maxLift
    y = Math.min(0, Math.max(-maxLift, y));
    setCover(y);

    // Si on a soulevé à plus de 60%, ça se débloque tout seul
    const progress = Math.abs(y) / maxLift;
    if (progress >= 0.60) unlock();
  }

  function onUp() {
    if (!dragging) return;
    dragging = false;
    cover.style.transition = "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"; // Effet rebond

    if (!unlocked) {
      setCover(0); // Si on lâche trop tôt, ça redescend
    }
  }

  // --- Événements Souris & Tactile ---
  cover.addEventListener("pointerdown", (e) => {
    e.preventDefault(); // Empêche de sélectionner l'image
    cover.setPointerCapture(e.pointerId);
    onDown(e.clientY);
  });

  cover.addEventListener("pointermove", (e) => {
    if (dragging) e.preventDefault();
    onMove(e.clientY);
  });

  cover.addEventListener("pointerup", onUp);
  cover.addEventListener("pointercancel", onUp);

  // --- Vérification du Mot de Passe ---
  // --- Vérification du Mot de Passe ---
  function tryWord() {
    // On nettoie l'entrée et on met tout en majuscules pour comparer (plus facile)
    const v = input.value.trim().toUpperCase();

    // LE NOUVEAU CODE : K-739
    if (v === "K-739") {
      msg.style.color = "#4ff";
      msg.textContent = "ACCÈS AUTORISÉ";
      
      // Redirection vers la page rituel
      // D'après ton image, le chemin est : mini-jeux -> jeu1 -> rituel.html
      setTimeout(() => {
        window.location.href = "./mini-jeux/jeu1/rituel.html";
      }, 800);
      return;
    }

    // Mot de passe faux
    msg.style.color = "#f55";
    msg.textContent = "REFUSÉ";
    
    // Petite animation de secousse
    lift.animate([
      { transform: "translateX(0)" },
      { transform: "translateX(-5px)" },
      { transform: "translateX(5px)" },
      { transform: "translateX(0)" }
    ], { duration: 300 });
    
    input.value = "";
  }

  go.addEventListener("click", tryWord);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryWord();
  });
});
(() => {
  const phone = document.getElementById("phoneCall");
  const target = document.getElementById("targetimg");

  if (!phone || !target) return;

  let running = false;

  function getCenterRect(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function createShield() {
    const shield = document.createElement("div");
    shield.className = "possession-shield";
    document.body.appendChild(shield);
    return shield;
  }

  function createFakeCursor(startX, startY) {
    const c = document.createElement("div");
    c.className = "possessed-cursor";
    c.style.left = `${startX}px`;
    c.style.top = `${startY}px`;
    document.body.appendChild(c);
    return c;
  }

  function animateCursor(cursorEl, from, to, duration = 900) {
    const start = performance.now();

    return new Promise((resolve) => {
      function tick(t) {
        const p = Math.min(1, (t - start) / duration);

        // easing smooth (easeInOut)
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

        const x = from.x + (to.x - from.x) * ease;
        const y = from.y + (to.y - from.y) * ease;

        cursorEl.style.left = `${x}px`;
        cursorEl.style.top = `${y}px`;

        if (p < 1) requestAnimationFrame(tick);
        else resolve();
      }
      requestAnimationFrame(tick);
    });
  }

  async function possessAndGuide() {
    if (running) return;
    running = true;

    // position de départ = centre du téléphone
    const from = getCenterRect(phone);
    const to = getCenterRect(target);

    document.body.classList.add("possession-lock");

    const shield = createShield();        // bloque les clics
    const fakeCursor = createFakeCursor(from.x, from.y);

    // petit délai “prise de contrôle”
    await new Promise((r) => setTimeout(r, 180));

    // animation vers l’image cible
    await animateCursor(fakeCursor, from, to, 900);

    // effet final sur l’image (flash léger)
    target.animate(
      [{ filter: "brightness(1)" }, { filter: "brightness(1.25)" }, { filter: "brightness(1)" }],
      { duration: 500, easing: "ease-out" }
    );

    // OPTION : déclencher ton mini-jeu ici (rediriger)
    // window.location.href = "mini_jeu2.html";

    // cleanup
    await new Promise((r) => setTimeout(r, 250));
    fakeCursor.remove();
    shield.remove();
    document.body.classList.remove("possession-lock");

    running = false;
  }

  // Déclenchement au survol
  phone.addEventListener("mouseenter", possessAndGuide);

  // Bonus : déclenchement au clavier (accessibilité)
  phone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") possessAndGuide();
  });
})();
