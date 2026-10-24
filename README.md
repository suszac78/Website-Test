# D2D — Dawn Till Dark

A shop website for D2D, a sport and training clothing line: hoodies, t-shirts and pants.
There's no cart or checkout yet. Product pages show "Checkout opens soon".

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Home page: hero, categories, new arrivals, newsletter signup |
| `shop.html` | All products, with filters (Hoodies / T-shirts / Pants) and sorting |
| `product.html?id=…` | A page for each product: colors, sizes, size guide, fabric and care |

## Run it

No build step and nothing to install.

- **Quickest:** double-click `index.html`.
- **Or serve it:** `python3 -m http.server 8000`, then visit http://localhost:8000
- **Put it online:** in the GitHub repo, go to Settings → Pages, deploy from this branch, folder `/ (root)`.

Animations load GSAP from a CDN, so you need internet for those. The shop still works without them.

## Adding a new product

1. Put the image file in the `designs/` folder, e.g. `designs/sunset.png`.
2. Open `js/products.js` and add an entry to `HD.products`, copying one of the existing ones:

```js
{
  id: "sunset-hoodie", name: "Sunset Hoodie", type: "hoodie", price: 74, tag: "New",
  colors: ["black", "sand"], design: "designs/sunset.png", placement: { scale: 0.9, x: 0, y: 0 },
  description: "A line or two about the design.",
},
```

- `type` is `"hoodie"`, `"tee"` or `"pants"`
- `colors` can use `black`, `charcoal`, `white`, `sand`, `dawn`, `navy`, `olive`
- `design` can also be `{ dark: "designs/logo-white.png", light: "designs/logo-black.png" }`
  to use a white version on dark fabrics and a black version on light fabrics
- `placement`: `scale` is the size (1 fills the print area), `x` / `y` nudge it left/right and up/down

## Built with

Design skills from [freshtechbro/claudedesignskills](https://github.com/freshtechbro/claudedesignskills):

- **modern-web-design:** bold minimalism, fluid type, micro-interactions, custom cursor, accessibility
- **gsap-scrolltrigger:** hero intro, parallax and scroll reveals
- **lightweight-3d-effects:** tilt-on-hover product tiles

Logo files live in `assets/` (original + nav mark) and `designs/` (white and black print versions).

Garment mockups are drawn as SVG (`js/mockups.js`), so any design can be shown on any color.
