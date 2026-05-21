## Fix province-to-directorate mapping in QuickFilter

Apply 2 surgical edits to `src/pages/QuickFilter.tsx`. `ACADEMIES` is already imported. No other files touched.

### Edit 1 — Replace `onProvinceSelect` handler

Replace the current 3-tier matching with a bilingual-aware handler that:
1. Extracts the Arabic portion from the GeoJSON name (e.g. `"Province d'El Jadida إقليم الجديدة"` → `"إقليم الجديدة"`) via regex on Arabic Unicode range.
2. Strips the Arabic prefix `إقليم` / `عمالة` → `"الجديدة"`.
3. Normalizes (remove spaces/dashes, map trailing `ة` → `ه`) for fuzzy matching.
4. Matches against the selected academy's directorates, falling back to all `ACADEMIES` directorates when no region is selected.
5. Uses exact → normalized exact → normalized contains (both directions), falling back to the cleaned Arabic name.

### Edit 2 — Simplify directorate query in `handleSearch`

Replace the current `.or(directorate.eq.X, directorate.ilike.%X%)` with:
```ts
if (filters.directorate) query = query.eq('directorate', filters.directorate.trim());
```

### Scope
Only the two blocks above change in `QuickFilter.tsx`. No other files, no DB, no UI changes.

### Verification
Click a province on the map → directorate chip shows the short Arabic name (e.g. `الجديدة`, `مكناس`) → Search returns matching profiles.
