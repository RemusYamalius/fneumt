import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ACADEMIES } from '@/lib/academies-data';
import type { AppRole } from '@/lib/role-hierarchy';

// Roles that can see all data (national scope)
const NATIONAL_ROLES: AppRole[] = ['admin', 'national_secretary', 'deputy_national_secretary'];
// Roles scoped to academy
const REGIONAL_ROLES: AppRole[] = ['regional_supervisor', 'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high'];
// Roles scoped to directorate
const PROVINCIAL_ROLES: AppRole[] = ['provincial_manager', 'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high'];
// Local coordinator sees their deputies
const LOCAL_ROLES: AppRole[] = ['local_coordinator'];
// Deputies only see their own data
const DEPUTY_LOCAL_ROLES: AppRole[] = ['deputy_local_primary', 'deputy_local_middle', 'deputy_local_high'];

export interface DeputyInfo {
  user_id: string;
  full_name: string | null;
  employee_number: string | null;
  institution: string | null;
  corps: string | null;
  phone: string | null;
  email: string | null;
  academy: string | null;
  directorate: string | null;
  office_name?: string | null;
}

export interface LocalOfficeInfo {
  id: string;
  office_name: string | null;
  academy: string | null;
  directorate: string | null;
  coordinator_id: string;
}

export function useHierarchicalFilter() {
  const { user, role, profile } = useAuth();

  const [selectedAcademy, setSelectedAcademy] = useState('');
  const [selectedDirectorate, setSelectedDirectorate] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [selectedDeputy, setSelectedDeputy] = useState('');

  const [offices, setOffices] = useState<LocalOfficeInfo[]>([]);
  const [deputies, setDeputies] = useState<DeputyInfo[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // Determine if user can see hierarchical filters
  const canSeeHierarchy = useMemo(() => {
    if (!role) return false;
    return [...NATIONAL_ROLES, ...REGIONAL_ROLES, ...PROVINCIAL_ROLES, ...LOCAL_ROLES].includes(role);
  }, [role]);

  const isNational = role ? NATIONAL_ROLES.includes(role) : false;
  const isRegional = role ? REGIONAL_ROLES.includes(role) : false;
  const isProvincial = role ? PROVINCIAL_ROLES.includes(role) : false;
  const isLocal = role ? LOCAL_ROLES.includes(role) : false;
  const isDeputy = role ? DEPUTY_LOCAL_ROLES.includes(role) : false;

  // Available academies based on role
  const availableAcademies = useMemo(() => {
    if (isNational) return ACADEMIES;
    if (isRegional && profile?.academy) {
      return ACADEMIES.filter(a => a.label === profile.academy);
    }
    return [];
  }, [isNational, isRegional, profile?.academy]);

  // Available directorates
  const availableDirectorates = useMemo(() => {
    if (selectedAcademy) {
      const acad = ACADEMIES.find(a => a.label === selectedAcademy);
      return acad?.directorates || [];
    }
    if (isProvincial && profile?.directorate) return [profile.directorate];
    return [];
  }, [selectedAcademy, isProvincial, profile?.directorate]);

  // Reset cascading filters
  useEffect(() => { setSelectedDirectorate(''); setSelectedOffice(''); setSelectedDeputy(''); }, [selectedAcademy]);
  useEffect(() => { setSelectedOffice(''); setSelectedDeputy(''); }, [selectedDirectorate]);
  useEffect(() => { setSelectedDeputy(''); }, [selectedOffice]);

  // Pre-select fixed values for scoped roles
  useEffect(() => {
    if (isRegional && profile?.academy) setSelectedAcademy(profile.academy);
    if (isProvincial && profile?.academy) setSelectedAcademy(profile.academy);
    if (isProvincial && profile?.directorate) setSelectedDirectorate(profile.directorate);
  }, [isRegional, isProvincial, profile?.academy, profile?.directorate]);

  // Fetch offices when directorate is selected
  useEffect(() => {
    if (!selectedDirectorate || !canSeeHierarchy) { setOffices([]); return; }
    const fetchOffices = async () => {
      const { data } = await supabase
        .from('local_offices')
        .select('id, office_name, academy, directorate, coordinator_id')
        .eq('directorate', selectedDirectorate);
      setOffices((data || []) as LocalOfficeInfo[]);
    };
    fetchOffices();
  }, [selectedDirectorate, canSeeHierarchy]);

  // Fetch deputies when directorate is selected (or for local coordinators)
  useEffect(() => {
    if (!canSeeHierarchy && !isLocal) return;
    const fetchDeputies = async () => {
      setLoadingMeta(true);
      
      let deputyRolesData: any[] = [];
      
      if (isLocal && user) {
        // Local coordinator: get deputies from same area
        const { data: myProfile } = await supabase.from('profiles').select('academy, directorate').eq('user_id', user.id).single();
        if (myProfile?.academy && myProfile?.directorate) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('role', ['deputy_local_primary', 'deputy_local_middle', 'deputy_local_high'] as any);
          
          if (roles && roles.length > 0) {
            const deputyIds = roles.map(r => r.user_id);
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, full_name, employee_number, institution, corps, phone, email, academy, directorate')
              .in('user_id', deputyIds)
              .eq('academy', myProfile.academy)
              .eq('directorate', myProfile.directorate);
            deputyRolesData = (profiles || []);
          }
        }
      } else if (selectedDirectorate) {
        // Hierarchical: get deputies in selected directorate
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('role', ['deputy_local_primary', 'deputy_local_middle', 'deputy_local_high'] as any);
        
        if (roles && roles.length > 0) {
          const deputyIds = roles.map(r => r.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, employee_number, institution, corps, phone, email, academy, directorate')
            .in('user_id', deputyIds)
            .eq('directorate', selectedDirectorate);
          deputyRolesData = (profiles || []);
        }
      }

      // Enrich with office info
      if (deputyRolesData.length > 0) {
        const deputyUserIds = deputyRolesData.map((d: any) => d.user_id);
        const { data: memberships } = await supabase
          .from('local_office_members')
          .select('user_id, office_id, position')
          .in('user_id', deputyUserIds);
        
        const officeIds = [...new Set((memberships || []).map(m => m.office_id))];
        let officeMap: Record<string, string> = {};
        if (officeIds.length > 0) {
          const { data: officeData } = await supabase
            .from('local_offices')
            .select('id, office_name')
            .in('id', officeIds);
          (officeData || []).forEach(o => { officeMap[o.id] = o.office_name || '—'; });
        }
        
        const membershipMap: Record<string, string> = {};
        (memberships || []).forEach(m => {
          membershipMap[m.user_id] = officeMap[m.office_id] || '—';
        });

        setDeputies(deputyRolesData.map((d: any) => ({
          ...d,
          office_name: membershipMap[d.user_id] || null,
        })));
      } else {
        setDeputies([]);
      }
      setLoadingMeta(false);
    };
    fetchDeputies();
  }, [selectedDirectorate, canSeeHierarchy, isLocal, user]);

  // Get selected deputy info
  const selectedDeputyInfo = useMemo(() => {
    if (!selectedDeputy) return null;
    return deputies.find(d => d.user_id === selectedDeputy) || null;
  }, [selectedDeputy, deputies]);

  // Build the query filter function for requests/join_requests
  const getAssignedToFilter = useMemo(() => {
    if (isDeputy) return user?.id || null; // deputies see only their own
    if (selectedDeputy) return selectedDeputy;
    if (isLocal && deputies.length > 0) return deputies.map(d => d.user_id);
    return null; // national/regional/provincial without specific deputy = all (or filtered by academy/directorate)
  }, [isDeputy, selectedDeputy, isLocal, deputies, user?.id]);

  const resetHierarchy = () => {
    if (isNational) { setSelectedAcademy(''); }
    if (!isProvincial) { setSelectedDirectorate(''); }
    setSelectedOffice('');
    setSelectedDeputy('');
  };

  return {
    canSeeHierarchy,
    isNational, isRegional, isProvincial, isLocal, isDeputy,
    selectedAcademy, setSelectedAcademy,
    selectedDirectorate, setSelectedDirectorate,
    selectedOffice, setSelectedOffice,
    selectedDeputy, setSelectedDeputy,
    availableAcademies, availableDirectorates,
    offices, deputies, loadingMeta,
    selectedDeputyInfo,
    getAssignedToFilter,
    resetHierarchy,
    profile,
    user,
  };
}
