(function () {
  if (window.__AicupaCursorGlowLoaded__) return;
  window.__AicupaCursorGlowLoaded__ = true;

  console.log("Aicupa Cyberpunk Interactive Matrix Active.");

  const canvasId = "aicupa-cursor-particle-canvas";
  let canvas = null,
    ctx = null;
  let moveParticles = []; // 移动拖影池
  let clickParticles = []; // 点击粒子池
  let clickRipples = []; // 点击波动涟漪池

  const mouse = { x: 0, y: 0 };

  // 核心模态状态缓存
  let activeMoveFX = localStorage.getItem("aicupa_cursor_fx") || "quantum";
  let activeClickFX =
    localStorage.getItem("aicupa_cursor_click_fx") || "ripple";

  const config = {
    maxMoveParticles: 60,
    glowColor: "#00a3ff",
    particleSize: 2.2,
  };

  // ==========================================
  // 1. 移动拖影粒子物理类
  // ==========================================
  class MoveSpark {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.alpha = 1.0;
      if (type === "float") {
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -Math.random() * 1.2 - 0.4;
        this.speed = 0.025;
      } else if (type === "burst") {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.speed = 0.05;
      } else {
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.speed = 0.04;
      }
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.type === "float") this.vx += (Math.random() - 0.5) * 0.1;
      this.alpha -= this.speed;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
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
        ctx.shadowBlur = this.type === "float" ? 12 : 8;
        ctx.shadowColor = config.glowColor;
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ==========================================
  // 2. 💡 新增：点击冲击波冲击环物理类
  // ==========================================
  class ClickRipple {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 2; // 扩散初始半径
      this.maxRadius = 38; // 霓虹光环最大范围
      this.alpha = 1.0;
      this.speed = 2.4; // 扩散速率
    }
    update() {
      this.radius += this.speed;
      this.alpha = 1.0 - this.radius / this.maxRadius;
    }
    draw() {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = config.glowColor;
      ctx.shadowBlur = 10;
      ctx.shadowColor = config.glowColor;
      ctx.stroke();
      ctx.restore();
    }
  }

  class ClickSpark {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2; // 圆周爆发弹射初速度
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.alpha = 1.0;
      this.friction = 0.94; // 摩擦力，点击爆裂后会有优雅的逐渐减速凝聚效果
    }
    update() {
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= 0.04;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2.5 * this.alpha, 0, Math.PI * 2);
      ctx.shadowBlur = 6;
      ctx.shadowColor = config.glowColor;
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();
    }
  }

  // ==========================================
  // 3. 核心初始化与全局侦听
  // ==========================================
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

    // 🎯 挂载点击截获器（同样支持物理移动端端 tap 穿透）
    window.addEventListener("mousedown", onMouseClick);

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
    if (moveParticles.length < config.maxMoveParticles) {
      const spawnCount = activeMoveFX === "burst" ? 3 : 1;
      for (let i = 0; i < spawnCount; i++) {
        moveParticles.push(new MoveSpark(mouse.x, mouse.y, activeMoveFX));
      }
    }
  }

  // 🎯 执行点击脉冲泵入
  function onMouseClick(e) {
    if (activeClickFX === "none") return;

    const cx = e.clientX;
    const cy = e.clientY;

    if (activeClickFX === "ripple") {
      clickRipples.push(new ClickRipple(cx, cy));
    } else if (activeClickFX === "sparks") {
      // 瞬间向外泵入 16 个成圆周散射的量子火花
      for (let i = 0; i < 16; i++) {
        clickParticles.push(new ClickSpark(cx, cy));
      }
    }
  }

  // ==========================================
  // 4. 多重渲染循环
  // ==========================================
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // A. 渲染移动拖影
    for (let i = moveParticles.length - 1; i >= 0; i--) {
      const p = moveParticles[i];
      p.update();
      if (p.alpha <= 0) {
        moveParticles.splice(i, 1);
      } else {
        p.draw();
      }
    }

    // B. 渲染点击冲击波
    for (let i = clickRipples.length - 1; i >= 0; i--) {
      const r = clickRipples[i];
      r.update();
      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        clickRipples.splice(i, 1);
      } else {
        r.draw();
      }
    }

    // C. 渲染点击爆裂星光
    for (let i = clickParticles.length - 1; i >= 0; i--) {
      const sp = clickParticles[i];
      sp.update();
      if (sp.alpha <= 0) {
        clickParticles.splice(i, 1);
      } else {
        sp.draw();
      }
    }

    requestAnimationFrame(tick);
  }

  // ==========================================
  // 5. 跨域事件总线
  // ==========================================
  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (!msg || msg.type !== "plugin-call") return;

    if (msg.method === "syncCursorFXType") {
      activeMoveFX = msg.fx || "quantum";
      moveParticles = [];
    } else if (msg.method === "syncCursorClickFXType") {
      activeClickFX = msg.fx || "none";
      clickParticles = [];
      clickRipples = []; // 瞬间热切换清空
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
