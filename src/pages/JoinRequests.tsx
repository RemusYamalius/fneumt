import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, UserPlus, Clock, Phone, CheckCircle2, XCircle, User, Eye, Building, MapPin, Hash, BookOpen, Globe, Filter, RotateCcw, ChevronDown, ChevronUp, ArrowUpDown, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useHierarchicalFilter } from '@/hooks/useHierarchicalFilter';
import HierarchicalFilters from '@/components/HierarchicalFilters';

interface ProfileInfo {
  full_name: string | null;
  employee_number: string | null;
  institution: string | null;
  phone: string | null;
  corps: string | null;
  academy: string | null;
  directorate: string | null;
  zone: string | null;
  email: string | null;
  mission: string | null;
}

interface JoinRequest {
  id: string;
  user_id: string;
  assigned_to: string | null;
  status: string;
  created_at: string;
  profile?: ProfileInfo;
}

const CHART_COLORS = [
  'hsl(207, 62%, 45%)', 'hsl(160, 60%, 40%)', 'hsl(30, 90%, 50%)',
  'hsl(260, 60%, 55%)', 'hsl(340, 65%, 50%)', 'hsl(195, 70%, 45%)',
  'hsl(45, 80%, 50%)', 'hsl(120, 50%, 40%)', 'hsl(0, 70%, 55%)',
];

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  contacted: { icon: Phone, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  accepted: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
};

const CORPS_LABELS: Record<string, Record<string, string>> = {
  ar: { primary: 'ابتدائي', middle_school: 'إعدادي', high_school: 'ثانوي', administrative: 'إداري' },
  fr: { primary: 'Primaire', middle_school: 'Collège', high_school: 'Lycée', administrative: 'Administratif' },
};

const PAGE_SIZE = 15;

