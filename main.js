/* HydrateDifferent — interactions
   - Three.js bottle on a fixed stage that moves with the scroll story
   - GSAP + ScrollTrigger for reveals, pinned feature story, count-ups
   - Micro-interactions: magnetic buttons, custom cursor, color configurator
*/

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const isMobile = () => window.innerWidth <= 760;

document.getElementById("year").textContent = new Date().getFullYear();

/* ----------------------------------------------------------
   Bottle state — GSAP tweens these numbers, the render loop reads them.
   x / y are fractions of the visible half-width / half-height.
   ---------------------------------------------------------- */
const state = { x: 0.42, y: 0, scale: 1, rotY: 0, rotZ: -0.18, glow: 1, spin: 0, fade: 1 };

const poses = {
  hero: () => (isMobile() ? { x: 0, y: 0.42, scale: 0.62, rotY: 0, rotZ: -0.12, fade: 1 } : { x: 0.42, y: 0, scale: 1, rotY: 0, rotZ: -0.18, fade: 1 }),
  features: () => (isMobile() ? { x: 0, y: 0.1, scale: 0.75, rotY: Math.PI * 0.5, rotZ: 0.1, fade: 0.12 } : { x: -0.45, y: -0.02, scale: 1.05, rotY: Math.PI * 0.5, rotZ: 0.08, fade: 1 }),
  shop: () => (isMobile() ? { x: 0, y: 0.38, scale: 0.6, rotY: Math.PI * 2, rotZ: 0, fade: 1 } : { x: -0.45, y: 0, scale: 1.05, rotY: Math.PI * 2, rotZ: -0.06, fade: 1 }),
};
Object.assign(state, poses.hero());
// function-based values so poses re-evaluate on ScrollTrigger refresh (resize / breakpoint)
const pose = (name) => Object.fromEntries(Object.keys(poses[name]()).map((k) => [k, () => poses[name]()[k]]));

let bottle = null; // set once Three.js is ready

/* ----------------------------------------------------------
   Three.js scene
   ---------------------------------------------------------- */
