class LoginScene extends Phaser.Scene {
  constructor() {
    super("Login");
    this.SECRET = "来たれ、荒ぶる妖";
    this.progress = 0;
  }

  // 1. AJOUT DU PRELOAD POUR CHARGER L'IMAGE
  preload() {
    this.load.image("login_bg", "assets/images/login.jpeg");
  }

  create() {
    const { width, height } = this.scale;

    // 2. REMPLACEMENT DU FOND : Image au lieu de Rectangle
    // On la place au centre (width/2, height/2) avec une origine au centre (0.5)
    this.bg = this.add.image(width / 2, height / 2, "login_bg").setOrigin(0.5);

    // (Le reste de tes éléments décoratifs)
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

    this.pwdInput.setAttribute("autocomplete", "off");
    this.pwdInput.setAttribute("spellcheck", "false");
    this.updateInputDisplay();

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
      if (e.key.length !== 1) return;
      e.preventDefault();
      this.advanceOneChar();
    });

    root.addEventListener("click", (e) => {
      const t = e.target;
      if (!t) return;
      if (t.id === "go") this.tryLogin();
    });

    this.scale.on("resize", this.onResize, this);
    // Appel initial pour caler l'image
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
    // Attention: pwd n'était pas défini dans ton code original, j'imagine que tu voulais passer 'this.pwdInput.value' ou rien
    this.scene.start("Wiki"); 
    this.playIntroVideo();
  }

  playIntroVideo() {
    const video = document.getElementById("introVideo");
    const gameDiv = document.getElementById("game");

    if (!video || !gameDiv) {
      console.error("Video ou #game introuvable");
      return;
    }

    gameDiv.appendChild(video);
    video.style.display = "block";
    video.currentTime = 0;

    video.play().catch((err) => {
      console.error("Erreur lecture vidéo:", err);
    });

    video.onended = () => {
      video.style.display = "none";
      console.log("VIDEO FINIE");
      window.location.href = "kaijupedia.html";
    };
  }

  // 3. MISE A JOUR DU RESIZE POUR L'IMAGE
  onResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;

    // Gestion du fond d'écran "Cover" (remplit tout sans déformer)
    if (this.bg) {
        this.bg.setPosition(w / 2, h / 2);
        
        // On calcule quel ratio utiliser pour couvrir tout l'écran
        const scaleX = w / this.bg.width;
        const scaleY = h / this.bg.height;
        const scale = Math.max(scaleX, scaleY);
        
        this.bg.setScale(scale);
    }

    // Le reste de ton UI
    if (this.glow) this.glow.setPosition(w * 0.6, h * 0.45);
    if (this.ui) {
        this.ui.setPosition(w / 2, h / 2);
        const baseW = 1920;
        const baseH = 1080;
        const scaleUI = Math.min(w / baseW, h / baseH);
        const uiFinalScale = Phaser.Math.Clamp(scaleUI * 1.2, 0.75, 1.15);
        this.ui.setScale(uiFinalScale);
    }
  }
}