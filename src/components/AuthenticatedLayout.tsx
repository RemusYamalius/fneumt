import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, Globe } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import AnimatedLogo from '@/components/AnimatedLogo';
import VerifiedBadge, { getBadgeStatus } from '@/components/VerifiedBadge';
import NotificationPanel from '@/components/NotificationPanel';
import { toast } from '@/hooks/use-toast';

/* ─── Sub-bar with shimmer ─── */
const SubBarShimmer = ({ roleLabel, dir }: { roleLabel: string; dir: 'rtl' | 'ltr' }) => (
  <div className="subbar-shimmer-wrap bg-white/10 border-t border-white/10 relative overflow-hidden">
    <div
      className="subbar-shimmer-beam"
      style={{ animationDirection: dir === 'rtl' ? 'reverse' : 'normal' }}
    />
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-1.5">
      <p className="text-sm font-semibold text-white/90 text-center truncate">
        {roleLabel}
      </p>
    </div>
  </div>
);

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  const { t, toggleLang, dir } = useI18n();
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, markAllRead, refetch } = useRealtimeNotifications(user?.id, role);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const badgeStatus = getBadgeStatus(role, profile?.is_member ?? false, profile?.membership_verified ?? false);

  const MISSION_VALUE_TO_KEY: Record<string, string> = {
    teacher_primary: 'missionTeacherPrimary', teacher_middle: 'missionTeacherMiddle', teacher_high: 'missionTeacherHigh',
    specialist_educational: 'missionSpecialistEducational', specialist_social: 'missionSpecialistSocial', specialist_admin_econ: 'missionSpecialistAdminEcon',
    admin_director: 'missionAdminDirector', admin_guard_ext: 'missionAdminGuardExt', admin_guard_int: 'missionAdminGuardInt',
    admin_nazir: 'missionAdminNazir', admin_work_chief: 'missionAdminWorkChief', admin_study_dir: 'missionAdminStudyDir',
    admin_cross_sector: 'missionAdminCrossSector', admin_ministry: 'missionAdminMinistry', supplier: 'missionSupplier',
    editor: 'missionEditor', educational_assistant: 'missionEducationalAssistant', technician: 'missionTechnician',
    inspector_primary: 'missionInspectorPrimary', inspector_middle: 'missionInspectorMiddle', inspector_high: 'missionInspectorHigh',
    inspector_guidance: 'missionInspectorGuidance', inspector_planning: 'missionInspectorPlanning', inspector_finance: 'missionInspectorFinance',
    economy_admin: 'missionEconomyAdmin', doctor: 'missionDoctor',
  };

  const getMissionLabel = (missionValue: string | null | undefined): string => {
    if (!missionValue) return t.roleTeacher;
    const key = MISSION_VALUE_TO_KEY[missionValue];
    return key ? ((t as any)[key] || missionValue) : missionValue;
  };

  const getRoleLabel = () => {
    if (!role || !profile) return getMissionLabel(profile?.mission);
    if (role === 'teacher') {
      return getMissionLabel(profile.mission);
    }
    const base = t[`role_${role}`] || t.roleTeacher;
    const isRegional = ['regional_supervisor', 'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high'].includes(role);
    const isSubRegional = ['provincial_manager', 'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high', 'local_coordinator', 'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high'].includes(role);
    if (isRegional && profile.academy) return `${base} — ${profile.academy}`;
    if (isSubRegional && profile.academy && profile.directorate) return `${base} — ${profile.academy} / ${profile.directorate}`;
    if (isSubRegional && profile.academy) return `${base} — ${profile.academy}`;
    return base;
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header
        className="gradient-primary text-white shadow-lg sticky top-0 z-50"
        style={{ transform: 'translateZ(0)', contain: 'paint' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AnimatedLogo size="w-12 h-12 sm:w-16 sm:h-16" />
            <p className="font-bold text-sm sm:text-base leading-tight">{t.platformName}</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center"><VerifiedBadge status={badgeStatus} size={22} /></span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{badgeStatus === 'green' && role ? (t[`role_${role}`] || t[`badge_${badgeStatus}`]) : t[`badge_${badgeStatus}`]}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={toggleLang} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <Globe className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent><p>{(t as any).switchLang}</p></TooltipContent>
              </Tooltip>
              {user?.id ? (
                <NotificationPanel
                  userId={user.id}
                  unreadCount={unreadCount}
                  markAllRead={markAllRead}
                  onRefetch={refetch}
                />
              ) : null}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={handleSignOut} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent><p>{t.logout}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <SubBarShimmer roleLabel={getRoleLabel()} dir={dir} />
      </header>
      {children}
    </div>
  );
};

export default AuthenticatedLayout;
