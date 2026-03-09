import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Users, BarChart3, PieChart as PieIcon, TrendingUp, Clock, CheckCircle2, XCircle, Eye, FileText, Activity, UserCheck, ChevronDown, UsersRound, Filter, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { exportToPDF, exportToExcel } from '@/lib/export-supervisor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

interface Deputy {
  user_id: string;
  full_name: string | null;
  role: string;
  teamSize?: number;
  academy?: string | null;
  directorate?: string | null;
}

interface RequestData {
  id: string;
  tracking_number: string;
  category: string;
  status: string;
  created_at: string;
  subject: string;
  assigned_to: string;
}

interface StatusHistoryEntry {
  request_id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
}

interface ProfileData {
  user_id: string;
  is_member: boolean | null;
  membership_verified: boolean | null;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'hsl(38, 92%, 46%)',
  viewed: 'hsl(207, 78%, 46%)',
  in_progress: 'hsl(268, 61%, 52%)',
  accepted: 'hsl(146, 63%, 38%)',
  cancelled: 'hsl(0, 78%, 48%)',
};

const CATEGORY_COLORS = [
  'hsl(207, 78%, 46%)', 'hsl(146, 63%, 38%)', 'hsl(38, 92%, 46%)',
  'hsl(0, 78%, 48%)', 'hsl(268, 61%, 52%)', 'hsl(340, 65%, 47%)',
  'hsl(180, 60%, 40%)', 'hsl(30, 90%, 50%)',
];

// Subordinate role mapping
const TRIO_ROLES: Record<string, string[]> = {
  local_coordinator: ['deputy_local_primary', 'deputy_local_middle', 'deputy_local_high'],
  provincial_manager: ['deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high'],
  regional_supervisor: ['deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high'],
};

// Area-based subordinate discovery config
const AREA_CONFIG: Record<string, { subordinates: string[]; matchFields: ('academy' | 'directorate')[] }> = {
  local_coordinator: {
    subordinates: ['deputy_local_primary', 'deputy_local_middle', 'deputy_local_high'],
    matchFields: ['academy', 'directorate'],
  },
  provincial_manager: {
    subordinates: ['deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high'],
    matchFields: ['academy', 'directorate'],
  },
  regional_supervisor: {
    subordinates: ['deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high'],
    matchFields: ['academy'],
  },
  deputy_regional_primary: { subordinates: ['provincial_manager'], matchFields: ['academy'] },
  deputy_regional_middle: { subordinates: ['provincial_manager'], matchFields: ['academy'] },
  deputy_regional_high: { subordinates: ['provincial_manager'], matchFields: ['academy'] },
  deputy_provincial_primary: { subordinates: ['local_coordinator'], matchFields: ['academy', 'directorate'] },
  deputy_provincial_middle: { subordinates: ['local_coordinator'], matchFields: ['academy', 'directorate'] },
  deputy_provincial_high: { subordinates: ['local_coordinator'], matchFields: ['academy', 'directorate'] },
};

// Single subordinate roles (non-trio deputies that expect one subordinate type)
const SINGLE_SUBORDINATE: Record<string, string> = {
  deputy_regional_primary: 'provincial_manager',
  deputy_regional_middle: 'provincial_manager',
  deputy_regional_high: 'provincial_manager',
  deputy_provincial_primary: 'local_coordinator',
  deputy_provincial_middle: 'local_coordinator',
  deputy_provincial_high: 'local_coordinator',
};

/* ── Animated counter ── */
const AnimatedNumber = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.round(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}{suffix}</span>;
};

/* ── KPI Card ── */
const KPICard = ({ icon: Icon, label, value, suffix, color, delay }: {
  icon: any; label: string; value: number; suffix?: string; color: string; delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-accent/5 p-5 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
    <p className="text-3xl font-bold text-foreground">
      <AnimatedNumber value={value} suffix={suffix} />
    </p>
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" style={{ background: color, transform: 'translate(30%, -30%)' }} />
  </motion.div>
);

/* ── Mini stat pill ── */
const MiniStat = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-b from-muted/60 to-muted/30 border border-border/30">
    <span className="text-lg font-bold" style={{ color }}>{value}</span>
    <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">{label}</span>
  </div>
);

