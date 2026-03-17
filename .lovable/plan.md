

# Fix: Allow Admin to Assign National Roles (One Person Only)

## Problem
The `getAllowedPromotions('admin')` function doesn't include `national_secretary` or `deputy_national_secretary` in its return list, so these roles don't appear in the dropdown for admin.

## Changes

### 1. `src/lib/role-hierarchy.ts`
- Add `'national_secretary'` and `'deputy_national_secretary'` to the return array **only for `'admin'`** (not for `national_secretary` or `deputy_national_secretary` themselves — they cannot self-assign or assign each other to these positions).
- Split the switch case: `admin` gets `national_secretary` + `deputy_national_secretary` + all other roles. `national_secretary`/`deputy_national_secretary` get only the subordinate roles (as currently).

### 2. `src/pages/admin/UserManagement.tsx` — Uniqueness enforcement
- Before allowing role change to `national_secretary` or `deputy_national_secretary`, check if someone already holds that role.
- In `handleRoleChange`: if `newRole` is one of these two, query `user_roles` to check if another user already has it. If yes, show an error toast and block the change.
- In the role dropdown: disable/hide these two options if they're already taken by another user (pre-fetch occupied national roles on page load).

### 3. Database constraint (migration)
- Add a partial unique index to enforce at most one user per national role:
```sql
CREATE UNIQUE INDEX unique_national_secretary ON public.user_roles (role) WHERE role = 'national_secretary';
CREATE UNIQUE INDEX unique_deputy_national_secretary ON public.user_roles (role) WHERE role = 'deputy_national_secretary';
```
This guarantees the constraint at the database level too.

