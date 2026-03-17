import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserCheck, UserX, Building2, BarChart3, Clock, Filter, RotateCcw, ChevronDown, ChevronUp, Search, ArrowUpDown, ChevronLeft, ChevronRight, Eye, DollarSign, MapPin, Phone, Hash, Briefcase, X, FileSpreadsheet, ArrowRight, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ACADEMIES } from '@/lib/academies-data';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const CHART_COLORS = [
  'hsl(207, 62%, 45%)', 'hsl(160, 60%, 40%)', 'hsl(30, 90%, 50%)',
  'hsl(260, 60%, 55%)', 'hsl(340, 65%, 50%)', 'hsl(195, 70%, 45%)',
  'hsl(45, 80%, 50%)', 'hsl(120, 50%, 40%)', 'hsl(0, 70%, 55%)',
  'hsl(280, 50%, 50%)', 'hsl(210, 70%, 35%)', 'hsl(170, 60%, 35%)',
];

// Map DB mission values to i18n keys
const MISSION_DB_VALUES = [
  'teacher_primary', 'teacher_middle', 'teacher_high',
  'specialist_educational', 'specialist_social', 'specialist_admin_econ',
  'admin_director', 'admin_guard_ext', 'admin_guard_int',
  'admin_nazir', 'admin_work_chief', 'admin_study_dir',
  'admin_cross_sector', 'admin_ministry', 'supplier',
  'editor', 'educational_assistant', 'technician',
  'inspector_primary', 'inspector_middle', 'inspector_high',
  'inspector_guidance', 'inspector_planning', 'inspector_finance',
  'economy_admin', 'doctor',
];

const MISSION_VALUE_TO_KEY: Record<string, string> = {
  teacher_primary: 'missionTeacherPrimary',
  teacher_middle: 'missionTeacherMiddle',
  teacher_high: 'missionTeacherHigh',
  specialist_educational: 'missionSpecialistEducational',
  specialist_social: 'missionSpecialistSocial',
  specialist_admin_econ: 'missionSpecialistAdminEcon',
  admin_director: 'missionAdminDirector',
  admin_guard_ext: 'missionAdminGuardExt',
  admin_guard_int: 'missionAdminGuardInt',
  admin_nazir: 'missionAdminNazir',
  admin_work_chief: 'missionAdminWorkChief',
  admin_study_dir: 'missionAdminStudyDir',
  admin_cross_sector: 'missionAdminCrossSector',
  admin_ministry: 'missionAdminMinistry',
  supplier: 'missionSupplier',
  editor: 'missionEditor',
  educational_assistant: 'missionEducationalAssistant',
  technician: 'missionTechnician',
  inspector_primary: 'missionInspectorPrimary',
  inspector_middle: 'missionInspectorMiddle',
  inspector_high: 'missionInspectorHigh',
  inspector_guidance: 'missionInspectorGuidance',
  inspector_planning: 'missionInspectorPlanning',
  inspector_finance: 'missionInspectorFinance',
  economy_admin: 'missionEconomyAdmin',
  doctor: 'missionDoctor',
  // Legacy/fallback values that may exist in DB
  teaching: 'missionTeacherPrimary',
  teacher: 'missionTeacherPrimary',
  teacher_middle_school: 'missionTeacherMiddle',
  teacher_high_school: 'missionTeacherHigh',
  administrative: 'missionAdminDirector',
  inspector: 'missionInspectorPrimary',
};

const PAGE_SIZE = 15;

