window.addEventListener("DOMContentLoaded", () => {
  // ============================================================
  // PARTIE 1 : SYSTÈME DE HP / STABILITÉ (PRIORITAIRE)
  // (Doit marcher sur TOUTES les pages)
  // ============================================================
  const hpFill = document.getElementById("hpFill");
  const hpText = document.getElementById("hpText");

  function updateHPDisplay() {
    // 1. On récupère la valeur stockée (ou 50 par défaut)
    let currentHP = localStorage.getItem("kaijuHP");
    
    if (currentHP === null) {
      currentHP = 50;
      localStorage.setItem("kaijuHP", 50);
    } else {
      currentHP = parseInt(currentHP);
    }

    // 2. Sécuriser les limites (0 à 100)
    currentHP = Math.max(0, Math.min(100, currentHP));

    // 3. Mettre à jour l'affichage
    if (hpFill && hpText) {
      hpFill.style.width = currentHP + "%";
      hpText.textContent = currentHP + "%";
      
      // Changer la couleur selon la santé
      if (currentHP < 30) {
        hpFill.style.background = "#f00"; // Rouge critique
        hpFill.style.boxShadow = "0 0 15px #f00";
      } else if (currentHP > 70) {
        hpFill.style.background = "#4f4"; // Vert sain
      } else {
        hpFill.style.background = "linear-gradient(90deg, #b64a2a, #f55)"; // Normal
      }
    }
  }

  // Lancer l'affichage immédiatement
  updateHPDisplay();

  // Écouter les changements (si tu joues dans un autre onglet)
  window.addEventListener("storage", updateHPDisplay);


  // ============================================================
  // PARTIE 2 : BOUTON QUI FUIT (Pour la page d'accueil)
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
  // PARTIE 3 : LE SYSTÈME "LIFT" (Pour kaijupedia 1 et 2)
  // ============================================================
  const lift = document.getElementById("kaijuLift");
  const cover = document.getElementById("kaijuCover");
  const input = document.getElementById("kaijuWord");
  const go = document.getElementById("kaijuGo");
  const msg = document.getElementById("kaijuMsg");

  // On vérifie si le module existe. S'il n'existe pas, ON N'ARRÊTE PAS LE SCRIPT (pour que HP marche)
  if (lift && cover && input && go && msg) {
    
    let dragging = false;
    let startY = 0;
    let current = 0;
    let unlocked = false;

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
      setCover(-maxLiftPx());
      cover.style.cursor = "default";
      input.focus();
      msg.textContent = "";
    }

    function onDown(clientY) {
      if (unlocked) return;
      dragging = true;
      startY = clientY - current;
      cover.style.transition = "none";
    }

    function onMove(clientY) {
      if (!dragging || unlocked) return;
      const maxLift = maxLiftPx();
      let y = clientY - startY;
      y = Math.min(0, Math.max(-maxLift, y));
      setCover(y);
      if (Math.abs(y) / maxLift >= 0.60) unlock();
    }

    function onUp() {
      if (!dragging) return;
      dragging = false;
      cover.style.transition = "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
      if (!unlocked) setCover(0);
    }

    cover.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      cover.setPointerCapture(e.pointerId);
      onDown(e.clientY);
    });

    cover.addEventListener("pointermove", (e) => {
      if (dragging) e.preventDefault();
      onMove(e.clientY);
    });

    cover.addEventListener("pointerup", onUp);
    cover.addEventListener("pointercancel", onUp);

    // LOGIQUE DU MOT DE PASSE (MODIFIÉE POUR ACCEPTER K-739)
    function tryWord() {
      const v = input.value.trim().toUpperCase();

      // CODE POUR KAIJUPEDIA 1 -> K-739
      if (v === "K-739") {
        msg.style.color = "#4ff";
        msg.textContent = "ACCÈS AUTORISÉ";
        setTimeout(() => {
          // Vers le jeu RITUEL
          window.location.href = "./mini-jeux/jeu1/rituel.html";
        }, 800);
        return;
      }

      msg.style.color = "#f55";
      msg.textContent = "REFUSÉ";
      
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
  }
<<<<<<< HEAD

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

(() => {
  const display = document.getElementById("heroTitleDisplay");
  const input = document.getElementById("heroTitleInput");
  if (!display || !input) return;

  const WRONG = "KAJIUPEDIA";
  const RIGHT = "KAIJUPEDIA";

  // état initial : mal écrit
  display.textContent = WRONG;

  const normalize = (s) => (s || "").trim().toUpperCase();

  function openEdit() {
    display.style.display = "none";
    input.style.display = "inline-block";
    input.classList.remove("is-bad");
    input.value = "";
    input.focus();
  }

  function closeEdit() {
    input.style.display = "none";
    display.style.display = "inline";
  }

  function validate() {
    const v = normalize(input.value);

    if (v === RIGHT) {
      display.textContent = RIGHT;
      closeEdit();

      // ✅ ICI tu peux déclencher un truc (optionnel) :
      // window.location.href = "mini_jeu2.html";
      // ou jouer un son / ajouter une classe / etc.
      display.classList.add("is-fixed");
      window.location.href = "./mini-jeux/jeu56.html";

    } else {
      input.classList.add("is-bad");
      input.select();
    }
  }

  // Click / clavier sur le titre
  display.addEventListener("click", openEdit);
  display.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") openEdit();
  });

  // Validation dans l’input
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") validate();
    if (e.key === "Escape") closeEdit();
  });

  // Si on clique ailleurs : fermer
  document.addEventListener("click", (e) => {
    const editing = input.style.display === "inline-block";
    if (!editing) return;
    if (e.target === input || e.target === display) return;
    closeEdit();
  });
})();
=======
});
>>>>>>> 1bb4e41c29e0b37afc2eedab88302e6147a28d3d
