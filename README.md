# HydrateDifferent

Landing page for **HydrateDifferent**, a triple-wall insulated water bottle with a glow-reminder cap.

Built with the design skills from [freshtechbro/claudedesignskills](https://github.com/freshtechbro/claudedesignskills):

- **modern-web-design**: bold minimalism, fluid type, glassmorphism, micro-interactions, custom cursor, reduced-motion and keyboard support
- **threejs-webgl**: a 3D bottle built in code (lathe body, GlowCap ring, wrap-around label) plus floating bubble particles
- **gsap-scrolltrigger**: hero intro, a pinned scroll story where the bottle turns, tilts and flips with each feature, count-up stats

## Run it

It's a static site with no build step. Open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

Three.js and GSAP load from CDNs, so you need an internet connection.
