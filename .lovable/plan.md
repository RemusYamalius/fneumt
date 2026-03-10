

## Plan: Fix PDF Export, Notification Badge, and Add Downloadable Form

### 1. Fix PDF Export (Bug)

**Root cause:** In `jspdf-autotable` v5.x, `autoTable(doc, options)` returns `void`, not a table object. The current code does `const kpiTable = autoTable(...)` then `(kpiTable as any).finalY` which is `undefined.finalY` → crash. The error is silently swallowed by `try/finally` without `catch`.

Additionally, v5 uses a **named export** `{ autoTable }` not a default export.

**Fix in `src/lib/export-supervisor.ts`:**
- Change import to `import { autoTable } from 'jspdf-autotable'`
- Remove the return value capture; use `(doc as any).lastAutoTable.finalY` instead
- Add `catch` block in SupervisorDashboard to log errors

**Fix in `src/pages/SupervisorDashboard.tsx`:**
- Add `.catch(console.error)` or proper error handling in the PDF button's try block

### 2. Fix Notification Badge (Bell Icon)

**Problem:** The bell badge shows unread notification count, but notifications are never marked as read. When the user opens IncomingRequests, the badge should clear.

**Fix in `src/pages/IncomingRequests.tsx`:**
- On mount (when `user` is available), mark all notifications with `link = '/incoming-requests'` as `is_read = true`
- The `useRealtimeNotifications` hook already exposes `refetch` — pass it down or call it after marking read

**Fix in `src/hooks/useRealtimeNotifications.ts`:**
- Export a `markAllRead` function that updates all unread notifications for the user and refetches the count

**Fix in `src/components/AuthenticatedLayout.tsx`:**
- Pass `refetch` from `useRealtimeNotifications` via context or make the hook return a `markAllRead` method that IncomingRequests can call

Simplest approach: Add a `markAsRead` function to the hook, and call it from `IncomingRequests` on mount via importing supabase directly.

### 3. Add Downloadable Form Template to Attachments Step

**What:** Copy the uploaded PDF (`إستمارة_المعلومات_و_المشاكل.pdf`) to `public/forms/` and add a download link in Step 3 (Attachments) of `NewRequest.tsx`.

**UI:** Below the upload area, add a styled card with a download icon and bilingual text:
- AR: "تحميل استمارة المعلومات والمشاكل"
- FR: "Télécharger le formulaire d'informations et de problèmes"

The card will link to `/forms/إستمارة_المعلومات_و_المشاكل.pdf` with `download` attribute. Add a note reminding users to fill it out, include their info and signature, then re-attach it.

**Files changed:**
- `src/lib/export-supervisor.ts` — fix import and finalY access
- `src/pages/SupervisorDashboard.tsx` — add error logging in PDF catch
- `src/hooks/useRealtimeNotifications.ts` — add `markAsRead` function
- `src/pages/IncomingRequests.tsx` — call markAsRead on mount
- `src/pages/NewRequest.tsx` — add download template card in step 3
- `src/lib/i18n.tsx` — add translation keys for the form download
- Copy PDF to `public/forms/`

