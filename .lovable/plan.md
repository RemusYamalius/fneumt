

# Add Two New National Roles: Secretary General & Deputy Secretary General

## Overview
Add two new top-level roles (`national_secretary` and `deputy_national_secretary`) with admin-equivalent permissions, a green shimmering badge, and full integration across the app.

## Changes Required

### 1. Database Migration
Add two new values to the `app_role` enum:
```sql
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'national_secretary';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'deputy_national_secretary';
```

Update the `is_promoter` function to include these roles (they have admin-like powers).

### 2. Role Hierarchy (`src/lib/role-hierarchy.ts`)
- Add `'national_secretary'` and `'deputy_national_secretary'` to the `AppRole` type
- Add them to `PROMOTER_ROLES` and `ALL_ROLES`
- In `getAllowedPromotions`, give them the same promotions as `'admin'`
- In `getGeoConstraint`, return `'none'` for both (no geographic restriction)

### 3. Badge System (`src/components/VerifiedBadge.tsx`)
- Add a new `BadgeStatus`: `'green'`
- Green color: `fill: '#16a34a'`, `inner: '#15803d'`
- Add a shimmer animation (CSS `@keyframes`) that sweeps across the badge every 5 seconds
- Update `getBadgeStatus`: if role is `national_secretary` or `deputy_national_secretary`, return `'green'`

### 4. CSS Animation (`src/App.css` or `src/index.css`)
Add a shimmer keyframe animation for the green badge SVG overlay.

### 5. Translations (`src/lib/i18n.tsx`)
Arabic:
- `role_national_secretary`: 'الكاتب العام الوطني'
- `role_deputy_national_secretary`: 'مساعد الكاتب العام الوطني'
- `badge_green`: 'الكاتب العام الوطني' (or appropriate label)

French:
- `role_national_secretary`: 'Secrétaire Général National'
- `role_deputy_national_secretary`: 'Secrétaire Général Adjoint'
- `badge_green`: 'Secrétaire Général'

### 6. Route Guards (`src/App.tsx`)
Add `'national_secretary'` and `'deputy_national_secretary'` to every `allowedRoles` array that includes `'admin'`.

### 7. Dashboard (`src/pages/Dashboard.tsx`)
Add these roles to the `showIncomingRequests` and `isDeputyLocal`-like checks wherever `'admin'` is referenced, so they see the same admin interface.

### 8. Other Admin Checks
In `UserManagement.tsx` and `SupervisorDashboard.tsx`, treat these roles identically to `'admin'` in all conditional checks (`myRole === 'admin'` becomes `['admin', 'national_secretary', 'deputy_national_secretary'].includes(myRole)`).

### 9. Authenticated Layout (`src/components/AuthenticatedLayout.tsx`)
No special geographic suffix for these roles (same as admin).

## Technical Detail: Shimmer Effect
The green badge will use an SVG `<rect>` with a linear gradient mask animated via CSS keyframes, creating a shine sweep every 5 seconds. This keeps the effect self-contained within the badge component.

