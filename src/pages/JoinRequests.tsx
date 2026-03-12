import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, UserPlus, Clock, Phone, CheckCircle2, XCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { toast } from '@/hooks/use-toast';

interface JoinRequest {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    employee_number: string | null;
    institution: string | null;
    phone: string | null;
  };
}

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  contacted: { icon: Phone, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  accepted: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
};

const JoinRequests = () => {
  const { t, dir, lang } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  const fetchRequests = async () => {
    if (!user) return;
    setLoadingData(true);

    const { data: joinData } = await supabase
      .from('join_requests')
      .select('*')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false });

    if (joinData && joinData.length > 0) {
      const userIds = joinData.map((j: any) => j.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, employee_number, institution, phone')
        .in('user_id', userIds);

      const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));
      setRequests(joinData.map((j: any) => ({
        ...j,
        profile: profileMap.get(j.user_id) || undefined,
      })));
    } else {
      setRequests([]);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('join-requests-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'join_requests', filter: `assigned_to=eq.${user.id}` }, () => {
        fetchRequests();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('join_requests')
      .update({ status: newStatus } as any)
      .eq('id', id);

    if (!error) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast({ title: t.statusChangedSuccess });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statusActions = ['pending', 'contacted', 'accepted', 'rejected'];

  return (
    <AuthenticatedLayout>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back button */}
        <motion.div initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="rounded-full bg-gradient-to-r from-[hsl(207,78%,28%)] to-[hsl(207,78%,38%)] text-white hover:from-[hsl(207,78%,24%)] hover:to-[hsl(207,78%,34%)] hover:text-white px-5 py-2 gap-2 shadow-md"
          >
            {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {t.backToDashboard}
          </Button>
        </motion.div>

        {/* Title */}
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[hsl(195,70%,42%)] to-[hsl(195,70%,55%)] flex items-center justify-center shadow-md">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.joinRequests}</h1>
            <p className="text-sm text-muted-foreground">{t.joinRequestsDesc}</p>
          </div>
        </motion.div>

        {loadingData ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-border bg-card p-12 text-center">
            <UserPlus className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-lg text-muted-foreground">{t.noJoinRequests}</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {requests.map((req, i) => {
                const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                const StatusIcon = sc.icon;
                const dateStr = new Date(req.created_at).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* User info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[hsl(195,70%,42%)] to-[hsl(195,70%,55%)] flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{req.profile?.full_name || '—'}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                            {req.profile?.employee_number && (
                              <span className="font-mono">N°PPR: {req.profile.employee_number}</span>
                            )}
                            {req.profile?.institution && (
                              <span>{req.profile.institution}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{dateStr}</p>
                        </div>
                      </div>

                      {/* Status + actions */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${sc.bg} ${sc.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {t[`joinStatus_${req.status}`] || req.status}
                        </span>

                        {/* Quick action buttons */}
                        <div className="flex gap-1.5">
                          {statusActions.filter(s => s !== req.status).map(s => {
                            const actionConfig = STATUS_CONFIG[s];
                            const ActionIcon = actionConfig.icon;
                            return (
                              <button
                                key={s}
                                onClick={() => updateStatus(req.id, s)}
                                className={`p-2 rounded-lg border transition-colors hover:shadow-sm ${actionConfig.bg} ${actionConfig.color}`}
                                title={t[`joinStatus_${s}`] || s}
                              >
                                <ActionIcon className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </AuthenticatedLayout>
  );
};

export default JoinRequests;
