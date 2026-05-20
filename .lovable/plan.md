## Goal

Replace the "الإطار / المهمة" (Cadre / Mission) list everywhere with the new 26-item list, and centralize it as a single source of truth.

## Current state

The list is duplicated in 5+ files (`DatabaseDashboard.tsx`, `SponsoredPostComposer.tsx`, `PostComposer.tsx`, `AuthenticatedLayout.tsx`, `OrbitalFilter.tsx`, `Profile.tsx`), each maintaining its own `MISSION_DB_VALUES` + `MISSION_VALUE_TO_KEY` mapping. The `profiles.mission` column is `text` (not a Postgres enum), so no DB migration is needed — only code + i18n labels.

## Plan

### 1. Create single source of truth: `src/lib/missions.ts`

Exports `MISSION_DB_VALUES` (ordered array, 26 entries) and `MISSION_VALUE_TO_KEY` (with legacy aliases preserved for existing profiles in DB).

New DB value identifiers (added): `teacher_aggrege`, `counselor_guidance`, `counselor_planning`, `inspector_post_bac`, `teacher_higher_ed`, `engineer`.

Removed from the user-facing dropdown (but kept as legacy fallbacks mapping to `admin_director` so old profile values still render): `admin_guard_ext`, `admin_guard_int`, `admin_nazir`, `admin_work_chief`, `admin_study_dir`, `economy_admin`.

Final ordered list (DB value → i18n key → AR label):

```
1.  teacher_primary         missionTeacherPrimary         أستاذ(ة) التعليم الإبتدائى
2.  teacher_middle          missionTeacherMiddle          أستاذ(ة) الثانوي الإعدادي
3.  teacher_high            missionTeacherHigh            أستاذ(ة) الثانوى التأهيلى
4.  specialist_educational  missionSpecialistEducational  مختص(ة) تربوي (ة)
5.  specialist_social       missionSpecialistSocial       مختص(ة) اجتماعى(ة)
6.  specialist_admin_econ   missionSpecialistAdminEcon    مختص(ة) الإدارة والاقتصاد(ة)
7.  editor                  missionEditor                 محرر(ة)
8.  technician              missionTechnician             تقني(ة)
9.  supplier                missionSupplier               ممون(ة)
10. educational_assistant   missionEducationalAssistant   مساعد(ة) تربوي(ة)
11. admin_ministry          missionAdminMinistry          متصرف(ة) وزارة التربية الوطنية
12. admin_cross_sector      missionAdminCrossSector       متصرف(ة) (الأطر المشتركة)
13. teacher_aggrege         missionTeacherAggrege         أستاذ(ة) مبرز(ة) التربية والتكوين
14. counselor_guidance      missionCounselorGuidance      مستشار(ة) في التوجيه التربوي
15. counselor_planning      missionCounselorPlanning      مستشار(ة) في التخطيط التربوي
16. inspector_primary       missionInspectorPrimary       مفتش(ة) تربوي(ة) للتعليم الابتدائي
17. inspector_middle        missionInspectorMiddle        مفتش(ة) تربوي(ة) للتعليم الثانوي الإعدادي
18. inspector_high          missionInspectorHigh          مفتش(ة) تربوي(ة) للتعليم الثانوي التأهيلي
19. inspector_post_bac      missionInspectorPostBac       مفتش(ة) تربوي(ة) (ما بعد الباكالوريا)
20. inspector_guidance      missionInspectorGuidance      مفتش(ة) في التوجيه التربوي
21. inspector_planning      missionInspectorPlanning      مفتش(ة) في التخطيط التربوي
22. inspector_finance       missionInspectorFinance       مفتش(ة) الشؤون المالية
23. admin_director          missionAdminDirector          متصرف(ة) تربوي(ة)
24. teacher_higher_ed       missionTeacherHigherEd        أستاذ(ة) التعليم العالي
25. engineer                missionEngineer               مهندس(ة)
26. doctor                  missionDoctor                 طبيب(ة)
```

### 2. Update `src/lib/i18n.tsx`

- AR block: rewrite the 26 `mission*` labels to the exact Arabic strings above; add the 6 new keys; remove the 6 obsolete keys (`missionAdminGuardExt/Int`, `missionAdminNazir`, `missionAdminWorkChief`, `missionAdminStudyDir`, `missionEconomyAdmin`).
- FR block: matching French translations:
  - `missionTeacherAggrege`: "Professeur(e) agrégé(e) de l'éducation et de la formation"
  - `missionCounselorGuidance`: "Conseiller(ère) en orientation pédagogique"
  - `missionCounselorPlanning`: "Conseiller(ère) en planification pédagogique"
  - `missionInspectorPostBac`: "Inspecteur(trice) pédagogique (post-bac)"
  - `missionTeacherHigherEd`: "Enseignant(e) de l'enseignement supérieur"
  - `missionEngineer`: "Ingénieur(e)"
  - `missionAdminDirector`: "Administrateur(trice) pédagogique"
  - `missionInspectorPrimary/Middle/High/Finance`: rephrase to match new AR wording ("pour l'enseignement primaire", etc., "Inspecteur(trice) des affaires financières").
  - Remove the 6 obsolete keys.

### 3. Replace duplicated lists with imports

In each of these files, remove the local `MISSION_DB_VALUES` / `MISSION_VALUE_TO_KEY` / `MISSION_KEYS` / `MISSION_LABEL_MAP_*` constants and import from `@/lib/missions`:

- `src/pages/DatabaseDashboard.tsx`
- `src/components/SponsoredPostComposer.tsx`
- `src/components/PostComposer.tsx`
- `src/components/AuthenticatedLayout.tsx` (only has `MISSION_VALUE_TO_KEY`)
- `src/components/OrbitalFilter.tsx` (has its own `MISSION_KEYS` + `MISSION_LABEL_MAP_AR/FR` short labels — replace with shared list; keep `MISSION_COLORS` local since it's visual)
- `src/pages/Profile.tsx` (hardcoded `{ value, label }[]` array for the mission Select — generate from shared list + i18n)

### 4. OrbitalFilter short labels

Currently uses shorter labels (e.g. "أستاذ إبتدائي") for compact orbital display. With 26 segments, full labels won't fit. Keep behavior: import shared `MISSION_DB_VALUES` for order/values, but allow OrbitalFilter to use the full i18n label (since it's already truncated visually in the SVG). No truncation logic change — just driven from one list.

### 5. No DB migration

`profiles.mission` is `text`. Existing rows with removed values (`admin_guard_ext`, etc.) still render correctly via the legacy fallback entries in `MISSION_VALUE_TO_KEY`. Users editing their profile will see the new list and pick a new value on save. `derive_corps_from_mission` SQL function still handles `teacher_*`/`inspector_*` correctly; new missions fall through to its default branch ('primary'), which is acceptable since auto-assignment only matters for teachers.

## Out of scope

No style, layout, or functional changes — only the mission list contents and centralization.

## Verification

- Build passes; no leftover references to removed keys.
- Profile page mission dropdown shows the 26 new items in order, in both AR and FR.
- Filters (OrbitalFilter, QuickFilter, SearchResultsTable, PostComposer recipient filter) use the same list.
- An existing profile with a legacy mission value (e.g. `admin_nazir`) still displays a label (falls back to "متصرف(ة) تربوي(ة)").
