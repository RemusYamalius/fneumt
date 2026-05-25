## Fix RTL table column alignment

Add `text-right` to all `TableHead` and `TableCell` elements so headers align above their data columns in RTL context. Checkbox column gets `text-center`.

### Files

**1. `src/components/SearchResultsTable.tsx`**
- Checkbox `TableHead`: add `text-center`
- 7 data `TableHead`s (Name, Academy, Directorate, Mission, Membership, Phone, PPR): add `text-right`
- Body `TableCell`s for full_name, academy, directorate, mission, phone, employee_number: add `text-right`
- (Membership badge cell + checkbox cell left as-is since they're centered/start visuals)

**2. `src/pages/admin/SecurityLog.tsx`**
- Read file, then add `text-right` to all `TableHead` and `TableCell` elements (Date, Event Type, Severity, User, Details columns).

**3. `src/pages/admin/UserManagement.tsx`**
- Read file, then add `text-right` to all `TableHead` and `TableCell` elements.

**4. `src/pages/JoinRequests.tsx`**
- Read file, then add `text-right` to all `TableHead` and `TableCell` elements.

### Out of scope
- No functionality, data, or logic changes.
- No changes to `src/components/ui/table.tsx` defaults.