async function initThree() {
  const canvas = document.getElementById("bottle-canvas");
  let THREE, RoomEnvironment;
  try {
    THREE = await import("three");
    ({ RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js"));
  } catch (e) {
    document.documentElement.classList.add("no-webgl");
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    document.documentElement.classList.add("no-webgl");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x5ef2d6, 18, 12);
  rim.position.set(-3, 1.5, -2);
  scene.add(rim);
  const warm = new THREE.PointLight(0xff7a59, 8, 10);
  warm.position.set(3, -2, 1);
  scene.add(warm);

  /* --- bottle body: lathe profile (radius, height) --- */
  const H = 3.4;
  const profile = [
    [0, 0], [0.5, 0], [0.6, 0.03], [0.65, 0.1], [0.67, 0.25],
    [0.67, 2.25], [0.64, 2.45], [0.55, 2.62], [0.44, 2.74], [0.4, 2.8], [0.4, 2.86],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const bodyGeo = new THREE.LatheGeometry(profile, 96);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#6fe0d0"), metalness: 0.35, roughness: 0.38,
    clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.4, sheenColor: new THREE.Color("#ffffff"),
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);

  /* brushed-steel base ring */
  const steel = new THREE.MeshStandardMaterial({ color: 0xd9e3e8, metalness: 1, roughness: 0.28 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.672, 0.6, 0.12, 96, 1, true), steel);
  base.position.y = 0.06;

  /* cap + glow ring + carry loop */
  const capMat = new THREE.MeshPhysicalMaterial({ color: 0x0b1d30, metalness: 0.2, roughness: 0.45, clearcoat: 0.6 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.45, 0.5, 64), capMat);
  cap.position.y = 3.12;
  const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.43, 64, 16, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
  capTop.scale.y = 0.18;
  capTop.position.y = 3.37;
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x5ef2d6, emissive: 0x5ef2d6, emissiveIntensity: 1.2, roughness: 0.3 });
  const glow = new THREE.Mesh(new THREE.TorusGeometry(0.455, 0.035, 16, 96), glowMat);
  glow.rotation.x = Math.PI / 2;
  glow.position.y = 2.92;
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.055, 16, 48, Math.PI), capMat);
  loop.position.y = 3.42;

  /* wrap-around label drawn on a canvas */
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 2048;
  labelCanvas.height = 256;
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  labelTex.anisotropy = 8;
  function drawLabel(hex) {
    const c = new THREE.Color(hex);
    const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    const ink = lum > 0.45 ? "rgba(6,18,31,0.85)" : "rgba(233,244,246,0.92)";
    const ctx = labelCanvas.getContext("2d");
    ctx.clearRect(0, 0, 2048, 256);
    ctx.fillStyle = ink;
    ctx.textBaseline = "middle";
    ctx.font = "800 92px Unbounded, Arial Black, sans-serif";
    const text = "HYDRATE  ✦  DIFFERENT  ✦  ";
    const w = ctx.measureText(text).width;
    for (let x = 40; x < 2048; x += w) ctx.fillText(text, x, 132);
    labelTex.needsUpdate = true;
  }
  drawLabel("#6fe0d0");
  if (document.fonts) document.fonts.ready.then(() => drawLabel(currentHex));
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.674, 0.674, 0.42, 96, 1, true),
    new THREE.MeshStandardMaterial({ map: labelTex, transparent: true, roughness: 0.6, metalness: 0 })
  );
  label.position.y = 1.25;

  const group = new THREE.Group();
  [body, base, cap, capTop, glow, loop, label].forEach((m) => group.add(m));
  group.position.y = -H / 2; // pivot around the middle
  const pivot = new THREE.Group();
  pivot.add(group);
  scene.add(pivot);

  /* water-bubble particles drifting upward */
  const COUNT = isMobile() ? 120 : 260;
  const pos = new Float32Array(COUNT * 3);
  const speed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
    speed[i] = 0.15 + Math.random() * 0.45;
  }
  const bubbleGeo = new THREE.BufferGeometry();
  bubbleGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dot = document.createElement("canvas");
  dot.width = dot.height = 64;
  const dctx = dot.getContext("2d");
  const grad = dctx.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, "rgba(255,255,255,0.0)");
  grad.addColorStop(0.7, "rgba(160,255,240,0.55)");
  grad.addColorStop(1, "rgba(160,255,240,0)");
  dctx.fillStyle = grad;
  dctx.fillRect(0, 0, 64, 64);
  const bubbles = new THREE.Points(
    bubbleGeo,
    new THREE.PointsMaterial({ size: 0.12, map: new THREE.CanvasTexture(dot), transparent: true, depthWrite: false, opacity: 0.8 })
  );
  scene.add(bubbles);

  /* sizing */
  let halfW = 1, halfH = 1;
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    halfW = halfH * camera.aspect;
  }
  resize();
  window.addEventListener("resize", resize);

  /* pointer parallax */
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  /* render loop — paused when the tab is hidden */
  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) { clock.getDelta(); requestAnimationFrame(tick); }
  });
  function tick() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    mouse.sx += (mouse.x - mouse.sx) * 0.05;
    mouse.sy += (mouse.y - mouse.sy) * 0.05;
    const float = reduceMotion ? 0 : Math.sin(t * 1.1) * 0.06;
    const idleSpin = reduceMotion ? 0 : t * 0.25;

    pivot.position.set(state.x * halfW, state.y * halfH + float, 0);
    pivot.scale.setScalar(state.scale * Math.min(1, halfH / 3.2));
    pivot.rotation.set(mouse.sy * 0.15, state.rotY + state.spin + idleSpin + mouse.sx * 0.35, state.rotZ);

    canvas.style.opacity = state.fade;
    glowMat.emissiveIntensity = 0.4 + (0.6 + 0.4 * Math.sin(t * 2.4)) * state.glow;

    if (!reduceMotion) {
      const p = bubbleGeo.attributes.position.array;
      for (let i = 0; i < COUNT; i++) {
        p[i * 3 + 1] += speed[i] * dt;
        p[i * 3] += Math.sin(t + i) * 0.002;
        if (p[i * 3 + 1] > 5) p[i * 3 + 1] = -5;
      }
      bubbleGeo.attributes.position.needsUpdate = true;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  let currentHex = "#6fe0d0";
  bottle = {
    setColor(hex) {
      currentHex = hex;
      const target = new THREE.Color(hex);
      if (gsap) gsap.to(bodyMat.color, { r: target.r, g: target.g, b: target.b, duration: 0.8, ease: "power2.out" });
      else bodyMat.color.copy(target);
      drawLabel(hex);
    },
  };
}

