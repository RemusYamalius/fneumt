

# Add Date of Birth Card to Profile

## Overview
Add a "تاريخ الازدياد" (Date of Birth) card to the profile carousel, positioned after the "Gender" card, with a calendar date picker.

## Changes

### 1. Database Migration
Add a `date_of_birth` column (type `date`, nullable) to the `profiles` table.

### 2. `src/pages/Profile.tsx`
- Add `date_of_birth` to the `form` state (as string, e.g. `'2000-01-15'`)
- Add a new card type `'datepicker'` to `CardField.type`
- Insert the date of birth card after the gender card in the `cards` array (index 2), using `Calendar` icon from lucide
- In `renderCardContent`, handle `'datepicker'` type: render a Popover with a Calendar component inside
- Format the displayed date in Arabic-friendly format
- Add `date_of_birth` to `handleSave` update call
- Add to `getFieldValue` and `isFieldFilled`
- Import `Calendar` component, `Popover`/`PopoverTrigger`/`PopoverContent`, and `format` from `date-fns`

### 3. `src/lib/i18n.tsx`
Add translations:
- Arabic: `dateOfBirthLabel: 'تاريخ الازدياد'`, `pickDate: 'اختر التاريخ'`
- French: `dateOfBirthLabel: 'Date de naissance'`, `pickDate: 'Choisir une date'`

### 4. `src/hooks/useAuth.tsx`
Add `date_of_birth: string | null` to the `Profile` interface.

