class LoginScene extends Phaser.Scene {
  constructor() {
    super("Login");
    this.SECRET = "来たれ、荒ぶる妖";
    this.progress = 0;
    this.showPlain = false; // œil OFF au début
  }
playIntroVideo() {
  const video = document.getElementById("introVideo");

  if (!video) return;

  // Affiche la vidéo
  video.style.display = "block";

  // Plein écran si possible
  if (video.requestFullscreen) {
    video.requestFullscreen().catch(() => {});
  }

  video.currentTime = 0;
  video.play();

  // Quand la vidéo est finie
  video.onended = () => {
    video.style.display = "none";

    // Quitter le fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    console.log("VIDEO FINIE");
    // 👉 ici tu pourras lancer la scène Kaiju
    // this.scene.start("Game");
  };
}

  create() {
    const { width, height } = this.scale;

    this.bg = this.add.rectangle(0, 0, width, height, 0x0b0b0f).setOrigin(0);
    this.glow = this.add.circle(width * 0.6, height * 0.45, Math.min(width, height) * 0.25, 0x2a5cff, 0.12);

    this.ui = this.add.container(width / 2, height / 2);

    this.avatarStroke = this.add.circle(0, -120, 50, 0xffffff, 0.15).setStrokeStyle(2, 0xffffff, 0.18);
    this.avatar = this.add.circle(0, -120, 48, 0xffffff, 0.20);

    this.nameText = this.add.text(0, -50, "Le Crabe", {
      fontFamily: "Arial",
      fontSize: "46px",
      color: "#ffffff",
    }).setOrigin(0.5);

    const html = `
      <div style="display:flex; flex-direction:column; gap:10px; align-items:center;">

        <div style="display:flex; align-items:center; gap:10px;">
          <!-- IMPORTANT : type text pour pouvoir afficher les kanjis -->
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

          <button id="eye"
            style="
              height: 40px; width: 44px; border-radius: 6px;
              border: 1px solid rgba(255,255,255,0.18);
              background: rgba(255,255,255,0.12);
              color: white; font-size: 18px; cursor: pointer;
            "
            title="Afficher / cacher"
          >👁</button>

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
    this.eyeBtn = root.querySelector("#eye");
    this.msgLine = root.querySelector("#msg");

    // Empêche l’utilisateur de sélectionner/coller
    this.pwdInput.setAttribute("autocomplete", "off");
    this.pwdInput.setAttribute("spellcheck", "false");

    // Affichage initial
    this.updateInputDisplay();

    // À chaque touche : on avance d’un caractère de la phrase
    this.pwdInput.addEventListener("keydown", (e) => {
      // Entrée = valider
      if (e.key === "Enter") {
        e.preventDefault();
        this.tryLogin();
        return;
      }

      // Backspace = reculer
      if (e.key === "Backspace") {
        e.preventDefault();
        this.backOneChar();
        return;
      }

      // Ignore les touches non "caractère"
      if (e.key.length !== 1) return;

      // Toute frappe = avancer
      e.preventDefault();
      this.advanceOneChar();
    });

    // Click boutons
    root.addEventListener("click", (e) => {
      const t = e.target;
      if (!t) return;
      if (t.id === "eye") this.toggleEye();
      if (t.id === "go") this.tryLogin();
    });

    // Resize
    this.scale.on("resize", this.onResize, this);
    this.onResize({ width, height });

    this.pwdInput.focus();
  }

  // Ajoute un caractère du mot de passe
  advanceOneChar() {
    if (this.progress >= this.SECRET.length) return;
    this.progress++;
    this.updateInputDisplay();
    this.msgLine.textContent = "";
  }

  // Enlève un caractère
  backOneChar() {
    if (this.progress <= 0) return;
    this.progress--;
    this.updateInputDisplay();
    this.msgLine.textContent = "";
  }

  // œil : show/hide
  toggleEye() {
    this.showPlain = !this.showPlain;
    this.eyeBtn.textContent = this.showPlain ? "🙈" : "👁";
    this.updateInputDisplay();
    this.pwdInput.focus();
  }

  // Met à jour ce qui est affiché DANS L'INPUT
  updateInputDisplay() {
    const revealed = this.SECRET.slice(0, this.progress);

    // si œil ON => on montre les kanjis dans l'input
    if (this.showPlain) {
      this.pwdInput.value = revealed;
    } else {
      // œil OFF => on masque par des points
      this.pwdInput.value = "•".repeat(revealed.length);
    }

    // curseur en fin
    this.pwdInput.setSelectionRange(this.pwdInput.value.length, this.pwdInput.value.length);
  }

  tryLogin() {
  if (this.progress !== this.SECRET.length) {
    this.msgLine.textContent = "Déchiffrement incomplet…";
    this.cameras.main.shake(140, 0.005);
    return;
  }

  this.msgLine.textContent = "";
  this.cameras.main.flash(180, 255, 255, 255);

  // 🎬 LANCE LA VIDÉO
  this.playIntroVideo();
}


  onResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;

    this.bg.setSize(w, h);
    this.glow.setPosition(w * 0.6, h * 0.45);
    this.ui.setPosition(w / 2, h / 2);

    const baseW = 1920;
    const baseH = 1080;
    const scale = Math.min(w / baseW, h / baseH);
    const uiScale = Phaser.Math.Clamp(scale * 1.2, 0.75, 1.15);
    this.ui.setScale(uiScale);
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#000000",
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  dom: { createContainer: true },
  scene: [LoginScene],
};

new Phaser.Game(config);
