/* Shop page: filter + sort */
(function () {
  const { $, $$ } = HD;

  document.addEventListener("DOMContentLoaded", async () => {
    const all = await HD.allProducts();
    const params = new URLSearchParams(location.search);
    let type = HD.types[params.get("type")] ? params.get("type") : "all";
    let sort = "featured";

    // counts on chips
    $$(".chip").forEach((c) => {
      const t = c.dataset.type;
      c.querySelector("span").textContent = t === "all" ? all.length : all.filter((p) => p.type === t).length;
    });

    const grid = $("#grid");
    HD.bindCards(grid, all);

    function render() {
      let list = type === "all" ? [...all] : all.filter((p) => p.type === type);
      if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
      if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
      if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));

      const label = type === "all" ? "Shop all" : HD.types[type].plural;
      $("#shop-title").textContent = label;
      $("#crumb-current").textContent = label;
      document.title = `${label} — HydrateDifferent`;
      $("#shop-sub").textContent = type === "all" ? "Every piece in Collection 01." : `${list.length} ${list.length === 1 ? "piece" : "pieces"} in ${HD.types[type].plural.toLowerCase()}.`;
      $$(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.type === type)));
      $("#result-count").textContent = `${list.length} products`;

      grid.innerHTML = list.length ? list.map(HD.card).join("") : `<p class="empty">Nothing here yet.</p>`;
      HD.tilt(grid);
      HD.reveal(grid);
    }

    $$(".chip").forEach((c) => c.addEventListener("click", () => {
      type = c.dataset.type;
      const url = new URL(location.href);
      type === "all" ? url.searchParams.delete("type") : url.searchParams.set("type", type);
      history.replaceState(null, "", url);
      render();
    }));
    $("#sort").addEventListener("change", (e) => { sort = e.target.value; render(); });

    render();
  });
})();
