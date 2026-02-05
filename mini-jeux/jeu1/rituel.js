class RituelScene extends Phaser.Scene {
  constructor() {
    super("Rituel");

    // gameplay tuning
    this.maxStability = 4;      // erreurs max
    this.integrity = 100;       // vie kaiju (visuel)
    this.phase = 1;

    // phase 1
    this.glyphCount = 7;
    this.seqLength = 5;

    // phase 2
    this.holdDuration = 2400;   // ms à tenir appuyé

    // phase 3
    this.sealsToClick = 5;
  }


  create() {
  console.log("Kaiju loaded:", this.textures.exists("kaiju_front"));

    const { width, height } = this.scale;

    this.stability = this.maxStability;
    this.integrity = 100;
    this.phase = 1;

    // ===== BACKGROUND =====
    this.bg = this.add.rectangle(0, 0, width, height, 0x05050a).setOrigin(0);

    // léger halo
    this.halo = this.add.circle(width * 0.55, height * 0.45, Math.min(width, height) * 0.35, 0x7a1b1b, 0.10);

    // ===== UI =====
    this.uiTop = this.add.container(0, 0);

    this.title = this.add.text(18, 16, "PROCÉDURE INTERDITE — RITUEL DE RÉDUCTION", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "rgba(255,255,255,0.85)",
    });

    this.phaseLabel = this.add.text(18, 38, "", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "rgba(255,220,220,0.85)",
    });

    this.stats = this.add.text(18, 60, "", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "rgba(255,255,255,0.65)",
    });

    this.message = this.add.text(width / 2, height - 60, "", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "rgba(255,255,255,0.8)",
      align: "center",
    }).setOrigin(0.5);

    this.uiTop.add([this.title, this.phaseLabel, this.stats]);

    // ===== CENTRAL RITUAL =====
    this.center = new Phaser.Math.Vector2(width / 2, height / 2 + 10);

    this.ritual = this.add.container(this.center.x, this.center.y);

    this.ringGfx = this.add.graphics();
    this.drawRings();

    this.ritual.add(this.ringGfx);

    // ===== KAIJU SILHOUETTE =====
    this.kaiju = this.add.sprite(
  this.center.x,
  this.center.y,
  "kaiju_front"
);

