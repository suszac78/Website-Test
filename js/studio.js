/* Studio: upload a design, place it on a garment, add it to the shop */
(function () {
  const gsap = window.gsap;
  const { $, $$ } = HD;

  const defaults = {
    hoodie: { placement: { scale: 0.9, x: 0, y: 0 }, price: 72, colors: ["black"] },
    tee: { placement: { scale: 0.9, x: 0, y: 0 }, price: 36, colors: ["bone"] },
    pants: { placement: { scale: 1, x: 0, y: 0 }, price: 68, colors: ["black"] },
  };
  const MAX_PX = 1600;
  const MAX_MB = 15;

  const state = {
    image: "", fileName: "", type: "hoodie",
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
    state.image = data;
    state.fileName = file.name;
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
      design: state.image,
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
    Object.assign(state, { image: "", fileName: "", editingId: null, priceTouched: false, colors: ["black"], previewColor: "black" });
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
      image: p.design, fileName: p.name, editingId: p.id, priceTouched: true,
      colors: [...p.colors], previewColor: p.colors[0], placement: { ...p.placement },
    });
    $("#p-name").value = p.name;
    $("#p-price").value = p.price;
    $("#p-desc").value = p.description || "";
    $("#save").textContent = "Save changes";
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
      state.image = ""; state.fileName = ""; $("#file").value = "";
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
        design: state.image,
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
