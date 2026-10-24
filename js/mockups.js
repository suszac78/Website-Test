/* Garment mockups drawn as SVG so any color + any design can be shown.
   HD.mockup({ type, color, design, placement, view }) -> SVG markup string
   view: "full" (default) or "detail" (zoomed on the print)
*/
window.HD = window.HD || {};

(function () {
  let uid = 0;

  // Each garment: outline path, extra detail paths, and the print area (x, y, w, h).
  const garments = {
    tee: {
      viewBox: "0 0 400 440",
      body: "M150,36 C165,62 235,62 250,36 L322,58 L394,128 L350,178 L316,152 L316,412 C240,424 160,424 84,412 L84,152 L50,178 L6,128 L78,58 Z",
      back: "",
      lines: [
        { d: "M150,36 C165,62 235,62 250,36", w: 9, o: 0.28 },               // collar rib
        { d: "M84,152 L84,130", w: 1.5, o: 0.18 },
        { d: "M316,152 L316,130", w: 1.5, o: 0.18 },
        { d: "M54,170 L14,130", w: 1.5, o: 0.14 },                          // sleeve hems
        { d: "M346,170 L386,130", w: 1.5, o: 0.14 },
        { d: "M88,402 C160,412 240,412 312,402", w: 1.5, o: 0.16 },          // bottom hem
        { d: "M120,180 C130,260 120,330 112,400", w: 6, o: 0.05 },           // folds
        { d: "M282,190 C272,270 286,330 290,398", w: 6, o: 0.05 },
      ],
      print: { x: 128, y: 104, w: 144, h: 170 },
    },
    hoodie: {
      viewBox: "0 0 400 460",
      back: "M128,74 C112,8 288,8 272,74 Z",
      body: "M132,64 C150,100 250,100 268,64 L330,80 C364,96 378,142 386,250 L392,386 L350,390 L338,256 L326,188 L326,404 L74,404 L74,188 L62,256 L50,390 L8,386 L14,250 C22,142 36,96 70,80 Z",
      lines: [
        { d: "M148,64 C160,114 240,114 252,64", w: 3, o: 0.25 },             // hood opening
        { d: "M184,100 L180,156", w: 3, o: 0.35, cap: true },                // drawstrings
        { d: "M216,100 L220,156", w: 3, o: 0.35, cap: true },
        { d: "M126,300 L274,300 L292,384 L108,384 Z", w: 2, o: 0.2 },        // kangaroo pocket
        { d: "M74,188 L74,170", w: 1.5, o: 0.18 },
        { d: "M326,188 L326,170", w: 1.5, o: 0.18 },
        { d: "M110,200 C120,260 112,330 104,380", w: 7, o: 0.05 },
        { d: "M292,206 C282,270 294,330 298,380", w: 7, o: 0.05 },
      ],
      bands: [
        "M74,404 L326,404 L326,432 C240,440 160,440 74,432 Z",              // waistband
        "M8,386 L50,390 L48,420 L6,416 Z",                                   // cuffs
        "M392,386 L350,390 L352,420 L394,416 Z",
      ],
      inner: "M150,66 C162,110 238,110 250,66 C236,86 164,86 150,66 Z",
      print: { x: 134, y: 132, w: 132, h: 150 },
    },
    pants: {
      viewBox: "0 0 400 460",
      back: "",
      body: "M112,46 L288,46 C304,180 302,330 288,412 L214,412 L200,150 L186,412 L112,412 C98,330 96,180 112,46 Z",
      lines: [
        { d: "M200,62 L200,150", w: 1.5, o: 0.2 },                           // fly seam
        { d: "M122,62 C140,90 150,110 152,130", w: 1.5, o: 0.22 },           // pockets
        { d: "M278,62 C260,90 250,110 248,130", w: 1.5, o: 0.22 },
        { d: "M150,170 C146,260 150,340 150,404", w: 6, o: 0.05 },
        { d: "M252,170 C256,260 250,340 250,404", w: 6, o: 0.05 },
        { d: "M188,46 L184,98", w: 2.5, o: 0.35, cap: true },                // drawcord
        { d: "M212,46 L216,98", w: 2.5, o: 0.35, cap: true },
      ],
      bands: [
        "M108,18 L292,18 L290,50 L110,50 Z",                                  // waistband
        "M112,410 L186,410 L184,440 L116,440 Z",                              // cuffs
        "M214,410 L288,410 L284,440 L216,440 Z",
      ],
      print: { x: 218, y: 92, w: 58, h: 64 },                                 // wearer's left thigh
    },
  };
  HD.garments = garments;

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

  function luminance(hex) {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
    return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("");
  }

  HD.mockup = function ({ type = "tee", color = "#17191e", design = "", placement = {}, view = "full", title = "", guide = false }) {
    const g = garments[type] || garments.tee;
    const id = "m" + ++uid;
    const hex = color.startsWith("#") ? color : (HD.colors[color] || HD.colors.black).hex;
    const dark = luminance(hex) < 0.18;
    const line = dark ? "#ffffff" : "#000000";
    // design can be one image, or { dark, light } versions picked by fabric shade
    if (design && typeof design === "object") design = (luminance(hex) < 0.3 ? design.dark : design.light) || design.dark || design.light || "";
    const p = g.print;
    const s = placement.scale ?? 1;
    const w = p.w * s, h = p.h * s;
    const cx = p.x + p.w / 2 + (placement.x || 0) * p.w;
    const cy = p.y + p.h / 2 + (placement.y || 0) * p.h;

    let vb = g.viewBox;
    if (view === "detail") {
      const pad = Math.max(p.w, p.h) * 0.45;
      vb = `${p.x - pad} ${p.y - pad} ${p.w + pad * 2} ${p.h + pad * 2}`;
    }

    const lines = g.lines
      .map((l) => `<path d="${l.d}" fill="none" stroke="${line}" stroke-opacity="${l.o}" stroke-width="${l.w}" stroke-linecap="${l.cap ? "round" : "butt"}" stroke-linejoin="round"/>`)
      .join("");
    const bands = (g.bands || [])
      .map((d) => `<path d="${d}" fill="${shade(hex, dark ? 0.03 : -0.05)}"/><path d="${d}" fill="url(#${id}r)" opacity=".5"/>`)
      .join("");

    return `<svg class="mockup" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(title || HD.types[type].label)}">
  <defs>
    <linearGradient id="${id}s" x1="0" x2="1">
      <stop offset="0" stop-color="#000" stop-opacity=".28"/>
      <stop offset=".22" stop-color="#000" stop-opacity="0"/>
      <stop offset=".5" stop-color="#fff" stop-opacity=".07"/>
      <stop offset=".78" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".3"/>
    </linearGradient>
    <linearGradient id="${id}v" y1="0" y2="1" x1="0" x2="0">
      <stop offset="0" stop-color="#fff" stop-opacity=".06"/>
      <stop offset="1" stop-color="#000" stop-opacity=".18"/>
    </linearGradient>
    <pattern id="${id}r" width="5" height="5" patternUnits="userSpaceOnUse">
      <rect width="2" height="5" fill="${line}" fill-opacity=".12"/>
    </pattern>
    <clipPath id="${id}c"><path d="${g.body}"/></clipPath>
  </defs>
  ${g.back ? `<path d="${g.back}" fill="${shade(hex, -0.08)}"/>` : ""}
  <path d="${g.body}" fill="${hex}"/>
  ${g.inner ? `<path d="${g.inner}" fill="${shade(hex, -0.14)}"/>` : ""}
  ${design ? `<g clip-path="url(#${id}c)"><image href="${esc(design)}" x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" opacity=".96"/></g>` : ""}
  <path d="${g.body}" fill="url(#${id}s)"/>
  <path d="${g.body}" fill="url(#${id}v)"/>
  ${lines}
  ${bands}
  ${guide ? `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="4" fill="none" stroke="${line}" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="6 5" vector-effect="non-scaling-stroke"/>` : ""}
</svg>`;
  };

  /* Small helper to render a product card's mockup */
  HD.productMockup = function (product, colorKey, view) {
    return HD.mockup({
      type: product.type,
      color: colorKey || product.colors[0],
      design: product.design,
      placement: product.placement,
      view,
      title: product.name,
    });
  };
})();
