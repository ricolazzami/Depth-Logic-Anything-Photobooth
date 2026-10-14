---
name: Kinetic Doodle & Studio Depth
colors:
  surface: '#fcf9f4'
  surface-dim: '#dcdad5'
  surface-bright: '#fcf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ee'
  surface-container: '#f0ede9'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e5e2dd'
  on-surface: '#1c1c19'
  on-surface-variant: '#3c4a3d'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f3f0eb'
  outline: '#6c7b6c'
  outline-variant: '#bbcbba'
  surface-tint: '#006d34'
  primary: '#006d34'
  on-primary: '#ffffff'
  primary-container: '#00d26a'
  on-primary-container: '#005426'
  inverse-primary: '#2fe378'
  secondary: '#005ab3'
  on-secondary: '#ffffff'
  secondary-container: '#0073e0'
  on-secondary-container: '#fefcff'
  tertiary: '#5f5e5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#b8b6b6'
  on-tertiary-container: '#484747'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#62ff95'
  primary-fixed-dim: '#2fe378'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#005226'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#aac7ff'
  on-secondary-fixed: '#001b3e'
  on-secondary-fixed-variant: '#00468d'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#fcf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e5e2dd'
typography:
  display-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 54px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 9px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style
The design system bridges two contrasting interactive realities tailored for a fixed-orientation iPad (Gen 11 Landscape, 4:3 aspect ratio, 2360×1640 physical / 1180×820pt viewport) PWA Photobooth & 3D Depth Sculpture pipeline:

1. **Theme 1: Hand-Drawn Retro Doodle / Sketchbook**
   - **Mood:** Tactile, playful, human, unpretentious, zine-like arcade booth.
   - **Style:** Hand-drawn doodle linework, high tactile personality, raw organic contours, offset stamp fills, and arcade token coin-op charm. Elements feel as if sketched with a 0.5mm felt-tip Sakura Micron pen directly into a moleskine notebook.

2. **Theme 2: Sleek Studio Dark Mode**
   - **Mood:** Precise, professional, architectural, low-friction, spatial computing workspace.
   - **Style:** Pure computational dark mode utilizing matte charcoal backdrops, translucent glass layers with specular highlights, and surgical electric blue accents inspired by professional 3D lidar/depth mesh tooling.

3. **Signature Interaction & Visual Glitch:**
   - Both themes share an underlying digital pulse: an intentional, periodic chromatic aberration / micro-jitter glitch firing every 2.0 seconds (duration: 120ms). It shifts red/cyan channels by 2px with an instantaneous horizontal slice distortion, reminding the user that this tactile photobooth is also computing real-time 3D spatial geometry.

## Colors

The system uses a contextual color token architecture that maps variables seamlessly across both modes.

### Theme 1: Hand-Drawn Doodle Mode (Active Default)
- **Canvas / Background:** `#FBF8F3` (Warm newsprint / natural unbleached sketchbook paper).
- **Ink Primary:** `#1C1C1C` (Deep sumi ink, used for all hand-drawn borders, typography, and iconography).
- **Arcade Accent:** `#00D26A` (Vibrant coin-op arcade neon green for the physical shutter button, active states, and success indicators).
- **Secondary Accents:** `#FF4949` (Retro photobooth red for record/warning badges), `#FFA800` (Amber doodle highlight).
- **Surface Elevation:** `#FFFFFF` with `#1C1C1C` 2.5px solid borders and asymmetric solid drop-fills (`#1C1C1C`).

### Theme 2: Sleek Studio Dark Mode
- **Canvas / Background:** `#121212` (Deep matte obsidian void).
- **Surface Container:** `#1E1E1E` (Matte volcanic slab) and `#2C2C2E` (Frosted glass container backdrop at 80% opacity with `backdrop-filter: blur(20px)`).
- **Studio Accent:** `#0A84FF` (Apple system vibrant blue, high-luminance interactive focal point for 3D depth sliders and primary CTA buttons).
- **Neutral Foreground:** `#FFFFFF` (Primary text/vector), `#8E8E93` (Secondary parameters, unit metadata, and inactive toggles).
- **Mesh / Wireframe Grid:** `rgba(255, 255, 255, 0.12)` with depth z-index gradient planes.

### Glitch Spectrum Tokens (Universal Animation)
- **Glitch Cyan:** `#00FFFF`
- **Glitch Magenta:** `#FF0055`
- Triggered on a `@keyframes booth-glitch` 2000ms loop: 0%–94% idle, 95%–97% active slice shift (clip-path randomized horizontally ±3px), 98%–100% reset.

## Typography

The typographic hierarchy accommodates the duality of playful editorial sketchwork and precision CAD data:

- **Headlines (`Bricolage Grotesque`):** Delivers distinct expressive personality. In Doodle Mode, its whimsical optical alternates mimic casual hand-lettering and comic punch. In Dark Studio Mode, its tight geometric tracking creates high-impact editorial signage.
- **Body & Secondary Display (`Space Grotesk`):** Modern grotesque with idiosyncratic angled terminals. Clear and legible at glance distances when the iPad is resting on a photobooth counter stand.
- **Data, Sliders & Technical Specs (`JetBrains Mono`):** Monospaced clarity for technical readout tokens (triangle counts, depth ranges in millimeters `40 mm`, countdown timers `03.2s`, coordinate matrices, and coin counters `$0 = 4pics`).

### Theme Variations
- **Theme 1:** Headings render in uppercase with intentional slight rotational offset (`transform: rotate(-0.75deg)`) for key labels.
- **Theme 2:** Strict zero-rotation, crisp tracking, all caps for section titles (`label-lg`), with high contrast between values (`#FFFFFF`) and parameter keys (`#8E8E93`).

## Layout & Spacing

