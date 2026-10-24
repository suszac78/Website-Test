# HydrateDifferent — Clothing shop

A shop website for the HydrateDifferent clothing line: hoodies, t-shirts and pants.
There's no cart or checkout yet. Product pages show "Checkout opens soon".

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Home page: hero, categories, new arrivals, newsletter signup |
| `shop.html` | All products, with filters (Hoodies / T-shirts / Pants) and sorting |
| `product.html?id=…` | A page for each product: colors, sizes, size guide, fabric and care |
| `studio.html` | Upload your designs, place them on a garment, add them to the shop |

## Run it

No build step and nothing to install.

- **Quickest:** double-click `index.html`.
- **Or serve it:** `python3 -m http.server 8000`, then visit http://localhost:8000
- **Put it online:** in the GitHub repo, go to Settings → Pages, deploy from this branch, folder `/ (root)`.

Animations load GSAP from a CDN, so you need internet for those. The shop still works without them.

## Uploading your designs (Studio)

1. Open **Studio** in the menu.
2. Upload your design. A PNG with a transparent background looks best.
3. Pick the piece (hoodie, t-shirt or pants) and one or more colors.
4. Use the sliders, or drag the design on the preview, to place it.
5. Name it, set a price, and click **Add to shop**.

It shows up straight away on the home page, in the shop, and on its own product page.
You can also click **Download mockup** to save a PNG image of the preview.

**Important:** designs added in the Studio are saved **in your browser only**. Other visitors won't see them.

### Publishing your designs for everyone

1. Put the image file in the `designs/` folder, e.g. `designs/sunset.png`.
2. Open `js/products.js` and add an entry to `HD.products`, copying one of the existing ones:

```js
{
  id: "sunset-hoodie", name: "Sunset Hoodie", type: "hoodie", price: 74, tag: "New",
  colors: ["black", "bone"], design: "designs/sunset.png", placement: { scale: 0.9, x: 0, y: 0 },
  description: "A line or two about the design.",
},
```

- `type` is `"hoodie"`, `"tee"` or `"pants"`
- `colors` can use `black`, `navy`, `bone`, `heather`, `glacier`, `ember`, `moss`
- `placement` takes the numbers from the Studio sliders (size, left/right, up/down)

## Built with

Design skills from [freshtechbro/claudedesignskills](https://github.com/freshtechbro/claudedesignskills):

- **modern-web-design:** bold minimalism, fluid type, micro-interactions, custom cursor, accessibility
- **gsap-scrolltrigger:** hero intro, parallax and scroll reveals
- **lightweight-3d-effects:** tilt-on-hover product tiles

Garment mockups are drawn as SVG (`js/mockups.js`), so any design can be shown on any color.
