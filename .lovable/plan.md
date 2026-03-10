

## Plan: Fix PDF Export - `doc.autoTable is not a function`

### Root Cause
The runtime error is `doc.autoTable is not a function`. The side-effect import `import 'jspdf-autotable'` is not properly extending the `jsPDF` prototype in the current bundler setup. This is a known issue with `jspdf-autotable` v5.x and Vite.

### Fix
In `src/lib/export-supervisor.ts`, change the import approach to use `jspdf-autotable`'s default export which provides the `autoTable` function directly, instead of relying on the side-effect import to patch `jsPDF.prototype`.

**File: `src/lib/export-supervisor.ts`**

Replace:
```typescript
import jsPDF from 'jspdf';
import 'jspdf-autotable';
```

With:
```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
```

Then replace all `(doc as any).autoTable({...})` calls with `autoTable(doc, {...})` throughout the file. This uses the functional API which doesn't depend on prototype patching.

Also update references to `(doc as any).lastAutoTable.finalY` to use the return value from `autoTable()`.

### Changes Summary
- Lines 1-2: Update imports
- Lines ~128-145: Change first `autoTable` call to functional style, capture return value
- Lines ~160-185: Change second `autoTable` call to functional style
- All instances of `(doc as any).lastAutoTable.finalY` replaced with the returned table's `finalY`

