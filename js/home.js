/* Home page */
(function () {
  const gsap = window.gsap;
  const { $, $$ } = HD;

  document.addEventListener("DOMContentLoaded", async () => {
    // hero pieces
    const hero = {
      hoodie: HD.products.find((p) => p.id === "core-hoodie"),
      tee: HD.products.find((p) => p.id === "dtd-tee"),
      pants: HD.products.find((p) => p.id === "track-pants"),
    };
    const wrap = (svg) => `<div class="hp-par"><div class="hp-float">${svg}</div></div>`;
    $(".hero__piece--hoodie").innerHTML = wrap(HD.productMockup(hero.hoodie, "black"));
    $(".hero__piece--tee").innerHTML = wrap(HD.productMockup(hero.tee, "white"));
    $(".hero__piece--pants").innerHTML = wrap(HD.productMockup(hero.pants, "charcoal"));

    // categories
    const cats = [
      { type: "hoodie", product: HD.products.find((p) => p.id === "sunrise-hoodie"), color: "black" },
      { type: "tee", product: HD.products.find((p) => p.id === "logo-tee"), color: "dawn" },
      { type: "pants", product: HD.products.find((p) => p.id === "track-pants"), color: "black" },
    ];
    $("#cats").innerHTML = cats.map(({ type, product, color }) => {
      const from = Math.min(...HD.products.filter((p) => p.type === type).map((p) => p.price));
      return `<a class="cat reveal" href="shop.html?type=${type}" data-cursor="Shop">
        <div class="cat__media" data-tilt><div class="tilt-inner">${HD.productMockup(product, color)}</div></div>
        <div class="cat__info"><h3>${HD.types[type].plural}</h3><span>From ${HD.money(from)} →</span></div>
      </a>`;
    }).join("");

    // featured
    const all = await HD.allProducts();
    const featured = all.slice(0, 4);
    const grid = $("#featured");
    grid.innerHTML = featured.map(HD.card).join("");
    HD.bindCards(grid, featured);
    HD.tilt($("#cats"));
    HD.reveal();

    if (!gsap || HD.reduceMotion) return;

    // hero intro
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".hero__title .line > span", { yPercent: 110, duration: 1.1, stagger: 0.1 })
      .from(".hero .eyebrow, .hero__sub, .hero__cta", { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, "-=0.7")
      .from(".hero__piece", { y: 120, autoAlpha: 0, rotate: (i) => [-14, 18, -10][i], duration: 1.4, stagger: 0.12, ease: "expo.out" }, 0.1)
      .from(".hero__blob", { scale: 0.4, autoAlpha: 0, duration: 1.6, ease: "expo.out" }, 0)
      .from(".nav", { y: -30, autoAlpha: 0, duration: 0.8 }, 0.2);

    // gentle float + pointer parallax
    $$(".hp-float").forEach((el, i) => {
      gsap.to(el, { y: -14, duration: 2.6 + i * 0.4, yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 0.3 });
    });
    if (HD.finePointer) {
      const pieces = $$(".hero__piece");
      window.addEventListener("pointermove", (e) => {
        const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
        pieces.forEach((el) => gsap.to(el.firstElementChild, { x: x * 30 * el.dataset.depth, y: y * 24 * el.dataset.depth, duration: 1, ease: "power3.out", overwrite: "auto" }));
      });
    }

    // hero pieces drift apart as you scroll away
    gsap.to(".hero__stage", {
      yPercent: 18, scale: 0.92, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
    });
  });
})();
