

# Fix Admin Role Label & Badge

## Changes

### 1. Translations (`src/lib/i18n.tsx`)
- Change Arabic `roleAdmin` and `role_admin` from `'مدير(ة)'` to `'أدمين'`
- Change French `roleAdmin` and `role_admin` from `'Administrateur(trice)'` to `'Admin'`
- Add `badge_admin` tooltip key: Arabic `'أدمين'`, French `'Admin'`

### 2. Badge Logic (`src/components/VerifiedBadge.tsx`)
- In `getBadgeStatus`, add `'admin'` to the green badge check alongside `national_secretary` and `deputy_national_secretary`
- This gives admin the same green shimmering badge

### 3. Tooltip (`src/components/AuthenticatedLayout.tsx`)
- The tooltip already shows `t[`badge_${badgeStatus}`]` — since admin will now be `green` status, ensure `badge_green` translation covers this or add a role-specific tooltip. Since admin, national_secretary, and deputy all share green, the tooltip should show the role-specific name. Update to use role-based tooltip: if role is admin show "أدمين", if national_secretary show its name, etc. This means changing the tooltip from `t[`badge_${badgeStatus}`]` to a role-aware label when the badge is green.

