(function () {
  if (window.__AicupaCursorGlowLoaded__) {
    return;
  }
  window.__AicupaCursorGlowLoaded__ = true;

  console.log("Aicupa Multiverse Particle Matrix Online.");

  const canvasId = "aicupa-cursor-particle-canvas";
  let canvas = null,
    ctx = null,
    particles = [];
  const mouse = { x: 0, y: 0 };

  // ⚡ 动态物理矩阵配置
  let activeFX = localStorage.getItem("aicupa_cursor_fx") || "quantum";

  const config = {
    maxParticles: 60,
    glowColor: "#00a3ff",
    particleSize: 2.2,
  };

  class Spark {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.alpha = 1.0;

      // 🧬 根据不同动效类型注入截然不同的初始速度和衰减速率
      if (type === "float") {
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -Math.random() * 1.2 - 0.4; // 强行向上漂浮
        this.speed = 0.025; // 蒸发较慢
      } else if (type === "burst") {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1; // 极高爆发初速度
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.speed = 0.05; // 瞬间消亡
      } else {
        // 默认线性量子拖影 (quantum)
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.speed = 0.04;
      }
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // 反引力追加微弱的左右摇摆空气阻力微粒感
      if (this.type === "float") {
        this.vx += (Math.random() - 0.5) * 0.1;
      }

      this.alpha -= this.speed;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();

      // 爆裂特效带有轻微的长条流星拉伸感，其余保持圆形
      if (this.type === "burst") {
        ctx.lineWidth = config.particleSize * this.alpha;
        ctx.strokeStyle = config.glowColor;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
        ctx.stroke();
      } else {
        ctx.arc(
          this.x,
          this.y,
          config.particleSize * this.alpha,
          0,
          Math.PI * 2,
        );
        ctx.shadowBlur = this.type === "float" ? 12 : 8; // 浮空模式具备更强的烟雾晕染扩散
        ctx.shadowColor = config.glowColor;
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function initCanvas() {
    if (document.getElementById(canvasId)) return;
    canvas = document.createElement("canvas");
    canvas.id = canvasId;
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.zIndex = "999999";
    canvas.style.pointerEvents = "none";
    canvas.style.mixBlendMode = "screen";

    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", onMouseMove);
    tick();
  }

  function resizeCanvas() {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }

  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if (particles.length < config.maxParticles) {
      // 爆裂模式单次生成更多粒子以确立爆炸体感
      const spawnCount = activeFX === "burst" ? 3 : 1;
      for (let i = 0; i < spawnCount; i++) {
        particles.push(new Spark(mouse.x, mouse.y, activeFX));
      }
    }
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      } else {
        p.draw();
      }
    }
    requestAnimationFrame(tick);
  }

  // ==========================================
  // ⚡ 跨域事件总线：响应面板实时切流
  // ==========================================
  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (
      msg &&
      msg.type === "plugin-call" &&
      msg.method === "syncCursorFXType"
    ) {
      activeFX = msg.fx || "quantum";
      particles = []; // 瞬间清空历史粒子池，实现毫无滞后的丝滑热重载
      console.log(`🚀 Particle engine re-calibrated to: [${activeFX}]`);
    }
  });

  initCanvas();

  if (!window.AicupaCursorObserverAttached) {
    window.AicupaCursorObserverAttached = true;
    const observer = new MutationObserver(() => {
      if (!document.getElementById(canvasId)) initCanvas();
    });
    observer.observe(document.body, { childList: true });
  }
})();