this.kaiju.setOrigin(0.5, 0.5);
this.kaiju.setScale(0.6);
this.kaiju.setAlpha(0.85);
this.kaiju.setDepth(-1); // derrière les glyphes


    this.tweens.add({
  targets: this.kaiju,
  scale: { from: 0.62, to: 0.58 },
  duration: 2200,
  yoyo: true,
  repeat: -1,
  ease: "Sine.easeInOut",
});



    // ===== PHASE CONTAINER (change selon phase) =====
    this.phaseLayer = this.add.container(0, 0);

    // input global
    this.input.setTopOnly(true);

    // start phase 1
    this.startPhase1();

    // resize
    this.scale.on("resize", this.onResize, this);
    this.onResize({ width, height });
  }

  // ---------------------------
  // DRAW HELPERS
  // ---------------------------
  drawRings() {
    const { width, height } = this.scale;
    const r = Math.min(width, height) * 0.22;

    this.ringGfx.clear();

    // outer ring
    this.ringGfx.lineStyle(3, 0xffd0d0, 0.12);
    this.ringGfx.strokeCircle(0, 0, r);

    // inner ring
    this.ringGfx.lineStyle(2, 0xffffff, 0.06);
    this.ringGfx.strokeCircle(0, 0, r * 0.72);

    // small ticks
    this.ringGfx.lineStyle(2, 0xffb0b0, 0.10);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const x1 = Math.cos(a) * (r * 0.82);
      const y1 = Math.sin(a) * (r * 0.82);
      const x2 = Math.cos(a) * (r * 0.92);
      const y2 = Math.sin(a) * (r * 0.92);
      this.ringGfx.lineBetween(x1, y1, x2, y2);
    }

    // soft fill
    this.ringGfx.fillStyle(0x000000, 0.18);
    this.ringGfx.fillCircle(0, 0, r * 0.68);
  }

 drawKaiju() {
  this.kaijuGfx.clear();

  const alpha = 0.45;

  // masse centrale
  this.kaijuGfx.fillStyle(0x000000, alpha);
  this.kaijuGfx.fillCircle(0, 0, 140);

  // extensions organiques (irrégulier)
  this.kaijuGfx.fillCircle(-90, -40, 80);
  this.kaijuGfx.fillCircle(110, -20, 70);
  this.kaijuGfx.fillCircle(-40, 110, 75);

  // aura interne
  this.kaijuGfx.fillStyle(0x110000, 0.25);
  this.kaijuGfx.fillCircle(0, 0, 160);

  // contour instable
  this.kaijuGfx.lineStyle(3, 0x8c2f1f, 0.25);
  this.kaijuGfx.strokeCircle(0, 0, 150);
}



  updateStats() {
    this.phaseLabel.setText(
      this.phase === 1 ? "PHASE 1 — INVOCATION" :
      this.phase === 2 ? "PHASE 2 — LIEN" :
      "PHASE 3 — EFFACEMENT"
    );

    this.stats.setText(
      `INTÉGRITÉ ENTITÉ : ${Math.max(0, Math.round(this.integrity))}%   |   STABILITÉ PORTAIL : ${this.stability}/${this.maxStability}`
    );
  }

  setMessage(t) {
    this.message.setText(t || "");
  }

  // ---------------------------
  // GLOBAL HIT / FAIL
  // ---------------------------
  applySuccess(integrityLoss) {
    this.integrity = Math.max(0, this.integrity - integrityLoss);

    const targetScale = Phaser.Math.Clamp(this.integrity / 100, 0.02, 1);
    this.tweens.add({
      targets: this.kaiju,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 350,
      ease: "Sine.easeOut",
    });

    this.cameras.main.flash(80, 255, 220, 220);

    this.updateStats();
  }

  applyFail() {
    this.stability -= 1;
    this.cameras.main.shake(140, 0.008);

    this.updateStats();

    if (this.stability <= 0) {
      this.gameOver();
      return true;
    }
    return false;
  }

  clearPhaseLayer() {
    this.phaseLayer.removeAll(true);
  }

  // ---------------------------
  // PHASE 1 — INVOCATION
  // ---------------------------
  startPhase1() {
    this.phase = 1;
    this.clearPhaseLayer();
    this.updateStats();

    this.setMessage("Mémorisez la séquence… puis cliquez les glyphes dans l’ordre.");

    // glyphs around circle
    const { width, height } = this.scale;
    const r = Math.min(width, height) * 0.22;

    // runic-ish symbols
    this.glyphChars = ["ᚠ", "ᚢ", "ᚦ", "ᚱ", "ᚺ", "ᛇ", "ᛟ", "ᛉ", "ᚾ", "ᛞ"];
    Phaser.Utils.Array.Shuffle(this.glyphChars);
    const chosen = this.glyphChars.slice(0, this.glyphCount);

    this.glyphs = [];
    for (let i = 0; i < this.glyphCount; i++) {
      const a = (i / this.glyphCount) * Math.PI * 2 - Math.PI / 2;
      const x = this.center.x + Math.cos(a) * (r * 1.05);
      const y = this.center.y + Math.sin(a) * (r * 1.05);

      const t = this.add.text(x, y, chosen[i], {
        fontFamily: "Arial",
        fontSize: "64px",
        color: "rgba(255,220,220,0.85)",
      }).setOrigin(0.5);

      // “pastille”
      const bg = this.add.circle(x, y, 52, 0x000000, 0.45)
  .setStrokeStyle(3, 0x8c2f1f, 0.25);


const hit = this.add.circle(x, y, 70, 0xffffff, 0.001)
  .setDepth(10)
  .setInteractive({ useHandCursor: true });

      this.phaseLayer.add([bg, t, hit]);

      this.glyphs.push({ char: chosen[i], text: t, bg, hit });
    }

    // build sequence (chars)
    this.sequence = [];
    const pool = chosen.slice();
    for (let k = 0; k < this.seqLength; k++) {
      this.sequence.push(Phaser.Utils.Array.GetRandom(pool));
    }

    this.seqIndex = 0;

    // show sequence by flashing glyphs
    this.input.enabled = false;
    this.playSequenceFlash(() => {
      this.input.enabled = true;
      this.setMessage("Cliquez la séquence.");
      this.bindPhase1Clicks();
    });
  }
