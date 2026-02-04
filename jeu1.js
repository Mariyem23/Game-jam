class PortalStabilizeScene extends Phaser.Scene {
  constructor() {
    super("Jeu1_Portail");

    this.targetHits = 12;
    this.maxMisses = 4;

    this.spawnEveryMin = 260;
    this.spawnEveryMax = 520;

    this.lifeMin = 800;
    this.lifeMax = 1500;
  }

  create() {
    const { width, height } = this.scale;

    this.hits = 0;
    this.misses = 0;
    this.ended = false;

    // Fond
    this.bg = this.add.rectangle(0, 0, width, height, 0x07070c).setOrigin(0);
    this.vignette = this.add.circle(width / 2, height / 2, Math.min(width, height) * 0.55, 0x2a5cff, 0.08);

    // Portail
    this.portal = this.add.container(width / 2, height / 2);

    this.portalOuter = this.add.circle(0, 0, Math.min(width, height) * 0.18, 0x3a78ff, 0.15)
      .setStrokeStyle(3, 0xffffff, 0.12);

    this.portalInner = this.add.circle(0, 0, Math.min(width, height) * 0.12, 0x000000, 0.35)
      .setStrokeStyle(2, 0xffffff, 0.08);

    this.portalRing = this.add.circle(0, 0, Math.min(width, height) * 0.145, 0xffffff, 0.03)
      .setStrokeStyle(2, 0xffffff, 0.10);

    this.portal.add([this.portalOuter, this.portalInner, this.portalRing]);

    // UI
    this.title = this.add.text(16, 16, "Stabiliser le Portail", {
      fontSize: "20px",
      color: "#ffffff",
    });

    this.stats = this.add.text(16, 44, "", {
      fontSize: "14px",
      color: "rgba(255,255,255,0.8)",
    });

    this.targets = this.add.group();

    this.refreshUI();
    this.spawnLoop();

    this.tweens.add({
      targets: this.portalRing,
      alpha: { from: 0.03, to: 0.12 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    this.scale.on("resize", this.onResize, this);
  }

  refreshUI() {
    this.stats.setText(
      `Succès : ${this.hits}/${this.targetHits}   |   Échecs : ${this.misses}/${this.maxMisses}`
    );
  }

  spawnLoop() {
    if (this.ended) return;

    this.spawnTarget();

    const delay = Phaser.Math.Between(this.spawnEveryMin, this.spawnEveryMax);
    this.time.delayedCall(delay, () => this.spawnLoop());
  }

  spawnTarget() {
    if (this.ended) return;

    const { width, height } = this.scale;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const radius = Phaser.Math.FloatBetween(
      Math.min(width, height) * 0.10,
      Math.min(width, height) * 0.26
    );

    const x = width / 2 + Math.cos(angle) * radius;
    const y = height / 2 + Math.sin(angle) * radius;
    const r = Phaser.Math.Between(16, 28);

    const g = this.add.graphics();
    g.fillStyle(0xff3b3b, 0.65);
    g.fillCircle(0, 0, r);
    g.lineStyle(2, 0xffffff, 0.1);
    g.strokeCircle(0, 0, r);

    g.setPosition(x, y);
    g.setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains);

    const life = Phaser.Math.Between(this.lifeMin, this.lifeMax);

    const pulse = this.tweens.add({
      targets: g,
      alpha: { from: 1, to: 0.55 },
      duration: 180,
      yoyo: true,
      repeat: Math.floor(life / 180),
    });

    g.on("pointerdown", () => {
      if (this.ended) return;
      pulse.stop();
      g.destroy();

      this.hits++;
      this.refreshUI();
      this.cameras.main.shake(40, 0.0015);

      if (this.hits >= this.targetHits) this.win();
    });

    this.time.delayedCall(life, () => {
      if (!g.active || this.ended) return;
      g.destroy();

      this.misses++;
      this.refreshUI();
      this.cameras.main.shake(120, 0.006);

      if (this.misses >= this.maxMisses) this.lose();
    });
  }

  win() {
    this.ended = true;
    this.showEnd("Portail stabilisé ✔", "Protocole réussi");
  }

  lose() {
    this.ended = true;
    this.showEnd("Portail instable ✖", "Le Kaiju approche…");
  }

  showEnd(title, subtitle) {
    const { width, height } = this.scale;

    const panel = this.add.rectangle(width / 2, height / 2, 420, 180, 0x000000, 0.6)
      .setStrokeStyle(2, 0xffffff, 0.2);

    this.add.text(width / 2, height / 2 - 30, title, {
      fontSize: "24px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 10, subtitle, {
      fontSize: "16px",
      color: "rgba(255,255,255,0.8)",
    }).setOrigin(0.5);

    const btn = this.add.text(width / 2, height / 2 + 60, "Retour", {
      fontSize: "18px",
      backgroundColor: "#ffffff",
      color: "#000000",
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive();

    btn.on("pointerdown", () => {
      this.scene.start("Login"); // ou autre scène principale
    });
  }

  onResize({ width, height }) {
    this.bg.setSize(width, height);
    this.vignette.setPosition(width / 2, height / 2);
    this.portal.setPosition(width / 2, height / 2);
  }
}
class SonarScene extends Phaser.Scene {
  constructor() {
    super("Jeu_Sonar");
  }

  create() {
    const { width, height } = this.scale;
    
    // Fond radar
    this.add.circle(width/2, height/2, 300, 0x002200, 0.3).setStrokeStyle(2, 0x00ff00, 0.5);
    this.add.circle(width/2, height/2, 200, 0x002200, 0.0).setStrokeStyle(1, 0x00ff00, 0.3);
    this.add.circle(width/2, height/2, 100, 0x002200, 0.0).setStrokeStyle(1, 0x00ff00, 0.3);
    
    // La ligne de scan
    this.scanLine = this.add.line(0, 0, width/2, height/2, width/2, height/2 - 300, 0x00ff00, 1).setOrigin(0);
    this.physics.add.existing(this.scanLine);
    
    // Groupe de cibles
    this.targets = [];
    this.score = 0;
    
    // Texte
    this.label = this.add.text(width/2, 50, "CIBLEZ LE SIGNAL ROUGE", { fontSize: '24px', color: '#00ff00' }).setOrigin(0.5);

    // Faire tourner la ligne
    this.scanAngle = 0;
    
    // Spawn des blips
    this.time.addEvent({ delay: 2000, callback: this.spawnBlip, callbackScope: this, loop: true });
  }

  update() {
    // Rotation de la ligne (radar)
    this.scanAngle += 0.05;
    this.scanLine.setTo(this.scale.width/2, this.scale.height/2, 
                        this.scale.width/2 + Math.cos(this.scanAngle) * 300, 
                        this.scale.height/2 + Math.sin(this.scanAngle) * 300);
                        
    // Vérifier si la ligne touche un blip (logique simplifiée pour l'exemple)
    // Dans une vraie jam, on check l'angle du blip vs l'angle de la ligne
    this.targets.forEach(blip => {
       // Faire disparaitre le blip doucement
       blip.alpha -= 0.005;
       if(blip.alpha <= 0) blip.destroy();
    });
  }

  spawnBlip() {
    const { width, height } = this.scale;
    // Position random dans le cercle
    const angle = Phaser.Math.FloatBetween(0, 6.28);
    const dist = Phaser.Math.Between(50, 280);
    const x = width/2 + Math.cos(angle) * dist;
    const y = height/2 + Math.sin(angle) * dist;

    // 1 chance sur 3 que ce soit un ENNEMI (Rouge)
    const isEnemy = Phaser.Math.Between(0, 100) > 60;
    const color = isEnemy ? 0xff0000 : 0x00ff00;
    
    const blip = this.add.circle(x, y, 10, color, 1);
    blip.setData('isEnemy', isEnemy);
    blip.setInteractive();
    
    blip.on('pointerdown', () => {
        if(blip.getData('isEnemy')) {
            this.cameras.main.flash(100, 0, 255, 0); // Flash vert
            this.score++;
            this.label.setText("MENACE ÉLIMINÉE: " + this.score);
            blip.destroy();
            if(this.score >= 5) {
                // VICTOIRE -> Retour au menu ou jeu suivant
                this.scene.start('Kaijupedia'); 
            }
        } else {
             this.cameras.main.shake(100, 0.01); // Erreur
        }
    });
    
    this.targets.push(blip);
  }
}