/* ----------------------------------------------------------
   Scroll story (GSAP + ScrollTrigger)
   ---------------------------------------------------------- */
function initScroll() {
  if (!gsap || !ScrollTrigger) {
    document.querySelector(".features").classList.add("features--static");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* hero intro */
  if (!reduceMotion) {
    const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
    intro
      .from(".hero__title .line > span", { yPercent: 110, duration: 1.1, stagger: 0.09 })
      .from(".hero .reveal", { y: 24, opacity: 0, duration: 0.8, stagger: 0.08 }, "-=0.7")
      .from(state, { y: 1.4, scale: 0.6, rotZ: 0.6, duration: 1.6, ease: "expo.out" }, 0)
      .from(".nav", { y: -30, opacity: 0, duration: 0.8 }, 0.2);
  }

  /* progress bar + nav glass */
  gsap.to(".progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
  ScrollTrigger.create({ start: 80, end: "max", toggleClass: { targets: ".nav", className: "is-scrolled" } });

  /* bottle: hero -> features */
  gsap.fromTo(state, pose("hero"), {
    ...pose("features"),
    ease: "power1.inOut", immediateRender: false,
    scrollTrigger: { trigger: ".features", start: "top bottom", end: "top top", scrub: 1, invalidateOnRefresh: true },
  });

  /* pinned feature story (desktop only, motion allowed) */
  const mm = gsap.matchMedia();
  mm.add({ desktop: "(min-width: 761px)", ok: "(prefers-reduced-motion: no-preference)" }, (ctx) => {
    const { desktop, ok } = ctx.conditions;
    const features = document.querySelector(".features");
    if (!desktop || !ok) { features.classList.add("features--static"); return; }
    features.classList.remove("features--static");

    const cards = gsap.utils.toArray(".feature");
    const dots = gsap.utils.toArray(".features__dots i");
    gsap.set(cards, { autoAlpha: 0, y: 60 });
    const base = poses.features();
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: {
        trigger: ".features__pin", pin: true, start: "top top", end: "+=" + cards.length * 90 + "%", scrub: 1,
        onUpdate: (self) => {
          const idx = Math.min(cards.length - 1, Math.floor(self.progress * cards.length));
          dots.forEach((d, i) => d.classList.toggle("is-on", i === idx));
        },
      },
    });
    // 01 cold core: slow turn
    tl.to(cards[0], { autoAlpha: 1, y: 0, duration: 0.5 })
      .to(state, { rotY: base.rotY + Math.PI, duration: 1 }, "<")
      .to(cards[0], { autoAlpha: 0, y: -60, duration: 0.5 }, "+=0.3")
    // 02 GlowCap: tilt toward viewer, glow brighter
      .to(cards[1], { autoAlpha: 1, y: 0, duration: 0.5 })
      .to(state, { rotZ: -0.35, y: -0.08, scale: 1.25, glow: 3, duration: 1 }, "<")
      .to(cards[1], { autoAlpha: 0, y: -60, duration: 0.5 }, "+=0.3")
    // 03 leakproof: flip it upside down
      .to(cards[2], { autoAlpha: 1, y: 0, duration: 0.5 })
      .to(state, { rotZ: Math.PI, y: 0, scale: 1.05, glow: 1, duration: 1.2, ease: "back.inOut(1.4)" }, "<")
      .to(cards[2], { autoAlpha: 0, y: -60, duration: 0.5 }, "+=0.3")
    // 04 recycled: upright, full spin
      .to(cards[3], { autoAlpha: 1, y: 0, duration: 0.5 })
      .to(state, { rotZ: base.rotZ, rotY: base.rotY + Math.PI * 3, duration: 1.2 }, "<")
      .to({}, { duration: 0.4 });
    return () => gsap.set(cards, { clearProps: "all" });
  });

  /* bottle: features -> shop (created after the pin so offsets include it) */
  gsap.to(state, {
    ...pose("shop"), glow: 1,
    ease: "power1.inOut", immediateRender: false,
    scrollTrigger: { trigger: ".shop", start: "top bottom", end: "center center", scrub: 1, invalidateOnRefresh: true },
  });

  /* generic reveals */
  ScrollTrigger.batch("main .reveal:not(.hero .reveal)", {
    start: "top 88%",
    once: true,
    onEnter: (els) => gsap.from(els, { y: reduceMotion ? 0 : 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }),
  });

  /* count-up stats */
  document.querySelectorAll("[data-count]").forEach((el) => {
    const end = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 85%", once: true,
      onEnter: () => gsap.to(obj, {
        v: end, duration: reduceMotion ? 0 : 2, ease: "power2.out",
        onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString() + suffix),
      }),
    });
  });

  /* nav anchor links: let native smooth scroll work, then refresh */
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