playSequenceFlash(done) {
    const flashes = [];
    const getGlyphByChar = (c) => this.glyphs.find(g => g.char === c);

    let delay = 0;
    
    // On calcule la durée totale pour savoir quand rendre la main au joueur
    this.sequence.forEach((c, idx) => {
      const g = getGlyphByChar(c);
      
      // On ajoute l'animation
      flashes.push(this.time.delayedCall(delay, () => {
        if (!g) return;

        this.tweens.add({
          targets: [g.text, g.bg],
          alpha: { from: 1, to: 0.35 },
          duration: 140,
          yoyo: true,
          repeat: 2,
        });

        // mini flash sur le cercle
        this.cameras.main.flash(35, 120, 20, 20);
      }));
      
      // On incrémente le délai pour la prochaine lettre
      delay += 900;
    });

    this.setMessage("…");

    // === C'EST ICI QU'IL MANQUAIT LE CODE ===
    // On attend la fin du dernier délai + un petit temps de pause (ex: 800ms)
    // pour appeler "done" et rendre la main au joueur.
    this.time.delayedCall(delay, () => {
        this.setMessage("Répétez la séquence.");
        if (done) done(); // <--- CA C'EST CRUCIAL !
    });
  }

  bindPhase1Clicks() {
    const getGlyphByChar = (c) => this.glyphs.find(g => g.char === c);

    this.glyphs.forEach((g) => {
      g.hit.removeAllListeners();

      g.hit.on("pointerdown", () => {
        if (this.phase !== 1) return;

        const expected = this.sequence[this.seqIndex];

        // feedback click
        this.tweens.add({
  targets: [g.text, g.bg],
  alpha: { from: 0.15, to: 1 },
  scale: { from: 1.3, to: 1 },
  duration: 600,
  yoyo: true,
  repeat: 0,
  ease: "Sine.easeInOut",
});


        if (g.char !== expected) {
          const dead = this.applyFail();
          this.setMessage(dead ? "RUPTURE — le portail cède." : "Erreur… reprise de séquence.");
          if (!dead) {
            this.seqIndex = 0;
          }
          return;
        }

        // correct
        this.seqIndex += 1;
        this.setMessage(`Séquence : ${this.seqIndex}/${this.seqLength}`);

        if (this.seqIndex >= this.seqLength) {
          this.applySuccess(30); // 100 -> 70
          this.setMessage("VERROUILLAGE ÉTABLI ✔");
          this.input.enabled = false;

          this.time.delayedCall(700, () => {
            this.input.enabled = true;
            this.startPhase2();
          });
        }
      });
    });
  }

  // ---------------------------
  // PHASE 2 — LIEN (HOLD)
  // ---------------------------
  startPhase2() {
    this.phase = 2;
    this.clearPhaseLayer();
    this.updateStats();

    this.setMessage("Maintenez le sigil pour consolider le lien…");

    const { width, height } = this.scale;

    // big sigil in center
    const sigilR = Math.min(width, height) * 0.10;

    const sigilBg = this.add.circle(this.center.x, this.center.y, sigilR + 22, 0x000000, 0.35)
      .setStrokeStyle(2, 0xffc0c0, 0.12);
    const sigil = this.add.circle(this.center.x, this.center.y, sigilR, 0x140005, 0.55)
      .setStrokeStyle(3, 0xffd0d0, 0.10);

    const sigilText = this.add.text(this.center.x, this.center.y, "⟁", {
      fontFamily: "Arial",
      fontSize: `${Math.round(sigilR)}px`,
      color: "rgba(255,220,220,0.75)",
    }).setOrigin(0.5);

    // progress ring
    const prog = this.add.graphics();
    const drawProgress = (p) => {
      prog.clear();
      prog.lineStyle(6, 0xffb3b3, 0.18);
      prog.beginPath();
      prog.arc(this.center.x, this.center.y, sigilR + 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p, false);
      prog.strokePath();
    };
    drawProgress(0);

    // interactive area
    const hit = this.add.circle(this.center.x, this.center.y, sigilR + 26, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });

    this.phaseLayer.add([sigilBg, sigil, sigilText, prog, hit]);

    // ambient pulse
    this.tweens.add({
      targets: [sigilBg, sigil],
      alpha: { from: 0.55, to: 0.30 },
      duration: 420,
      yoyo: true,
      repeat: -1,
    });

    // hold logic
    this.holding = false;
    this.holdStart = 0;

    const stopHold = (failed) => {
      if (!this.holding) return;
      this.holding = false;

      // cancel ticks
      if (this.holdTick) this.holdTick.remove(false);
      this.holdTick = null;

      if (failed) {
        const dead = this.applyFail();
        this.setMessage(dead ? "RUPTURE — le portail cède." : "Lâché trop tôt… recommence.");
        drawProgress(0);
      }
    };

    hit.on("pointerdown", () => {
      if (this.phase !== 2 || this.holding) return;

      this.holding = true;
      this.holdStart = this.time.now;
      this.setMessage("Ne relâchez pas.");

      // jitter “kaiju se débat”
      this.tweens.add({
        targets: this.kaiju,
        x: { from: this.center.x - 3, to: this.center.x + 3 },
        y: { from: this.center.y - 2, to: this.center.y + 2 },
        duration: 60,
        yoyo: true,
        repeat: 18,
      });

      this.holdTick = this.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          if (!this.holding) return;
          const elapsed = this.time.now - this.holdStart;
          const p = Phaser.Math.Clamp(elapsed / this.holdDuration, 0, 1);
          drawProgress(p);

          // small screen noise
          if (Phaser.Math.Between(0, 100) > 94) {
            this.cameras.main.shake(40, 0.002);
          }

          if (p >= 1) {
            // success
            this.holding = false;
            if (this.holdTick) this.holdTick.remove(false);
            this.holdTick = null;

            this.applySuccess(35); // 70 -> 35
            this.setMessage("LIEN CONSOLIDÉ ✔");
            hit.disableInteractive();

            this.time.delayedCall(700, () => this.startPhase3());
          }
        },
      });
    });

    this.input.on("pointerup", () => {
      if (this.phase !== 2) return;
      // pointerup anywhere counts as release
      stopHold(true);
    });
  }

  // ---------------------------
  // PHASE 3 — EFFACEMENT (SEALS + CONFIRM)
  // ---------------------------
  startPhase3() {
    this.phase = 3;
    this.clearPhaseLayer();
    this.updateStats();

    this.setMessage("Déverrouillez la confirmation : scellez 5 points d’ancrage.");

    const { width, height } = this.scale;

    // panel
    const panelW = Math.min(520, width - 40);
    const panelH = 220;

    const panel = this.add.rectangle(width / 2, height / 2 + 10, panelW, panelH, 0x000000, 0.55)
      .setStrokeStyle(2, 0xffc0c0, 0.14);

    const head = this.add.text(width / 2, height / 2 - 70, "CONFIRMATION D’EFFACEMENT", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "rgba(255,220,220,0.9)",
    }).setOrigin(0.5);

    const sub = this.add.text(width / 2, height / 2 - 45, "PROTOCOLE: OBLIVION // ACCÈS SURVEILLÉ", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "rgba(255,255,255,0.6)",
    }).setOrigin(0.5);

    this.sealCount = 0;

    const sealInfo = this.add.text(width / 2, height / 2 - 10, "", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "rgba(255,255,255,0.75)",
    }).setOrigin(0.5);

    const confirmBtn = this.add.text(width / 2, height / 2 + 70, "CONFIRMER", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "rgba(0,0,0,0.85)",
      backgroundColor: "rgba(255,220,220,0.25)",
      padding: { left: 18, right: 18, top: 10, bottom: 10 },
    }).setOrigin(0.5);

    confirmBtn.setAlpha(0.45);

    const updateSealInfo = () => {
      sealInfo.setText(`SCEAUX : ${this.sealCount}/${this.sealsToClick}`);
      if (this.sealCount >= this.sealsToClick) {
        confirmBtn.setAlpha(1);
        confirmBtn.setStyle({ backgroundColor: "rgba(255,220,220,0.9)" });
        confirmBtn.setInteractive({ useHandCursor: true });
        this.setMessage("Accès déverrouillé. Confirmez l’effacement.");
      }
    };

    updateSealInfo();

    this.phaseLayer.add([panel, head, sub, sealInfo, confirmBtn]);

    // spawn “seals” to click (random points on screen)
    this.spawnSeal = () => {
      if (this.phase !== 3) return;
      if (this.sealCount >= this.sealsToClick) return;

      const x = Phaser.Math.Between(60, width - 60);
      const y = Phaser.Math.Between(120, height - 120);

      const g = this.add.graphics();
      g.lineStyle(2, 0xffb3b3, 0.18);
      g.strokeCircle(0, 0, 18);
      g.lineStyle(2, 0xffb3b3, 0.12);
      g.strokeCircle(0, 0, 10);
      g.lineStyle(2, 0xffb3b3, 0.08);
      g.strokeLineShape(new Phaser.Geom.Line(-12, 0, 12, 0));
      g.strokeLineShape(new Phaser.Geom.Line(0, -12, 0, 12));
      g.setPosition(x, y);

      const hit = this.add.circle(x, y, 26, 0xffffff, 0.001).setInteractive({ useHandCursor: true });

      const kill = () => {
        hit.removeAllListeners();
        hit.destroy();
        g.destroy();
      };

      // pulse
      this.tweens.add({
        targets: g,
        alpha: { from: 1, to: 0.35 },
        duration: 320,
        yoyo: true,
        repeat: -1,
      });

      hit.on("pointerdown", () => {
        if (this.phase !== 3) return;

        this.sealCount++;
        this.cameras.main.flash(60, 255, 220, 220);
        kill();
        updateSealInfo();

        // respawn until done
        if (this.sealCount < this.sealsToClick) {
          this.time.delayedCall(220, () => this.spawnSeal());
        }
      });

      // if player ignores it too long, it relocates (no punition, juste vivant)
      this.time.delayedCall(1800, () => {
        if (!hit.active) return;
        kill();
        this.spawnSeal();
      });
    };

    // start seals
    this.spawnSeal();

    // confirm logic
    confirmBtn.on("pointerdown", () => {
      if (this.phase !== 3) return;
      if (this.sealCount < this.sealsToClick) return;

      confirmBtn.disableInteractive();
      this.setMessage("EFFACEMENT EN COURS… NE DÉTOURNEZ PAS LE REGARD.");
      this.doFinalErase();
    });
  }

  doFinalErase() {
    // big glitchy finale
    this.cameras.main.shake(600, 0.006);
    this.applySuccess(35); // 35 -> 0

    // stop kaiju pulse and shrink to nothing
    this.tweens.add({
      targets: this.kaiju,
      alpha: { from: 1, to: 0 },
      duration: 700,
      ease: "Sine.easeIn",
    });

    this.time.delayedCall(800, () => {
      this.showWin();
    });
  }
  // --- GESTION DE LA BARRE DE VIE GLOBALE (LOCALSTORAGE) ---
  updateGlobalHP(amount) {
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

  showWin() {
    // VICTOIRE : On gagne 5% d'intégrité
    this.updateGlobalHP(5);

    const { width, height } = this.scale;
    this.phaseLayer.removeAll(true);

    this.setMessage("");

    const panel = this.add.rectangle(width / 2, height / 2, Math.min(560, width - 40), 220, 0x000000, 0.62)
      .setStrokeStyle(2, 0xffc0c0, 0.14);

    const t1 = this.add.text(width / 2, height / 2 - 40, "ENTITÉ DÉCLARÉE INEXISTANTE", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "rgba(255,220,220,0.95)",
    }).setOrigin(0.5);

    // J'ai ajouté la mention du bonus ici
    const t2 = this.add.text(width / 2, height / 2 - 10, "TRACE DIMENSIONNELLE : NULLE\nSTABILITÉ SYSTÈME : +5%", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#4ff", // Couleur cyan pour le positif
      align: "center",
    }).setOrigin(0.5);

    const btn = this.add.text(width / 2, height / 2 + 60, "RETOUR AUX ARCHIVES", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "rgba(0,0,0,0.85)",
      backgroundColor: "rgba(255,220,220,0.9)",
      padding: { left: 16, right: 16, top: 10, bottom: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on("pointerdown", () => {
      // Retour vers la page principale (adapte le lien si besoin selon tes dossiers)
      window.location.href = "../../kaijupedia.html"; 
    });

    this.phaseLayer.add([panel, t1, t2, btn]);
  }

  gameOver() {
    // 1. DÉFAITE : On perd 10% d'intégrité (sauvegardé dans le localStorage)
    this.updateGlobalHP(-10);

    const { width, height } = this.scale;
    this.phaseLayer.removeAll(true);

    this.setMessage("");

    // Fond du panneau (rouge sombre)
    const panel = this.add.rectangle(width / 2, height / 2, Math.min(560, width - 40), 220, 0x000000, 0.66)
      .setStrokeStyle(2, 0xff4b4b, 0.20);

    // Titre du message
    const t1 = this.add.text(width / 2, height / 2 - 40, "RUPTURE DU PORTAIL", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "rgba(255,90,90,0.95)",
    }).setOrigin(0.5);

    // Sous-titre avec le malus
    const t2 = this.add.text(width / 2, height / 2 - 10, "La procédure a échoué.\nSTABILITÉ SYSTÈME : -10%", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#f55", // Rouge
      align: "center",
    }).setOrigin(0.5);

    // BOUTON DE REDIRECTION
    const btn = this.add.text(width / 2, height / 2 + 60, "RETOUR AUX ARCHIVES", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "rgba(0,0,0,0.85)",
      backgroundColor: "rgba(255,90,90,0.9)",
      padding: { left: 16, right: 16, top: 10, bottom: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // C'est ici que ça se passe : au clic, on change de page
    btn.on("pointerdown", () => {
      // On remonte de 2 dossiers pour revenir à kaijupedia.html
      // (mini-jeux > jeu1 > ... retour racine)
      window.location.href = "../../kaijupedia.html";
    });

    this.phaseLayer.add([panel, t1, t2, btn]);
  }

  // ---------------------------
  // RESIZE
  // ---------------------------
  onResize({ width, height }) {
    this.bg.setSize(width, height);
    this.halo.setPosition(width * 0.55, height * 0.45);
    this.halo.setRadius(Math.min(width, height) * 0.35);

    this.center.set(width / 2, height / 2 + 10);
    this.ritual.setPosition(this.center.x, this.center.y);
    this.kaiju.setPosition(this.center.x, this.center.y);

    this.drawRings();

    // reposition bottom message
    this.message.setPosition(width / 2, height - 60);
  }
}
