## Fix checkbox column alignment in SearchResultsTable.tsx

The header checkbox cell already has `text-center`, but the body checkbox cells do not. This causes row checkboxes to appear offset from the header checkbox in RTL layout.

### Change
- In `src/components/SearchResultsTable.tsx`, add `text-center` to the body `TableCell` that wraps each row `Checkbox`.

### Out of scope
- No other files or logic changed.