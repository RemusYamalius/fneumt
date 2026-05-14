## Plan: Clean reset + single definitive mobile fix

### Step 1 — Revert all previous mobile compositing fixes

**`src/components/MoroccoMap.tsx`**
- Remove the `.morocco-map-container` wrapper div added previously, including its inline `isolation`, `contain: strict`, `overflow: hidden`, and `transform: translateZ(0)` styles. Restore both the normal map output and fullscreen map output to their pre-fix structure.

**`src/components/OrbitalFilter.tsx`**
- Remove the `.orbital-filter-container` wrapper div with inline `isolation`, `contain: layout paint style`, `overflow: hidden`, `opacity: 1`, `transform: none`. Restore the original returned JSX.

**`src/pages/QuickFilter.tsx`**
- Remove the `<div className="section-separator lg:hidden" aria-hidden="true" />` inserted between the Morocco map and orbital filter sections.

**`src/components/AuthenticatedLayout.tsx`**
- Remove the `gpu-isolate` class added to the `<header>` element.

**`src/pages/Index.tsx`**
- Remove the `gpu-isolate` class added to both `<header>` and `<main>` elements.

**`src/index.css`**
- Remove all previously added mobile-fix CSS:
  - `.gpu-isolate` and `.gpu-contain` utilities
  - `.section-separator` rule
  - Every `@media (max-width: 768px)` block added by previous fixes (touch-action overrides, backdrop-filter overrides, will-change resets, framer-motion opacity/transform `!important` overrides, sticky header solid-bg fallback, animation: none for fade/scale/slide-in, `.morocco-map-container` / `.orbital-filter-container` / `[class*="orbital"]` / `[class*="OrbitalFilter"]` / `[class*="MoroccoMap"]` / SVG mobile resets)
- Leave all original (pre-fix) CSS untouched.

### Step 2 — Apply one definitive fix

Append exactly the user-provided CSS block to the very end of `src/index.css`:

- `html, body` get `touch-action: pan-y` and `overflow-x: hidden`
- Universal `backdrop-filter: none !important` and `-webkit-backdrop-filter: none !important`
- `.glass`, `.glass-dark`, `[class*="backdrop-blur"]`, `[class*="glass"]` get `background-color: rgba(15, 35, 60, 0.92) !important` to compensate for removed blur
- Universal `opacity: 1 !important; visibility: visible !important`
- Exception block re-hides `[aria-hidden="true"]`, `[data-state="closed"]`, `[data-radix-popper-content-wrapper]`, `.sr-only`
- `main > section`, `main > div > section` get `isolation: isolate; overflow: hidden`
- `svg` gets `transform: none !important; will-change: auto !important; display: block`
- `canvas` gets `transform: none !important; will-change: auto !important`

All scoped under one `@media (max-width: 768px)` block.

### Step 3 — Strictly out of scope

- No edits to any component file beyond the reverts in Step 1
- No edits to JSX, framer-motion props, or any desktop styles
- No logic or functionality changes
- No additions to `index.css` other than the single block in Step 2

### Step 4 — Verify

At 375px and 390px viewports, walk through `/` (Index), `/dashboard`, `/quick-filter`, and the auth pages (`/login`, `/signup`):
- Confirm no horizontal tearing between sections (especially Morocco map ↔ orbital filter)
- Confirm map renders, rings render, all cards visible and positioned correctly
- Confirm closed dropdowns/modals/tooltips remain hidden (exception block working)
- Confirm desktop at 1280px+ visually unchanged

If any specific element becomes wrongly hidden, add a single targeted exception for its exact class name only — do not modify the global rules.

### Files touched

```text
src/index.css                          (revert prior mobile blocks + append the single new block)
src/components/MoroccoMap.tsx          (revert wrapper)
src/components/OrbitalFilter.tsx       (revert wrapper)
src/pages/QuickFilter.tsx              (remove separator div)
src/components/AuthenticatedLayout.tsx (remove gpu-isolate)
src/pages/Index.tsx                    (remove gpu-isolate)
```
