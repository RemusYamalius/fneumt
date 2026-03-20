import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, User, Calendar, Tag, Eye, Inbox, Loader2, XCircle, Search, Download, Image as ImageIcon, FileIcon, Building2, Filter, RotateCcw, ChevronDown, ChevronUp, ArrowUpDown, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useHierarchicalFilter } from '@/hooks/useHierarchicalFilter';
import HierarchicalFilters from '@/components/HierarchicalFilters';

type RequestStatus = 'submitted' | 'viewed' | 'in_progress' | 'accepted' | 'cancelled';

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
}

interface IncomingRequest {
  id: string;
  tracking_number: string;
  category: string;
  subject: string;
  description: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  user_id: string;
  assigned_to: string | null;
  resolution_level: string | null;
  sender_name: string | null;
  sender_email: string | null;
  sender_institution: string | null;
  sender_academy: string | null;
  sender_directorate: string | null;
}

const CHART_COLORS = [
  'hsl(207, 62%, 45%)', 'hsl(160, 60%, 40%)', 'hsl(30, 90%, 50%)',
  'hsl(260, 60%, 55%)', 'hsl(340, 65%, 50%)', 'hsl(195, 70%, 45%)',
  'hsl(45, 80%, 50%)', 'hsl(120, 50%, 40%)', 'hsl(0, 70%, 55%)',
];

const PAGE_SIZE = 15;

