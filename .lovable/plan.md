## Plan

1. **Harden `MoroccoMap` itself**
   - Wrap the normal map output and fullscreen map output in `.morocco-map-container` with inline compositing isolation:
     - `position: relative`
     - `isolation: isolate`
     - `contain: strict`
     - `overflow: hidden`
     - `transform: translateZ(0)`
   - Add explicit SVG classes/styles so both country and region SVGs render as stable block elements.
   - Remove mobile blur/backdrop effects from map overlays by targeting the component container, without changing desktop visuals.
   - Add a mobile guard so motion wrappers inside the map are forced visible and untransformed on small screens.

2. **Harden `OrbitalFilter` / ring component**
   - Wrap the returned filter content in `.orbital-filter-container` with inline isolation:
     - `position: relative`
     - `isolation: isolate`
     - `contain: layout paint style`
     - `overflow: hidden`
   - Detect mobile viewport in the component and stop ring auto-rotation on mobile while keeping click/selection behavior intact.
   - Add explicit mobile-safe inline `opacity: 1` / `transform: none` on the key orbital wrapper so disabling motion cannot leave invisible content.
   - Ensure orbital SVG is a stable block element on mobile.

3. **Add the compositor layer break between sections**
   - In `QuickFilter`, add a real divider element between the Morocco map section and the orbital filter section.
   - On desktop it will be visually inert and not alter the layout; on mobile it will force a clean section boundary between the two isolated render trees.

4. **Add targeted CSS safeguards in `index.css`**
   - Add the exact mobile rules for:
     - `.morocco-map-container`
     - `.orbital-filter-container`
     - `[class*="orbital"]`
     - `[class*="OrbitalFilter"]`
     - `[class*="MoroccoMap"]`
   - Add SVG-specific mobile reset for Morocco map SVGs.
   - Add `.section-separator` styling as a 1px compositing break.
   - Scope the new rules to `max-width: 768px` so desktop remains unchanged.

5. **Verification**
   - After implementation, inspect the app at a 375px mobile viewport on `/quick-filter`.
   - Confirm the map renders, the orbital/ring filter remains visible, and the boundary between them has the explicit separator/compositing break.
   - Desktop behavior will remain unchanged because the CSS and motion disables are mobile-only.