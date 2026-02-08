window.addEventListener("DOMContentLoaded", () => {
  // ============================================================
  // CLOSE BUTTON - VIDEO PERDU
  // ============================================================
  const closeBtn = document.querySelector(".winbtn--close");
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Créer un overlay avec la vidéo
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      `;
      
      const video = document.createElement("video");
      video.src = "./assets/PERDU.mp4";
      video.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 8px;
      `;
      video.autoplay = true;
      video.controls = true;
      
      overlay.appendChild(video);
      document.body.appendChild(overlay);
    });
  }

  // ============================================================
  // PARTIE 1 : HP / STABILITÉ
  // ============================================================
  const hpFill = document.getElementById("hpFill");
  const hpText = document.getElementById("hpText");

  function updateHPDisplay() {
    let currentHP = localStorage.getItem("kaijuHP");

    if (currentHP === null) {
      currentHP = 50;
      localStorage.setItem("kaijuHP", "50");
    } else {
      currentHP = parseInt(currentHP, 10);
    }

    currentHP = Math.max(0, Math.min(100, currentHP));

    if (hpFill && hpText) {
      hpFill.style.width = currentHP + "%";
      hpText.textContent = currentHP + "%";

      if (currentHP < 30) {
        hpFill.style.background = "#f00";
        hpFill.style.boxShadow = "0 0 15px #f00";
      } else if (currentHP > 70) {
        hpFill.style.background = "#4f4";
        hpFill.style.boxShadow = "0 0 15px rgba(80,255,80,.35)";
      } else {
        hpFill.style.background = "linear-gradient(90deg, #b64a2a, #f55)";
        hpFill.style.boxShadow = "0 0 12px rgba(182, 74, 42, 0.35)";
      }
    }
  }

  updateHPDisplay();
  window.addEventListener("storage", updateHPDisplay);

  // ============================================================
  // PARTIE 2 : BOUTON QUI FUIT (si présent)
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
  // PARTIE 3 : LIFT (si présent)
  // ============================================================
  const lift = document.getElementById("kaijuLift");
  const cover = document.getElementById("kaijuCover");
  const input = document.getElementById("kaijuWord");
  const go = document.getElementById("kaijuGo");
  const msg = document.getElementById("kaijuMsg");

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
      cover.style.transition =
        "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
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

    function tryWord() {
      const v = input.value.trim().toUpperCase();

      if (v === "K-739") {
        msg.style.color = "#4ff";
        msg.textContent = "ACCÈS AUTORISÉ";
        setTimeout(() => {
          window.location.href = "./mini-jeux/jeu4/index.html";
        }, 800);
        return;
      }

      msg.style.color = "#f55";
      msg.textContent = "REFUSÉ";

      lift.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-5px)" },
          { transform: "translateX(5px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 300 }
      );
      input.value = "";
    }

    go.addEventListener("click", tryWord);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") tryWord();
    });
  }

  const decryptLink = document.getElementById("decryptLink");

if (decryptLink) {
  decryptLink.addEventListener("click", () => {
    // Redirection vers ton mini-jeu de decrypt
    window.location.href = "http://127.0.0.1:5500/mini-jeux/jeu3/decrypt.html";
  });
}

});


  // ============================================================
  // PARTIE 4 : POSSESSION TÉLÉPHONE (safe)
  // ============================================================
  try {
    const phone = document.getElementById("phoneCall");
    const target = document.getElementById("targetimg"); // <- ton image a cet id dans ton HTML
    let running = false;

    if (phone && target) {
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

      function createFakeCursor(x, y) {
        const c = document.createElement("div");
        c.className = "possessed-cursor";
        c.style.left = `${x}px`;
        c.style.top = `${y}px`;
        document.body.appendChild(c);
        return c;
      }

      function animateCursor(cursorEl, from, to, duration = 900) {
        const start = performance.now();

        return new Promise((resolve) => {
          function tick(t) {
            const p = Math.min(1, (t - start) / duration);
            const ease =
              p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

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

        const from = getCenterRect(phone);
        const to = getCenterRect(target);

        document.body.classList.add("possession-lock");
        const shield = createShield();
        const fakeCursor = createFakeCursor(from.x, from.y);

        await new Promise((r) => setTimeout(r, 180));
        await animateCursor(fakeCursor, from, to, 900);

        target.animate(
          [
            { filter: "brightness(1)" },
            { filter: "brightness(1.25)" },
            { filter: "brightness(1)" },
          ],
          { duration: 500, easing: "ease-out" }
        );

        // Ici tu peux déclencher mini-jeu 2 si tu veux :
        // window.location.href = "./mini-jeux/jeu2/xxx.html";

        await new Promise((r) => setTimeout(r, 250));
        fakeCursor.remove();
        shield.remove();
        document.body.classList.remove("possession-lock");

        running = false;
      }

      phone.addEventListener("mouseenter", possessAndGuide);
      phone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") possessAndGuide();
      });
    }
  } catch (e) {
    console.warn("Possession téléphone désactivée :", e);
  }
; // ✅ IMPORTANT : pas de () ici !

// ============================================================
// PARTIE 5 : TITRE CORRIGIBLE + REDIRECTION
// ============================================================
(() => {
  const display = document.getElementById("heroTitleDisplay");
  const input = document.getElementById("heroTitleInput");
  if (!display || !input) return;

  const WRONG = "KAJIUPEDIA";
  const RIGHT = "KAIJUPEDIA";

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
      window.location.href = "./mini-jeux/jeu56.html"; // <- ton mini-jeu
    } else {
      input.classList.add("is-bad");
      input.select();
    }
  }

  display.addEventListener("click", openEdit);
  display.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") openEdit();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") validate();
    if (e.key === "Escape") closeEdit();
  });

  document.addEventListener("click", (e) => {
    const editing = input.style.display === "inline-block";
    if (!editing) return;
    if (e.target === input || e.target === display) return;
    closeEdit();
  });
})();

