

## Plan: Fix Table Alignment & Add Colored Backgrounds to Supervisor Dashboard

### Problem 1: Table Column Misalignment
The "Recent Requests" table headers don't align with their data columns. The issue is that the table inside a rounded container with RTL direction causes misalignment. Fix by adding explicit `text-start` alignment to `TableHead` and `TableCell`, and ensuring consistent column widths.

### Problem 2: Add Colored Backgrounds (like reference image)
The reference image shows a dashboard with colored card backgrounds (soft blues, purples, grays). Currently all sections use plain `bg-card` or `bg-background`. Will add subtle gradient/colored backgrounds to:
- KPI cards
- Filter section
- Deputy cards (header area)
- Charts section
- Rate cards
- Mini stats row
- Recent requests table wrapper

### Changes

**File: `src/pages/SupervisorDashboard.tsx`**

1. **Fix table**: Add `text-start` to all `TableHead` and `TableCell` elements, set `dir="rtl"` on the table wrapper to ensure proper RTL alignment, and add `whitespace-nowrap` to prevent column wrapping issues.

2. **KPI cards** (line ~130): Add soft colored background tints matching each card's accent color instead of plain `bg-card`.

3. **Filter section** (line ~597): Add a subtle colored background container (`bg-gradient-to-br from-slate-100/80 to-blue-50/50` or similar muted tint).

4. **Deputy cards** (line ~671): Add a subtle gradient background to the card itself.

5. **Charts row** (lines 816-891): Add colored background tints to each chart card (e.g., soft blue, soft purple, soft teal).

6. **Rate cards** (lines 792-811): Replace `bg-muted/30` with soft colored backgrounds.

7. **Mini stats** (line ~147): Add subtle colored pill backgrounds.

8. **Recent requests table** (line ~900): Add colored header row background.

### Summary of visual changes
- Soft pastel/gradient backgrounds on all dashboard sections
- Properly aligned RTL table with fixed column headers
- Consistent with the budget dashboard reference aesthetic (colored cards over a tinted background)

