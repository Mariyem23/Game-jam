class LoginScene extends Phaser.Scene {
  constructor() {
    super("Login");
    this.SECRET = "来たれ、荒ぶる妖";
    this.progress = 0;
  }

  create() {
    const { width, height } = this.scale;

    // Fond plein écran
    this.bg = this.add.rectangle(0, 0, width, height, 0x0b0b0f).setOrigin(0);
    this.glow = this.add.circle(
      width * 0.6,
      height * 0.45,
      Math.min(width, height) * 0.25,
      0x2a5cff,
      0.12,
    );

    // UI centrée
    this.ui = this.add.container(width / 2, height / 2);

    this.avatarStroke = this.add
      .circle(0, -120, 50, 0xffffff, 0.15)
      .setStrokeStyle(2, 0xffffff, 0.18);
    this.avatar = this.add.circle(0, -120, 48, 0xffffff, 0.2);

    this.nameText = this.add
      .text(0, -50, "Le Crabe", {
        fontFamily: "Arial",
        fontSize: "46px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const html = `
      <div style="display:flex; flex-direction:column; gap:12px; align-items:center;">
        <div style="display:flex; align-items:center; gap:10px;">
          <input id="pwd" type="text" placeholder="Mot de passe"
            style="
              width: 360px;
              height: 40px;
              padding: 0 12px;
              border-radius: 6px;
              border: 1px solid rgba(255,255,255,0.25);
              background: rgba(0,0,0,0.35);
              color: white;
              outline: none;
              font-size: 16px;
              letter-spacing: 1px;
            "
          />
          <button id="go"
            style="
              height: 40px; width: 44px; border-radius: 6px;
              border: 1px solid rgba(255,255,255,0.18);
              background: rgba(255,255,255,0.15);
              color: white; font-size: 18px; cursor: pointer;
            "
            title="Valider"
          >➜</button>
        </div>

        <div id="msg"
          style="
            min-height: 18px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: rgba(255,120,120,0.95);
            text-align:center;
            user-select:none;
          "
        ></div>
      </div>
    `;

    this.form = this.add.dom(0, 25).createFromHTML(html);
    this.ui.add([this.avatarStroke, this.avatar, this.nameText, this.form]);

    const root = this.form.node;
    this.pwdInput = root.querySelector("#pwd");
    this.msgLine = root.querySelector("#msg");

    // Empêche l’utilisateur de coller et d’écrire librement
    this.pwdInput.setAttribute("autocomplete", "off");
    this.pwdInput.setAttribute("spellcheck", "false");

    // Affichage initial
    this.updateInputDisplay();

    // À chaque touche : on avance dans la phrase
    this.pwdInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.tryLogin();
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        this.backOneChar();
        return;
      }

      // Ignore les touches non-caractères
      if (e.key.length !== 1) return;

      // Toute frappe = avancer d’un caractère
      e.preventDefault();
      this.advanceOneChar();
    });

    // Click bouton ➜
    root.addEventListener("click", (e) => {
      const t = e.target;
      if (!t) return;
      if (t.id === "go") this.tryLogin();
    });

    // Resize responsive
    this.scale.on("resize", this.onResize, this);
    this.onResize({ width, height });

    this.pwdInput.focus();
  }

  advanceOneChar() {
    if (this.progress >= this.SECRET.length) return;
    this.progress++;
    this.updateInputDisplay();
    this.msgLine.textContent = "";
  }

  backOneChar() {
    if (this.progress <= 0) return;
    this.progress--;
    this.updateInputDisplay();
    this.msgLine.textContent = "";
  }

  updateInputDisplay() {
    const revealed = this.SECRET.slice(0, this.progress);
    this.pwdInput.value = revealed;

    // curseur en fin
    this.pwdInput.setSelectionRange(
      this.pwdInput.value.length,
      this.pwdInput.value.length,
    );
  }

  tryLogin() {
  if (this.progress !== this.SECRET.length) {
    this.msgLine.textContent = "Déchiffrement incomplet…";
    this.cameras.main.shake(140, 0.005);
    return;
  }

  this.msgLine.textContent = "";
  this.cameras.main.flash(180, 255, 255, 255);

  // 🎬 Lance la vidéo
  this.playIntroVideo();
}


  playIntroVideo() {
    const video = document.getElementById("introVideo");
    const gameDiv = document.getElementById("game");

    if (!video || !gameDiv) {
      console.error("Video ou #game introuvable");
      return;
    }

    // Important : s'assurer que la vidéo est dans #game
    gameDiv.appendChild(video);

    video.style.display = "block";
    video.currentTime = 0;

    // pause l'UI derrière si tu veux (optionnel)
    // this.scene.pause();

    video.play().catch((err) => {
      console.error("Erreur lecture vidéo:", err);
      // Si ça bloque encore, enlève "muted" dans HTML et clique sur Play manuellement
    });

    video.onended = () => {
  video.style.display = "none";
  console.log("VIDEO FINIE");

  // ➜ Après la vidéo, on lance la page Wiki
  this.scene.start("Wiki", { invocation: this.SECRET });
};

  }

  onResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;

    this.bg.setSize(w, h);
    this.glow.setPosition(w * 0.6, h * 0.45);
    this.ui.setPosition(w / 2, h / 2);

    // responsive scale UI
    const baseW = 1920;
    const baseH = 1080;
    const scale = Math.min(w / baseW, h / baseH);
    const uiScale = Phaser.Math.Clamp(scale * 1.2, 0.75, 1.15);
    this.ui.setScale(uiScale);
  }
}
class WikiScene extends Phaser.Scene {
  constructor() {
    super("Wiki");
    this.invocation = "";
    this.kaijuHP = 100;
    this.escape = 0;
  }

  // Phaser appelle init() quand on démarre la scène avec des data
  init(data) {
    this.invocation = data && data.invocation ? data.invocation : "";
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // 1) Fond style wiki
    this.add.rectangle(0, 0, width, height, 0xf5f5f5).setOrigin(0);

    // 2) Barre top "Wikipedia"
    this.add.rectangle(0, 0, width, 60, 0xe6e6e6).setOrigin(0);
    this.add.text(20, 18, "Wikipedia", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#111111",
      fontStyle: "bold",
    });

    // 3) Titre article
    this.add.text(40, 90, "Kaiju", {
      fontFamily: "Georgia",
      fontSize: "52px",
      color: "#111111",
    });

    // 4) Afficher l’invocation tapée au login
    this.invocationText = this.add.text(
      40,
      155,
      `Invocation détectée : "${this.invocation}"`,
      {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#7a0000",
      },
    );

    // 5) Texte wiki fake
    const paragraph =
      "Les kaijus sont des créatures colossales. Certaines légendes parlent d’une invocation numérique via une interface...";
    this.add.text(40, 200, paragraph, {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#222222",
      wordWrap: { width: width - 80 },
      lineSpacing: 8,
    });

    // 6) HUD (HP / ESCAPE) en haut à droite
    this.hpText = this.add.text(width - 220, 16, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#111111",
    });

    this.escapeText = this.add.text(width - 220, 38, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#111111",
    });

    this.refreshHUD();

    // 7) Lien cliquable (test mini-jeu)
    const link = this.add
      .text(40, height - 80, "▶ Lancer un protocole de confinement", {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#0645ad",
      })
      .setInteractive({ useHandCursor: true });

    link.on("pointerdown", () => {
      // Pour l’instant on simule : tu “joues” => HP baisse mais ESCAPE monte
      this.kaijuHP = Math.max(0, this.kaijuHP - 10);
      this.escape = Math.min(100, this.escape + 12);
      this.refreshHUD();

      // Conditions fin
      if (this.escape >= 100) this.showGameOver();
      if (this.kaijuHP <= 0) this.showVictory();
    });
  }

  refreshHUD() {
    this.hpText.setText(`HP: ${this.kaijuHP}`);
    this.escapeText.setText(`ESCAPE: ${Math.floor(this.escape)}%`);
  }

  showGameOver() {
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.65)
      .setOrigin(0);
    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        "GAME OVER\nLe kaiju sort de l'écran",
        {
          fontFamily: "Arial",
          fontSize: "42px",
          color: "#ffffff",
          align: "center",
        },
      )
      .setOrigin(0.5);
    this.input.enabled = false;
  }

  showVictory() {
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0xffffff, 0.75)
      .setOrigin(0);
    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        "VICTOIRE\nKaiju neutralisé",
        {
          fontFamily: "Arial",
          fontSize: "42px",
          color: "#111111",
          align: "center",
        },
      )
      .setOrigin(0.5);
    this.input.enabled = false;
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  dom: { createContainer: true },
  scene: [LoginScene, WikiScene],
};

new Phaser.Game(config);
