

## Plan: Colored Backgrounds for User Management + Fix PDF Export

### 1. Fix PDF Export (Critical Bug)
The `jspdf` package is **missing** from `package.json` — only `jspdf-autotable` is installed. The import `import jsPDF from 'jspdf'` in `src/lib/export-supervisor.ts` fails silently at runtime.

**Fix:** Add `jspdf` as a dependency in `package.json`.

### 2. Add Gradient Backgrounds to User Management Page

**File: `src/pages/admin/UserManagement.tsx`**

Apply the same pastel gradient styling used in the Supervisor Dashboard:

- **Page header section**: Wrap icon + title in a subtle gradient container (`bg-gradient-to-br from-slate-50 to-blue-50/40`)
- **Filter bar** (line 156): Change `bg-card` to `bg-gradient-to-br from-slate-100/80 to-blue-50/50 border-white/60`
- **Table wrapper** (line 191): Change `bg-card` to `bg-gradient-to-br from-white to-blue-50/30 border-blue-100/40`
- **Table header row**: Add colored header background (`bg-gradient-to-r from-[hsl(207,78%,28%)] to-[hsl(207,78%,38%)] text-white`)
- **Overall page**: Add a subtle tinted background to the main container

### Summary
- Install missing `jspdf` package to fix PDF export
- Apply consistent gradient styling to User Management matching the Supervisor Dashboard aesthetic

