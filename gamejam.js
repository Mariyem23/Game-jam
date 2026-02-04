class LoginScene extends Phaser.Scene {
  constructor() {
    super("Login");
  }

  preload() {
    // Mets une image dans ton projet si tu veux, ex: assets/bg.jpg
    // this.load.image("bg", "assets/bg.jpg");
  }

  create() {
    const { width, height } = this.scale;

    // --- FOND (dégradé simple si pas d'image) ---
    this.bg = this.add.rectangle(0, 0, width, height, 0x0b0b0f).setOrigin(0);

    // petit "glow" derrière (pour faire une ambiance)
    this.glow = this.add.circle(width * 0.55, height * 0.45, Math.min(width, height) * 0.25, 0x2a5cff, 0.12);

    // --- UI WINDOWS STYLE ---
    this.ui = this.add.container(width / 2, height / 2);

    // avatar
    this.avatar = this.add.circle(0, -120, 48, 0xffffff, 0.20);
    this.avatarStroke = this.add.circle(0, -120, 50, 0xffffff, 0.15).setStrokeStyle(2, 0xffffff, 0.18);

    // nom
    this.nameText = this.add.text(0, -50, "Le Crabe", {
      fontFamily: "Arial",
      fontSize: "46px",
      color: "#ffffff",
    }).setOrigin(0.5);

    // champ password (DOM)
    const html = `
      <div style="
        display:flex;
        align-items:center;
        gap:10px;
      ">
        <input id="pwd" type="password" placeholder="Mot de passe"
          style="
            width: 320px;
            height: 40px;
            padding: 0 12px;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.25);
            background: rgba(0,0,0,0.35);
            color: white;
            outline: none;
            font-size: 14px;
          "
        />
        <button id="go"
          style="
            height: 40px;
            width: 44px;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.18);
            background: rgba(255,255,255,0.15);
            color: white;
            font-size: 18px;
            cursor: pointer;
          "
        >➜</button>
      </div>
    `;

    this.form = this.add.dom(0, 25).createFromHTML(html);

    // ajoute au container
    this.ui.add([this.avatarStroke, this.avatar, this.nameText, this.form]);

    // events
    const root = this.form.node;
    root.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.id === "go") this.tryLogin();
    });

    root.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.tryLogin();
      }
    });

    // resize handler
    this.scale.on("resize", this.onResize, this);
    this.onResize({ width, height });
  }

  tryLogin() {
    const input = this.form.node.querySelector("#pwd");
    const pwd = input.value;

    if (!pwd) {
      this.cameras.main.shake(120, 0.004);
      return;
    }

    console.log("PASSWORD:", pwd);

    // exemple: transition scène suivante
    this.cameras.main.flash(180, 255, 255, 255);
    // this.scene.start("Game");
  }

  onResize(gameSize) {
    const w = gameSize.width;
    const h = gameSize.height;

    this.bg.setSize(w, h);
    this.glow.setPosition(w * 0.6, h * 0.45);
    this.ui.setPosition(w / 2, h / 2);

    // responsive: scale UI si écran petit
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
  scale: {
    mode: Phaser.Scale.RESIZE,   // ✅ plein écran responsive
    width: window.innerWidth,
    height: window.innerHeight,
  },
  dom: {
    createContainer: true,       // ✅ pour inputs
  },
  scene: [LoginScene],
};

new Phaser.Game(config);
