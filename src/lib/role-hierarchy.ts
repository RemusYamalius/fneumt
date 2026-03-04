// Role hierarchy and promotion rules

export type AppRole =
  | 'admin'
  | 'regional_supervisor'
  | 'deputy_regional_primary'
  | 'deputy_regional_middle'
  | 'deputy_regional_high'
  | 'provincial_manager'
  | 'deputy_provincial_primary'
  | 'deputy_provincial_middle'
  | 'deputy_provincial_high'
  | 'local_coordinator'
  | 'deputy_local_primary'
  | 'deputy_local_middle'
  | 'deputy_local_high'
  | 'teacher';

// All roles that have promotion powers
export const PROMOTER_ROLES: AppRole[] = [
  'admin',
  'regional_supervisor',
  'deputy_regional_primary',
  'deputy_regional_middle',
  'deputy_regional_high',
  'provincial_manager',
  'deputy_provincial_primary',
  'deputy_provincial_middle',
  'deputy_provincial_high',
  'local_coordinator',
];

// What roles each promoter can assign
export function getAllowedPromotions(promoterRole: AppRole): AppRole[] {
  switch (promoterRole) {
    case 'admin':
      // Admin can assign any role
      return [
        'regional_supervisor',
        'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high',
        'provincial_manager',
        'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high',
        'local_coordinator',
        'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high',
        'teacher',
      ];
    case 'regional_supervisor':
      return ['deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high'];
    case 'deputy_regional_primary':
    case 'deputy_regional_middle':
    case 'deputy_regional_high':
      return ['provincial_manager'];
    case 'provincial_manager':
      return ['deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high'];
    case 'deputy_provincial_primary':
    case 'deputy_provincial_middle':
    case 'deputy_provincial_high':
      return ['local_coordinator'];
    case 'local_coordinator':
      return ['deputy_local_primary', 'deputy_local_middle', 'deputy_local_high'];
    default:
      return [];
  }
}

// Geographic constraint type for each promoter
export type GeoConstraint = 'none' | 'academy' | 'directorate';

export function getGeoConstraint(promoterRole: AppRole): GeoConstraint {
  if (promoterRole === 'admin') return 'none';
  if (['regional_supervisor', 'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high'].includes(promoterRole)) {
    return 'academy';
  }
  return 'directorate';
}

export function isPromoterRole(role: AppRole): boolean {
  return PROMOTER_ROLES.includes(role);
}

export const ALL_ROLES: AppRole[] = [
  'admin',
  'regional_supervisor',
  'deputy_regional_primary',
  'deputy_regional_middle',
  'deputy_regional_high',
  'provincial_manager',
  'deputy_provincial_primary',
  'deputy_provincial_middle',
  'deputy_provincial_high',
  'local_coordinator',
  'deputy_local_primary',
  'deputy_local_middle',
  'deputy_local_high',
  'teacher',
];
