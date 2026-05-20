// Single source of truth for the "الإطار / المهمة" (Cadre / Mission) list.
// Update this file to change the list everywhere it appears in the app.

export const MISSION_DB_VALUES = [
  'teacher_primary',
  'teacher_middle',
  'teacher_high',
  'specialist_educational',
  'specialist_social',
  'specialist_admin_econ',
  'editor',
  'technician',
  'supplier',
  'educational_assistant',
  'admin_ministry',
  'admin_cross_sector',
  'teacher_aggrege',
  'counselor_guidance',
  'counselor_planning',
  'inspector_primary',
  'inspector_middle',
  'inspector_high',
  'inspector_post_bac',
  'inspector_guidance',
  'inspector_planning',
  'inspector_finance',
  'admin_director',
  'teacher_higher_ed',
  'engineer',
  'doctor',
] as const;

export type MissionValue = (typeof MISSION_DB_VALUES)[number];

// Maps DB values (including legacy/removed ones) to i18n keys, so existing
// profiles with deprecated mission values still render a readable label.
export const MISSION_VALUE_TO_KEY: Record<string, string> = {
  teacher_primary: 'missionTeacherPrimary',
  teacher_middle: 'missionTeacherMiddle',
  teacher_high: 'missionTeacherHigh',
  specialist_educational: 'missionSpecialistEducational',
  specialist_social: 'missionSpecialistSocial',
  specialist_admin_econ: 'missionSpecialistAdminEcon',
  editor: 'missionEditor',
  technician: 'missionTechnician',
  supplier: 'missionSupplier',
  educational_assistant: 'missionEducationalAssistant',
  admin_ministry: 'missionAdminMinistry',
  admin_cross_sector: 'missionAdminCrossSector',
  teacher_aggrege: 'missionTeacherAggrege',
  counselor_guidance: 'missionCounselorGuidance',
  counselor_planning: 'missionCounselorPlanning',
  inspector_primary: 'missionInspectorPrimary',
  inspector_middle: 'missionInspectorMiddle',
  inspector_high: 'missionInspectorHigh',
  inspector_post_bac: 'missionInspectorPostBac',
  inspector_guidance: 'missionInspectorGuidance',
  inspector_planning: 'missionInspectorPlanning',
  inspector_finance: 'missionInspectorFinance',
  admin_director: 'missionAdminDirector',
  teacher_higher_ed: 'missionTeacherHigherEd',
  engineer: 'missionEngineer',
  doctor: 'missionDoctor',
  // ── Legacy fallbacks (DB may still contain these values) ──
  admin_guard_ext: 'missionAdminDirector',
  admin_guard_int: 'missionAdminDirector',
  admin_nazir: 'missionAdminDirector',
  admin_work_chief: 'missionAdminDirector',
  admin_study_dir: 'missionAdminDirector',
  economy_admin: 'missionAdminDirector',
  teaching: 'missionTeacherPrimary',
  teacher: 'missionTeacherPrimary',
  teacher_middle_school: 'missionTeacherMiddle',
  teacher_high_school: 'missionTeacherHigh',
  administrative: 'missionAdminDirector',
  inspector: 'missionInspectorPrimary',
};

export function getMissionI18nKey(value: string | null | undefined): string | null {
  if (!value) return null;
  return MISSION_VALUE_TO_KEY[value] ?? null;
}