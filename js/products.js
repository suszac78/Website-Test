/* D2D — Dawn Till Dark — product catalog
   To add a product for everyone: put the design image in /designs and add an entry below.
   type: "hoodie" | "tee" | "pants"
   design: one image path, or { dark: "...", light: "..." } to use a different image
           on dark fabrics vs light fabrics (e.g. white logo vs black logo)
   placement: scale (1 = fills the print area), x / y nudge (-0.5 … 0.5 of the print area)
*/
window.HD = window.HD || {};

HD.brand = "D2D";

HD.colors = {
  black:    { name: "Black",    hex: "#121315" },
  charcoal: { name: "Charcoal", hex: "#34363b" },
  white:    { name: "White",    hex: "#f3f3f1" },
  sand:     { name: "Sand",     hex: "#d8ccb4" },
  dawn:     { name: "Dawn",     hex: "#ff5a1f" },
  navy:     { name: "Navy",     hex: "#1b2440" },
  olive:    { name: "Olive",    hex: "#4b5335" },
};

HD.types = {
  hoodie: { label: "Hoodie", plural: "Hoodies", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  tee:    { label: "T-shirt", plural: "T-shirts", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  pants:  { label: "Pants", plural: "Pants", sizes: ["S", "M", "L", "XL"] },
};

HD.typeDetails = {
  hoodie: {
    fabric: "Midweight 360 gsm brushed fleece with 4% stretch. Athletic fit through the body, roomy hood, thumbholes in the cuffs, and a zip pocket for keys.",
    care: "Machine wash cold, inside out. Hang dry. Do not iron the print.",
  },
  tee: {
    fabric: "Lightweight performance knit that pulls sweat away and dries fast. Athletic fit, flatlock seams that won't rub, and anti-odor finish.",
    care: "Machine wash cold, inside out. No fabric softener. Hang dry.",
  },
  pants: {
    fabric: "Four-way stretch woven fabric that moves with you. Tapered leg, elastic waist with drawcord, zip side pockets, and ankle zips for easy on and off.",
    care: "Machine wash cold. Hang dry to keep the stretch.",
  },
};

const LOGO = { dark: "designs/d2d-logo-white.png", light: "designs/d2d-logo-black.png" };
const MARK = { dark: "designs/d2d-mark-white.png", light: "designs/d2d-mark-black.png" };
const TAGLINE = { dark: "designs/tagline-white.svg", light: "designs/tagline-black.svg" };
const TRAIN = { dark: "designs/train-white.svg", light: "designs/train-black.svg" };

HD.products = [
  {
    id: "core-hoodie", name: "D2D Core Hoodie", type: "hoodie", price: 75, tag: "New",
    colors: ["black", "charcoal", "white", "dawn"], design: LOGO, placement: { scale: 0.95, x: 0, y: -0.1 },
    description: "The full D2D logo across the chest on our training hoodie. Warm enough for the 5am start, light enough to keep on for the warm-up.",
  },
  {
    id: "sunrise-hoodie", name: "Sunrise Hoodie", type: "hoodie", price: 80,
    colors: ["black", "navy", "sand"], design: "designs/sunrise.svg", placement: { scale: 0.85, x: 0, y: -0.05 },
    description: "A striped rising sun for the ones who are up before it. Heavy on warmth, light on weight.",
  },
  {
    id: "logo-tee", name: "D2D Logo Tee", type: "tee", price: 35, tag: "Bestseller",
    colors: ["black", "white", "charcoal", "dawn"], design: LOGO, placement: { scale: 0.95, x: 0, y: -0.15 },
    description: "Our logo on a performance tee that dries fast and doesn't cling. Built for sessions, good enough for after.",
  },
  {
    id: "dtd-tee", name: "Dawn Till Dark Tee", type: "tee", price: 35, tag: "New",
    colors: ["white", "black", "olive"], design: TAGLINE, placement: { scale: 0.85, x: 0, y: -0.05 },
    description: "DAWN TILL DARK, stacked and stepped like a training plan. Wear the work ethic.",
  },
  {
    id: "train-tee", name: "Train Tee", type: "tee", price: 38,
    colors: ["charcoal", "navy", "sand"], design: TRAIN, placement: { scale: 1, x: 0, y: -0.1 },
    description: "Train from 05:00 to 22:00. A reminder printed across the chest of our lightest tee.",
  },
  {
    id: "track-pants", name: "D2D Track Pants", type: "pants", price: 70,
    colors: ["black", "charcoal", "navy"], design: MARK, placement: { scale: 1, x: 0, y: -0.1 },
    description: "Stretch track pants with the D2D mark on the thigh. Zip pockets, ankle zips, and a fit that stays put mid-sprint.",
  },
  {
    id: "sunrise-joggers", name: "Sunrise Joggers", type: "pants", price: 72,
    colors: ["sand", "black", "olive"], design: "designs/sunrise.svg", placement: { scale: 1, x: 0, y: 0 },
    description: "Matching bottoms for the Sunrise Hoodie, with the sun on the thigh. For recovery days and cold mornings.",
  },
];

HD.money = (n) => "$" + Number(n).toFixed(0);

HD.allProducts = async () => HD.products;
HD.findProduct = async (id) => HD.products.find((p) => p.id === id);
