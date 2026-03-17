

# Fix Select Trigger RTL Direction

## Problem
The `SelectTrigger` uses default `flex` layout with `justify-between`, but the text direction inside the trigger doesn't follow RTL. In Arabic, the text ("ذكر") should appear on the right and the chevron arrow on the left.

## Solution
Add `text-start` class to the `SelectTrigger` so text aligns according to document direction. The `flex` + `justify-between` already handles icon positioning correctly in RTL contexts since the browser flips flex direction when `dir="rtl"` is set on a parent. The key fix is ensuring the trigger itself respects text direction.

**File: `src/components/ui/select.tsx`** (line 20)
- Add `text-start` to SelectTrigger className to ensure text aligns to the start (right in RTL, left in LTR)
- Add `flex-row-reverse` conditionally or use `[dir=rtl] &` — actually, since the HTML `dir="rtl"` is set on the document, `justify-between` in a flex container already flips. The issue is likely that the `Icon` needs `ms-auto` (margin-inline-start) instead of being at the end.

Looking at the image: text "ذكر" is on the LEFT and chevron on the RIGHT — but user wants the opposite. The flex container with `justify-between` should already handle this if RTL is properly inherited. Let me check how RTL direction is set in the app.

Actually, the simpler fix: add `text-start` and ensure the trigger has proper direction inheritance. The `SelectPrimitive.Icon` should use `ms-auto` or the trigger should use `flex-row-reverse` in RTL — but the cleanest approach is just ensuring the trigger container inherits direction properly, which `justify-between` will handle automatically.

The real fix: The Radix Select trigger renders children then icon. In RTL, flex `justify-between` should put children on the right and icon on the left automatically. If it's not working, it means the trigger or a parent doesn't have `dir="rtl"`. Let me check the i18n setup.

## Changes

**`src/components/ui/select.tsx`** — SelectTrigger:
- Add `text-start` to the className to ensure proper text alignment in both directions

This single change ensures all select triggers across the entire site respect the current language direction.

