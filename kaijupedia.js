window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("archivesBtn");
  const hero = document.querySelector(".hero"); // la section de déplacement
  if (!btn || !hero) return;

  let timer = null;
  let hasMoved = false;
  const PADDING = 12;

  btn.addEventListener("mouseenter", () => {
    const delays = [40, 90, 140];
    const delay = delays[Math.floor(Math.random() * delays.length)];

    timer = setTimeout(() => {
      const hr = hero.getBoundingClientRect();

      // tailles dispo DANS la hero
      const maxX = hr.width - btn.offsetWidth - PADDING * 2;
      const maxY = hr.height - btn.offsetHeight - PADDING * 2;

      if (maxX <= 0 || maxY <= 0) return;

      const x = PADDING + Math.random() * maxX;
      const y = PADDING + Math.random() * maxY;

      // après le 1er move, on abandonne bottom
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
});
