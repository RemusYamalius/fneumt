## Plan: Full CSS revert + single targeted wrapper fix

### Step 1 — Full revert of `src/index.css`
Remove every line added by previous mobile-fix prompts. Restore `src/index.css` to its pre-fix original state:
- Delete the final `@media (max-width: 768px)` block (touch-action, universal `backdrop-filter: none !important`, `.glass`/`.glass-dark`/`[class*="backdrop-blur"]`/`[class*="glass"]` background overrides, universal `opacity: 1 !important; visibility: visible !important`, exception block for `[aria-hidden="true"]`/`[data-state="closed"]`/`[data-radix-popper-content-wrapper]`/`.sr-only`, `main > section` isolation, `svg`/`canvas` resets).
- Delete any leftover `.gpu-isolate`, `.gpu-contain`, `.section-separator` utilities if still present.
- Leave all original (pre-fix) CSS untouched.

### Step 2 — Do NOT add any CSS
No `@media` blocks. No new utility classes. No `contain`, `isolation`, `backdrop-filter`, `opacity`, or `will-change` overrides anywhere in `index.css`.

### Step 3 — One targeted inline-style fix in `src/pages/QuickFilter.tsx`
The direct parent wrapping both `<MoroccoMap />` and `<OrbitalFilter />` is the grid container:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

Add only these inline styles to that single element:

```tsx
<div
  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
  style={{ isolation: 'isolate', overflow: 'hidden', position: 'relative' }}
>
```

No other JSX, component, or style changes anywhere.

### Step 4 — Verify
Walk through `/quick-filter`, `/dashboard`, `/`, and auth pages at 375px and desktop:
- OrbitalFilter rings visible and colored
- MoroccoMap visible and interactive
- Header icons + colors intact
- Dashboard card colors intact
- Desktop unchanged
- No tearing between map and rings

Fallback: if OrbitalFilter disappears (due to a child needing to overflow the wrapper), drop `overflow: 'hidden'` from the inline style and keep only `isolation: 'isolate'` and `position: 'relative'`.

### Files touched
```text
src/index.css                 (revert only — no additions)
src/pages/QuickFilter.tsx     (add inline style to the grid wrapper, nothing else)
```
