/* Studio: upload a design, place it on a garment, add it to the shop */
(function () {
  const gsap = window.gsap;
  const { $, $$ } = HD;

  const defaults = {
    hoodie: { placement: { scale: 0.9, x: 0, y: -0.05 }, price: 75 },
    tee: { placement: { scale: 0.9, x: 0, y: -0.1 }, price: 35 },
    pants: { placement: { scale: 1, x: 0, y: 0 }, price: 70 },
  };
  const MAX_PX = 1600;
  const MAX_MB = 15;

  const state = {
    image: "", original: "", knockout: false, lightImage: "", invert: false, fileName: "", type: "hoodie",
    colors: ["black"], previewColor: "black",
    placement: { ...defaults.hoodie.placement },
    view: "full", editingId: null, priceTouched: false,
  };

  /* ---------- reading the file ---------- */
  function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }

  // shrink big photos so they save quickly; keeps PNG transparency
  function downscale(dataURL, mime) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, MAX_PX / Math.max(img.width, img.height));
        if (k === 1) return resolve(dataURL);
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL(mime === "image/jpeg" ? "image/jpeg" : "image/png", 0.9));
      };
      img.onerror = () => resolve(dataURL);
      img.src = dataURL;
    });
  }

  // load an image and return its pixels on a canvas
  function toCanvas(dataURL) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || 1200, h = img.naturalHeight || 1200;
        const k = Math.min(1, MAX_PX / Math.max(w, h));
        const c = document.createElement("canvas");
        c.width = Math.round(w * k); c.height = Math.round(h * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c);
      };
      img.onerror = reject;
      img.src = dataURL;
    });
  }

  // black copy of the design (keeps transparency) for light fabrics
  async function makeDark(dataURL) {
    const c = await toCanvas(dataURL);
    const ctx = c.getContext("2d");
    const d = ctx.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < d.data.length; i += 4) { d.data[i] = 14; d.data[i + 1] = 14; d.data[i + 2] = 16; }
    ctx.putImageData(d, 0, 0);
    return c.toDataURL("image/png");
  }

  // is the design mostly white? (then it needs a dark version on light fabric)
  async function isMostlyLight(dataURL) {
    try {
      const c = await toCanvas(dataURL);
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let sum = 0, n = 0;
      for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 128) { sum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; n++; }
      return n > 0 && sum / n > 0.85;
    } catch { return false; }
  }

  // solid background? (all four corners the same opaque color)
  async function findBackground(dataURL) {
    try {
      const c = await toCanvas(dataURL);
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      const px = (x, y) => { const i = (y * c.width + x) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; };
      const m = 2, W = c.width - 1 - m, H = c.height - 1 - m;
      const corners = [px(m, m), px(W, m), px(m, H), px(W, H)];
      if (corners.some((p) => p[3] < 250)) return null;
      const bg = [0, 1, 2].map((k) => corners.reduce((s, p) => s + p[k], 0) / 4);
      const same = corners.every((p) => [0, 1, 2].every((k) => Math.abs(p[k] - bg[k]) < 18));
      return same ? bg : null;
    } catch { return null; }
  }

  // turn the background color transparent, keeping soft edges
  async function knockout(dataURL, bg) {
    const c = await toCanvas(dataURL);
    const ctx = c.getContext("2d");
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const dist = Math.max(Math.abs(d[i] - bg[0]), Math.abs(d[i + 1] - bg[1]), Math.abs(d[i + 2] - bg[2]));
      const a = Math.max(0, Math.min(1, (dist - 28) / 150));
      if (a > 0) for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, (d[i + k] - bg[k] * (1 - a)) / a));
      d[i + 3] = Math.round(a * d[i + 3]);
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL("image/png");
  }

  // crop away fully transparent edges so the design fills its print area
  async function trim(dataURL) {
    const c = await toCanvas(dataURL);
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      if (d[(y * c.width + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0 || (x0 <= 1 && y0 <= 1 && x1 >= c.width - 2 && y1 >= c.height - 2)) return dataURL;
    const pad = 4;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(c.width - 1, x1 + pad); y1 = Math.min(c.height - 1, y1 + pad);
    const out = document.createElement("canvas");
    out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
    out.getContext("2d").drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    return out.toDataURL("image/png");
  }

  async function applyKnockout() {
    state.image = state.knockout && state.bg ? await trim(await knockout(state.original, state.bg)) : state.original;
    state.lightImage = "";
    $("#file-thumb").src = state.image;
    await setInvert(state.invert);
  }

  async function setInvert(on) {
    state.invert = on;
    $("#p-invert").checked = on;
    if (on && state.image && !state.lightImage) {
      try { state.lightImage = await makeDark(state.image); } catch { state.lightImage = ""; }
    }
    draw(false);
  }

  const designValue = () => (state.invert && state.lightImage ? { dark: state.image, light: state.lightImage } : state.image);

  async function handleFile(file) {
    const err = $("#file-error");
    err.textContent = "";
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) {
      err.textContent = "That file type isn't supported. Use PNG, JPG, WEBP or SVG.";
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      err.textContent = `That file is over ${MAX_MB} MB. Try a smaller export.`;
      return;
    }
    let data = await readAsDataURL(file);
    if (file.type !== "image/svg+xml") data = await downscale(data, file.type);
    state.original = data;
    state.fileName = file.name;
    state.bg = file.type === "image/svg+xml" ? null : await findBackground(data);
    state.knockout = !!state.bg;
    $("#knockout-row").hidden = !state.bg;
    $("#p-knockout").checked = state.knockout;
    state.image = state.knockout ? await knockout(data, state.bg) : data;
    if (file.type !== "image/svg+xml") state.image = await trim(state.image);
    state.lightImage = "";
    await setInvert(await isMostlyLight(state.image));
    if (!$("#p-name").value) {
      const base = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
      $("#p-name").value = (base.charAt(0).toUpperCase() + base.slice(1)).slice(0, 28) + " " + HD.types[state.type].label;
    }
    showFile();
    draw(true);
  }

  function showFile() {
    const has = !!state.image;
    $("#file-info").hidden = !has;
    $("#drop").hidden = has;
    $("#download").disabled = !has;
    if (has) {
      $("#file-thumb").src = state.image;
      $("#file-name").textContent = state.fileName || "Your design";
    }
  }

  /* ---------- preview ---------- */
  function draw(pop) {
    const box = $("#preview");
    box.innerHTML = HD.mockup({
      type: state.type,
      color: state.previewColor,
      design: designValue(),
      placement: state.placement,
      view: state.view,
      guide: !state.image || dragging,
      title: "Preview",
    });
    if (!state.image) {
      box.insertAdjacentHTML("beforeend", `<p class="studio__empty">Your design shows up here</p>`);
    }
    if (pop && gsap && !HD.reduceMotion) gsap.fromTo(box.firstElementChild, { scale: 0.96, autoAlpha: 0.5 }, { scale: 1, autoAlpha: 1, duration: 0.45, ease: "power3.out" });
  }

  function syncSliders() {
    $("#p-scale").value = state.placement.scale;
    $("#p-x").value = state.placement.x;
    $("#p-y").value = state.placement.y;
  }

  /* drag the design straight on the preview */
  let dragging = false;
  function initDrag() {
    const box = $("#preview");
    let start = null;
    box.addEventListener("pointerdown", (e) => {
      if (!state.image) return;
      const svg = box.querySelector("svg");
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      start = { x: e.clientX, y: e.clientY, px: state.placement.x, py: state.placement.y, k: ctm.a };
      dragging = true;
      box.setPointerCapture(e.pointerId);
      box.classList.add("is-dragging");
    });
    box.addEventListener("pointermove", (e) => {
      if (!start) return;
      const pr = HD.garments[state.type].print;
      const clamp = (v) => Math.max(-0.6, Math.min(0.6, v));
      state.placement.x = +clamp(start.px + (e.clientX - start.x) / start.k / pr.w).toFixed(3);
      state.placement.y = +clamp(start.py + (e.clientY - start.y) / start.k / pr.h).toFixed(3);
      syncSliders();
      draw(false);
    });
    const end = () => {
      if (!start) return;
      start = null;
      dragging = false;
      box.classList.remove("is-dragging");
      draw(false);
    };
    box.addEventListener("pointerup", end);
    box.addEventListener("pointercancel", end);
  }

  /* ---------- controls ---------- */
  function renderColors() {
    $("#color-picks").innerHTML = Object.entries(HD.colors).map(([key, c]) =>
      `<button type="button" class="swatch swatch--btn" style="--c:${c.hex}" data-color="${key}" aria-pressed="${state.colors.includes(key)}"><span></span><em>${c.name}</em></button>`
    ).join("");
  }

  function setType(type, keepPlacement) {
    state.type = type;
    $$("#type-seg button").forEach((b) => {
      const on = b.dataset.type === type;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-checked", String(on));
    });
    if (!keepPlacement) state.placement = { ...defaults[type].placement };
    if (!state.priceTouched) $("#p-price").value = defaults[type].price;
    const name = $("#p-name");
    Object.values(HD.types).forEach((t) => {
      if (name.value.endsWith(" " + t.label)) name.value = name.value.slice(0, -t.label.length) + HD.types[type].label;
    });
    syncSliders();
    draw(true);
  }

  function resetForm() {
    $("#knockout-row").hidden = true;
    Object.assign(state, { image: "", original: "", bg: null, knockout: false, lightImage: "", invert: false, fileName: "", editingId: null, priceTouched: false, colors: ["black"], previewColor: "black" });
    $("#studio-form").reset();
    $("#file").value = "";
    $("#save").textContent = "Add to shop";
    renderColors();
    setType("hoodie");
    showFile();
  }

  /* ---------- your designs ---------- */
  async function renderMine() {
    const list = await HD.store.all();
    const box = $("#mine");
    if (!list.length) {
      box.innerHTML = `<p class="mine__empty">Nothing yet. Upload a design above to get started.</p>`;
      return;
    }
    box.innerHTML = list.map((p) => `
      <article class="mine__item">
        <a href="product.html?id=${encodeURIComponent(p.id)}" class="mine__media" aria-label="View ${HD.esc(p.name)}">${HD.productMockup(p, p.colors[0])}</a>
        <div class="mine__info">
          <h3>${HD.esc(p.name)}</h3>
          <p>${HD.types[p.type].label} · ${HD.money(p.price)} · ${p.colors.length} color${p.colors.length > 1 ? "s" : ""}</p>
          <div class="mine__actions">
            <a href="product.html?id=${encodeURIComponent(p.id)}">View</a>
            <button type="button" class="link-btn" data-edit="${p.id}">Edit</button>
            <button type="button" class="link-btn link-btn--danger" data-del="${p.id}">Delete</button>
          </div>
        </div>
      </article>`).join("");
  }

  async function editProduct(id) {
    const p = await HD.store.get(id);
    if (!p) return;
    Object.assign(state, {
      image: typeof p.design === "object" ? p.design.dark : p.design,
      lightImage: typeof p.design === "object" ? p.design.light : "",
      invert: typeof p.design === "object",
      fileName: p.name, editingId: p.id, priceTouched: true,
      bg: null, knockout: false,
      colors: [...p.colors], previewColor: p.colors[0], placement: { ...p.placement },
    });
    $("#p-name").value = p.name;
    $("#p-price").value = p.price;
    $("#p-desc").value = p.description || "";
    $("#save").textContent = "Save changes";
    $("#p-invert").checked = state.invert;
    state.original = state.image;
    $("#knockout-row").hidden = true;
    renderColors();
    setType(p.type, true);
    showFile();
    window.scrollTo({ top: 0, behavior: HD.reduceMotion ? "auto" : "smooth" });
  }

  /* ---------- download the mockup as a PNG ---------- */
  function downloadPNG() {
    const svg = $("#preview svg");
    if (!svg) return;
    const vb = svg.viewBox.baseVal;
    const W = 1600, H = Math.round((W * vb.height) / vb.width);
    const clone = svg.cloneNode(true);
    clone.setAttribute("width", W);
    clone.setAttribute("height", H);
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#eef2f3";
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      const a = document.createElement("a");
      const name = ($("#p-name").value || "mockup").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      a.download = `${name}-${state.previewColor}.png`;
      a.href = c.toDataURL("image/png");
      a.click();
    };
    img.onerror = () => HD.toast("Couldn't create the image in this browser.");
    img.src = url;
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderColors();
    syncSliders();
    draw(false);
    initDrag();
    renderMine();

    // upload
    $("#file").addEventListener("change", (e) => handleFile(e.target.files[0]));
    const drop = $("#drop");
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("is-over"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("is-over"); }));
    drop.addEventListener("drop", (e) => handleFile(e.dataTransfer.files[0]));
    $("#file-clear").addEventListener("click", () => {
      state.image = ""; state.original = ""; state.bg = null; state.lightImage = ""; state.fileName = ""; $("#file").value = "";
      $("#knockout-row").hidden = true;
      showFile(); draw(true);
    });

    // piece
    $$("#type-seg button").forEach((b) => b.addEventListener("click", () => setType(b.dataset.type)));

    // colors (multi-select; the last one clicked is previewed)
    $("#color-picks").addEventListener("click", (e) => {
      const b = e.target.closest("[data-color]");
      if (!b) return;
      const key = b.dataset.color;
      const on = state.colors.includes(key);
      if (on && state.previewColor !== key) {
        state.previewColor = key;                    // already picked: just preview it
      } else if (on && state.colors.length > 1) {
        state.colors = state.colors.filter((c) => c !== key);
        state.previewColor = state.colors[0];
      } else if (!on) {
        state.colors.push(key);
        state.previewColor = key;
      }
      renderColors();
      draw(true);
    });

    // placement
    [["#p-scale", "scale"], ["#p-x", "x"], ["#p-y", "y"]].forEach(([sel, key]) =>
      $(sel).addEventListener("input", (e) => { state.placement[key] = +e.target.value; draw(false); })
    );
    $("#p-reset").addEventListener("click", () => { state.placement = { ...defaults[state.type].placement }; syncSliders(); draw(true); });

    // view toggle
    $$(".studio__previewbar .seg button").forEach((b) => b.addEventListener("click", () => {
      state.view = b.dataset.view;
      $$(".studio__previewbar .seg button").forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
      draw(true);
    }));

    $("#p-price").addEventListener("input", () => (state.priceTouched = true));
    $("#p-invert").addEventListener("change", (e) => setInvert(e.target.checked));
    $("#p-knockout").addEventListener("change", (e) => { state.knockout = e.target.checked; applyKnockout(); });
    $("#download").addEventListener("click", downloadPNG);

    // save
    $("#studio-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $("#form-error");
      err.textContent = "";
      const name = $("#p-name").value.trim();
      const price = Math.round(+$("#p-price").value);
      if (!state.image) { $("#file-error").textContent = "Upload a design first."; $("#drop").focus?.(); return; }
      if (!name) { err.textContent = "Give your product a name."; $("#p-name").focus(); return; }
      if (!(price >= 1 && price <= 999)) { err.textContent = "Enter a price between $1 and $999."; $("#p-price").focus(); return; }

      const old = state.editingId ? await HD.store.get(state.editingId) : null;
      const product = {
        id: state.editingId || "u-" + Date.now().toString(36),
        name, price, type: state.type,
        colors: [...state.colors],
        design: designValue(),
        placement: { ...state.placement },
        description: $("#p-desc").value.trim(),
        created: old ? old.created : Date.now(),
      };
      try {
        await HD.store.put(product);
      } catch (ex) {
        err.textContent = "Couldn't save. Your browser may be out of storage space, or blocks saving in private mode.";
        return;
      }
      HD.toast(`${state.editingId ? "Saved" : "Added"} <strong>${HD.esc(name)}</strong> · <a href="product.html?id=${encodeURIComponent(product.id)}">View it</a>`);
      resetForm();
      renderMine();
    });

    // your designs
    $("#mine").addEventListener("click", async (e) => {
      const edit = e.target.closest("[data-edit]");
      const del = e.target.closest("[data-del]");
      if (edit) editProduct(edit.dataset.edit);
      if (del && confirm("Delete this design from the shop?")) {
        await HD.store.remove(del.dataset.del);
        if (state.editingId === del.dataset.del) resetForm();
        renderMine();
      }
    });
  });
})();