/* ----------------------------------------------------------
   Micro-interactions
   ---------------------------------------------------------- */
function initCursor() {
  if (!finePointer || reduceMotion) return;
  const cursor = document.querySelector(".cursor");
  const label = cursor.querySelector(".cursor__label");
  let mx = -100, my = -100, cx = -100, cy = -100;
  window.addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; cursor.classList.add("is-ready"); });
  document.addEventListener("pointerleave", () => cursor.classList.remove("is-ready"));
  (function loop() {
    cx += (mx - cx) * 0.18;
    cy += (my - cy) * 0.18;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll("[data-cursor]").forEach((el) => {
    el.addEventListener("pointerenter", () => { label.textContent = el.dataset.cursor; cursor.classList.add("is-active"); });
    el.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));
  });
}

function initMagnetic() {
  if (!finePointer || reduceMotion || !gsap) return;
  document.querySelectorAll(".magnetic").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.4, ease: "power3.out" });
    });
    el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" }));
  });
}

let toastTimer;
function toast(msg) {
  const t = document.querySelector(".toast");
  t.textContent = msg;
  t.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-visible"), 2600);
}

function initShop() {
  const nameEl = document.getElementById("color-name");
  const priceEl = document.getElementById("price");
  const selected = () => ({
    color: document.querySelector('input[name="color"]:checked'),
    size: document.querySelector('input[name="size"]:checked'),
  });

  document.querySelectorAll('input[name="color"]').forEach((input) =>
    input.addEventListener("change", () => {
      nameEl.textContent = input.value;
      nameEl.style.color = input.dataset.hex === "#24345c" ? "#8fa8e8" : input.dataset.hex;
      if (gsap && !reduceMotion) gsap.fromTo(nameEl, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "back.out(2)" });
      if (bottle) bottle.setColor(input.dataset.hex);
    })
  );
  nameEl.style.color = "#6fe0d0";

  document.querySelectorAll('input[name="size"]').forEach((input) =>
    input.addEventListener("change", () => {
      priceEl.textContent = "$" + input.dataset.price;
      if (gsap && !reduceMotion) gsap.fromTo(priceEl, { scale: 1.25 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      if (gsap) gsap.to(state, { scale: { "500 ml": 0.92, "750 ml": 1.05, "1 L": 1.18 }[input.value] * (isMobile() ? 0.6 : 1), duration: 0.6, ease: "back.out(1.6)" });
    })
  );

  document.getElementById("add-to-cart").addEventListener("click", () => {
    const { color, size } = selected();
    toast(`Added ${color.value} · ${size.value} to your bag`);
    if (gsap && !reduceMotion) gsap.to(state, { spin: state.spin + Math.PI * 2, duration: 1.2, ease: "power3.inOut" });
  });

  const form = document.getElementById("signup");
  const msg = document.querySelector(".signup__msg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    msg.classList.toggle("is-error", !valid);
    msg.textContent = valid ? "You're in. Check your inbox for 10% off." : "That email doesn't look right — try again?";
    if (valid) form.reset();
  });
}

/* boot */
initScroll();
initCursor();
initMagnetic();
initShop();
initThree();