const JoinRequests = () => {
  const { t, dir, lang } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<ProfileInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const hierarchy = useHierarchicalFilter();

  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fStatus, setFStatus] = useState('');
  const [fName, setFName] = useState('');
  const [fInstitution, setFInstitution] = useState('');

  // Table
  const [sortField, setSortField] = useState('created_at');
  const [sortDir2, setSortDir2] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  const fetchRequests = async () => {
    if (!user) return;
    setLoadingData(true);

    let query = supabase.from('join_requests').select('*').order('created_at', { ascending: false });

    const filter = hierarchy.getAssignedToFilter;
    if (hierarchy.isDeputy) {
      query = query.eq('assigned_to', user.id);
    } else if (typeof filter === 'string' && filter) {
      query = query.eq('assigned_to', filter);
    } else if (Array.isArray(filter) && filter.length > 0) {
      query = query.in('assigned_to', filter);
    }

    const { data: joinData } = await query;

    if (joinData && joinData.length > 0) {
      const userIds = joinData.map((j: any) => j.user_id);
      const { data: profilesData } = await supabase.from('profiles').select('user_id, full_name, employee_number, institution, phone, corps, academy, directorate, zone, email, mission').in('user_id', userIds);
      const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));
      let enriched = joinData.map((j: any) => ({ ...j, profile: profileMap.get(j.user_id) || undefined }));

      // Client-side academy/directorate filtering
      if (hierarchy.selectedAcademy && !hierarchy.isDeputy) {
        enriched = enriched.filter(r => r.profile?.academy === hierarchy.selectedAcademy);
      }
      if (hierarchy.selectedDirectorate && !hierarchy.isDeputy) {
        enriched = enriched.filter(r => r.profile?.directorate === hierarchy.selectedDirectorate);
      }

      setRequests(enriched);
    } else { setRequests([]); }
    setLoadingData(false);
  };

  useEffect(() => { if (user) fetchRequests(); }, [user, hierarchy.getAssignedToFilter, hierarchy.selectedAcademy, hierarchy.selectedDirectorate]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('join-requests-page').on('postgres_changes', { event: '*', schema: 'public', table: 'join_requests' }, () => { fetchRequests(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, hierarchy.getAssignedToFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('join_requests').update({ status: newStatus } as any).eq('id', id);
    if (!error) { setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r)); toast({ title: t.statusChangedSuccess }); }
  };

  const openProfile = (profile: ProfileInfo | undefined) => {
    if (!profile) return;
    setSelectedProfile(profile);
    setDialogOpen(true);
  };

  const hasActiveFilter = fStatus || fName || fInstitution;
  const resetFilters = () => { setFStatus(''); setFName(''); setFInstitution(''); setCurrentPage(1); };

  // Filtered
  const filteredRequests = useMemo(() => {
    let result = [...requests];
    if (fStatus) result = result.filter(r => r.status === fStatus);
    if (fName.trim()) result = result.filter(r => (r.profile?.full_name || '').toLowerCase().includes(fName.trim().toLowerCase()));
    if (fInstitution.trim()) result = result.filter(r => (r.profile?.institution || '').toLowerCase().includes(fInstitution.trim().toLowerCase()));
    return result;
  }, [requests, fStatus, fName, fInstitution]);

  // Sorted
  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      let va: string, vb: string;
      if (sortField === 'full_name') { va = a.profile?.full_name || ''; vb = b.profile?.full_name || ''; }
      else if (sortField === 'institution') { va = a.profile?.institution || ''; vb = b.profile?.institution || ''; }
      else if (sortField === 'created_at') { return sortDir2 === 'asc' ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime() : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); }
      else { va = (a as any)[sortField] || ''; vb = (b as any)[sortField] || ''; }
      return sortDir2 === 'asc' ? va.localeCompare(vb, 'ar') : vb.localeCompare(va, 'ar');
    });
  }, [filteredRequests, sortField, sortDir2]);

  const totalPages = Math.ceil(sortedRequests.length / PAGE_SIZE);
  const paginatedRequests = sortedRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir2(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir2('asc'); }
    setCurrentPage(1);
  };

  // KPIs
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const contactedCount = requests.filter(r => r.status === 'contacted').length;
  const acceptedRejectedCount = requests.filter(r => r.status === 'accepted' || r.status === 'rejected').length;

  // Charts
  const statusChartData = useMemo(() => [
    { name: t.joinStatus_pending, value: pendingCount },
    { name: t.joinStatus_contacted, value: contactedCount },
    { name: t.joinStatus_accepted, value: requests.filter(r => r.status === 'accepted').length },
    { name: t.joinStatus_rejected, value: requests.filter(r => r.status === 'rejected').length },
  ].filter(d => d.value > 0), [requests, t]);

  const institutionChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(r => { if (r.profile?.institution) counts[r.profile.institution] = (counts[r.profile.institution] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [requests]);

  const missionChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(r => { if (r.profile?.corps) counts[r.profile.corps] = (counts[r.profile.corps] || 0) + 1; });
    return Object.entries(counts).map(([key, value]) => ({ name: CORPS_LABELS[lang]?.[key] || key, value })).sort((a, b) => b.value - a.value);
  }, [requests, lang]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleExportExcel = () => {
    const data = filteredRequests.map(r => ({
      [t.fullNameLabel]: r.profile?.full_name || '',
      [t.employeeNumberLabel]: r.profile?.employee_number || '',
      [t.institutionLabel]: r.profile?.institution || '',
      [t.corpsColumn]: r.profile?.corps ? (CORPS_LABELS[lang]?.[r.profile.corps] || r.profile.corps) : '',
      [t.academyLabel]: r.profile?.academy || '',
      [t.directorateLabel]: r.profile?.directorate || '',
      [t.phoneColumn]: r.profile?.phone || '',
      [t.dateColumn]: formatDate(r.created_at),
      [t.statusColumn]: t[`joinStatus_${r.status}`] || r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 25 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.joinRequests);
    XLSX.writeFile(wb, `join-requests-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const kpiCards = [
    { label: t.joinTotal, value: requests.length, gradient: 'from-[hsl(207,62%,40%)] to-[hsl(207,62%,55%)]', icon: UserPlus },
    { label: t.joinPending, value: pendingCount, gradient: 'from-[hsl(45,80%,45%)] to-[hsl(45,80%,58%)]', icon: Clock },
    { label: t.joinContacted, value: contactedCount, gradient: 'from-[hsl(195,70%,38%)] to-[hsl(195,70%,52%)]', icon: Phone },
    { label: t.joinAcceptedRejected, value: acceptedRejectedCount, gradient: 'from-[hsl(160,60%,38%)] to-[hsl(160,60%,50%)]', icon: CheckCircle2 },
  ];

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th className="px-3 py-3 text-start text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors select-none whitespace-nowrap" onClick={() => toggleSort(field)}>
      <span className="inline-flex items-center gap-1">{children}<ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground/50'}`} /></span>
    </th>
  );

  const ProfileField = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"><Icon className="w-4 h-4 text-primary" /></div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium truncate ${value ? 'text-foreground' : 'text-muted-foreground/50 italic'}`}>{value || '—'}</p>
      </div>
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <AuthenticatedLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground mb-1 bg-blue-100/60 text-blue-800 px-3 py-1 rounded-lg inline-block">{t.joinRequests}</h1>
            <p className="text-sm bg-emerald-100/60 text-emerald-700 px-2 py-0.5 rounded-md inline-block">{t.joinRequestsDesc}</p>
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
        {requests.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border/50 p-4 shadow-sm">
              <h3 className="font-bold text-sm mb-3 text-foreground">{t.joinStatusDistribution}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border/50 p-4 shadow-sm">
              <h3 className="font-bold text-sm mb-3 text-foreground">{t.joinInstitutionDistribution}</h3>
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

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border/50 p-4 shadow-sm">
              <h3 className="font-bold text-sm mb-3 text-foreground">{t.joinMissionDistribution}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={missionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {missionChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
                <div className="px-5 pb-5 pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.searchByName}</label>
                    <Input value={fName} onChange={e => { setFName(e.target.value); setCurrentPage(1); }} placeholder="..." className="h-9 text-xs" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.filterByStatus}</label>
                    <Select value={fStatus} onValueChange={v => { setFStatus(v === '__all__' ? '' : v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allStatuses} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">{t.allStatuses}</SelectItem>
                        {['pending', 'contacted', 'accepted', 'rejected'].map(s => <SelectItem key={s} value={s}>{t[`joinStatus_${s}`] || s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{t.institutionLabel}</label>
                    <Input value={fInstitution} onChange={e => { setFInstitution(e.target.value); setCurrentPage(1); }} placeholder="..." className="h-9 text-xs" />
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
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-border/50 bg-muted/30">
              <p className="text-xs text-muted-foreground">{t.showingResults} {sortedRequests.length > 0 ? `${((currentPage - 1) * PAGE_SIZE) + 1}-${Math.min(currentPage * PAGE_SIZE, sortedRequests.length)}` : '0'} {t.of} {sortedRequests.length}</p>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExportExcel} disabled={filteredRequests.length === 0}>
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
                    <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.corpsColumn}</th>
                    <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.academyLabel}</th>
                    <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.directorateLabel}</th>
                    <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.phoneColumn}</th>
                    <SortHeader field="created_at">{t.dateColumn}</SortHeader>
                    <SortHeader field="status">{t.statusColumn}</SortHeader>
                    <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.actionsColumn}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {paginatedRequests.map((req, i) => {
                    const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={req.id} className={`hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <button onClick={() => openProfile(req.profile)} className="font-medium text-foreground hover:text-primary hover:underline transition-colors flex items-center gap-1">
                            {req.profile?.full_name || '—'}
                            <Eye className="w-3 h-3 text-muted-foreground/50" />
                          </button>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-mono">{req.profile?.employee_number || '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{req.profile?.institution || '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{req.profile?.corps ? (CORPS_LABELS[lang]?.[req.profile.corps] || req.profile.corps) : '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{req.profile?.academy?.replace('الأكاديمية الجهوية للتربية والتكوين لجهة ', '') || '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{req.profile?.directorate || '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px]">{req.profile?.phone || '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{formatDate(req.created_at)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${sc.bg} ${sc.color}`}>
                            <sc.icon className="w-3 h-3" />
                            {t[`joinStatus_${req.status}`] || req.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex gap-1">
                            {['pending', 'contacted', 'accepted', 'rejected'].filter(s => s !== req.status).map(s => {
                              const ac = STATUS_CONFIG[s];
                              const AIcon = ac.icon;
                              return (
                                <button key={s} onClick={() => updateStatus(req.id, s)} className={`p-1.5 rounded-lg border transition-colors hover:shadow-sm ${ac.bg} ${ac.color}`} title={t[`joinStatus_${s}`] || s}>
                                  <AIcon className="w-3.5 h-3.5" />
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedRequests.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">{t.noJoinRequests}</td></tr>
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

      {/* Profile Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(195,70%,42%)] to-[hsl(195,70%,55%)] flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              {selectedProfile?.full_name || '—'}
            </DialogTitle>
            <DialogDescription>{lang === 'ar' ? 'معلومات الملف الشخصي' : 'Informations du profil'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1 mt-2">
            <ProfileField icon={Hash} label={lang === 'ar' ? 'رقم التأجير' : 'N° PPR'} value={selectedProfile?.employee_number} />
            <ProfileField icon={Phone} label={lang === 'ar' ? 'الهاتف' : 'Téléphone'} value={selectedProfile?.phone} />
            <ProfileField icon={Globe} label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'} value={selectedProfile?.email} />
            <ProfileField icon={Building} label={lang === 'ar' ? 'المؤسسة' : 'Établissement'} value={selectedProfile?.institution} />
            <ProfileField icon={BookOpen} label={lang === 'ar' ? 'السلك' : 'Corps'} value={selectedProfile?.corps ? (CORPS_LABELS[lang]?.[selectedProfile.corps] || selectedProfile.corps) : null} />
            <ProfileField icon={MapPin} label={lang === 'ar' ? 'الأكاديمية' : 'Académie'} value={selectedProfile?.academy} />
            <ProfileField icon={MapPin} label={lang === 'ar' ? 'المديرية' : 'Direction'} value={selectedProfile?.directorate} />
            <ProfileField icon={MapPin} label={lang === 'ar' ? 'المنطقة' : 'Zone'} value={selectedProfile?.zone} />
          </div>
          {selectedProfile?.phone && (
            <a href={`tel:${selectedProfile.phone}`} className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[hsl(195,70%,42%)] to-[hsl(195,70%,55%)] text-white font-medium text-sm shadow-md hover:shadow-lg transition-shadow">
              <Phone className="w-4 h-4" />
              {lang === 'ar' ? 'اتصال مباشر' : 'Appeler directement'}
            </a>
          )}
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
};

export default JoinRequests;