const DatabaseDashboard = () => {
  const { t, dir, lang } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Data state
  const [profiles, setProfiles] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [officeMembers, setOfficeMembers] = useState<any[]>([]);
  const [membershipCards, setMembershipCards] = useState<any[]>([]);
  const [officeFinances, setOfficeFinances] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filter state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fAcademy, setFAcademy] = useState('');
  const [fDirectorate, setFDirectorate] = useState('');
  const [fInstitution, setFInstitution] = useState('');
  const [fGender, setFGender] = useState('');
  const [fMission, setFMission] = useState('');
  const [fMinAge, setFMinAge] = useState('');
  const [fMaxAge, setFMaxAge] = useState('');
  const [fMembership, setFMembership] = useState('');
  const [fEmployeeNumber, setFEmployeeNumber] = useState('');
  const [fPhone, setFPhone] = useState('');

  // Table state
  const [sortField, setSortField] = useState('full_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Office detail dialog
  const [selectedOffice, setSelectedOffice] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  // Fetch all data
  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    Promise.all([
      supabase.from('profiles').select('*').then(r => r.data || []),
      supabase.from('local_offices').select('*').then(r => r.data || []),
      supabase.from('local_office_members').select('*').then(r => r.data || []),
      supabase.from('membership_cards').select('*').then(r => r.data || []),
      supabase.from('office_finances').select('*').then(r => r.data || []),
      supabase.from('user_roles').select('*').then(r => r.data || []),
    ]).then(([p, o, om, mc, of2, ur]) => {
      setProfiles(p);
      setOffices(o);
      setOfficeMembers(om);
      setMembershipCards(mc);
      setOfficeFinances(of2);
      setUserRoles(ur);
      setLoadingData(false);
    });
  }, [user]);

  const getMissionLabel = (val: string | null) => {
    if (!val) return '—';
    const key = MISSION_VALUE_TO_KEY[val];
    return key ? (t as any)[key] || val : val;
  };

  const getAge = (dob: string | null) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  // Available directorates based on selected academy
  const availableDirectorates = useMemo(() => {
    if (!fAcademy) return [];
    const ac = ACADEMIES.find(a => a.label === fAcademy);
    return ac?.directorates || [];
  }, [fAcademy]);

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    let result = [...profiles];
    if (fAcademy) result = result.filter(p => p.academy === fAcademy);
    if (fDirectorate) result = result.filter(p => p.directorate === fDirectorate);
    if (fInstitution) result = result.filter(p => p.institution?.includes(fInstitution));
    if (fGender) result = result.filter(p => p.gender === fGender);
    if (fMission) result = result.filter(p => p.mission === fMission);
    if (fMinAge) result = result.filter(p => { const age = getAge(p.date_of_birth); return age !== null && age >= parseInt(fMinAge); });
    if (fMaxAge) result = result.filter(p => { const age = getAge(p.date_of_birth); return age !== null && age <= parseInt(fMaxAge); });
    if (fMembership === 'member') result = result.filter(p => p.is_member && p.membership_verified);
    else if (fMembership === 'non-member') result = result.filter(p => !p.is_member && !p.membership_verified);
    else if (fMembership === 'pending') result = result.filter(p => p.is_member && !p.membership_verified);
    if (fEmployeeNumber) result = result.filter(p => p.employee_number?.includes(fEmployeeNumber));
    if (fPhone) result = result.filter(p => p.phone?.includes(fPhone));
    return result;
  }, [profiles, fAcademy, fDirectorate, fInstitution, fGender, fMission, fMinAge, fMaxAge, fMembership, fEmployeeNumber, fPhone]);

  // Sorted profiles
  const sortedProfiles = useMemo(() => {
    const sorted = [...filteredProfiles].sort((a, b) => {
      const va = a[sortField] || '';
      const vb = b[sortField] || '';
      if (sortField === 'date_of_birth') {
        return sortDir === 'asc' ? new Date(va).getTime() - new Date(vb).getTime() : new Date(vb).getTime() - new Date(va).getTime();
      }
      return sortDir === 'asc' ? String(va).localeCompare(String(vb), 'ar') : String(vb).localeCompare(String(va), 'ar');
    });
    return sorted;
  }, [filteredProfiles, sortField, sortDir]);

  const totalPages = Math.ceil(sortedProfiles.length / PAGE_SIZE);
  const paginatedProfiles = sortedProfiles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetFilters = () => {
    setFAcademy(''); setFDirectorate(''); setFInstitution(''); setFGender('');
    setFMission(''); setFMinAge(''); setFMaxAge(''); setFMembership('');
    setFEmployeeNumber(''); setFPhone(''); setCurrentPage(1);
  };

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setCurrentPage(1);
  };

  // KPIs
  const totalUsers = filteredProfiles.length;
  const totalMembersCount = filteredProfiles.filter(p => p.is_member && p.membership_verified).length;
  const totalNonMembers = filteredProfiles.filter(p => !p.is_member || !p.membership_verified).length;
  const malesCount = filteredProfiles.filter(p => p.gender === 'male').length;
  const femalesCount = filteredProfiles.filter(p => p.gender === 'female').length;
  const ages = filteredProfiles.map(p => getAge(p.date_of_birth)).filter(a => a !== null) as number[];
  const avgAge = ages.length ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : 0;

  // Charts data
  const academyChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProfiles.forEach(p => { if (p.academy) counts[p.academy] = (counts[p.academy] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.replace('الأكاديمية الجهوية للتربية والتكوين لجهة ', ''), value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredProfiles]);

  const genderChartData = useMemo(() => [
    { name: t.genderMale, value: malesCount },
    { name: t.genderFemale, value: femalesCount },
  ], [malesCount, femalesCount, t]);

  const membershipChartData = useMemo(() => [
    { name: t.memberStatus, value: filteredProfiles.filter(p => p.is_member && p.membership_verified).length },
    { name: t.pendingStatus, value: filteredProfiles.filter(p => p.is_member && !p.membership_verified).length },
    { name: t.nonMemberStatus, value: filteredProfiles.filter(p => !p.is_member).length },
  ], [filteredProfiles, t]);

  const ageChartData = useMemo(() => {
    const groups = { '20-29': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60+': 0 };
    ages.forEach(a => {
      if (a < 30) groups['20-29']++;
      else if (a < 40) groups['30-39']++;
      else if (a < 50) groups['40-49']++;
      else if (a < 60) groups['50-59']++;
      else groups['60+']++;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [ages]);

  const missionChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProfiles.forEach(p => { if (p.mission) counts[p.mission] = (counts[p.mission] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: getMissionLabel(name), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredProfiles, t]);

  // Office enrichment
  const enrichedOffices = useMemo(() => {
    return offices.map(office => {
      const members = officeMembers.filter(m => m.office_id === office.id);
      const cards = membershipCards.filter(c => c.office_id === office.id);
      const finance = officeFinances.find(f => f.office_id === office.id);
      const coordProfile = profiles.find(p => p.user_id === office.coordinator_id);
      const paidCount = cards.filter(c => c.is_paid).length;
      return { ...office, members, cards, finance, coordProfile, memberCount: members.length, paidCount, totalCards: cards.length };
    });
  }, [offices, officeMembers, membershipCards, officeFinances, profiles]);

  const getMembershipBadge = (p: any) => {
    if (p.is_member && p.membership_verified) return { label: t.memberStatus, color: 'bg-emerald-500/15 text-emerald-700 border-emerald-300' };
    if (p.is_member && !p.membership_verified) return { label: t.pendingStatus, color: 'bg-amber-500/15 text-amber-700 border-amber-300' };
    return { label: t.nonMemberStatus, color: 'bg-slate-500/15 text-slate-600 border-slate-300' };
  };

  const getRoleName = (userId: string) => {
    const ur = userRoles.find(r => r.user_id === userId);
    if (!ur) return '';
    return (t as any)[`role_${ur.role}`] || ur.role;
  };

  const handleExportExcel = () => {
    const data = filteredProfiles.map(p => {
      const badge = getMembershipBadge(p);
      return {
        [t.fullNameLabel]: p.full_name || '',
        [t.genderLabel]: p.gender === 'male' ? t.genderMale : p.gender === 'female' ? t.genderFemale : '',
        [t.dateOfBirthLabel]: p.date_of_birth || '',
        [t.employeeNumberLabel]: p.employee_number || '',
        [t.missionLabel]: getMissionLabel(p.mission),
        [t.academyLabel]: p.academy || '',
        [t.directorateLabel]: p.directorate || '',
        [t.institutionLabel]: p.institution || '',
        [t.phoneLabel]: p.phone || '',
        [t.membershipFilter]: badge.label,
        [t.roleLabel]: getRoleName(p.user_id),
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 25 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.registeredUsers);
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `database-export-${date}.xlsx`);
  };

  if (loading || loadingData) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const kpiCards = [
    { icon: Users, label: t.totalRegistered, value: totalUsers, gradient: 'from-[hsl(207,62%,40%)] to-[hsl(207,62%,55%)]' },
    { icon: UserCheck, label: t.totalMembers, value: totalMembersCount, gradient: 'from-[hsl(160,60%,38%)] to-[hsl(160,60%,50%)]' },
    { icon: UserX, label: t.totalNonMembers, value: totalNonMembers, gradient: 'from-[hsl(30,90%,45%)] to-[hsl(30,90%,58%)]' },
    { icon: Building2, label: t.totalOffices, value: offices.length, gradient: 'from-[hsl(260,60%,50%)] to-[hsl(260,60%,62%)]' },
    { icon: BarChart3, label: t.genderRatio, value: femalesCount ? `${(malesCount / femalesCount).toFixed(1)}` : '—', gradient: 'from-[hsl(340,65%,47%)] to-[hsl(340,65%,58%)]' },
    { icon: Clock, label: t.averageAge, value: `${avgAge} ${t.years}`, gradient: 'from-[hsl(195,70%,38%)] to-[hsl(195,70%,52%)]' },
  ];

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      className="px-3 py-3 text-start text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors select-none whitespace-nowrap"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground/50'}`} />
      </span>
    </th>
  );

  return (
    <AuthenticatedLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="rounded-full bg-gradient-to-r from-[hsl(217,70%,25%)] to-[hsl(217,60%,35%)] text-white hover:from-[hsl(217,70%,30%)] hover:to-[hsl(217,60%,40%)] shadow-md px-5 h-10 text-sm gap-2"
          >
            {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {dir === 'rtl' ? 'العودة للوحة التحكم' : 'Retour au tableau de bord'}
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold text-foreground mb-1">{t.databaseTitle}</h1>
          <p className="text-muted-foreground text-sm">{t.databaseDesc}</p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {kpiCards.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="relative overflow-hidden rounded-2xl p-4 shadow-md border border-border/50"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-10`} />
              <div className="relative z-10">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center mb-2 shadow-sm`}>
                  <kpi.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-extrabold text-foreground">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 rounded-2xl border border-border/60 shadow-sm overflow-hidden"
        >
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
          >
            <span className="flex items-center gap-2 font-semibold text-foreground">
              <Filter className="w-4 h-4" />
              {t.advancedFilters}
            </span>
            <div className="flex items-center gap-2">
              {(fAcademy || fDirectorate || fGender || fMission || fMembership || fEmployeeNumber || fPhone || fInstitution || fMinAge || fMaxAge) && (
                <Badge variant="secondary" className="text-[10px]">
                  {t.filterLabel}
                </Badge>
              )}
              {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {/* Academy */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.academyFilter}</label>
                    <Select value={fAcademy} onValueChange={v => { setFAcademy(v === '__all__' ? '' : v); setFDirectorate(''); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allAcademies} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">{t.allAcademies}</SelectItem>
                        {ACADEMIES.map(a => <SelectItem key={a.label} value={a.label}>{a.label.replace('الأكاديمية الجهوية للتربية والتكوين لجهة ', '')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Directorate */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.directorateFilter}</label>
                    <Select value={fDirectorate} onValueChange={v => { setFDirectorate(v === '__all__' ? '' : v); setCurrentPage(1); }} disabled={!fAcademy}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allDirectorates} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">{t.allDirectorates}</SelectItem>
                        {availableDirectorates.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Institution */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.institutionFilter}</label>
                    <Input value={fInstitution} onChange={e => { setFInstitution(e.target.value); setCurrentPage(1); }} placeholder="..." className="h-9 text-xs" />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.genderFilter}</label>
                    <Select value={fGender} onValueChange={v => { setFGender(v === '__all__' ? '' : v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allGenders} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">{t.allGenders}</SelectItem>
                        <SelectItem value="male">{t.genderMale}</SelectItem>
                        <SelectItem value="female">{t.genderFemale}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mission */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.missionFilter}</label>
                    <Select value={fMission} onValueChange={v => { setFMission(v === '__all__' ? '' : v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allMissions} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">{t.allMissions}</SelectItem>
                        {MISSION_DB_VALUES.map(m => <SelectItem key={m} value={m}>{getMissionLabel(m)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Age Range */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.ageRange}</label>
                    <div className="flex gap-1.5">
                      <Input type="number" value={fMinAge} onChange={e => { setFMinAge(e.target.value); setCurrentPage(1); }} placeholder="Min" className="h-9 text-xs w-1/2" />
                      <Input type="number" value={fMaxAge} onChange={e => { setFMaxAge(e.target.value); setCurrentPage(1); }} placeholder="Max" className="h-9 text-xs w-1/2" />
                    </div>
                  </div>

                  {/* Membership */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.membershipFilter}</label>
                    <Select value={fMembership} onValueChange={v => { setFMembership(v === '__all__' ? '' : v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allStatuses} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">{t.allStatuses}</SelectItem>
                        <SelectItem value="member">{t.memberStatus}</SelectItem>
                        <SelectItem value="non-member">{t.nonMemberStatus}</SelectItem>
                        <SelectItem value="pending">{t.pendingStatus}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Employee Number */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.employeeNumberFilter}</label>
                    <Input value={fEmployeeNumber} onChange={e => { setFEmployeeNumber(e.target.value); setCurrentPage(1); }} placeholder="N°PPR" className="h-9 text-xs" />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.phoneFilter}</label>
                    <Input value={fPhone} onChange={e => { setFPhone(e.target.value); setCurrentPage(1); }} placeholder="06..." className="h-9 text-xs" />
                  </div>

                  {/* Reset */}
                  <div className="flex items-end">
                    <Button variant="outline" size="sm" onClick={resetFilters} className="h-9 w-full text-xs gap-1">
                      <RotateCcw className="w-3 h-3" />
                      {t.resetFilters}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full justify-start mb-6 bg-muted/50 rounded-xl p-1 h-auto">
            <TabsTrigger value="users" className="rounded-lg px-6 py-2.5 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Users className="w-4 h-4 me-2" />
              {t.registeredUsers}
            </TabsTrigger>
            <TabsTrigger value="offices" className="rounded-lg px-6 py-2.5 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Building2 className="w-4 h-4 me-2" />
              {t.localOfficesTab}
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Academy Distribution */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border/50 p-4 shadow-sm">
                <h3 className="font-bold text-sm mb-3 text-foreground">{t.academyDistribution}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={academyChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {academyChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Gender + Membership PieCharts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border/50 p-4 shadow-sm">
                  <h3 className="font-bold text-sm mb-3 text-foreground">{t.genderDistribution}</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={genderChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        <Cell fill="hsl(207, 62%, 45%)" />
                        <Cell fill="hsl(340, 65%, 50%)" />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border/50 p-4 shadow-sm">
                  <h3 className="font-bold text-sm mb-3 text-foreground">{t.membershipDistribution}</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={membershipChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        <Cell fill="hsl(160, 60%, 40%)" />
                        <Cell fill="hsl(45, 80%, 50%)" />
                        <Cell fill="hsl(0, 0%, 70%)" />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Age Distribution */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border/50 p-4 shadow-sm">
                <h3 className="font-bold text-sm mb-3 text-foreground">{t.ageDistribution}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={ageChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="value" stroke="hsl(195, 70%, 45%)" fill="hsl(195, 70%, 45%)" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Mission Distribution */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-border/50 p-4 shadow-sm">
                <h3 className="font-bold text-sm mb-3 text-foreground">{t.missionDistribution}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={missionChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {missionChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border/50 shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between border-b border-border/50 bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  {t.showingResults} {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, sortedProfiles.length)} {t.of} {sortedProfiles.length}
                </p>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExportExcel}>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {t.exportToExcel}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" dir={dir}>
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <SortHeader field="full_name">{t.fullNameLabel}</SortHeader>
                      <SortHeader field="gender">{t.genderLabel}</SortHeader>
                      <SortHeader field="date_of_birth">{t.dateOfBirthLabel}</SortHeader>
                      <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.employeeNumberLabel}</th>
                      <SortHeader field="mission">{t.missionLabel}</SortHeader>
                      <SortHeader field="academy">{t.academyLabel}</SortHeader>
                      <SortHeader field="directorate">{t.directorateLabel}</SortHeader>
                      <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.institutionLabel}</th>
                      <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.phoneLabel}</th>
                      <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.membershipFilter}</th>
                      <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.roleLabel}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {paginatedProfiles.map((p, i) => {
                      const badge = getMembershipBadge(p);
                      const age = getAge(p.date_of_birth);
                      return (
                        <tr key={p.id} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                          <td className="px-3 py-2.5 font-medium whitespace-nowrap">{p.full_name || '—'}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">{p.gender === 'male' ? t.genderMale : p.gender === 'female' ? t.genderFemale : '—'}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">{p.date_of_birth || '—'}{age !== null ? ` (${age})` : ''}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap font-mono">{p.employee_number || '—'}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{getMissionLabel(p.mission)}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{p.academy?.replace('الأكاديمية الجهوية للتربية والتكوين لجهة ', '') || '—'}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">{p.directorate || '—'}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{p.institution || '—'}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px]">{p.phone || '—'}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.color}`}>{badge.label}</span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{getRoleName(p.user_id)}</td>
                        </tr>
                      );
                    })}
                    {paginatedProfiles.length === 0 && (
                      <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground">{t.noData}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-border/50 bg-muted/20">
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                    {dir === 'rtl' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </Button>
                  <span className="text-xs text-muted-foreground">{t.page} {currentPage} / {totalPages}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Offices Tab */}
          <TabsContent value="offices">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrichedOffices.map((office, i) => (
                <motion.div
                  key={office.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedOffice(office)}
                  className="group cursor-pointer rounded-2xl border border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  {/* Header with photo */}
                  <div className="relative h-24 bg-gradient-to-br from-[hsl(207,62%,40%)] to-[hsl(195,70%,50%)] flex items-end p-4">
                    <div className="absolute top-3 end-3">
                      <Eye className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                    </div>
                    <Avatar className="w-14 h-14 border-3 border-white shadow-lg -mb-7">
                      <AvatarImage src={office.secretary_photo_url || ''} />
                      <AvatarFallback className="bg-white text-primary font-bold text-lg">
                        {office.coordProfile?.full_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="pt-9 px-4 pb-4 space-y-2.5">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{office.office_name || t.localOffice}</h3>
                      <p className="text-[11px] text-muted-foreground">{office.coordProfile?.full_name || '—'}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{office.directorate || '—'}</span>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Users className="w-3 h-3 text-primary" />
                        <span className="font-semibold">{office.memberCount}</span>
                        <span className="text-muted-foreground">{t.officeMembers}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <DollarSign className="w-3 h-3 text-emerald-500" />
                        <span className="font-semibold">{office.paidCount}</span>
                        <span className="text-muted-foreground">{t.paidMembers}</span>
                      </div>
                    </div>

                    {office.finance && (
                      <div className="flex gap-2 pt-1">
                        <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50">
                          {t.totalCollected}: {office.finance.total_collected}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                          {t.remaining}: {office.finance.remaining}
                        </Badge>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {enrichedOffices.length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground">{t.noData}</div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Office Detail Dialog */}
        <Dialog open={!!selectedOffice} onOpenChange={() => setSelectedOffice(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selectedOffice && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-primary shadow">
                      <AvatarImage src={selectedOffice.secretary_photo_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {selectedOffice.coordProfile?.full_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{selectedOffice.office_name || t.localOffice}</p>
                      <p className="text-sm text-muted-foreground font-normal">{selectedOffice.coordProfile?.full_name} — {selectedOffice.directorate}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="members" className="mt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="members" className="flex-1">{t.officeMembers}</TabsTrigger>
                    <TabsTrigger value="cards" className="flex-1">{t.membershipCards}</TabsTrigger>
                    <TabsTrigger value="finances" className="flex-1">{t.officeFinancesLabel}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="members" className="mt-3">
                    <div className="space-y-2">
                      {selectedOffice.members.map((m: any) => {
                        const mp = profiles.find((p: any) => p.user_id === m.user_id);
                        return (
                          <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                            <div>
                              <p className="font-medium text-sm">{mp?.full_name || '—'}</p>
                              <p className="text-[11px] text-muted-foreground">{mp?.employee_number} • {mp?.institution || '—'}</p>
                            </div>
                            <Badge variant="secondary" className="text-[10px]">{(t as any)[`position_${m.position}`] || m.position}</Badge>
                          </div>
                        );
                      })}
                      {selectedOffice.members.length === 0 && <p className="text-center py-6 text-muted-foreground text-sm">{t.noMembers}</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="cards" className="mt-3">
                    <div className="space-y-2">
                      {selectedOffice.cards.map((c: any) => {
                        const cp = profiles.find((p: any) => p.user_id === c.member_user_id);
                        return (
                          <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                            <div>
                              <p className="font-medium text-sm">{cp?.full_name || '—'}</p>
                              <p className="text-[11px] text-muted-foreground">{t.cardNumber}: {c.card_number || '—'}</p>
                            </div>
                            <Badge className={c.is_paid ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-red-100 text-red-700 border-red-300'} variant="outline">
                              {c.is_paid ? t.paid : t.unpaid}
                            </Badge>
                          </div>
                        );
                      })}
                      {selectedOffice.cards.length === 0 && <p className="text-center py-6 text-muted-foreground text-sm">{t.noData}</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="finances" className="mt-3">
                    {selectedOffice.finance ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                          <p className="text-2xl font-extrabold text-emerald-700">{selectedOffice.finance.total_collected}</p>
                          <p className="text-xs text-emerald-600 mt-1">{t.totalCollected}</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                          <p className="text-2xl font-extrabold text-amber-700">{selectedOffice.finance.remaining}</p>
                          <p className="text-xs text-amber-600 mt-1">{t.remaining}</p>
                        </div>
                        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center">
                          <p className="text-2xl font-extrabold text-blue-700">{selectedOffice.finance.paid_to_provincial}</p>
                          <p className="text-xs text-blue-600 mt-1">{t.paidToProvincial}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center py-6 text-muted-foreground text-sm">{t.noData}</p>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </AuthenticatedLayout>
  );
};

export default DatabaseDashboard;
