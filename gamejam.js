class LoginScene extends Phaser.Scene {
  constructor() {
    super("Login");
    this.SECRET = "来たれ、荒ぶる妖";
    this.progress = 0;
  }

  // 1. CHARGEMENT DE L'IMAGE
  preload() {
    // On charge l'image
    this.load.image("login_bg", "/images/plage.jpeg");
  }

  create() {
    const { width, height } = this.scale;

    // 2. AFFICHER L'IMAGE
    this.bg = this.add.image(width / 2, height / 2, "login_bg").setOrigin(0.5);

    // Glow
    this.glow = this.add.circle(width * 0.6, height * 0.45, Math.min(width, height) * 0.25, 0x2a5cff, 0.12);

    // UI Container
    this.ui = this.add.container(width / 2, height / 2);

    // Avatar
    this.avatarStroke = this.add.circle(0, -120, 50, 0xffffff, 0.15).setStrokeStyle(2, 0xffffff, 0.18);
    this.avatar = this.add.circle(0, -120, 48, 0xffffff, 0.2);

    // Nom
    this.nameText = this.add.text(0, -50, "Le Crabe", { fontFamily: "Arial", fontSize: "46px", color: "#ffffff" }).setOrigin(0.5);

    // Formulaire HTML
    const html = `
      <div style="display:flex; flex-direction:column; gap:12px; align-items:center;">
        <div style="display:flex; align-items:center; gap:10px;">
          <input id="pwd" type="text" placeholder="Mot de passe"
            style="width: 360px; height: 40px; padding: 0 12px; border-radius: 6px; border: 1px solid rgb(255, 255, 255); background: rgba(0,0,0,0.35); color: white; outline: none; font-size: 16px; letter-spacing: 1px;" />
          <button id="go" style="height: 40px; width: 44px; border-radius: 6px; border: 1px solid rgb(255, 255, 255); background: rgba(255,255,255,0.15); color: white; font-size: 18px; cursor: pointer;" title="Valider">➜</button>
        </div>
        <div id="msg" style="min-height: 18px; font-family: Arial, sans-serif; font-size: 12px; color: rgba(255,120,120,0.95); text-align:center; user-select:none;"></div>
      </div>
    `;

    this.form = this.add.dom(0, 25).createFromHTML(html);
    this.ui.add([this.avatarStroke, this.avatar, this.nameText, this.form]);

    // Logique Input
    const root = this.form.node;
    this.pwdInput = root.querySelector("#pwd");
    this.msgLine = root.querySelector("#msg");

    this.pwdInput.setAttribute("autocomplete", "off");
    this.pwdInput.setAttribute("spellcheck", "false");
    this.updateInputDisplay();

    this.pwdInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); this.tryLogin(); return; }
      if (e.key === "Backspace") { e.preventDefault(); this.backOneChar(); return; }
      if (e.key.length !== 1) return;
      e.preventDefault();
      this.advanceOneChar();
    });

    root.addEventListener("click", (e) => {
      if (e.target && e.target.id === "go") this.tryLogin();
    });

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
    
    // Note: Cela plantera si "Rituel" n'est pas dans la config scene[] plus bas
    // Mais on veut d'abord voir l'écran de Login !
    this.scene.start("Rituel"); 
    this.playIntroVideo();
  }

  playIntroVideo() {
    const video = document.getElementById("introVideo");
    const gameDiv = document.getElementById("game");
    if (!video || !gameDiv) return;

    gameDiv.appendChild(video);
    video.style.display = "block";
    video.currentTime = 0;
    video.play().catch((err) => console.error(err));
    video.onended = () => {
      video.style.display = "none";
      window.location.href = "kaijupedia.html";
    };
  }

  onResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;

    if (this.bg) {
        this.bg.setPosition(w / 2, h / 2);
        const scaleX = w / this.bg.width;
        const scaleY = h / this.bg.height;
        const scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale);
    }

    if (this.glow) this.glow.setPosition(w * 0.6, h * 0.45);
    if (this.ui) {
        this.ui.setPosition(w / 2, h / 2);
        const baseW = 1920;
        const baseH = 1080;
        const scale = Math.min(w / baseW, h / baseH);
        this.ui.setScale(Phaser.Math.Clamp(scale * 1.2, 0.75, 1.15));
    }
  }
} // <--- ICI : ON FERME LA CLASSE LOGINSCENE ! (C'était ça qui manquait)

// --- CONFIGURATION DU JEU (EN DEHORS DE LA CLASSE) ---
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
  // Pour l'instant on ne met QUE LoginScene pour éviter les bugs de l'autre fichier
  scene: [LoginScene] 
};

// Lancement du jeu
new Phaser.Game(config);