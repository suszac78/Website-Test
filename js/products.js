/* HydrateDifferent — product catalog
   To add a product for everyone: put the design image in /designs and add an entry below.
   type: "hoodie" | "tee" | "pants"
   placement: scale (1 = fills the print area), x / y nudge (-0.5 … 0.5 of the print area)
*/
window.HD = window.HD || {};

HD.colors = {
  black:   { name: "Black",   hex: "#17191e" },
  navy:    { name: "Navy",    hex: "#1f2b48" },
  bone:    { name: "Bone",    hex: "#ebe4d6" },
  heather: { name: "Heather", hex: "#b7bbc1" },
  glacier: { name: "Glacier", hex: "#8fd9cc" },
  ember:   { name: "Ember",   hex: "#e2603f" },
  moss:    { name: "Moss",    hex: "#66784b" },
};

HD.types = {
  hoodie: { label: "Hoodie", plural: "Hoodies", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  tee:    { label: "T-shirt", plural: "T-shirts", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  pants:  { label: "Pants", plural: "Pants", sizes: ["S", "M", "L", "XL"] },
};

HD.typeDetails = {
  hoodie: {
    fabric: "Heavyweight 400 gsm brushed fleece, 80% organic cotton / 20% recycled polyester. Relaxed fit with dropped shoulders and a double-layer hood.",
    care: "Machine wash cold, inside out. Hang dry. Do not iron the print.",
  },
  tee: {
    fabric: "220 gsm combed organic cotton jersey. Boxy fit, ribbed crew neck, shoulder-to-shoulder taping.",
    care: "Machine wash cold, inside out. Tumble dry low. Do not iron the print.",
  },
  pants: {
    fabric: "Midweight 340 gsm loopback fleece, 80% organic cotton / 20% recycled polyester. Tapered leg, elastic waist with drawcord, ribbed cuffs, deep side pockets.",
    care: "Machine wash cold. Hang dry to keep the shape.",
  },
};

HD.products = [
  {
    id: "wave-hoodie", name: "Wave Hoodie", type: "hoodie", price: 78, tag: "New",
    colors: ["black", "navy", "bone"], design: "designs/wave.svg", placement: { scale: 1, x: 0, y: 0 },
    description: "Our signature wave print across the chest, on a heavyweight hoodie built for cold mornings and late nights.",
  },
  {
    id: "drop-hoodie", name: "Drop Logo Hoodie", type: "hoodie", price: 72,
    colors: ["heather", "glacier", "black"], design: "designs/drop.svg", placement: { scale: 0.55, x: 0, y: -0.1 },
    description: "A clean, centered drop logo. The everyday hoodie you'll reach for first.",
  },
  {
    id: "wordmark-tee", name: "Wordmark Tee", type: "tee", price: 38, tag: "Bestseller",
    colors: ["black", "bone", "navy", "ember"], design: "designs/wordmark.svg", placement: { scale: 1, x: 0, y: -0.05 },
    description: "HYDRATE DIFFERENT, stacked big and bold. A boxy tee that says it for you.",
  },
  {
    id: "ripple-tee", name: "Ripple Tee", type: "tee", price: 36,
    colors: ["bone", "glacier", "black"], design: "designs/ripple.svg", placement: { scale: 0.9, x: 0, y: 0 },
    description: "Concentric ripples spreading from a single drop. Small idea, big impact.",
  },
  {
    id: "badge-tee", name: "Drink More Tee", type: "tee", price: 36, tag: "New",
    colors: ["navy", "black", "moss"], design: "designs/badge.svg", placement: { scale: 0.8, x: 0, y: -0.05 },
    description: "A round badge print: drink more, waste less. Wear the reminder.",
  },
  {
    id: "drop-joggers", name: "Drop Joggers", type: "pants", price: 68,
    colors: ["black", "heather", "navy"], design: "designs/drop.svg", placement: { scale: 1, x: 0, y: 0 },
    description: "Tapered fleece joggers with a small drop logo on the thigh. Pairs with everything here.",
  },
  {
    id: "wave-joggers", name: "Wave Joggers", type: "pants", price: 72,
    colors: ["bone", "moss", "black"], design: "designs/wave.svg", placement: { scale: 1, x: 0, y: 0 },
    description: "Matching bottoms for the Wave Hoodie, with the wave print on the thigh.",
  },
];

HD.money = (n) => "$" + Number(n).toFixed(0);
