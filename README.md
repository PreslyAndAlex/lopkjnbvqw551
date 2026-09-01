# Dulbina-Dive-Example

A portfolio demo by **A&P Digital**. *Дълбина* ("Depth") is a **fictional** Black
Sea dive centre. Nothing is sold, no order is ever placed, and no data leaves the
browser.

The whole site is one idea: **scrolling down the page is descending underwater.**
As you go, the page loses colour the way real water takes it — red first, blue
last — a depth gauge tracks your metres, silt drifts past, surface noise thins
out, and every piece of gear surfaces at the depth it is actually rated for.

---

## The depth map

| # | Section | Depth | Gear (at its rating) | Dives | Courses |
|---|---------|-------|----------------------|-------|---------|
| 01 | Повърхността | 0–2 m | — | — | — |
| 02 | Плитчината — *red dies* | 2–8 m | Mask **3 m**, Fins **6 m** | Urdoviza **6 m** | — |
| 03 | Термоклинът — *orange dies* | 8–16 m | SMB **9 m**, 5 mm wetsuit **12 m**, BCD **15 m** | Night dive **12 m** | Open Water **18 m** |
| 04 | Синьото — *yellow dies* | 16–24 m | 7 mm semi-dry **18 m**, Regulator **21 m**, Octopus **24 m** | Maslen Nos **18 m** | — |
| 05 | Здрачът — *green dies* | 24–32 m | Torch **26 m**, Dive computer **30 m** | Arkutino **28 m** | Advanced OW **30 m** |
| 06 | Корпусите — *blue only* | 32–42 m | Drysuit **36 m**, Deco buoy **40 m** | Shabla **42 m** | Deep Diver **40 m** |
| 07 | Тъмното | 42–50 m | Twinset **45 m**, Trimix reg. **50 m** | — | Trimix / ER **50 m** |
| 08 | Изплуване | 50 → 5 m | dive log — everything you passed, by depth | | |
| 09 | Деко спирка | 5 → 0 m | contact; full colour returns | | |

Section boundaries are read from the DOM (`data-from` / `data-to` on each
`[data-zone]`), so the depth map and the layout can never drift apart —
see [`src/lib/scrollMap.ts`](src/lib/scrollMap.ts).

---

## The colour science

Not a blue overlay. [`src/lib/optics.ts`](src/lib/optics.ts) solves the
Beer–Lambert law over five spectral bands every frame:

```
T(λ, d) = exp( −Kd(λ) · L(d) ),   L(d) = 2d + 3 m
```

`Kd` sits **between Jerlov oceanic types I and II** — clear water whose
attenuation minimum is in the blue. That is the Black Sea offshore of Sozopol on
a calm summer day. (In turbid spring water the minimum shifts to green and the
sea looks green; that is the other Black Sea, and not the one modelled here.)

The path is **two-way**: light travels down to the object *and* back to the eye,
plus ~1.5 m of viewing distance each way. That is why red dies at 5 m rather
than 15 m.

| Band | λ | Kd (m⁻¹) | 5 m | 10 m | 20 m | 30 m | 50 m |
|---|---|---|---|---|---|---|---|
| red | 660 nm | 0.350 | **1.4 %** | 0.05 % | ~0 | ~0 | ~0 |
| orange | 600 nm | 0.190 | 11 % | **2.1 %** | 0.07 % | ~0 | ~0 |
| yellow | 580 nm | 0.100 | 36 % | 16 % | **3.3 %** | 0.7 % | 0.03 % |
| green | 530 nm | 0.080 | 46 % | 26 % | 7.9 % | **2.4 %** | 0.2 % |
| blue | 470 nm | 0.021 | 100 % | 100 % | 100 % | 100 % | **100 %** |

(Percentages are relative to the surviving blue channel, which is what the
adapted eye actually sees. The live figures are in the spectrum instrument in
sections 02, 04, 06 and 08 — those numbers come straight from the model.)

### How it reaches the page

The five bands are mixed into sRGB by spectral channel overlap, then composited
over the DOM using the standard underwater image-formation model
(Jaffe–McGlamery):

```
I_out = I_scene · T(d) + B(d)
```

* the first term is a WebGL canvas with `mix-blend-mode: multiply` (transmission)
* the second is a WebGL canvas with `mix-blend-mode: screen` (backscatter veil)

Both run the same fragment shader ([`src/water/shaders.ts`](src/water/shaders.ts)),
which also adds caustics near the surface, light shafts, a depth-dependent
vignette, and the torch.

### The one disclosed compromise

The green channel passes through a compression of `g^0.34`
(`ADAPTATION_GAMMA`). The reason is partly physiological — the eye adapts to the
dominant wavelength, and the sRGB green sensor still sees the 500 nm light that
survives at depth — and partly practical: a pure-blue image caps out at about
**2.4 : 1** contrast, at which point body text stops being readable.

With the compression, plus panels that darken with depth and a backscatter veil
shaped to stay thin in the middle of the frame (where the text is) and thick
toward the edges, contrast at 50 m lands at **4.8 : 1** for headings and
**4.5 : 1** for body copy. Small mono labels sit at 3.6 : 1 — AA for their size.

**The red channel is untouched.** It goes to zero, which is the whole point.

The sense of darkness comes from the page's own palette ramp
(`seaColorAt()`), the shader vignette and the fading light shafts — *not* from
dimming the frame, which would have destroyed the text contrast.

---

