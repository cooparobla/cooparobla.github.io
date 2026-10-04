// coopa: hero wave grid, scroll reveals, lightbox, copy button.
(() => {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Nav background once scrolled ──
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  document.getElementById("year").textContent = new Date().getFullYear();

  // ── Reveal on scroll ──
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 70}ms`;
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  // ── Typed scene names in the hero terminal ──
  const typed = document.getElementById("typed");
  const scenes = ["water_test", "terrain_test", "underwater_test", "pixel_demo", "physics_test", "cloth_test", "world_canvas_test"];
  if (typed && !reduceMotion) {
    let si = 0, ci = scenes[0].length, deleting = true;
    const tick = () => {
      if (deleting) {
        ci--;
        if (ci <= 0) { deleting = false; si = (si + 1) % scenes.length; }
      } else {
        ci++;
        if (ci >= scenes[si].length) { deleting = true; typed.textContent = scenes[si]; return setTimeout(tick, 2200); }
      }
      typed.textContent = scenes[si].slice(0, Math.max(ci, 0)) || "";
      setTimeout(tick, deleting ? 35 : 75);
    };
    setTimeout(tick, 2600);
  }

  // ── Lightbox for screenshots ──
  const box = document.getElementById("lightbox");
  const boxImg = box.querySelector("img");
  const closeBox = () => { box.hidden = true; document.body.style.overflow = ""; };
  document.querySelectorAll("[data-zoom]").forEach((img) => {
    img.addEventListener("click", () => {
      boxImg.src = img.currentSrc || img.src;
      boxImg.alt = img.alt;
      box.hidden = false;
      document.body.style.overflow = "hidden";
    });
  });
  box.addEventListener("click", closeBox);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && !box.hidden) closeBox(); });

  // ── Copy build commands ──
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.classList.add("done");
        setTimeout(() => btn.classList.remove("done"), 1400);
      } catch { /* clipboard blocked; nothing to do */ }
    });
  });

  // ── Hero: Gerstner-ish waves on an isometric grid of blocks ──
  const canvas = document.getElementById("waves");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const N = 20;                       // grid is N x N blocks
  let W = 0, H = 0, dpr = 1, tw = 0, th = 0, ox = 0, oy = 0, unit = 0;

  // Same idea as toyengine's water: a few directional waves summed together.
  const waves = [
    { dx: 1.0, dy: 0.25, k: 0.55, w: 1.25, a: 1.0 },
    { dx: -0.35, dy: 1.0, k: 0.8, w: 1.7, a: 0.55 },
    { dx: 0.7, dy: -0.7, k: 1.3, w: 2.3, a: 0.25 },
  ];
  for (const wv of waves) { const l = Math.hypot(wv.dx, wv.dy); wv.dx /= l; wv.dy /= l; }

  // A few "buoyant crates" riding the surface.
  const crates = [
    { i: 6, j: 5, top: "#ffc845", left: "#ff6b4a", right: "#2fb5c8" },
    { i: 13, j: 9, top: "#ff8a6e", left: "#d24a2c", right: "#b33d22" },
    { i: 8, j: 14, top: "#ffe08a", left: "#d9962a", right: "#b97c1f" },
  ];
  const crateAt = new Map(crates.map((c) => [c.i * N + c.j, c]));

  const ripples = [];
  let lastCell = -1, lastRippleT = 0;

  // Colour ramp: deep indigo → teal → pale foam/sun at the crests.
  const stops = [
    [0.0, [42, 35, 80]],
    [0.35, [31, 127, 147]],
    [0.65, [47, 181, 200]],
    [0.88, [143, 227, 238]],
    [1.0, [255, 224, 138]],
  ];
  const ramp = (v) => {
    v = Math.min(1, Math.max(0, v));
    for (let s = 1; s < stops.length; s++) {
      if (v <= stops[s][0]) {
        const [p0, c0] = stops[s - 1], [p1, c1] = stops[s];
        const t = (v - p0) / (p1 - p0);
        return [c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t, c0[2] + (c1[2] - c0[2]) * t];
      }
    }
    return stops[stops.length - 1][1];
  };
  const rgb = (c, m) => `rgb(${c[0] * m | 0},${c[1] * m | 0},${c[2] * m | 0})`;

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const narrow = W < 900;
    const span = narrow ? Math.min(W * 1.1, H * 0.9) : Math.min(W * 0.5, H * 1.05);
    tw = span / N; th = tw * 0.5; unit = tw * 0.42;
    // draw() already centres the diamond on oy; leave headroom above for crests.
    ox = narrow ? W * 0.5 : W * 0.72;
    oy = narrow ? H * 0.74 : H * 0.55;
    draw(performance.now() / 1000);
  }

  function height(i, j, t) {
    let h = 0;
    for (const wv of waves) h += wv.a * Math.sin((i * wv.dx + j * wv.dy) * wv.k - t * wv.w);
    for (const r of ripples) {
      const age = t - r.t0, d = Math.hypot(i - r.i, j - r.j), front = age * 6;
      if (d > front) continue;
      h += r.a * Math.sin(d * 1.4 - age * 8) * Math.exp(-age * 1.2) * Math.exp(-(front - d) * 0.15);
    }
    return h;
  }

  function block(x, y, w, hTop, hBase, top, left, right) {
    // x,y = screen centre of the block's top diamond at height 0; heights go up.
    const yt = y - hTop, yb = y - hBase, hw = w / 2, hh = w / 4;
    ctx.fillStyle = left;
    ctx.beginPath(); ctx.moveTo(x - hw, yt); ctx.lineTo(x, yt + hh); ctx.lineTo(x, yb + hh); ctx.lineTo(x - hw, yb); ctx.fill();
    ctx.fillStyle = right;
    ctx.beginPath(); ctx.moveTo(x, yt + hh); ctx.lineTo(x + hw, yt); ctx.lineTo(x + hw, yb); ctx.lineTo(x, yb + hh); ctx.fill();
    ctx.fillStyle = top;
    ctx.beginPath(); ctx.moveTo(x, yt - hh); ctx.lineTo(x + hw, yt); ctx.lineTo(x, yt + hh); ctx.lineTo(x - hw, yt); ctx.fill();
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const base = -2.4 * unit;
    for (let s = 0; s <= 2 * (N - 1); s++) {
      for (let i = Math.max(0, s - N + 1); i <= Math.min(s, N - 1); i++) {
        const j = s - i;
        const h = height(i, j, t);
        const x = ox + (i - j) * (tw / 2);
        const y = oy + (i + j) * (th / 2) - N * th / 2;
        // Fade the grid out towards its edges so it melts into the page.
        const edge = Math.min(i, j, N - 1 - i, N - 1 - j);
        ctx.globalAlpha = Math.min(1, 0.25 + edge * 0.22);
        const c = ramp((h + 1.8) / 3.6);
        block(x, y, tw * 0.98, h * unit, base, rgb(c, 1), rgb(c, 0.72), rgb(c, 0.5));
        const crate = crateAt.get(i * N + j);
        if (crate) {
          const bob = h * unit + Math.sin(t * 2 + i) * unit * 0.12;
          block(x, y, tw * 0.78, bob + tw * 0.62, bob + tw * 0.06, crate.top, crate.left, crate.right);
          ctx.fillStyle = "rgba(255,255,255,.35)";
          ctx.beginPath(); ctx.ellipse(x, y - bob - tw * 0.62, tw * 0.15, tw * 0.075, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // Screen → grid cell (ignoring height, close enough for ripples).
  function cellAt(px, py) {
    const sx = (px - ox) / (tw / 2), sy = (py - oy + N * th / 2) / (th / 2);
    return [Math.round((sy + sx) / 2), Math.round((sy - sx) / 2)];
  }
  function addRipple(px, py, a) {
    const [i, j] = cellAt(px, py);
    if (i < -2 || j < -2 || i > N + 1 || j > N + 1) return;
    const t = performance.now() / 1000;
    ripples.push({ i, j, t0: t, a });
    if (ripples.length > 8) ripples.shift();
  }

  const hero = canvas.parentElement;
  hero.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const [i, j] = cellAt(px, py), cell = i * 1000 + j, now = performance.now();
    if (cell !== lastCell && now - lastRippleT > 140) {
      lastCell = cell; lastRippleT = now;
      addRipple(px, py, 0.9);
    }
  });
  hero.addEventListener("pointerdown", (e) => {
    const r = canvas.getBoundingClientRect();
    addRipple(e.clientX - r.left, e.clientY - r.top, 2.2);
  });

  let running = false, raf = 0;
  const loop = (ms) => {
    const t = ms / 1000;
    while (ripples.length && t - ripples[0].t0 > 5) ripples.shift();
    draw(t);
    raf = requestAnimationFrame(loop);
  };
  const setRunning = (on) => {
    if (reduceMotion || on === running) return;
    running = on;
    if (on) raf = requestAnimationFrame(loop); else cancelAnimationFrame(raf);
  };

  window.addEventListener("resize", resize);
  resize();
  if (!reduceMotion) {
    let heroVisible = true;
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; setRunning(heroVisible && !document.hidden); }).observe(hero);
    document.addEventListener("visibilitychange", () => setRunning(heroVisible && !document.hidden));
  }
})();
