## Fix province/directorate search bug

Apply the 4 surgical edits exactly as specified by the user.

### File 1: `src/pages/QuickFilter.tsx`
- **Edit A** — Replace the `onProvinceSelect` handler with the 3-tier matching logic (exact → partial → normalized) so map province clicks map reliably to the academy's directorate list.
- **Edit B** — In `handleSearch`, replace the `filters.directorate` exact `eq` with an `or(directorate.eq.<val>,directorate.ilike.%<val>%)` to tolerate minor stored-value differences.

### File 2: `src/components/OrbitalFilter.tsx`
- **Edit C** — Remove the `selectedDirectorate !== filters.directorate` guard from the `selectedDirectorate` sync effect so it always propagates.
- **Edit D** — Remove the `selectedAcademy !== filters.academy` guard from the academy sync effect and add `selectedDirectorate` to its dependency array.

### Scope
No other UI, logic, styles, or files are touched. No DB or RLS changes.

### Verification
After applying, click a province on the Morocco map → confirm the directorate chip updates and Search returns the expected profiles (no false "لا توجد نتائج مطابقة").
