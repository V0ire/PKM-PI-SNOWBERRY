---
name: Airbnb
colors:
  primary: "#ff385c"
  secondary: "#222222"
  background: "#ffffff"
  surface: "#ffffff"
  foreground: "#222222"
  border: "#c1c1c1"
  accent: "#b76e79"
  success: "#ff385c"
  info: "#428bff"
  warning: "#c13515"
  danger: "#c13515"
colors-dark:
  primary: "#ff385c"
  secondary: "#f0f0f0"
  background: "#1a1a1a"
  surface: "#2a2a2a"
  foreground: "#f0f0f0"
  border: "#3a3a3a"
  accent: "#d4a5aa"
  success: "#ff385c"
  info: "#428bff"
  warning: "#c13515"
  danger: "#c13515"
typography:
  display-lg:
    fontFamily: '"Nunito Sans", -apple-system, system-ui, Roboto, Helvetica Neue, sans-serif'
    fontSize: 1.75rem
    fontWeight: 700
  heading-md:
    fontFamily: '"Nunito Sans", -apple-system, system-ui, Roboto, Helvetica Neue, sans-serif'
    fontSize: 1.375rem
    fontWeight: 600
  body-md:
    fontFamily: '"Nunito Sans", -apple-system, system-ui, Roboto, Helvetica Neue, sans-serif'
    fontSize: 1rem
    fontWeight: 400
  label-md:
    fontFamily: '"Nunito Sans", -apple-system, system-ui, Roboto, Helvetica Neue, sans-serif'
    fontSize: 0.875rem
    fontWeight: 500
  caption-sm:
    fontFamily: '"Nunito Sans", -apple-system, system-ui, Roboto, Helvetica Neue, sans-serif'
    fontSize: 0.75rem
    fontWeight: 500
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
rounded:
  sm: 8px
  md: 14px
  lg: 20px
  xl: 32px
  full: 9999px
elevation:
  level0: none
  level1: rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px
  level2: rgba(0,0,0,0.08) 0px 4px 12px
  level3: rgba(0,0,0,0.12) 0px 8px 24px
---

The Airbnb palette is intentionally restrained: pure white canvas with warm near-black text. This creates a photography-forward marketplace where colorful destination images become the only sources of vibrancy.

### Primary — Rausch Red (#ff385c)

Named after Airbnb's first street address, Rausch Red is the singular brand accent. It appears only on primary CTAs, active states, and brand moments. The color itself is a warm coral-red, inviting and energetic without being aggressive.

### Secondary — Near Black (#222222)

Airbnb deliberately avoids pure black (#000000). The warm near-black (#222222) creates softer contrast against white backgrounds, reducing eye strain and conveying approachability.

### Premium Tiers

- **Luxe Purple (#460479)**: Distinguishes Airbnb Luxe properties — the ultra-premium tier
- **Plus Magenta (#92174d)**: Marks Airbnb Plus verified properties

### Surface Hierarchy

| Level | Color | Usage |
|-------|-------|-------|
| Background | #ffffff | Page canvas |
| Surface | #f2f2f2 | Secondary elements, circular buttons |
| Border | #c1c1c1 | Card edges, dividers |

---

## Typography

### Font Stack

**Nunito Sans** — A variable font with rounded terminals that echo Airbnb's "belong anywhere" philosophy. Warm, approachable letterforms avoid the cold efficiency of geometric sans-serifs.

### Type Scale

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Section Heading | 1.75rem | 700 | Section titles |
| Card Heading | 1.375rem | 600 | Card titles |
| Feature Title | 1.25rem | 600 | Feature descriptions |
| UI Medium | 1rem | 500 | UI elements |
| Body | 0.875rem | 400 | Content text |
| Tag | 0.75rem | 500 | Labels, metadata |
| Micro | 0.5rem | 700 | Uppercase micro labels |

### The Negative Tracking Principle

Headings use negative letter-spacing (-0.18px to -0.44px) to create intimate, cozy headlines. This psychological trick makes text feel tighter and more personal.

---

## Layout & Spacing

The spacing system follows a 4px base grid scale, providing generous breathing room:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Micro spacing, inline gaps |
| sm | 8px | Button padding, chip gaps |
| md | 16px | Card padding, default spacing |
| lg | 24px | Section spacing |
| xl | 32px | Large margins |

---

## Elevation & Depth

Airbnb's depth system uses graduated shadows for warm, natural lift:

| Level | Shadow | Usage |
|-------|--------|-------|
| Level 0 | none | Page background, text blocks |
| Level 1 | Three-layer stack | Listing cards, search bar |
| Level 2 | `rgba(0,0,0,0.08) 0px 4px 12px` | Button hover, interactive lift |
| Level 3 | `rgba(0,0,0,0.12) 0px 8px 24px` | Modals, dropdowns |

### The Light Border Fallback

When shadows feel too heavy, Airbnb uses subtle borders. Card borders use rgba(0,0,0,0.02) — barely visible but enough to create definition without elevation.

---

## Shapes

The shape language uses 8px as the base corner radius with generous card rounding:

| Token | Value | Usage |
|-------|-------|-------|
| sm | 8px | Buttons, inputs |
| md | 14px | Status badges |
| lg | 20px | Listing cards |
| xl | 32px | Hero elements |
| full | 9999px | Progress bars |

---

## Components

### Buttons & Interaction

**Primary Dark** — The workhorse CTA: #222222 background with white text, 8px border-radius. Hover transitions to Rausch Red.

**Primary CTA (Rausch)** — Reserved for most important actions. Background: #ff385c with white text. Never used for large surfaces.

**Circular Navigation** — #f2f2f2 background, 50% border-radius.

### Inputs & Selection

**Search Input** — 8px border-radius matching buttons. Focus: dark border + dark ring. Error: red border + red ring.

### Chips & Selection Controls

**Status Badges** — 14px border-radius (pill-adjacent). 10px uppercase with 0.05em letter-spacing. Weight 700.

### Data & Containers

**Listing Cards** — 20px border-radius with three-layer card shadow. 16:10 image aspect ratio. Body padding: 16px.

### Feedback Components

**Progress Bars** — 9999px border-radius. Rausch Red fill for primary. **Alerts** — 16px border-radius with 4px left border accent.

---

## Do's and Don'ts

### Do

- ✅ Use #222222 (warm near-black) for text — never pure #000000
- ✅ Apply Rausch Red (#ff385c) only for primary CTAs — it's the singular accent
- ✅ Use Nunito Sans at weight 500-700 — the warm weight range is intentional
- ✅ Apply the three-layer card shadow for all elevated surfaces
- ✅ Use generous border-radius: 8px for buttons, 20px for cards
- ✅ Use photography as the primary visual content

### Don't

- ❌ Don't use pure black (#000000) for text — always #222222
- ❌ Don't apply Rausch Red to backgrounds or large surfaces
- ❌ Don't use thin font weights (300, 400) for headings
- ❌ Don't use heavy shadows (>0.1 opacity as primary layer)
- ❌ Don't use sharp corners (0-4px) on cards
- ❌ Don't introduce additional brand colors beyond the Rausch/Luxe/Plus system