## The gauge is also the control

Press and hold the depth gauge and the page follows. On the scale itself the
drag is **absolute** — wherever you grab is where you go — and anywhere else on
the panel it is **relative**, moving you by as much as you pulled. It resolves
through the inverse of the same DOM-derived map (`scrollForDepth()`), so the
metre you drag to is the metre you land on, at any viewport size. The scale is a
real `role="slider"`: arrows step a metre, Shift five, Page keys ten, Home and
End go to the surface and the bottom.

Touch is deliberately asymmetric — the scale takes the gesture, the rest of the
panel stays transparent to the page scroll, so the bottom bar on a phone never
fights the thumb.

---

## The torch

At 40 m everything is grey-blue, including the things you might want to buy.
That is physically honest, and it is also solved the way divers solve it: turn on
a light. The torch button in the top bar enables a light that follows the pointer
(centred on the viewport on touch devices) and restores the full spectrum inside
its beam — short light path, no attenuation — plus a warm 5000 K cast, because a
dive torch is warmer than the water.

---

## Stack

* React 19 · TypeScript · Vite 7
* **GSAP + ScrollTrigger** — the descent choreography and every reveal
* **Lenis** — smooth scroll (with anchor handling)
* **WebGL** — two fragment-shader layers for the medium
* **Canvas 2D** — the drifting silt, which streams upward at a rate driven by
  scroll velocity, because when you descend, suspended particles pass you going up
* **Web Audio** — the ambience is *generated*, not a file: pink noise through a
  low-pass whose cutoff falls with depth (the highs go first, exactly like the
  light), a rumble that rises, and breathing bursts that slow as you go down.
  The speaker button owns on/off, the slider next to it owns the level and is
  remembered in `localStorage`; the slider never starts audio on its own
* **zustand** (+ `localStorage`) — cart
* **i18next / react-i18next** — Bulgarian default, English toggle

No backend. No 3D models. No image assets — every product is a monoline
technical drawing in inline SVG ([`src/components/KitArt.tsx`](src/components/KitArt.tsx)).

Type: **IBM Plex Sans** and **IBM Plex Mono**. With `lang="bg"` the browser picks
up Plex's Bulgarian `locl` alternates, so the Cyrillic renders in proper
Bulgarian letterforms rather than Russian ones.

---

## Performance

Mobile is the priority; the descent drops work, not frames.

* Device tier is picked at load (`initialQuality()`) and **downgraded at runtime**
  if the rolling frame time exceeds 21 ms for 1.4 s — caustic iterations first,
  then light shafts, then render scale.
* The shader canvases render at 0.3–0.5× and are upscaled; the medium is smooth,
  so nobody can tell.
* Particles: 150 / 70 / 34 by tier.
* Depth lives outside React ([`src/lib/depth.ts`](src/lib/depth.ts)). The gauge,
  the spectrum and the science table write to the DOM directly — React only
  re-renders when something a person clicked has changed.

| Tier | Render scale | Particles | Caustic steps | Shafts |
|---|---|---|---|---|
| high | 0.50 | 150 | 3 | yes |
| medium | 0.40 | 70 | 2 | yes |
| low | 0.30 | 34 | 1 | no |

If WebGL is unavailable the two layers fall back to flat blend colours driven by
the same model — the colour still drains, just without caustics, shafts or torch.

---

## Accessibility

* `prefers-reduced-motion: reduce` turns off Lenis, the scrub, the particles, the
  caustics and every reveal. Depth then snaps to each section's midpoint via an
  `IntersectionObserver`, so all nine sections are still shown in their own
  colour — static and fully readable. A note at the top says so.
  Append **`?reduced=1`** to force this mode for a demo without touching OS settings.
* Audio never autoplays. It is created only on the first click of the sound
  toggle and suspends when the tab is hidden.
* The HUD (top bar, gauge, spectrum instrument) sits *above* the water layers —
  diegetically, instruments are backlit — so it keeps full contrast at every depth.
* Skip link, focus-visible rings, labelled controls, focus-trapped cart drawer,
  `inert` when closed.

---

## Embedding

Built for an `<iframe>` on the A&P portfolio. [`vercel.json`](vercel.json) sets
`Content-Security-Policy: frame-ancestors *` and deliberately sends **no**
`X-Frame-Options`.

```html
<iframe src="https://<deployment>.vercel.app" title="Дълбина" loading="lazy"></iframe>
```

---

## Running it

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

`npm run typecheck` runs the project references build with no emit.

### Dev helper

In dev builds only, `window.__dulbina.freeze(30)` pins the page at 30 m so a
depth can be inspected without scrolling; `freeze(null)` releases it.

---

## Layout of the source

```
src/
  lib/
    optics.ts      Beer–Lambert model, Kd table, palette ramp
    depth.ts       depth state (outside React), zones, smoothing
    scrollMap.ts   scroll position → metres, built from the DOM
    device.ts      quality tiers, reduced motion, torch tracking
    audio.ts       generated ambience
    store.ts       cart (persisted) and UI state
  water/
    shaders.ts     the fragment shader for the medium
    renderer.ts    WebGL plumbing, context loss, resize
    particles.ts   silt
    engine.ts      the single rAF loop that drives all of it
  data/catalog.ts  products, dives, courses — depth, price, SKU
  i18n/            bg.ts is the source of truth; en.ts is typed against it
  components/      HUD, sections, cards, cart, dive log
```
