import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import logoFne from '@/assets/logo-fne.png';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Deputy {
  user_id: string;
  full_name: string | null;
  role: string;
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

const STATUS_COLORS: Record<string, string> = {
  submitted: '#f59e0b',
  viewed: '#3b82f6',
  in_progress: '#8b5cf6',
  accepted: '#10b981',
  cancelled: '#ef4444',
};

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const SupervisorDashboard = () => {
  const { t, dir, lang } = useI18n();
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [deputies, setDeputies] = useState<Deputy[]>([]);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [selectedDeputy, setSelectedDeputy] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);

    // Fetch deputies promoted by this user
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role, promoted_by')
      .eq('promoted_by', user.id);

    const deputyIds = (rolesData || []).map(r => r.user_id);

    if (deputyIds.length > 0) {
      const [profilesRes, requestsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').in('user_id', deputyIds),
        supabase.from('requests').select('id, tracking_number, category, status, created_at, subject, assigned_to').in('assigned_to', deputyIds).order('created_at', { ascending: false }),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p.full_name]));
      setDeputies((rolesData || []).map(r => ({
        user_id: r.user_id,
        full_name: profileMap.get(r.user_id) || null,
        role: r.role,
      })));
      setRequests(requestsRes.data || []);
    } else {
      setDeputies([]);
      setRequests([]);
    }
    setLoadingData(false);
  };

  const deputyRequests = useMemo(() => {
    if (!selectedDeputy) return requests;
    return requests.filter(r => r.assigned_to === selectedDeputy);
  }, [requests, selectedDeputy]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    deputyRequests.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: t[`status_${status}`] || status,
      value: count,
      status,
    }));
  }, [deputyRequests, t]);

  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    deputyRequests.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return Object.entries(counts).map(([cat, count]) => ({
      name: t[`cat_${cat}`] || cat,
      value: count,
    }));
  }, [deputyRequests, t]);

  const getRoleLabel = (role: string) => t[`role_${role}`] || role;

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="gradient-primary text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoFne} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
            <div>
              <p className="font-bold text-sm">{t.supervisorDashboard}</p>
              <p className="text-xs text-white/70">{t.platformName}</p>
            </div>
          </div>
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
            {t.backToDashboard}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.supervisorDashboard}</h1>
            <p className="text-sm text-muted-foreground">{t.supervisorDashboardDesc}</p>
          </div>
        </div>

        {loadingData ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : deputies.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg text-muted-foreground">{t.noDeputies}</p>
          </div>
        ) : (
          <>
            {/* Deputy cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <div
                onClick={() => setSelectedDeputy(null)}
                className={`card-premium p-4 cursor-pointer transition-all ${!selectedDeputy ? 'ring-2 ring-primary' : ''}`}
              >
                <p className="font-bold text-foreground">{lang === 'ar' ? 'جميع النواب' : 'Tous les adjoints'}</p>
                <p className="text-sm text-muted-foreground">{t.totalRequests}: {requests.length}</p>
              </div>
              {deputies.map(dep => {
                const count = requests.filter(r => r.assigned_to === dep.user_id).length;
                return (
                  <div
                    key={dep.user_id}
                    onClick={() => setSelectedDeputy(dep.user_id)}
                    className={`card-premium p-4 cursor-pointer transition-all ${selectedDeputy === dep.user_id ? 'ring-2 ring-primary' : ''}`}
                  >
                    <p className="font-bold text-foreground">{dep.full_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{getRoleLabel(dep.role)}</p>
                    <p className="text-sm text-primary font-semibold mt-1">{count} {lang === 'ar' ? 'طلب' : 'demande(s)'}</p>
                  </div>
                );
              })}
            </div>

            {/* Charts */}
            {deputyRequests.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Bar chart - by status */}
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      {t.requestsByStatus}
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={statusChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {statusChartData.map((entry, i) => (
                            <Cell key={i} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pie chart - by category */}
                  <div className="card-premium p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <PieIcon className="w-5 h-5 text-primary" />
                      {t.requestsByCategory}
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {categoryChartData.map((_, i) => (
                            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Files table */}
                <div className="card-premium overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground">{t.filesTable}</h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.trackingNumberLabel}</TableHead>
                        <TableHead>{t.subjectLabel}</TableHead>
                        <TableHead>{t.stepCategory}</TableHead>
                        <TableHead>{t.currentStatus}</TableHead>
                        <TableHead>{t.dateLabel}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deputyRequests.map(req => (
                        <TableRow key={req.id}>
                          <TableCell className="font-mono text-sm font-bold text-primary">{req.tracking_number}</TableCell>
                          <TableCell>{req.subject}</TableCell>
                          <TableCell className="text-xs">{t[`cat_${req.category}`] || req.category}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              req.status === 'submitted' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              req.status === 'received' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              req.status === 'processing' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                              req.status === 'resolved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                              req.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {t[`status_${req.status}`] || req.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">{new Date(req.created_at).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="card-premium p-8 text-center">
                <p className="text-muted-foreground">{t.noRequests}</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SupervisorDashboard;
