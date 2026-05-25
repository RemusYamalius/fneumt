import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldAlert, AlertTriangle, Info, AlertCircle, Volume2, VolumeX, BellRing } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { toast } from 'sonner';

type Severity = 'info' | 'warning' | 'critical';

interface AuditLog {
  id: string;
  user_id: string | null;
  event_type: string;
  severity: Severity;
  metadata: any;
  created_at: string;
}

const EVENT_TYPES = [
  'login_failed', 'login_success', 'logout',
  'account_deletion_requested', 'rate_limit_exceeded',
  'role_changed', 'password_changed', 'password_reset_requested',
  'unauthorized_access', 'signup_success', 'signup_failed',
];

const SecurityLog = () => {
  const { t, dir } = useI18n();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('security_sound_enabled') !== 'false';
  });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isInitialLoadRef = useRef(true);

  const playCriticalAlert = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      // Three urgent beeps descending — distinct from notification sound
      [0, 0.18, 0.36].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.value = 1200 - i * 200;
        const start = ctx.currentTime + delay;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
        osc.start(start);
        osc.stop(start + 0.16);
      });
      if (navigator.vibrate) navigator.vibrate([200, 80, 200, 80, 200]);
    } catch {}
  }, [soundEnabled]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('security_sound_enabled', String(next));
    if (next) {
      // Unlock audio context on user gesture
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        audioCtxRef.current.resume();
      } catch {}
    }
  };

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from('security_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (data) setLogs(data as AuditLog[]);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchLogs();
      setLoading(false);
      isInitialLoadRef.current = false;
    })();

    // Realtime subscription for new audit log entries
    const channel = supabase
      .channel('security-audit-log-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_audit_log' },
        (payload) => {
          const newLog = payload.new as AuditLog;
          setLogs((prev) => [newLog, ...prev].slice(0, 500));
          if (newLog.severity === 'critical') {
            playCriticalAlert();
            toast.error(
              dir === 'rtl' ? '🚨 حدث أمني حرج' : '🚨 Évènement critique',
              {
                description: t[`event_${newLog.event_type}`] || newLog.event_type,
                duration: 8000,
              },
            );
          } else if (newLog.severity === 'warning') {
            toast.warning(
              dir === 'rtl' ? '⚠️ تحذير أمني' : '⚠️ Avertissement',
              {
                description: t[`event_${newLog.event_type}`] || newLog.event_type,
                duration: 5000,
              },
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs, playCriticalAlert, dir, t]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (filterEvent !== 'all' && l.event_type !== filterEvent) return false;
      if (filterSeverity !== 'all' && l.severity !== filterSeverity) return false;
      return true;
    });
  }, [logs, filterEvent, filterSeverity]);

  const stats = useMemo(() => {
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    const recent = logs.filter(l => new Date(l.created_at).getTime() > last24h);
    return {
      total: logs.length,
      critical: logs.filter(l => l.severity === 'critical').length,
      failedLogins24h: recent.filter(l => l.event_type === 'login_failed').length,
      rateLimits24h: recent.filter(l => l.event_type === 'rate_limit_exceeded').length,
    };
  }, [logs]);

  const getSeverityBadge = (sev: Severity) => {
    const map: Record<Severity, { color: string; icon: typeof Info }> = {
      info: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Info },
      warning: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
      critical: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
    };
    const { color, icon: Icon } = map[sev];
    return (
      <Badge className={`${color} border gap-1`}>
        <Icon className="w-3 h-3" />
        {t[`severity_${sev}`] || sev}
      </Badge>
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(dir === 'rtl' ? 'ar-MA' : 'fr-MA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  return (
    <AuthenticatedLayout>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="rounded-full bg-gradient-to-r from-[hsl(207,78%,28%)] to-[hsl(207,78%,38%)] text-white hover:from-[hsl(207,78%,24%)] hover:to-[hsl(207,78%,34%)] hover:text-white px-5 py-2 gap-2 shadow-md"
          >
            {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {dir === 'rtl' ? 'العودة للوحة التحكم' : 'Retour'}
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6 bg-gradient-to-br from-red-50 to-orange-50/40 p-5 rounded-2xl border border-red-100/40">
          <ShieldAlert className="w-8 h-8 text-red-600" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{t.securityLogTitle || 'سجل الأحداث الأمنية'}</h1>
            <p className="text-sm text-muted-foreground">{t.securityLogSubtitle || 'مراقبة الأحداث الأمنية الحساسة'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {dir === 'rtl' ? 'مباشر' : 'Live'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSound}
              className="gap-2"
              title={soundEnabled ? (dir === 'rtl' ? 'كتم الصوت' : 'Couper le son') : (dir === 'rtl' ? 'تفعيل الصوت' : 'Activer le son')}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
              <BellRing className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground">{t.securityStatTotal || 'إجمالي الأحداث'}</div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="text-xs text-red-700">{t.securityStatCritical || 'أحداث حرجة'}</div>
            <div className="text-2xl font-bold mt-1 text-red-700">{stats.critical}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="text-xs text-amber-700">{t.securityStatFailedLogins || 'دخول فاشل (24س)'}</div>
            <div className="text-2xl font-bold mt-1 text-amber-700">{stats.failedLogins24h}</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="text-xs text-orange-700">{t.securityStatRateLimit || 'تجاوز الحدود (24س)'}</div>
            <div className="text-2xl font-bold mt-1 text-orange-700">{stats.rateLimits24h}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={filterEvent} onValueChange={setFilterEvent}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allEvents || 'جميع الأحداث'}</SelectItem>
              {EVENT_TYPES.map(ev => (
                <SelectItem key={ev} value={ev}>{t[`event_${ev}`] || ev}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allSeverities || 'جميع المستويات'}</SelectItem>
              <SelectItem value="info">{t.severity_info || 'معلومات'}</SelectItem>
              <SelectItem value="warning">{t.severity_warning || 'تحذير'}</SelectItem>
              <SelectItem value="critical">{t.severity_critical || 'حرج'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card border rounded-xl overflow-hidden">
          <Table dir={dir}>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{t.eventDate || 'التاريخ'}</TableHead>
                <TableHead className="text-right">{t.eventType || 'نوع الحدث'}</TableHead>
                <TableHead className="text-right">{t.eventSeverity || 'الخطورة'}</TableHead>
                <TableHead className="text-right">{t.eventUser || 'المستخدم'}</TableHead>
                <TableHead className="text-right">{t.eventDetails || 'التفاصيل'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t.loading || '...'}</TableCell></TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t.noLogs || 'لا توجد سجلات'}</TableCell></TableRow>
              ) : filteredLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs whitespace-nowrap text-right">{formatDate(log.created_at)}</TableCell>
                  <TableCell className="font-medium text-sm text-right">{t[`event_${log.event_type}`] || log.event_type}</TableCell>
                  <TableCell className="text-right">{getSeverityBadge(log.severity)}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground text-right">
                    {log.user_id ? log.user_id.slice(0, 8) : (log.metadata?.email || '—')}
                  </TableCell>
                  <TableCell className="text-xs max-w-md text-right">
                    <code className="text-xs bg-muted px-2 py-1 rounded block overflow-hidden text-ellipsis whitespace-nowrap">
                      {JSON.stringify(log.metadata || {})}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </AuthenticatedLayout>
  );
};

export default SecurityLog;
