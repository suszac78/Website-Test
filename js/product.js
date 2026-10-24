/* Product page */
(function () {
  const gsap = window.gsap;
  const { $, $$ } = HD;

  const sizeTables = {
    hoodie: { head: ["Size", "Chest (in)", "Length (in)"], rows: [["XS", "40", "26"], ["S", "43", "27"], ["M", "46", "28"], ["L", "49", "29"], ["XL", "52", "30"], ["XXL", "55", "31"]] },
    tee: { head: ["Size", "Chest (in)", "Length (in)"], rows: [["XS", "38", "26"], ["S", "41", "27"], ["M", "44", "28"], ["L", "47", "29"], ["XL", "50", "30"], ["XXL", "53", "31"]] },
    pants: { head: ["Size", "Waist (in)", "Inseam (in)"], rows: [["S", "28–30", "29"], ["M", "31–33", "30"], ["L", "34–36", "31"], ["XL", "37–39", "32"]] },
  };

  document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(location.search);
    const p = await HD.findProduct(params.get("id") || "");
    if (!p) {
      $("#pdp").hidden = true;
      $("#pdp-missing").hidden = false;
      $("#crumb-name").textContent = "Not found";
      return;
    }

    let color = p.colors.includes(params.get("color")) ? params.get("color") : p.colors[0];
    let view = "full";
    const type = HD.types[p.type];

    document.title = `${p.name} — HydrateDifferent`;
    $("#crumb-type").textContent = type.plural;
    $("#crumb-type").href = `shop.html?type=${p.type}`;
    $("#crumb-name").textContent = p.name;
    $("#pdp-type").textContent = type.label + (p.mine ? " · Your design" : "");
    $("#pdp-name").textContent = p.name;
    $("#pdp-price").textContent = HD.money(p.price);
    $("#pdp-desc").textContent = p.description || `Your design on our ${type.label.toLowerCase()}.`;
    $("#pdp-fabric").textContent = HD.typeDetails[p.type].fabric;
    $("#pdp-care").textContent = HD.typeDetails[p.type].care;

    const t = sizeTables[p.type];
    $("#pdp-size-table").innerHTML = `<table class="size-table"><thead><tr>${t.head.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((c, i) => (i ? `<td>${c}</td>` : `<th scope="row">${c}</th>`)).join("")}</tr>`).join("")}</tbody></table>`;

    // colors
    $("#pdp-colors").innerHTML = p.colors.map((c) => {
      const col = HD.colors[c];
      return `<label class="swatch" style="--c:${col.hex}"><input type="radio" name="color" value="${c}" ${c === color ? "checked" : ""} /><span></span><em>${col.name}</em></label>`;
    }).join("");

    // sizes
    $("#pdp-sizes").innerHTML = type.sizes.map((s, i) =>
      `<label class="size"><input type="radio" name="size" value="${s}" ${s === "M" ? "checked" : ""} /><span>${s}</span></label>`
    ).join("");

    function draw(animate) {
      $("#pdp-color-name").textContent = HD.colors[color].name;
      const main = $("#pdp-main");
      main.innerHTML = HD.productMockup(p, color, view);
      $$(".thumb").forEach((b) => (b.innerHTML = HD.productMockup(p, color, b.dataset.view)));
      if (animate && gsap && !HD.reduceMotion) gsap.fromTo(main.firstElementChild, { scale: 0.96, autoAlpha: 0.4 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "power3.out" });
    }
    draw(false);

    $("#pdp-colors").addEventListener("change", (e) => {
      color = e.target.value;
      const url = new URL(location.href);
      url.searchParams.set("color", color);
      history.replaceState(null, "", url);
      draw(true);
    });
    $$(".thumb").forEach((b) => b.addEventListener("click", () => {
      view = b.dataset.view;
      $$(".thumb").forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
      draw(true);
    }));
    $("#size-guide-btn").addEventListener("click", () => {
      const d = $("#size-guide");
      d.open = true;
      d.scrollIntoView({ behavior: HD.reduceMotion ? "auto" : "smooth", block: "center" });
    });

    // related: same type first, then others
    const all = await HD.allProducts();
    const related = [...all.filter((x) => x.type === p.type && x.id !== p.id), ...all.filter((x) => x.type !== p.type)].slice(0, 4);
    const grid = $("#related");
    grid.innerHTML = related.map(HD.card).join("");
    HD.bindCards(grid, related);

    if (gsap && !HD.reduceMotion) {
      gsap.from(".pdp__gallery", { x: -30, autoAlpha: 0, duration: 0.9, ease: "power3.out" });
      gsap.from(".pdp__info > *", { y: 20, autoAlpha: 0, duration: 0.7, stagger: 0.05, ease: "power3.out", delay: 0.1 });
    }
  });
})();
