## Goal
Address mobile color bleed on the orbital filter and significantly improve scroll/tap performance across the site by reducing concurrent animation work.

## Changes

### 1. `src/components/OrbitalFilter.tsx`

**a. SVG filter color-bleed fix**
- Add `x="-5%" y="-5%" width="110%" height="110%"` to `<filter id="ring-glow">` and reduce `feGaussianBlur stdDeviation` from `3` → `1.5`.

**b. Reduce drop-shadow intensity on segments**
- Replace the `ArcSegment` `filter` style:
  - selected: `brightness(1.15) drop-shadow(0 0 6px ${color})` (drop the 20px halo).
  - hovered: `brightness(1.08) drop-shadow(0 0 3px ${color}66)`.
- Note: current code uses `hovered` (not `isHovered`) as in the existing source — keep variable names intact.

**c. Pause all 5 ring rotations while user is scrolling**
- In `OrbitalFilter`, add `isScrolling` state + scroll listener with 300ms debounce (passive listener, cleanup on unmount).
- Pass `pauseRotation={isScrolling}` to every `<FilterRing />` instance.
- In `FilterRing`, accept `pauseRotation` prop and include it in `shouldRotateRef.current = !ringHovered && selected === null && !isDragging.current && !pauseRotation`.

### 2. `src/index.css` — global mobile perf rules
Append a perf block:
- `@media (max-width: 768px)`: kill tap highlight; disable `backdrop-filter` on `.backdrop-blur-sm/md/xl` (replace with solid translucent bg).
- Global `html { scroll-behavior: smooth; -webkit-overflow-scrolling: touch; }`.
- `* { backface-visibility: hidden; }`.
- `button, a, [role="button"] { touch-action: manipulation; }`.

### 3. Remove decorative `animate-pulse`
Scan project for `animate-pulse` usages and remove only from decorative/background dots & glow overlays. Keep on:
- loading skeletons / spinners
- live notification badges (unread counts)
- `VerifiedBadge` indicator if it conveys status

Targets to audit (will `rg "animate-pulse"` first, then strip from decorative spots in pages like `Dashboard.tsx`, `admin/UserManagement.tsx`, hub pages).

### 4. Add `once: true` to scroll-triggered framer-motion animations
Search project for `whileInView` and `viewport={{` and add `once: true` to any viewport object that doesn't already set it. This prevents re-firing on every scroll-into-view.

## Out of scope
- No data, business logic, or layout changes.
- Keeping all rotation directions/speeds; only pausing during scroll.
- Not touching the orbital chart's interactive behavior (drag, wheel, click).

## Verification
- Visual: orbital segments no longer bleed color outside arcs on mobile preview.
- Perf: scrolling the QuickFilter page no longer triggers 5 concurrent rAF loops (rotations freeze during scroll, resume 300ms after).
- Regression check: hover/click/drag interactions on rings still work; no layout shifts from CSS perf rules.
