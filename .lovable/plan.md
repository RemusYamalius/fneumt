## Plan: Isolate MoroccoMap into its own GPU compositing layer

### Goal
Eliminate the mobile tearing artifact between the map and the orbital filter by promoting MoroccoMap to its own compositor layer, without touching any other file.

### Step 1 — Wrap `mapContent` root in MoroccoMap.tsx
File: `src/components/MoroccoMap.tsx` (around line 238-241)

Change the outer wrapper of `mapContent` from:

```tsx
const mapContent = (
  <div className="relative w-full h-full flex items-center justify-center">
```

to:

```tsx
const mapContent = (
  <div
    className="relative w-full h-full flex items-center justify-center"
    style={{
      transform: 'translate3d(0, 0, 0)',
      willChange: 'transform',
      isolation: 'isolate',
      position: 'relative',
      zIndex: 0,
      overflow: 'hidden',
    }}
  >
```

This single wrapper covers both the inline (non-fullscreen) and fullscreen render paths, since both render `mapContent`.

### Step 2 — Harden the two SVG elements
Both `<svg>` blocks (country view ~line 261, region view ~line 380) currently have:

```tsx
style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.15))' }}
```

Update both to:

```tsx
style={{ display: 'block', overflow: 'hidden', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.15))' }}
```

The `drop-shadow` filter is a static CSS filter (not an animation/transform), so it stays — the user's instruction was to remove transform/animation on the SVG itself, of which there is none.

### Step 3 — Do not touch
- `src/index.css` — unchanged
- `src/components/OrbitalFilter.tsx` — unchanged
- `src/pages/QuickFilter.tsx` — leave the existing grid wrapper inline style as-is
- Any other file

### Step 4 — Verify at 375px mobile
- No tearing/colored stripes between map and rings
- Map renders fully and is interactive (region click → drill-down works)
- OrbitalFilter rings still visible and colored
- Header icons + colors intact
- Desktop unchanged

### Files touched
```text
src/components/MoroccoMap.tsx   (wrapper div + 2 svg style props)
```