### Fixed iPad Gen 11 Landscape (4:3) Layout Model
The target viewport is strictly optimized for landscape orientation (approx. 1180px × 820px web layout bounds). The viewport divides into an intentional split:

- **Viewport Canvas (`65%` width, flex-grow):** Houses the live camera viewfinder or the WebGL 3D depth sculpture viewport. Surrounded by a fixed `1.5rem` (`margin`) outer border safe zone.
- **Control Inspector (`35%` width, fixed 360px–400px):** Houses capture instructions, multi-step progress, parameter sliders (Depth, Smoothness, Texture, Outline), toggle controls, and export actions.
- **Fixed Bottom/Corner Overlay Nodes:** Dedicated floating touch targets for shutter trigger, undo/redo, and theme-swap toggles.

### Touch Target Sizing (iPad Ergonomics)
- Minimum physical touch targets are strictly maintained at `48px × 48px` (interactive padding `space-md`).
- Primary photobooth arcade button measures `72px × 72px` minimum for immediate kiosk accessibility.

## Elevation & Depth

Visual hierarchy diverges structurally per theme while maintaining equivalent interactive physics:

### Theme 1: Hand-Drawn Doodle Elevation (Hard Neo-Brutalist Sketch)
- **Zero Blurs:** No soft diffuse shadows. Elevation is expressed entirely through solid black ink outlines and hard offset cast-shadows.
- **Level 1 (Cards, Frames):** `box-shadow: 4px 4px 0px #1C1C1C; border: 2.5px solid #1C1C1C;`
- **Level 2 (Active Buttons, Floating Badges):** `box-shadow: 6px 6px 0px #1C1C1C; border: 3px solid #1C1C1C; transform: translate(-2px, -2px);`
- **Pressed State:** `box-shadow: 0px 0px 0px #1C1C1C; transform: translate(4px, 4px);`

### Theme 2: Sleek Studio Elevation (Frosted Glass & Ambient Voids)
- **Subsurface Scatter & Glass:** Translucent `#2C2C2E` backgrounds with `backdrop-filter: blur(28px) saturate(180%)`.
- **Specular Hairline:** 1px perimeter border using `linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 100%)`.
- **Level 1 (Panels):** `box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);`
- **Level 2 (Popovers, Mesh Thumbnails):** `box-shadow: 0 20px 48px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(10, 132, 255, 0.2);`

### Periodic Glitch Overlay Specification
- At intervals of 2000ms, an SVG displacement filter `<feDisplacementMap>` or CSS horizontal strip clip-path activates for 120ms across the main viewfinder frame.
- Produces a momentary RGB split (red channel offset `-3px`, blue channel offset `+3px`) with a sudden scanline flicker.

## Shapes

The design system employs a dynamic shape mapping:
- **Default System Token:** Level `2` (Base elements: `8px / 0.5rem`, Larger cards: `16px / 1rem`, Floating containers: `24px / 1.5rem`).

### Theme Nuances
- **In Doodle Mode:** Shapes use an organic SVG rough border filter or non-uniform radii (e.g., `border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px`) giving cards, toggle switches, and Polaroid frames an authentic, hand-inked aesthetic.
- **In Studio Dark Mode:** Radii are mathematically precise iOS squircles (`border-radius: 14px` for cards, `border-radius: 9999px` for pill sliders and mode segment chips).

## Components

### 1. Shutter & Arcade Action Buttons
- **Theme 1 (Doodle):** An upright arcade slot or bold rounded pill button. Inked 3px border, filled with Arcade Green (`#00D26A`), stamped with uppercase inked typography. Hover/Tap causes an immediate squash animation (`scale(0.96) translate(2px, 2px)`).
- **Theme 2 (Studio):** Full-width or bottom floating pill in Apple Vibrant Blue (`#0A84FF`), smooth white text (`headline-sm`), with subtle specular top edge reflection and gentle glow on hover.

### 2. Live Viewfinder & Polaroid Sculpture Frame
- **Doodle Mode:** Framed as an off-kilter Polaroid print with thick bottom margin for handwritten marker notes (`"eye level"`, `"4 pics"`). Accompanied by hand-drawn navigational arrows and doodle mascot stickers.
- **Studio Mode:** Floating 3D viewport over an infinite perspective grid (`rgba(255, 255, 255, 0.08)` lines with 10mm pitch). Top overlay displays precise monospaced telemetry: `"200 x 150 x 43.0 mm · 1,221,290 triangles · 10 mm grid"`.

### 3. Depth & Sculpture Configuration Sliders
- **Track:** 6px thickness. In Doodle mode, a solid black line with uneven sketched endpoints. In Studio mode, dark grey track (`#3A3A3C`) with filled active segment in `#0A84FF`.
- **Thumb:** 
  - Doodle: An oversized, hand-drawn white circle with a 2.5px ink outline.
  - Studio: Crisp white capsule thumb (`24px × 24px`) casting a focused drop shadow (`0 2px 8px rgba(0,0,0,0.4)`).
- **Value Readout:** JetBrains Mono right-aligned numerical pill (e.g., `40 mm`, `100%`, `0%`).

### 4. Segmented Mode Switches (Simple / Advanced & B&W / Color)
- **Doodle Mode:** Drawn as a mechanical retro toggle switch or hand-drawn boxed radio selector with an arrow pointing to the selected option.
- **Studio Mode:** Recessed matte capsule (`#1C1C1E`) housing an animated sliding thumb (`#3A3A3C`) with crisp white active typography.

### 5. Floating Auxiliary Controls (Undo / Redo / Theme Swap)
- Circular buttons (`44px × 44px`) fixed to bottom or top navigation bar.
- Theme Swap toggle dynamically alternates the entire UI skin between hand-drawn paper ink and spatial CAD dark studio with a 200ms glitch transition wipe.