/* Shared behaviour for every page: nav, reveals, cursor, magnetic buttons, toast, product cards */
window.HD = window.HD || {};

(function () {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  HD.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  HD.finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  HD.$ = $;
  HD.$$ = $$;
  HD.esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* ---------- nav ---------- */
  function initNav() {
    const nav = $(".nav");
    if (!nav) return;
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const here = document.body.dataset.page;
    $$(".nav__links a").forEach((a) => a.dataset.page === here && a.setAttribute("aria-current", "page"));

    const toggle = $(".nav__toggle");
    const menu = $(".nav__menu");
    if (toggle && menu) {
      toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        menu.classList.toggle("is-open", !open);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menu.classList.contains("is-open")) { toggle.click(); toggle.focus(); }
      });
    }
    const y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- scroll reveals ---------- */
  HD.reveal = function (scope = document) {
    const els = $$(".reveal:not(.is-in)", scope);
    if (!gsap || !ScrollTrigger || HD.reduceMotion) { els.forEach((e) => e.classList.add("is-in")); return; }
    els.forEach((e) => e.classList.add("is-in"));
    ScrollTrigger.batch(els, {
      start: "top 90%",
      once: true,
      onEnter: (batch) => gsap.fromTo(batch, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.08, ease: "power3.out", overwrite: true }),
    });
    // hide only what's below the fold so nothing above flickers
    els.forEach((e) => { if (e.getBoundingClientRect().top > window.innerHeight * 0.9) gsap.set(e, { autoAlpha: 0 }); });
  };

  /* ---------- cursor + magnetic buttons ---------- */
  function initCursor() {
    if (!HD.finePointer || HD.reduceMotion) return;
    const cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<span class="cursor__label"></span>';
    document.body.appendChild(cursor);
    const label = cursor.firstChild;
    let mx = -100, my = -100, cx = -100, cy = -100;
    window.addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; cursor.classList.add("is-ready"); });
    document.addEventListener("pointerleave", () => cursor.classList.remove("is-ready"));
    (function loop() {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener("pointerover", (e) => {
      const el = e.target.closest("[data-cursor]");
      if (el) { label.textContent = el.dataset.cursor; cursor.classList.add("is-active"); }
    });
    document.addEventListener("pointerout", (e) => {
      const el = e.target.closest("[data-cursor]");
      if (el && !el.contains(e.relatedTarget)) cursor.classList.remove("is-active");
    });
  }

  HD.magnetic = function (scope = document) {
    if (!HD.finePointer || HD.reduceMotion || !gsap) return;
    $$(".magnetic", scope).forEach((el) => {
      if (el.dataset.mag) return;
      el.dataset.mag = "1";
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: "power3.out" });
      });
      el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" }));
    });
  };

  /* ---------- tilt on product tiles (lightweight 3D) ---------- */
  HD.tilt = function (scope = document) {
    if (!HD.finePointer || HD.reduceMotion) return;
    $$("[data-tilt]", scope).forEach((el) => {
      if (el.dataset.tiltOn) return;
      el.dataset.tiltOn = "1";
      const inner = el.querySelector(".tilt-inner") || el;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = `perspective(900px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) scale(1.03)`;
      });
      el.addEventListener("pointerleave", () => (inner.style.transform = ""));
    });
  };

  /* ---------- toast ---------- */
  let toastTimer;
  HD.toast = function (html) {
    let t = $(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      document.body.appendChild(t);
    }
    t.innerHTML = html;
    t.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-visible"), 3200);
  };

  /* ---------- product card ---------- */
  HD.card = function (p) {
    const colors = p.colors.map((c) => HD.colors[c] || { name: c, hex: c });
    const tag = p.mine ? "Your design" : p.tag;
    return `<article class="card reveal" data-type="${p.type}">
  <a class="card__link" href="product.html?id=${encodeURIComponent(p.id)}" data-cursor="View" aria-label="${HD.esc(p.name)}, ${HD.money(p.price)}">
    <div class="card__media" data-tilt>
      <div class="tilt-inner">${HD.productMockup(p, p.colors[0])}</div>
      ${tag ? `<span class="tag${p.mine ? " tag--mine" : ""}">${HD.esc(tag)}</span>` : ""}
    </div>
    <div class="card__info">
      <div>
        <h3 class="card__name">${HD.esc(p.name)}</h3>
        <p class="card__type">${HD.types[p.type].label} · ${colors.length} color${colors.length > 1 ? "s" : ""}</p>
      </div>
      <p class="card__price">${HD.money(p.price)}</p>
    </div>
  </a>
  <div class="card__swatches" role="group" aria-label="Preview colors">
    ${colors.map((c, i) => `<button type="button" class="dot${i === 0 ? " is-on" : ""}" style="--c:${c.hex}" data-color="${HD.esc(p.colors[i])}" aria-label="Preview in ${HD.esc(c.name)}" aria-pressed="${i === 0}"></button>`).join("")}
  </div>
</article>`;
  };

  /* color dots on cards swap the preview */
  HD.bindCards = function (scope, products) {
    scope.addEventListener("click", (e) => {
      const dot = e.target.closest(".dot");
      if (!dot) return;
      const card = dot.closest(".card");
      const id = decodeURIComponent(card.querySelector(".card__link").getAttribute("href").split("id=")[1]);
      const p = products.find((x) => x.id === id);
      if (!p) return;
      card.querySelector(".tilt-inner").innerHTML = HD.productMockup(p, dot.dataset.color);
      card.querySelectorAll(".dot").forEach((d) => { d.classList.toggle("is-on", d === dot); d.setAttribute("aria-pressed", String(d === dot)); });
      card.querySelector(".card__link").href = `product.html?id=${encodeURIComponent(p.id)}&color=${dot.dataset.color}`;
    });
    HD.tilt(scope);
    HD.reveal(scope);
  };

  /* ---------- newsletter forms ---------- */
  function initSignup() {
    $$(".signup").forEach((form) => {
      const msg = form.parentElement.querySelector(".signup__msg");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim());
        if (msg) {
          msg.classList.toggle("is-error", !ok);
          msg.textContent = ok ? "You're on the list. We'll tell you the moment the shop opens." : "That email doesn't look right. Try again?";
        }
        if (ok) form.reset();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initCursor();
    initSignup();
    HD.magnetic();
    HD.reveal();
  });
})();
