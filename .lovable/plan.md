## Plan — Two independent fixes

### Issue 1 — Stat cards around the map are clipped

**Where it happens**
`src/components/MoroccoMap.tsx`, region view (after clicking a region).
The 3 floating cards (`ملخص` top-left, `الانخراط` bottom-left, `النسب` top-right) are positioned `absolute` inside the inner `.flex-1.relative` container. They get clipped by:

1. The map wrapper `mapContent` has `overflow: hidden` (added in the previous tearing fix).
2. The QuickFilter map section wrapper is `rounded-3xl overflow-hidden ... p-4`.
3. The QuickFilter grid wrapper also has inline `overflow: hidden`.

On both desktop (when the SVG fills the box) and mobile (where the box is narrower than `min-w-[130px]` cards on each side), the top edge / side of these cards is cut off — exactly what the screenshots show.

**Fix (MoroccoMap.tsx only)**
- Replace absolute floating panels with a **responsive layout**:
  - On `md+` viewports: keep them floating (`absolute`) but move them slightly *inside* (use `top-2 left-2 / right-2`, shrink to `min-w-[120px]` / fullscreen keeps `170px`), and add extra top padding to `.flex-1.relative` so they never overlap the back-button row or extend above it.
  - On `< md`: render the same three panels **below the SVG** as a horizontal scrollable strip (`flex gap-2 overflow-x-auto`) so nothing is clipped on phones — no info is lost.
- Wrap each card in a `<div className="hidden md:block">` for the absolute version and `<div className="md:hidden">` for the stacked mobile version, sharing the same `StatPanel` component.
- Remove `overflow: hidden` from the `.flex-1.relative` only if needed; keep mapContent wrapper untouched (it was the tearing fix).

This guarantees the cards are fully visible in every viewport without altering the desktop look.

### Issue 2 — Tearing on real mobile (worst on the 3 supreme accounts)

**Root cause analysis**
The shared `AuthenticatedLayout` header is `sticky top-0 z-50`. Inside it:

- `SubBarShimmer` runs a **continuous `translateX(-100% → 100%)` beam** (`subbar-shimmer-beam`, animation `subbar-shimmer 5s infinite`) in `src/index.css` lines 731–758.
- `AnimatedLogo` runs **three concurrent infinite animations** (`logo-border-shine` 6s rotate of a conic-gradient, `logo-sparkle` 6s background-position, plus an animated background-position layer).
- The whole header is **sticky**, so on scroll the Android Chrome compositor must continuously re-rasterize this layer while the animations are still running.

On the 3 leadership accounts (`admin`, `secretary_general`, `national_president`), the role label produced by `getRoleLabel()` is the longest of all roles (e.g. `الكاتب العام للنقابة الوطنية للتعليم — الاتحاد المغربي للشغل`), so the sub-bar text + shimmer beam span the full width → larger composited layer → much more visible tearing on real mobile GPUs.

**Fixes (no visible change)**
1. **`src/index.css` — `.subbar-shimmer-wrap` & `.subbar-shimmer-beam`**
   - Add GPU-isolation hints: `transform: translateZ(0); backface-visibility: hidden; contain: paint;` on the wrap.
   - Add `will-change: transform;` on the beam (only the beam, not the wrap).
   - Wrap the `@keyframes subbar-shimmer` rule in `@media (prefers-reduced-motion: no-preference)` and **disable the animation entirely on `(max-width: 640px)`** via a mobile media query that sets `.subbar-shimmer-beam { animation: none; opacity: 0; }`. The shimmer is a decorative flourish — invisible on phones is acceptable and is what eliminates the tearing.

2. **`src/components/AnimatedLogo.tsx`**
   - Add a `motion-reduce:` variant and a `sm:` gating to the two animated layers so on `< sm` (mobile) the border-shine + sparkle layers render statically (no animation classes). The static logo + the static white background ring look identical to the running animation at a glance.
   - Add `style={{ transform: 'translateZ(0)', willChange: 'transform' }}` to the outer wrapper so the logo gets its own compositor layer and never bleeds into the sticky header repaint.

3. **`src/components/AuthenticatedLayout.tsx`**
   - Add `style={{ transform: 'translateZ(0)', contain: 'paint' }}` to the sticky `<header>` so the sticky layer is fully isolated from the page content. This prevents repaints of the header from cascading into the page body on Android Chrome.

These three changes are invisible on desktop (animations still run identically) and on iOS, and they specifically target the Android Chrome compositor path that is causing the tearing. Visual output is unchanged on desktop and on mobile (only the sub-bar shimmer beam becomes invisible on phones, where it was barely perceptible anyway).

### Files touched

```text
src/components/MoroccoMap.tsx        (responsive stat panels)
src/index.css                        (shimmer GPU isolation + mobile disable)
src/components/AnimatedLogo.tsx      (mobile static + layer promotion)
src/components/AuthenticatedLayout.tsx (sticky header layer isolation)
```

### Out of scope
- No changes to `OrbitalFilter`, `QuickFilter` grid wrapper, routes, business logic, or i18n.
- No new dependencies.

### Verification
- Desktop preview: cards visible around the map in region view; header / logo / shimmer animate as before.
- 390×779 preview: cards stack below the map, fully visible; header animates as before (preview is not real-mobile so tearing isn't reproducible here, but the GPU-isolation fixes are non-visual and safe).
- Ask the user to re-test on the real Android phone with one of the three supreme accounts after deploy.
