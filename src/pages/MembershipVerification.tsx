import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, Building2, CreditCard, Hash, Loader2, RotateCcw, ChevronsUpDown, Check, X, Filter, ChevronDown, ChevronUp, ArrowUpDown, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import VerifiedBadge, { getBadgeStatus } from '@/components/VerifiedBadge';
import { useHierarchicalFilter } from '@/hooks/useHierarchicalFilter';
import HierarchicalFilters from '@/components/HierarchicalFilters';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  employee_number: string | null;
  institution: string | null;
  membership_card_number: string | null;
  is_member: boolean | null;
  membership_verified: boolean | null;
  email: string | null;
  academy: string | null;
  directorate: string | null;
}

const CHART_COLORS = [
  'hsl(207, 62%, 45%)', 'hsl(160, 60%, 40%)', 'hsl(45, 80%, 50%)',
  'hsl(0, 0%, 70%)', 'hsl(30, 90%, 50%)', 'hsl(260, 60%, 55%)',
  'hsl(340, 65%, 50%)', 'hsl(195, 70%, 45%)', 'hsl(120, 50%, 40%)',
];

const PAGE_SIZE = 15;

const MembershipVerification = () => {
  const { t, dir, lang } = useI18n();
  const { user, profile, loading, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const hierarchy = useHierarchicalFilter();

  const isSupreme = role === 'admin' || role === 'national_secretary' || role === 'deputy_national_secretary';

  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterInstitution, setFilterInstitution] = useState('');
  const [filterMembership, setFilterMembership] = useState('');
  const [openName, setOpenName] = useState(false);
  const [openEmployee, setOpenEmployee] = useState(false);
  const [openInstitution, setOpenInstitution] = useState(false);

  // Table
  const [sortField, setSortField] = useState('full_name');
  const [sortDir2, setSortDir2] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  // Determine filtering scope
  const effectiveAcademy = hierarchy.selectedAcademy || profile?.academy;
  const effectiveDirectorate = hierarchy.selectedDirectorate || profile?.directorate;

  useEffect(() => {
    if (!user) return;
    // Supreme accounts can browse all data (no academy/directorate required)
    if (!isSupreme && (!effectiveAcademy || !effectiveDirectorate)) return;
    fetchUsers();
  }, [user, effectiveAcademy, effectiveDirectorate, isSupreme, hierarchy.selectedAcademy, hierarchy.selectedDirectorate]);

  const fetchUsers = async () => {
    setLoadingData(true);

    let query = supabase
      .from('profiles')
      .select('id, user_id, full_name, employee_number, institution, membership_card_number, is_member, membership_verified, email, academy, directorate')
      .order('full_name', { ascending: true });

    // Apply scope: narrowest available filter wins
    if (hierarchy.selectedDirectorate) {
      if (hierarchy.selectedAcademy) query = query.eq('academy', hierarchy.selectedAcademy);
      query = query.eq('directorate', hierarchy.selectedDirectorate);
    } else if (hierarchy.selectedAcademy) {
      query = query.eq('academy', hierarchy.selectedAcademy);
    } else if (!isSupreme && effectiveAcademy && effectiveDirectorate) {
      // Non-supreme users without explicit hierarchy selection fall back to own scope
      query = query.eq('academy', effectiveAcademy).eq('directorate', effectiveDirectorate);
    }
    // Supreme with no selection => no scope filter (national view)

    const { data, error } = await query;
    if (error) console.error(error);
    else setUsers((data || []) as UserProfile[]);
    setLoadingData(false);
  };

  const uniqueNames = useMemo(() => [...new Set(users.map(u => u.full_name).filter(Boolean))] as string[], [users]);
  const uniqueEmployees = useMemo(() => [...new Set(users.map(u => u.employee_number).filter(Boolean))] as string[], [users]);
  const uniqueInstitutions = useMemo(() => [...new Set(users.map(u => u.institution).filter(Boolean))] as string[], [users]);

  const hasActiveFilter = filterName || filterEmployee || filterInstitution || filterMembership;
  const resetFilters = () => { setFilterName(''); setFilterEmployee(''); setFilterInstitution(''); setFilterMembership(''); setCurrentPage(1); };

  const getMembershipStatus = (u: UserProfile): 'not_member' | 'pending' | 'verified' => {
    if (!u.is_member) return 'not_member';
    if (u.membership_verified) return 'verified';
    return 'pending';
  };

  const handleSetMembershipStatus = async (targetUser: UserProfile, status: 'not_member' | 'pending' | 'verified') => {
    setUpdatingId(targetUser.user_id);
    try {
      const updateData = { is_member: status !== 'not_member', membership_verified: status === 'verified' };
      const { error } = await supabase.from('profiles').update(updateData).eq('user_id', targetUser.user_id);
      if (error) throw error;
      const notifTitles = {
        not_member: lang === 'ar' ? 'تم تعطيل انخراطك' : 'Adhésion désactivée',
        pending: lang === 'ar' ? 'انخراطك قيد التحقق' : 'Adhésion en cours de vérification',
        verified: lang === 'ar' ? 'تم تفعيل انخراطك' : 'Adhésion activée',
      };
      const notifMessages = {
        not_member: lang === 'ar' ? 'تم تعطيل حالة انخراطك من طرف المسؤول المحلي' : "Votre statut d'adhésion a été désactivé par le responsable local",
        pending: lang === 'ar' ? 'انخراطك قيد التحقق من طرف المسؤول المحلي' : "Votre adhésion est en cours de vérification par le responsable local",
        verified: lang === 'ar' ? 'تم التحقق من انخراطك بنجاح من طرف المسؤول المحلي' : "Votre adhésion a été vérifiée par le responsable local",
      };
      await supabase.from('notifications').insert({ user_id: targetUser.user_id, title: notifTitles[status], message: notifMessages[status], link: '/profile' });
      setUsers(prev => prev.map(u => u.user_id === targetUser.user_id ? { ...u, ...updateData } : u));
      toast({ title: lang === 'ar' ? 'تم التحديث بنجاح' : 'Mis à jour avec succès' });
    } catch (err: any) {
      toast({ title: lang === 'ar' ? 'خطأ' : 'Erreur', description: err?.message, variant: 'destructive' });
    } finally { setUpdatingId(null); }
  };

  // Filtered
  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (filterName) result = result.filter(u => (u.full_name || '').toLowerCase().includes(filterName.toLowerCase()));
    if (filterEmployee) result = result.filter(u => (u.employee_number || '').toLowerCase().includes(filterEmployee.toLowerCase()));
    if (filterInstitution) result = result.filter(u => (u.institution || '').toLowerCase().includes(filterInstitution.toLowerCase()));
    if (filterMembership === 'verified') result = result.filter(u => u.is_member && u.membership_verified);
    else if (filterMembership === 'pending') result = result.filter(u => u.is_member && !u.membership_verified);
    else if (filterMembership === 'not_member') result = result.filter(u => !u.is_member);
    return result;
  }, [users, filterName, filterEmployee, filterInstitution, filterMembership]);

  // Sorted
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const va = (a as any)[sortField] || '';
      const vb = (b as any)[sortField] || '';
      return sortDir2 === 'asc' ? String(va).localeCompare(String(vb), 'ar') : String(vb).localeCompare(String(va), 'ar');
    });
  }, [filteredUsers, sortField, sortDir2]);

  const totalPages = Math.ceil(sortedUsers.length / PAGE_SIZE);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir2(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir2('asc'); }
    setCurrentPage(1);
  };

  // KPIs
  const totalCount = users.length;
  const verifiedCount = users.filter(u => u.is_member && u.membership_verified).length;
  const pendingCount = users.filter(u => u.is_member && !u.membership_verified).length;
  const nonMemberCount = users.filter(u => !u.is_member).length;

  // Charts
  const statusChartData = useMemo(() => [
    { name: t.membershipVerifiedCount, value: verifiedCount },
    { name: t.membershipPendingCount, value: pendingCount },
    { name: t.membershipNonMember, value: nonMemberCount },
  ].filter(d => d.value > 0), [verifiedCount, pendingCount, nonMemberCount, t]);

  const institutionChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => { if (u.institution) counts[u.institution] = (counts[u.institution] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [users]);

  const getMembershipBadgeColor = (status: 'not_member' | 'pending' | 'verified') => {
    switch (status) {
      case 'verified': return 'bg-emerald-500/15 text-emerald-700 border-emerald-300';
      case 'pending': return 'bg-amber-500/15 text-amber-700 border-amber-300';
      default: return 'bg-slate-500/15 text-slate-600 border-slate-300';
    }
  };

  const getMembershipLabel = (status: 'not_member' | 'pending' | 'verified') => {
    switch (status) {
      case 'verified': return lang === 'ar' ? 'منخرط مفعل' : 'Vérifié';
      case 'pending': return lang === 'ar' ? 'قيد التحقق' : 'En attente';
      default: return lang === 'ar' ? 'غير منخرط' : 'Non adhérent';
    }
  };

  const handleExportExcel = () => {
    const data = filteredUsers.map(u => {
      const status = getMembershipStatus(u);
      return {
        [t.fullNameLabel]: u.full_name || '',
        [t.employeeNumberLabel]: u.employee_number || '',
        [t.institutionLabel]: u.institution || '',
        [t.cardNumberColumn]: u.membership_card_number || '',
        [t.membershipStatusColumn]: getMembershipLabel(status),
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 25 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.membershipVerification);
    XLSX.writeFile(wb, `membership-verification-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const kpiCards = [
    { label: t.membershipTotal, value: totalCount, gradient: 'from-[hsl(207,62%,40%)] to-[hsl(207,62%,55%)]', icon: User },
    { label: t.membershipVerifiedCount, value: verifiedCount, gradient: 'from-[hsl(160,60%,38%)] to-[hsl(160,60%,50%)]', icon: Check },
    { label: t.membershipPendingCount, value: pendingCount, gradient: 'from-[hsl(45,80%,45%)] to-[hsl(45,80%,58%)]', icon: ChevronsUpDown },
    { label: t.membershipNonMember, value: nonMemberCount, gradient: 'from-[hsl(0,0%,55%)] to-[hsl(0,0%,68%)]', icon: X },
  ];

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th className="px-3 py-3 text-start text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors select-none whitespace-nowrap" onClick={() => toggleSort(field)}>
      <span className="inline-flex items-center gap-1">{children}<ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground/50'}`} /></span>
    </th>
  );

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <AuthenticatedLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground mb-1 bg-blue-100/60 text-blue-800 px-3 py-1 rounded-lg inline-block">{t.membershipVerification}</h1>
            <p className="text-sm bg-emerald-100/60 text-emerald-700 px-2 py-0.5 rounded-md inline-block">{t.membershipVerificationDesc}</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full bg-gradient-to-r from-[hsl(217,70%,25%)] to-[hsl(217,60%,35%)] text-white hover:from-[hsl(217,70%,30%)] hover:to-[hsl(217,60%,40%)] shadow-md px-5 h-10 text-sm gap-2 shrink-0">
            {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {t.backToDashboard}
          </Button>
        </motion.div>

        {/* Hierarchical Filters */}
        <HierarchicalFilters {...hierarchy} />

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {kpiCards.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }} className="relative overflow-hidden rounded-2xl p-4 shadow-md border border-border/50">
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-10`} />
              <div className="relative z-10">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center mb-2 shadow-sm`}><kpi.icon className="w-4 h-4 text-white" /></div>
                <p className="text-2xl font-extrabold text-foreground">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        {users.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border/50 p-4 shadow-sm">
              <h3 className="font-bold text-sm mb-3 text-foreground">{t.membershipStatusDistribution}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    <Cell fill="hsl(160, 60%, 40%)" />
                    <Cell fill="hsl(45, 80%, 50%)" />
                    <Cell fill="hsl(0, 0%, 70%)" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border/50 p-4 shadow-sm">
              <h3 className="font-bold text-sm mb-3 text-foreground">{t.membershipInstitutionDistribution}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={institutionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {institutionChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
            <span className="flex items-center gap-2 font-semibold text-foreground"><Filter className="w-4 h-4" />{t.advancedFilters}</span>
            <div className="flex items-center gap-2">
              {hasActiveFilter && <Badge variant="secondary" className="text-[10px]">{t.filterLabel}</Badge>}
              {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          <AnimatePresence>
            {filtersOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                <div className="px-5 pb-5 pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Name Combobox */}
                  <div>
                    <label className="text-sm font-bold bg-blue-100/60 text-blue-700 px-2 py-0.5 rounded-md mb-1 inline-block">{lang === 'ar' ? 'الاسم' : 'Nom'}</label>
                    <Popover open={openName} onOpenChange={setOpenName}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className={cn("w-full justify-between h-9 text-xs font-normal", !filterName && "text-muted-foreground")}>
                          <span className="truncate">{filterName || (lang === 'ar' ? 'ابحث بالاسم...' : 'Rechercher...')}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {filterName && <X className="h-3 w-3 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setFilterName(''); }} />}
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder={lang === 'ar' ? 'اكتب للبحث...' : 'Tapez pour filtrer...'} />
                          <CommandList className="max-h-[200px]">
                            <CommandEmpty>{lang === 'ar' ? 'لا توجد نتائج' : 'Aucun résultat'}</CommandEmpty>
                            <CommandGroup>
                              {uniqueNames.map(name => (
                                <CommandItem key={name} value={name} onSelect={(val) => { setFilterName(filterName === val ? '' : val); setOpenName(false); setCurrentPage(1); }}>
                                  <Check className={cn("mr-2 h-4 w-4", filterName === name ? "opacity-100" : "opacity-0")} />{name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Employee Number Combobox */}
                  <div>
                    <label className="text-sm font-bold bg-indigo-100/60 text-indigo-700 px-2 py-0.5 rounded-md mb-1 inline-block">{lang === 'ar' ? 'رقم التأجير' : 'N° PPR'}</label>
                    <Popover open={openEmployee} onOpenChange={setOpenEmployee}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className={cn("w-full justify-between h-9 text-xs font-normal", !filterEmployee && "text-muted-foreground")}>
                          <span className="truncate">{filterEmployee || (lang === 'ar' ? 'ابحث برقم التأجير...' : 'N°PPR...')}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {filterEmployee && <X className="h-3 w-3 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setFilterEmployee(''); }} />}
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder={lang === 'ar' ? 'اكتب للبحث...' : 'Tapez...'} />
                          <CommandList className="max-h-[200px]">
                            <CommandEmpty>{lang === 'ar' ? 'لا توجد نتائج' : 'Aucun résultat'}</CommandEmpty>
                            <CommandGroup>
                              {uniqueEmployees.map(emp => (
                                <CommandItem key={emp} value={emp} onSelect={(val) => { setFilterEmployee(filterEmployee === val ? '' : val); setOpenEmployee(false); setCurrentPage(1); }}>
                                  <Check className={cn("mr-2 h-4 w-4", filterEmployee === emp ? "opacity-100" : "opacity-0")} />{emp}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Institution Combobox */}
                  <div>
                    <label className="text-sm font-bold bg-amber-100/60 text-amber-700 px-2 py-0.5 rounded-md mb-1 inline-block">{lang === 'ar' ? 'المؤسسة' : 'Établissement'}</label>
                    <Popover open={openInstitution} onOpenChange={setOpenInstitution}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className={cn("w-full justify-between h-9 text-xs font-normal", !filterInstitution && "text-muted-foreground")}>
                          <span className="truncate">{filterInstitution || (lang === 'ar' ? 'ابحث بالمؤسسة...' : 'Établissement...')}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {filterInstitution && <X className="h-3 w-3 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setFilterInstitution(''); }} />}
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder={lang === 'ar' ? 'اكتب للبحث...' : 'Tapez...'} />
                          <CommandList className="max-h-[200px]">
                            <CommandEmpty>{lang === 'ar' ? 'لا توجد نتائج' : 'Aucun résultat'}</CommandEmpty>
                            <CommandGroup>
                              {uniqueInstitutions.map(inst => (
                                <CommandItem key={inst} value={inst} onSelect={(val) => { setFilterInstitution(filterInstitution === val ? '' : val); setOpenInstitution(false); setCurrentPage(1); }}>
                                  <Check className={cn("mr-2 h-4 w-4", filterInstitution === inst ? "opacity-100" : "opacity-0")} />{inst}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Membership Status */}
                  <div>
                    <label className="text-sm font-bold bg-purple-100/60 text-purple-700 px-2 py-0.5 rounded-md mb-1 inline-block">{t.filterByMembership}</label>
                    <Select value={filterMembership} onValueChange={v => { setFilterMembership(v === '__all__' ? '' : v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allStatuses} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">{t.allStatuses}</SelectItem>
                        <SelectItem value="verified">{lang === 'ar' ? 'منخرط مفعل' : 'Vérifié'}</SelectItem>
                        <SelectItem value="pending">{lang === 'ar' ? 'قيد التحقق' : 'En attente'}</SelectItem>
                        <SelectItem value="not_member">{lang === 'ar' ? 'غير منخرط' : 'Non adhérent'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button variant="outline" size="sm" onClick={resetFilters} className="h-9 w-full text-xs gap-1"><RotateCcw className="w-3 h-3" />{t.resetFilters}</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Table */}
        {loadingData ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : isSupreme && (!hierarchy.selectedAcademy || !hierarchy.selectedDirectorate) ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center text-sm text-muted-foreground">
            {lang === 'ar'
              ? 'اختر الأكاديمية ثم المديرية لعرض المنخرطين والتحقق من حالتهم.'
              : 'Sélectionnez une académie puis une direction pour afficher les adhérents.'}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-border/50 bg-muted/30">
              <p className="text-xs text-muted-foreground">{t.showingResults} {sortedUsers.length > 0 ? `${((currentPage - 1) * PAGE_SIZE) + 1}-${Math.min(currentPage * PAGE_SIZE, sortedUsers.length)}` : '0'} {t.of} {sortedUsers.length}</p>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExportExcel} disabled={filteredUsers.length === 0}>
                <FileSpreadsheet className="w-3.5 h-3.5" />{t.exportToExcel}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" dir={dir}>
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <SortHeader field="full_name">{t.fullNameLabel}</SortHeader>
                    <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.employeeNumberLabel}</th>
                    <SortHeader field="institution">{t.institutionLabel}</SortHeader>
                    <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.cardNumberColumn}</th>
                    <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.membershipStatusColumn}</th>
                    <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.actionsColumn}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {paginatedUsers.map((u, i) => {
                    const status = getMembershipStatus(u);
                    const isSelf = u.user_id === user!.id;
                    return (
                      <tr key={u.user_id} className={`hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{u.full_name || '—'}</span>
                            <VerifiedBadge status={getBadgeStatus(null, u.is_member, u.membership_verified)} size={16} />
                          </div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-mono">{u.employee_number || '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{u.institution || '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{u.membership_card_number || '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${getMembershipBadgeColor(status)}`}>{getMembershipLabel(status)}</span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {updatingId === u.user_id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : isSelf ? (
                            <span className="text-[11px] text-muted-foreground italic">
                              {lang === 'ar' ? '— حسابك —' : '— vous —'}
                            </span>
                          ) : (
                            <div className="flex items-center gap-3">
                              {([
                                { key: 'verified' as const, label: lang === 'ar' ? 'مفعل' : 'Vérifié', color: 'text-emerald-600' },
                                { key: 'pending' as const, label: lang === 'ar' ? 'قيد التحقق' : 'En attente', color: 'text-amber-600' },
                                { key: 'not_member' as const, label: lang === 'ar' ? 'غير منخرط' : 'Non', color: 'text-muted-foreground' },
                              ]).map(opt => (
                                <label key={opt.key} className="flex items-center gap-1.5 cursor-pointer">
                                  <Checkbox checked={status === opt.key} onCheckedChange={() => handleSetMembershipStatus(u, opt.key)} disabled={status === opt.key} />
                                  <span className={`text-[11px] font-medium ${opt.color}`}>{opt.label}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedUsers.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">{t.noUsers}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/20">
                <p className="text-xs text-muted-foreground">{t.page} {currentPage} {t.of} {totalPages}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                    {dir === 'rtl' ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    {dir === 'rtl' ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </AuthenticatedLayout>
  );
};

export default MembershipVerification;