const SupervisorDashboard = () => {
  const { t, dir, lang } = useI18n();
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [deputies, setDeputies] = useState<Deputy[]>([]);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [expandedDeputy, setExpandedDeputy] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [filterLevel, setFilterLevel] = useState<'all' | 'regional' | 'provincial' | 'local'>('all');
  const [filterCorps, setFilterCorps] = useState<'all' | 'primary' | 'middle' | 'high'>('all');
  const [exportLang, setExportLang] = useState<'ar' | 'fr'>(lang as 'ar' | 'fr');
  const [exporting, setExporting] = useState(false);

  const levelMap: Record<string, string[]> = {
    regional: ['regional_supervisor', 'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high'],
    provincial: ['provincial_manager', 'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high'],
    local: ['local_coordinator', 'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high'],
  };
  const corpsMap: Record<string, string[]> = {
    primary: ['deputy_regional_primary', 'deputy_provincial_primary', 'deputy_local_primary'],
    middle: ['deputy_regional_middle', 'deputy_provincial_middle', 'deputy_local_middle'],
    high: ['deputy_regional_high', 'deputy_provincial_high', 'deputy_local_high'],
  };
  const allCorpsRoles = ['regional_supervisor', 'provincial_manager', 'local_coordinator'];

  const applyFilters = useCallback((lvl: string, corps: string) => {
    return deputies.filter(dep => {
      if (lvl !== 'all' && !levelMap[lvl]?.includes(dep.role)) return false;
      if (corps !== 'all' && !corpsMap[corps]?.includes(dep.role) && !allCorpsRoles.includes(dep.role)) return false;
      return true;
    });
  }, [deputies]);

  const filteredDeputies = useMemo(() => applyFilters(filterLevel, filterCorps), [applyFilters, filterLevel, filterCorps]);

  const filterCounts = useMemo(() => {
    const levelCounts: Record<string, number> = {};
    for (const lvl of ['all', 'regional', 'provincial', 'local']) {
      levelCounts[lvl] = applyFilters(lvl, filterCorps).length;
    }
    const corpsCounts: Record<string, number> = {};
    for (const c of ['all', 'primary', 'middle', 'high']) {
      corpsCounts[c] = applyFilters(filterLevel, c).length;
    }
    return { levelCounts, corpsCounts };
  }, [applyFilters, filterLevel, filterCorps]);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || !role) return;
    fetchData();
  }, [user, role]);

  const fetchData = async () => {
    if (!user || !role) return;
    setLoadingData(true);

    let allDeputyRoles: { user_id: string; role: string; promoted_by: string | null }[] = [];

    // All supervisory roles in hierarchy order
    const ALL_SUPERVISORY_ROLES = [
      'regional_supervisor',
      'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high',
      'provincial_manager',
      'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high',
      'local_coordinator',
      'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high',
    ];

    if (role === 'admin') {
      // Admin sees ALL non-teacher supervisory roles + placeholders for missing ones
      const { data } = await supabase
        .from('user_roles')
        .select('user_id, role, promoted_by')
        .neq('role', 'teacher');
      allDeputyRoles = data || [];

      // Inject placeholders for ALL missing supervisory roles
      const existingRoles = new Set(allDeputyRoles.map(r => r.role));
      ALL_SUPERVISORY_ROLES.forEach(r => {
        if (!existingRoles.has(r)) {
          allDeputyRoles.push({ user_id: `placeholder_${r}`, role: r, promoted_by: null });
        }
      });

      // Sort by hierarchy order
      const roleOrder = Object.fromEntries(ALL_SUPERVISORY_ROLES.map((r, i) => [r, i]));
      allDeputyRoles.sort((a, b) => (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99));
    } else {
      // Strategy 1: subordinates linked via promoted_by
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role, promoted_by')
        .eq('promoted_by', user.id);
      allDeputyRoles = [...(rolesData || [])];

      // Strategy 2: area-based lookup for trio-supervisor roles
      const areaConfig = AREA_CONFIG[role];
      if (areaConfig) {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('academy, directorate')
          .eq('user_id', user.id)
          .single();

        if (myProfile) {
          let query = supabase.from('profiles').select('user_id').neq('user_id', user.id);
          if (areaConfig.matchFields.includes('academy') && myProfile.academy) {
            query = query.eq('academy', myProfile.academy);
          }
          if (areaConfig.matchFields.includes('directorate') && myProfile.directorate) {
            query = query.eq('directorate', myProfile.directorate);
          }
          const { data: areaProfiles } = await query;
          const areaUserIds = (areaProfiles || []).map(p => p.user_id);

          if (areaUserIds.length > 0) {
            const { data: areaRoles } = await supabase
              .from('user_roles')
              .select('user_id, role, promoted_by')
              .in('user_id', areaUserIds)
              .in('role', areaConfig.subordinates as any);

            const existingIds = new Set(allDeputyRoles.map(r => r.user_id));
            (areaRoles || []).forEach(r => {
              if (!existingIds.has(r.user_id)) {
                allDeputyRoles.push(r);
                existingIds.add(r.user_id);
              }
            });
          }
        }
      }
    }

    // Inject placeholders for trio-roles (local_coordinator, provincial_manager, regional_supervisor)
    const expectedRoles = TRIO_ROLES[role || ''];
    if (expectedRoles) {
      const existingRoles = new Set(allDeputyRoles.map(r => r.role));
      expectedRoles.forEach(depRole => {
        if (!existingRoles.has(depRole)) {
          allDeputyRoles.push({ user_id: `placeholder_${depRole}`, role: depRole, promoted_by: null });
        }
      });
    }

    // Inject placeholder for single-subordinate roles (deputy_regional_*, deputy_provincial_*)
    const singleSubRole = SINGLE_SUBORDINATE[role || ''];
    if (singleSubRole && allDeputyRoles.length === 0) {
      allDeputyRoles.push({ user_id: `placeholder_${singleSubRole}`, role: singleSubRole, promoted_by: null });
    }

    const realDeputyIds = allDeputyRoles.filter(r => !r.user_id.startsWith('placeholder_')).map(r => r.user_id);

    if (realDeputyIds.length > 0) {
      const [profilesRes, requestsRes, allProfilesRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, academy, directorate').in('user_id', realDeputyIds),
        supabase.from('requests').select('id, tracking_number, category, status, created_at, subject, assigned_to').in('assigned_to', realDeputyIds).order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, is_member, membership_verified'),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, { full_name: p.full_name, academy: p.academy, directorate: p.directorate }]));

      // Count team members per deputy using area-based matching
      const teamCounts = new Map<string, number>();
      for (const dep of (profilesRes.data || [])) {
        const depRole = allDeputyRoles.find(r => r.user_id === dep.user_id)?.role;
        if (!depRole) continue;
        
        // Find what subordinate roles this deputy's role manages
        const depAreaConfig = AREA_CONFIG[depRole];
        if (!depAreaConfig) continue;
        
        // Query for subordinates in the same geographic area
        let subQuery = supabase.from('profiles').select('user_id').neq('user_id', dep.user_id);
        if (depAreaConfig.matchFields.includes('academy') && dep.academy) {
          subQuery = subQuery.eq('academy', dep.academy);
        }
        if (depAreaConfig.matchFields.includes('directorate') && dep.directorate) {
          subQuery = subQuery.eq('directorate', dep.directorate);
        }
        const { data: subProfiles } = await subQuery;
        const subUserIds = (subProfiles || []).map(p => p.user_id);
        
        if (subUserIds.length > 0) {
          const { data: subRoles } = await supabase
            .from('user_roles')
            .select('user_id')
            .in('user_id', subUserIds)
            .in('role', depAreaConfig.subordinates as any);
          teamCounts.set(dep.user_id, (subRoles || []).length);
        }
      }

      setDeputies(allDeputyRoles.map(r => {
        const prof = profileMap.get(r.user_id);
        return {
          user_id: r.user_id,
          full_name: r.user_id.startsWith('placeholder_') ? null : (prof?.full_name || null),
          role: r.role,
          teamSize: r.user_id.startsWith('placeholder_') ? 0 : (teamCounts.get(r.user_id) || 0),
          academy: prof?.academy || null,
          directorate: prof?.directorate || null,
        };
      }));
      setRequests(requestsRes.data || []);
      setProfiles(allProfilesRes.data || []);

      const requestIds = (requestsRes.data || []).map(r => r.id);
      if (requestIds.length > 0) {
        const { data: historyData } = await supabase
          .from('request_status_history')
          .select('request_id, old_status, new_status, created_at')
          .in('request_id', requestIds);
        setStatusHistory(historyData || []);
      }
    } else {
      setDeputies(allDeputyRoles.map(r => ({
        user_id: r.user_id,
        full_name: null,
        role: r.role,
        teamSize: 0,
      })));
      setRequests([]);
    }
    setLoadingData(false);
  };

  /* ── Global KPIs ── */
  const globalKPIs = useMemo(() => {
    const total = requests.length;
    const processed = requests.filter(r => r.status === 'accepted').length;
    const viewed = requests.filter(r => ['viewed', 'in_progress', 'accepted', 'cancelled'].includes(r.status)).length;
    const responseRate = total > 0 ? Math.round((viewed / total) * 100) : 0;
    const verifiedCount = profiles.filter(p => p.membership_verified === true).length;
    const totalSubordinates = deputies.filter(d => !d.user_id.startsWith('placeholder_')).length;
    return { total, processed, responseRate, verifiedCount, totalSubordinates };
  }, [requests, profiles, deputies]);

  /* ── Per-deputy stats ── */
  const getDeputyStats = (deputyId: string) => {
    const depRequests = requests.filter(r => r.assigned_to === deputyId);
    const total = depRequests.length;
    const byStatus = {
      submitted: depRequests.filter(r => r.status === 'submitted').length,
      viewed: depRequests.filter(r => r.status === 'viewed').length,
      in_progress: depRequests.filter(r => r.status === 'in_progress').length,
      accepted: depRequests.filter(r => r.status === 'accepted').length,
      cancelled: depRequests.filter(r => r.status === 'cancelled').length,
    };
    const viewedTotal = total - byStatus.submitted;
    const responseRate = total > 0 ? Math.round((viewedTotal / total) * 100) : 0;
    const acceptanceRate = total > 0 ? Math.round((byStatus.accepted / total) * 100) : 0;
    const cancellationRate = total > 0 ? Math.round((byStatus.cancelled / total) * 100) : 0;

    // Average response time (submitted → viewed)
    let avgResponseHours = 0;
    const depRequestIds = depRequests.map(r => r.id);
    const viewedHistories = statusHistory.filter(
      h => depRequestIds.includes(h.request_id) && h.new_status === 'viewed' && (h.old_status === 'submitted' || h.old_status === null)
    );
    if (viewedHistories.length > 0) {
      const requestMap = new Map(depRequests.map(r => [r.id, r.created_at]));
      const totalMs = viewedHistories.reduce((sum, h) => {
        const submitted = requestMap.get(h.request_id);
        if (!submitted) return sum;
        return sum + (new Date(h.created_at).getTime() - new Date(submitted).getTime());
      }, 0);
      avgResponseHours = totalMs / viewedHistories.length / (1000 * 60 * 60);
    }

    // Status chart data
    const statusChartData = Object.entries(byStatus)
      .filter(([, v]) => v > 0)
      .map(([status, count]) => ({
        name: t[`status_${status}`] || status,
        value: count,
        status,
      }));

    // Category chart data
    const catCounts: Record<string, number> = {};
    depRequests.forEach(r => { catCounts[r.category] = (catCounts[r.category] || 0) + 1; });
    const categoryChartData = Object.entries(catCounts).map(([cat, count]) => ({
      name: t[`cat_${cat}`] || cat,
      value: count,
    }));

    // Timeline data (last 30 days)
    const now = new Date();
    const days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = depRequests.filter(r => r.created_at.slice(0, 10) === key).length;
      days.push({ date: d.toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'short' }), count });
    }

    const recent5 = depRequests.slice(0, 5);

    return { total, byStatus, responseRate, acceptanceRate, cancellationRate, avgResponseHours, statusChartData, categoryChartData, timelineData: days, recent5 };
  };

  const getRoleLabel = (r: string) => t[`role_${r}`] || r;

  const formatResponseTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} ${t.minutes}`;
    return `${hours.toFixed(1)} ${t.hours}`;
  };

  // Check if subordinate role handles requests directly
  const isDirectRequestHandler = (depRole: string) =>
    ['deputy_local_primary', 'deputy_local_middle', 'deputy_local_high'].includes(depRole);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <AuthenticatedLayout>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="rounded-full bg-gradient-to-r from-[hsl(207,78%,28%)] to-[hsl(207,78%,38%)] text-white hover:from-[hsl(207,78%,24%)] hover:to-[hsl(207,78%,34%)] hover:text-white px-5 py-2 gap-2 shadow-md"
          >
            {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {dir === 'rtl' ? 'العودة للوحة التحكم' : 'Retour au tableau de bord'}
          </Button>
        </motion.div>

        {/* Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: dir === 'rtl' ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t.supervisorDashboard}</h1>
              <p className="text-sm text-muted-foreground">{t.supervisorDashboardDesc}</p>
            </div>
          </motion.div>

          {/* Export controls */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <Select value={exportLang} onValueChange={(v) => setExportLang(v as 'ar' | 'fr')}>
              <SelectTrigger className="w-[110px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={exporting || loadingData || deputies.length === 0}
              onClick={async () => {
                setExporting(true);
                try {
                  await exportToPDF({
                    kpis: globalKPIs,
                    deputies: filteredDeputies,
                    getDeputyStats,
                    getRoleLabel,
                  }, exportLang);
                } finally { setExporting(false); }
              }}
              className="gap-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={exporting || loadingData || deputies.length === 0}
              onClick={() => {
                exportToExcel({
                  kpis: globalKPIs,
                  deputies: filteredDeputies,
                  getDeputyStats,
                  getRoleLabel,
                }, exportLang);
              }}
              className="gap-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </Button>
          </motion.div>
        </div>

        {loadingData ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : deputies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-border bg-card p-12 text-center"
          >
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg text-muted-foreground">{t.noDeputies}</p>
          </motion.div>
        ) : (
          <>
            {/* Global KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <KPICard icon={UsersRound} label={t.totalSubordinates} value={globalKPIs.totalSubordinates} color="hsl(207, 78%, 46%)" delay={0} />
              <KPICard icon={FileText} label={t.totalRequests} value={globalKPIs.total} color="hsl(146, 63%, 38%)" delay={0.1} />
              <KPICard icon={CheckCircle2} label={t.processedRequests} value={globalKPIs.processed} color="hsl(268, 61%, 52%)" delay={0.2} />
              <KPICard icon={Eye} label={t.responseRate} value={globalKPIs.responseRate} suffix="%" color="hsl(38, 92%, 46%)" delay={0.3} />
            </div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex flex-wrap items-center gap-3 mb-6 bg-gradient-to-br from-muted/40 to-accent/5 p-4 rounded-2xl border border-border/40"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span className="font-medium">{t.filterByLevel}:</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'regional', 'provincial', 'local'] as const).map(level => {
                  const labelKey = level === 'all' ? 'filterLevelAll' : `filter${level.charAt(0).toUpperCase() + level.slice(1)}`;
                  return (
                    <button
                      key={level}
                      onClick={() => setFilterLevel(level)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filterLevel === level
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {t[labelKey as keyof typeof t]}
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] leading-none ${
                        filterLevel === level ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground'
                      }`}>{filterCounts.levelCounts[level]}</span>
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">{t.filterByCorps}:</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'primary', 'middle', 'high'] as const).map(corps => {
                  const labelKey = corps === 'all' ? 'filterCorpsAll' : `filter${corps.charAt(0).toUpperCase() + corps.slice(1)}`;
                  return (
                    <button
                      key={corps}
                      onClick={() => setFilterCorps(corps)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filterCorps === corps
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {t[labelKey as keyof typeof t]}
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] leading-none ${
                        filterCorps === corps ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground'
                      }`}>{filterCounts.corpsCounts[corps]}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Deputy Cards */}
            <div className="space-y-4">
              {filteredDeputies.map((dep, idx) => {
                const stats = getDeputyStats(dep.user_id);
                const isExpanded = expandedDeputy === dep.user_id;
                const isPlaceholder = dep.user_id.startsWith('placeholder_');
                const handlesRequests = isDirectRequestHandler(dep.role);

                return (
                  <motion.div
                    key={dep.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-primary/[0.03] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Deputy Header */}
                    <button
                      onClick={() => !isPlaceholder && setExpandedDeputy(isExpanded ? null : dep.user_id)}
                      className={`w-full p-5 flex items-center justify-between text-start ${isPlaceholder ? 'cursor-default' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md ${isPlaceholder ? 'bg-muted-foreground/30' : 'bg-gradient-to-br from-primary to-secondary'}`}>
                          {isPlaceholder ? '?' : (dep.full_name || '?')[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">
                            {isPlaceholder ? t.awaitingAssignment : (dep.full_name || '—')}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs text-muted-foreground">{getRoleLabel(dep.role)}</p>
                            {!isPlaceholder && dep.directorate && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                                {dep.directorate}
                              </span>
                            )}
                            {isPlaceholder && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">{t.notAssigned}</span>
                            )}
                            {!isPlaceholder && (dep.teamSize ?? 0) > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary flex items-center gap-1">
                                <UsersRound className="w-3 h-3" />
                                {dep.teamSize} {t.teamMembers}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {!isPlaceholder && (
                          <div className="hidden sm:flex items-center gap-3">
                            {handlesRequests && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                                {stats.total} {t.totalRequests}
                              </span>
                            )}
                            {!handlesRequests && (dep.teamSize ?? 0) > 0 && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent">
                                {dep.teamSize} {t.appointedLabel}
                              </span>
                            )}
                            {handlesRequests && stats.responseRate > 0 && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent">
                                {stats.responseRate}% {t.responseRate}
                              </span>
                            )}
                          </div>
                        )}
                        {!isPlaceholder && (
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          </motion.div>
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && !isPlaceholder && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-6 border-t border-border pt-5">
                            {/* For non-request-handlers, show team info */}
                            {!handlesRequests && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4 text-center">
                                    <UsersRound className="w-5 h-5 mx-auto mb-2 text-primary" />
                                    <p className="text-2xl font-bold text-foreground">{dep.teamSize || 0}</p>
                                    <p className="text-xs text-muted-foreground">{t.appointedSubordinates}</p>
                                  </div>
                                  <div className="rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 p-4 text-center">
                                    <FileText className="w-5 h-5 mx-auto mb-2 text-primary" />
                                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                                    <p className="text-xs text-muted-foreground">{t.directRequests}</p>
                                  </div>
                                </div>
                              </motion.div>
                            )}

                            {/* For request handlers, show full analytics */}
                            {handlesRequests && stats.total === 0 ? (
                              <p className="text-center text-muted-foreground py-8">{t.noRequestsForDeputy}</p>
                            ) : handlesRequests ? (
                              <>
                                {/* Mini Stats Row */}
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 }}
                                  className="flex flex-wrap justify-center gap-2 mb-6"
                                >
                                  <MiniStat label={t.status_submitted} value={stats.byStatus.submitted} color={STATUS_COLORS.submitted} />
                                  <MiniStat label={t.status_viewed} value={stats.byStatus.viewed} color={STATUS_COLORS.viewed} />
                                  <MiniStat label={t.status_in_progress} value={stats.byStatus.in_progress} color={STATUS_COLORS.in_progress} />
                                  <MiniStat label={t.status_accepted} value={stats.byStatus.accepted} color={STATUS_COLORS.accepted} />
                                  <MiniStat label={t.status_cancelled} value={stats.byStatus.cancelled} color={STATUS_COLORS.cancelled} />
                                </motion.div>

                                {/* Rate Cards */}
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.15 }}
                                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
                                >
                                  <div className="rounded-xl bg-gradient-to-br from-blue-50/80 to-blue-100/40 dark:from-blue-950/30 dark:to-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 p-4 text-center">
                                    <Eye className="w-5 h-5 mx-auto mb-2 text-primary" />
                                    <p className="text-2xl font-bold text-foreground">{stats.responseRate}%</p>
                                    <p className="text-xs text-muted-foreground">{t.viewedRate}</p>
                                  </div>
                                  <div className="rounded-xl bg-gradient-to-br from-purple-50/80 to-purple-100/40 dark:from-purple-950/30 dark:to-purple-900/10 border border-purple-200/50 dark:border-purple-800/30 p-4 text-center">
                                    <Clock className="w-5 h-5 mx-auto mb-2 text-primary" />
                                    <p className="text-2xl font-bold text-foreground">{formatResponseTime(stats.avgResponseHours)}</p>
                                    <p className="text-xs text-muted-foreground">{t.avgResponseTime}</p>
                                  </div>
                                  <div className="rounded-xl bg-gradient-to-br from-teal-50/80 to-teal-100/40 dark:from-teal-950/30 dark:to-teal-900/10 border border-teal-200/50 dark:border-teal-800/30 p-4 text-center">
                                    <Activity className="w-5 h-5 mx-auto mb-2 text-accent" />
                                    <p className="text-foreground">
                                      <span className="text-xl font-bold text-accent">{stats.acceptanceRate}%</span>
                                      <span className="text-muted-foreground mx-1">/</span>
                                      <span className="text-xl font-bold text-destructive">{stats.cancellationRate}%</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">{t.acceptanceRate} / {t.cancellationRate}</p>
                                  </div>
                                </motion.div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                                  {/* Bar Chart */}
                                  <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/60 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 p-4"
                                  >
                                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                      <BarChart3 className="w-4 h-4 text-primary" />
                                      {t.requestsByStatus}
                                    </h4>
                                    <ResponsiveContainer width="100%" height={180}>
                                      <BarChart data={stats.statusChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                          {stats.statusChartData.map((entry, i) => (
                                            <Cell key={i} fill={STATUS_COLORS[entry.status] || 'hsl(var(--muted-foreground))'} />
                                          ))}
                                        </Bar>
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </motion.div>

                                  {/* Donut Chart */}
                                  <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="rounded-xl border border-border bg-background p-4"
                                  >
                                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                      <PieIcon className="w-4 h-4 text-primary" />
                                      {t.requestsByCategory}
                                    </h4>
                                    <ResponsiveContainer width="100%" height={180}>
                                      <PieChart>
                                        <Pie data={stats.categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3}>
                                          {stats.categoryChartData.map((_, i) => (
                                            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                                          ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                                        <Legend wrapperStyle={{ fontSize: 10 }} />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </motion.div>

                                  {/* Area Chart */}
                                  <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="rounded-xl border border-border bg-background p-4"
                                  >
                                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                      <TrendingUp className="w-4 h-4 text-primary" />
                                      {t.requestsOverTime}
                                    </h4>
                                    <ResponsiveContainer width="100%" height={180}>
                                      <AreaChart data={stats.timelineData}>
                                        <defs>
                                          <linearGradient id={`gradient-${dep.user_id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(207, 78%, 46%)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(207, 78%, 46%)" stopOpacity={0} />
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={6} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                                        <Area type="monotone" dataKey="count" stroke="hsl(207, 78%, 46%)" fill={`url(#gradient-${dep.user_id})`} strokeWidth={2} />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </motion.div>
                                </div>

                                {/* Recent Requests Table */}
                                {stats.recent5.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 }}
                                    className="rounded-xl border border-border overflow-hidden"
                                  >
                                    <div className="px-4 py-3 bg-muted/30 border-b border-border">
                                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        {t.recentRequests}
                                      </h4>
                                    </div>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="text-xs">{t.trackingNumberLabel}</TableHead>
                                          <TableHead className="text-xs">{t.subjectLabel}</TableHead>
                                          <TableHead className="text-xs">{t.stepCategory}</TableHead>
                                          <TableHead className="text-xs">{t.currentStatus}</TableHead>
                                          <TableHead className="text-xs">{t.dateLabel}</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {stats.recent5.map(req => (
                                          <TableRow key={req.id}>
                                            <TableCell className="font-mono text-xs font-bold text-primary">{req.tracking_number}</TableCell>
                                            <TableCell className="text-xs">{req.subject}</TableCell>
                                            <TableCell className="text-xs">{t[`cat_${req.category}`] || req.category}</TableCell>
                                            <TableCell>
                                              <span
                                                className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                                                style={{
                                                  color: STATUS_COLORS[req.status] || 'hsl(var(--muted-foreground))',
                                                  borderColor: `${STATUS_COLORS[req.status] || 'hsl(var(--border))'}40`,
                                                  background: `${STATUS_COLORS[req.status] || 'hsl(var(--muted))'}15`,
                                                }}
                                              >
                                                {t[`status_${req.status}`] || req.status}
                                              </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                              {new Date(req.created_at).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </motion.div>
                                )}
                              </>
                            ) : null}

                            {/* For non-request-handlers with 0 direct requests, show info message */}
                            {!handlesRequests && stats.total === 0 && (dep.teamSize ?? 0) === 0 && (
                              <p className="text-center text-muted-foreground py-4">{t.noActivityYet}</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </AuthenticatedLayout>
  );
};

export default SupervisorDashboard;