const IncomingRequests = () => {
  const { t, dir, lang } = useI18n();
  const { user, loading, role, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refetch: refetchBadge } = useRealtimeNotifications(user?.id);
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<IncomingRequest | null>(null);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const hierarchy = useHierarchicalFilter();

  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fStatus, setFStatus] = useState('');
  const [fCategory, setFCategory] = useState('');
  const [fResolution, setFResolution] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Table
  const [sortField, setSortField] = useState('created_at');
  const [sortDir2, setSortDir2] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchRequests();
  }, [user, hierarchy.getAssignedToFilter, hierarchy.selectedAcademy, hierarchy.selectedDirectorate]);

  const fetchRequests = async () => {
    if (!user) return;
    setLoadingData(true);

    let query = supabase
      .from('requests')
      .select('id, tracking_number, category, subject, description, status, created_at, updated_at, user_id, resolution_level, assigned_to')
      .order('created_at', { ascending: false });

    // Apply scope filtering
    const filter = hierarchy.getAssignedToFilter;
    if (hierarchy.isDeputy) {
      query = query.eq('assigned_to', user.id);
    } else if (typeof filter === 'string' && filter) {
      query = query.eq('assigned_to', filter);
    } else if (Array.isArray(filter) && filter.length > 0) {
      query = query.in('assigned_to', filter);
    }
    // For national/regional/provincial without specific deputy: RLS handles visibility

    const { data, error } = await query;
    if (error) { console.error(error); setLoadingData(false); return; }

    const userIds = [...new Set((data || []).map(r => r.user_id))];
    let profilesMap: Record<string, { full_name: string | null; email: string | null; institution: string | null; academy: string | null; directorate: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, institution, academy, directorate')
        .in('user_id', userIds);
      (profiles || []).forEach(p => {
        profilesMap[p.user_id] = { full_name: p.full_name, email: p.email, institution: p.institution, academy: p.academy, directorate: p.directorate };
      });
    }

    let enriched = (data || []).map(r => ({
      ...r,
      status: r.status as RequestStatus,
      resolution_level: r.resolution_level || null,
      sender_name: profilesMap[r.user_id]?.full_name || null,
      sender_email: profilesMap[r.user_id]?.email || null,
      sender_institution: profilesMap[r.user_id]?.institution || null,
      sender_academy: profilesMap[r.user_id]?.academy || null,
      sender_directorate: profilesMap[r.user_id]?.directorate || null,
    }));

    // Client-side academy/directorate filtering for broader scopes
    if (hierarchy.selectedAcademy && !hierarchy.isDeputy) {
      enriched = enriched.filter(r => r.sender_academy === hierarchy.selectedAcademy);
    }
    if (hierarchy.selectedDirectorate && !hierarchy.isDeputy) {
      enriched = enriched.filter(r => r.sender_directorate === hierarchy.selectedDirectorate);
    }

    setRequests(enriched);
    setLoadingData(false);
  };

  const fetchAttachments = async (requestId: string) => {
    setLoadingAttachments(true);
    const { data } = await supabase.from('attachments').select('id, file_name, file_path, file_size, mime_type').eq('request_id', requestId);
    setAttachments(data || []);
    setLoadingAttachments(false);
  };

  const handleSelectRequest = async (request: IncomingRequest) => {
    if (selectedRequest?.id === request.id) { setSelectedRequest(null); setAttachments([]); return; }
    setSelectedRequest(request);
    fetchAttachments(request.id);
    setTimeout(() => {
      document.getElementById('request-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    if (request.status === 'submitted' && user && request.assigned_to === user.id) {
      try {
        await supabase.from('requests').update({ status: 'viewed' as any }).eq('id', request.id);
        await supabase.from('request_status_history').insert({ request_id: request.id, old_status: 'submitted' as any, new_status: 'viewed' as any, changed_by: user.id, note: lang === 'ar' ? 'تم الاطلاع على الملف' : 'Dossier consulté' } as any);
        await supabase.from('notifications').insert({ user_id: request.user_id, title: lang === 'ar' ? 'تم الاطلاع على ملفك' : 'Dossier consulté', message: lang === 'ar' ? `تم الاطلاع على ملفك رقم ${request.tracking_number}` : `Votre dossier n° ${request.tracking_number} a été consulté`, link: '/track' });
        setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'viewed' as RequestStatus } : r));
        setSelectedRequest({ ...request, status: 'viewed' as RequestStatus });
      } catch (err) { console.error(err); }
    }
  };

  const handleStatusChange = async (request: IncomingRequest, newStatus: RequestStatus) => {
    if (!user) return;
    setChangingStatus(`${request.id}:${newStatus}`);
    try {
      await supabase.from('requests').update({ status: newStatus as any }).eq('id', request.id);
      await supabase.from('request_status_history').insert({ request_id: request.id, old_status: request.status as any, new_status: newStatus as any, changed_by: user.id } as any);
      const statusLabels: Record<string, { ar: string; fr: string }> = {
        viewed: { ar: 'مطلع عليه', fr: 'Consulté' }, in_progress: { ar: 'قيد الإجراء', fr: 'En cours' },
        accepted: { ar: 'مقبول', fr: 'Accepté' }, cancelled: { ar: 'ملغى', fr: 'Annulé' },
      };
      const label = statusLabels[newStatus];
      if (label) {
        await supabase.from('notifications').insert({ user_id: request.user_id, title: lang === 'ar' ? 'تحديث حالة ملفك' : 'Mise à jour de votre dossier', message: lang === 'ar' ? `تم تغيير حالة ملفك رقم ${request.tracking_number} إلى: ${label.ar}` : `Le statut de votre dossier n° ${request.tracking_number} a été changé à : ${label.fr}`, link: '/track' });
      }
      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: newStatus } : r));
      setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null);
      toast({ title: t.statusChangedSuccess });
    } catch (err: any) {
      toast({ title: lang === 'ar' ? 'خطأ' : 'Erreur', description: err?.message, variant: 'destructive' });
    } finally { setChangingStatus(null); }
  };

  const downloadAttachment = async (att: Attachment) => {
    try {
      const { data, error } = await supabase.storage.from('attachments').download(att.file_path);
      if (error || !data) throw error || new Error('File inaccessible');
      const objectUrl = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = objectUrl; link.download = att.file_name;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1500);
    } catch (err: any) {
      toast({ title: lang === 'ar' ? 'تعذر تحميل المرفق' : 'Téléchargement impossible', description: err?.message, variant: 'destructive' });
    }
  };

  const formatDateTime = (dateStr: string) => new Date(dateStr).toLocaleString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const categoryLabel = (key: string) => t[`cat_${key}`] || key;
  const statusLabel = (key: string) => t[`status_${key}`] || key;
  const resolutionLabel = (key: string | null) => key ? (t[`level_${key}`] || key) : '—';
  const isFileImage = (mime: string | null) => mime?.startsWith('image/');

  // Filtered data
  const filteredRequests = useMemo(() => {
    let result = [...requests];
    if (fStatus) result = result.filter(r => r.status === fStatus);
    if (fCategory) result = result.filter(r => r.category === fCategory);
    if (fResolution) result = result.filter(r => r.resolution_level === fResolution);
    if (searchQuery.trim()) result = result.filter(r => r.tracking_number.toLowerCase().includes(searchQuery.trim().toLowerCase()));
    return result;
  }, [requests, fStatus, fCategory, fResolution, searchQuery]);

  // Sorted data
  const sortedRequests = useMemo(() => {
    const sorted = [...filteredRequests].sort((a, b) => {
      const va = (a as any)[sortField] || '';
      const vb = (b as any)[sortField] || '';
      if (sortField === 'created_at') return sortDir2 === 'asc' ? new Date(va).getTime() - new Date(vb).getTime() : new Date(vb).getTime() - new Date(va).getTime();
      return sortDir2 === 'asc' ? String(va).localeCompare(String(vb), 'ar') : String(vb).localeCompare(String(va), 'ar');
    });
    return sorted;
  }, [filteredRequests, sortField, sortDir2]);

  const totalPages = Math.ceil(sortedRequests.length / PAGE_SIZE);
  const paginatedRequests = sortedRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir2(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir2('asc'); }
    setCurrentPage(1);
  };

  const resetFilters = () => { setFStatus(''); setFCategory(''); setFResolution(''); setSearchQuery(''); setCurrentPage(1); };
  const hasActiveFilter = fStatus || fCategory || fResolution || searchQuery;

  // KPIs
  const totalCount = requests.length;
  const submittedCount = requests.filter(r => r.status === 'submitted' || r.status === 'viewed').length;
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
  const acceptedCount = requests.filter(r => r.status === 'accepted').length;
  const cancelledCount = requests.filter(r => r.status === 'cancelled').length;

  // Charts
  const statusChartData = useMemo(() => [
    { name: t.incomingSubmitted, value: submittedCount },
    { name: t.incomingInProgress, value: inProgressCount },
    { name: t.incomingAccepted, value: acceptedCount },
    { name: t.incomingCancelled, value: cancelledCount },
  ].filter(d => d.value > 0), [submittedCount, inProgressCount, acceptedCount, cancelledCount, t]);

  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return Object.entries(counts).map(([key, value]) => ({ name: categoryLabel(key), value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [requests, t]);

  const resolutionChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(r => { if (r.resolution_level) counts[r.resolution_level] = (counts[r.resolution_level] || 0) + 1; });
    return Object.entries(counts).map(([key, value]) => ({ name: resolutionLabel(key), value })).sort((a, b) => b.value - a.value);
  }, [requests, t]);

  // Unique values for filters
  const uniqueCategories = useMemo(() => [...new Set(requests.map(r => r.category))], [requests]);
  const uniqueResolutions = useMemo(() => [...new Set(requests.map(r => r.resolution_level).filter(Boolean))] as string[], [requests]);

  // Export
  const handleExportExcel = () => {
    const data = filteredRequests.map(r => ({
      [t.trackingColumn]: r.tracking_number,
      [t.senderColumn]: r.sender_name || '',
      [t.institutionLabel]: r.sender_institution || '',
      [t.categoryColumn]: categoryLabel(r.category),
      [t.resolutionColumn]: resolutionLabel(r.resolution_level),
      [t.dateColumn]: formatDateTime(r.created_at),
      [t.statusColumn]: statusLabel(r.status),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map(() => ({ wch: 25 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.incomingRequests);
    XLSX.writeFile(wb, `incoming-requests-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const kpiCards = [
    { label: t.incomingTotal, value: totalCount, gradient: 'from-[hsl(207,62%,40%)] to-[hsl(207,62%,55%)]', icon: Inbox },
    { label: t.incomingSubmitted, value: submittedCount, gradient: 'from-[hsl(45,80%,45%)] to-[hsl(45,80%,58%)]', icon: Clock },
    { label: t.incomingInProgress, value: inProgressCount, gradient: 'from-[hsl(195,70%,38%)] to-[hsl(195,70%,52%)]', icon: Loader2 },
    { label: t.incomingAccepted, value: acceptedCount, gradient: 'from-[hsl(160,60%,38%)] to-[hsl(160,60%,50%)]', icon: CheckCircle2 },
    { label: t.incomingCancelled, value: cancelledCount, gradient: 'from-[hsl(0,70%,48%)] to-[hsl(0,70%,58%)]', icon: XCircle },
  ];

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th className="px-3 py-3 text-start text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors select-none whitespace-nowrap" onClick={() => toggleSort(field)}>
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground/50'}`} />
      </span>
    </th>
  );

  const getStatusBadgeColor = (status: RequestStatus) => {
    switch (status) {
      case 'submitted': return 'bg-amber-500/15 text-amber-700 border-amber-300';
      case 'viewed': return 'bg-blue-500/15 text-blue-700 border-blue-300';
      case 'in_progress': return 'bg-cyan-500/15 text-cyan-700 border-cyan-300';
      case 'accepted': return 'bg-emerald-500/15 text-emerald-700 border-emerald-300';
      case 'cancelled': return 'bg-red-500/15 text-red-700 border-red-300';
    }
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <AuthenticatedLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground mb-1">{t.incomingRequests}</h1>
            <p className="text-muted-foreground text-sm">{t.incomingRequestsDesc}</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full bg-gradient-to-r from-[hsl(217,70%,25%)] to-[hsl(217,60%,35%)] text-white hover:from-[hsl(217,70%,30%)] hover:to-[hsl(217,60%,40%)] shadow-md px-5 h-10 text-sm gap-2 shrink-0">
            {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {t.backToDashboard}
          </Button>
        </motion.div>

        {/* Hierarchical Filters */}
        <HierarchicalFilters {...hierarchy} />

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {kpiCards.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }} className="relative overflow-hidden rounded-2xl p-4 shadow-md border border-border/50">
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

        {/* Charts */}
        {requests.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border/50 p-4 shadow-sm">
              <h3 className="font-bold text-sm mb-3 text-foreground">{t.statusDistribution}</h3>
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
              <h3 className="font-bold text-sm mb-3 text-foreground">{t.categoryDistribution}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border/50 p-4 shadow-sm">
              <h3 className="font-bold text-sm mb-3 text-foreground">{t.resolutionDistribution}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={resolutionChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {resolutionChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="group relative w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[hsl(217,70%,25%)] to-[hsl(217,60%,40%)] text-white rounded-t-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl">
            <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-t-2xl">
              <span className="absolute inset-y-0 -left-10 w-20 bg-gradient-to-r from-transparent via-white/25 to-transparent rotate-12 animate-[shimmer-sweep_3s_ease-in-out_infinite]" />
            </span>
            <span className="relative flex items-center gap-2 font-semibold">
              <Filter className="w-4 h-4" />
              {t.advancedFilters}
            </span>
            <div className="relative flex items-center gap-2">
              {hasActiveFilter && <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-white/30">{t.filterLabel}</Badge>}
              {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          <AnimatePresence>
            {filtersOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                <div className="px-5 pb-5 pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="text-sm font-bold mb-1 block px-2 py-0.5 rounded-md bg-blue-100/60 text-blue-700 w-fit">{t.searchByTracking}</label>
                    <Input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="REQ-..." className="h-9 text-xs" />
                  </div>
                  <div>
                    <label className="text-sm font-bold mb-1 block px-2 py-0.5 rounded-md bg-amber-100/60 text-amber-700 w-fit">{t.filterByStatus}</label>
                    <Select value={fStatus} onValueChange={v => { setFStatus(v === '__all__' ? '' : v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allStatuses} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">{t.allStatuses}</SelectItem>
                        {['submitted', 'viewed', 'in_progress', 'accepted', 'cancelled'].map(s => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-bold mb-1 block px-2 py-0.5 rounded-md bg-emerald-100/60 text-emerald-700 w-fit">{t.filterByCategory}</label>
                    <Select value={fCategory} onValueChange={v => { setFCategory(v === '__all__' ? '' : v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allCategories} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">{t.allCategories}</SelectItem>
                        {uniqueCategories.map(c => <SelectItem key={c} value={c}>{categoryLabel(c)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-bold mb-1 block px-2 py-0.5 rounded-md bg-purple-100/60 text-purple-700 w-fit">{t.filterByResolution}</label>
                    <Select value={fResolution} onValueChange={v => { setFResolution(v === '__all__' ? '' : v); setCurrentPage(1); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allLevels} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">{t.allLevels}</SelectItem>
                        {uniqueResolutions.map(l => <SelectItem key={l} value={l}>{resolutionLabel(l)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
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

        {/* Table */}
        {loadingData ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-border/50 bg-muted/30">
              <p className="text-sm font-bold px-2 py-0.5 rounded-md bg-indigo-100/60 text-indigo-700">
                {t.showingResults} {sortedRequests.length > 0 ? `${((currentPage - 1) * PAGE_SIZE) + 1}-${Math.min(currentPage * PAGE_SIZE, sortedRequests.length)}` : '0'} {t.of} {sortedRequests.length}
              </p>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExportExcel} disabled={filteredRequests.length === 0}>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {t.exportToExcel}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" dir={dir}>
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.trackingColumn}</th>
                    <SortHeader field="sender_name">{t.senderColumn}</SortHeader>
                    <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.institutionLabel}</th>
                    <SortHeader field="category">{t.categoryColumn}</SortHeader>
                    <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.resolutionColumn}</th>
                    <SortHeader field="created_at">{t.dateColumn}</SortHeader>
                    <SortHeader field="status">{t.statusColumn}</SortHeader>
                    <th className="px-3 py-3 text-start text-xs font-bold uppercase whitespace-nowrap">{t.actionsColumn}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {paginatedRequests.map((req, i) => (
                    <tr key={req.id} className={`cursor-pointer hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'} ${selectedRequest?.id === req.id ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`} onClick={() => handleSelectRequest(req)}>
                      <td className="px-3 py-2.5 font-mono font-bold text-primary whitespace-nowrap">{req.tracking_number}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{req.sender_name || '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{req.sender_institution || '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{categoryLabel(req.category)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{resolutionLabel(req.resolution_level)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-[11px]">{formatDateTime(req.created_at)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadgeColor(req.status)}`}>{statusLabel(req.status)}</span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {(['in_progress', 'accepted', 'cancelled'] as RequestStatus[]).filter(s => s !== req.status).map(s => {
                            const icons: Record<string, any> = { in_progress: Clock, accepted: CheckCircle2, cancelled: XCircle };
                            const iconColors: Record<string, string> = { in_progress: 'text-cyan-600 hover:bg-cyan-50', accepted: 'text-emerald-600 hover:bg-emerald-50', cancelled: 'text-red-600 hover:bg-red-50' };
                            const Icon = icons[s];
                            return (
                              <button key={s} onClick={() => handleStatusChange(req, s)} disabled={!!changingStatus} className={`p-1.5 rounded-lg border border-border/50 transition-colors ${iconColors[s]}`} title={statusLabel(s)}>
                                {changingStatus === `${req.id}:${s}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedRequests.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">{t.noData}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedRequest && (
            <motion.div id="request-detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mt-4 rounded-2xl border border-border/50 p-5 shadow-sm bg-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-primary">{selectedRequest.tracking_number}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadgeColor(selectedRequest.status)}`}>{statusLabel(selectedRequest.status)}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedRequest(null); setAttachments([]); }}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-bold text-blue-600 mb-0.5">{t.senderColumn}</p>
                  <p className="text-sm font-medium">{selectedRequest.sender_name || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedRequest.sender_institution || ''}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600 mb-0.5">{t.categoryColumn}</p>
                  <p className="text-sm font-medium">{categoryLabel(selectedRequest.category)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{resolutionLabel(selectedRequest.resolution_level)}</p>
                </div>
              </div>

              {selectedRequest.description && (
                <div className="bg-purple-50/50 rounded-xl p-4 mb-4 border border-purple-200/30">
                  <span className="text-xs font-bold text-purple-600">{t.descriptionLabel}</span>
                  <p className="text-foreground mt-1">{selectedRequest.description}</p>
                </div>
              )}

              {/* Attachments */}
              <div className="bg-amber-50/50 rounded-xl p-4 mb-4 border border-amber-200/30">
                <span className="text-xs font-bold text-amber-600 mb-2 block">{t.attachments}</span>
                {loadingAttachments ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.noAttachments}</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map(att => (
                      <div key={att.id} className="flex items-center justify-between rounded-lg px-3 py-2 bg-background/50 border border-border/30">
                        <div className="flex items-center gap-2 min-w-0">
                          {isFileImage(att.mime_type) ? <ImageIcon className="w-4 h-4 text-primary shrink-0" /> : <FileIcon className="w-4 h-4 text-primary shrink-0" />}
                          <span className="text-sm truncate">{att.file_name}</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => downloadAttachment(att)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status change */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-bold text-cyan-600 self-center me-1">{t.changeStatus}:</span>
                {(['viewed', 'in_progress', 'accepted', 'cancelled'] as RequestStatus[]).map(s => {
                  const isActive = selectedRequest.status === s;
                  const icons: Record<string, any> = { viewed: Eye, in_progress: Clock, accepted: CheckCircle2, cancelled: XCircle };
                  const Icon = icons[s];
                  return (
                    <Button key={s} size="sm" variant={isActive ? 'default' : 'outline'} disabled={isActive || !!changingStatus} onClick={() => handleStatusChange(selectedRequest, s)}>
                      {changingStatus === `${selectedRequest.id}:${s}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                      {statusLabel(s)}
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </AuthenticatedLayout>
  );
};

export default IncomingRequests;
