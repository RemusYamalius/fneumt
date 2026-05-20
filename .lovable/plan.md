## Fix mobile rendering glitch between map and orbital chart

Apply three surgical CSS fixes to eliminate GPU compositing artifacts on mobile in the QuickFilter page.

### Changes

**1. `src/components/OrbitalFilter.tsx`**
- Change main SVG `overflow="visible"` → `overflow="hidden"` and add `style={{ isolation: 'isolate' }}`.

**2. `src/components/MoroccoMap.tsx`**
- Remove `transform: 'translate3d(0,0,0)'` and `willChange: 'transform'` from the map container style; keep `isolation`, `position`, `zIndex`, `overflow`.

**3. `src/pages/QuickFilter.tsx`**
- Add `style={{ contain: 'paint', isolation: 'isolate' }}` to both grid children (map motion.div and orbital motion.div).

### Notes
- No functionality, data, or animation changes.
- Need to verify Fix 1 doesn't clip intentionally overflowing orbital decorations — will inspect OrbitalFilter.tsx before applying. If the rotating rings rely on overflow:visible for visual effect, will instead scope `overflow:hidden` to a wrapper while keeping SVG visible, or apply only on mobile via CSS.
