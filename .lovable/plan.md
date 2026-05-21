## Fix: pass selectedDirectorate/selectedRegion as fallbacks to handleSearch

Three surgical edits in `src/pages/QuickFilter.tsx`. No other files.

### Edit 1 — Inline OrbitalFilter `onSearch`
Wrap `handleSearch` to merge map selections as fallbacks:
```tsx
onSearch={(f) => handleSearch({
  ...f,
  academy: f.academy || selectedRegion?.academyLabel || null,
  directorate: f.directorate || selectedDirectorate,
})}
```

### Edit 2 — Fullscreen OrbitalFilter `onSearch`
Same fallback merge after closing fullscreen:
```tsx
onSearch={(f) => {
  setIsOrbitalFullscreen(false);
  handleSearch({
    ...f,
    academy: f.academy || selectedRegion?.academyLabel || null,
    directorate: f.directorate || selectedDirectorate,
  });
}}
```

### Edit 3 — `handleSearch` deps
Change `}, [lang]);` → `}, [lang, selectedDirectorate, selectedRegion]);`

### Scope
Only the three blocks above. No UI, DB, or logic changes elsewhere.
