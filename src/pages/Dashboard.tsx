import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FilePlus, Search, User, LogOut, Bell, Globe, Shield, Inbox, BarChart3, ChevronDown, Briefcase, UserCircle, UserCheck, Clock, Eye, Loader2, CheckCircle2, XCircle, FileText, Copy, ArrowUpDown, Filter } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar, fr } from 'date-fns/locale';
import AnimatedLogo from '@/components/AnimatedLogo';
import VerifiedBadge, { getBadgeStatus } from '@/components/VerifiedBadge';

/* ─── Sub-bar with shimmer ─── */
const SubBarShimmer = ({ roleLabel, dir }: { roleLabel: string; dir: 'rtl' | 'ltr' }) => {
  return (
    <div className="subbar-shimmer-wrap bg-white/10 border-t border-white/10 relative overflow-hidden">
      <div
        className="subbar-shimmer-beam"
        style={{ animationDirection: dir === 'rtl' ? 'reverse' : 'normal' }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-1.5">
        <p className="text-sm font-semibold text-white/90 text-center truncate">
          {roleLabel}
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { t, toggleLang, dir, lang } = useI18n();
  const { user, profile, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useRealtimeNotifications(user?.id);
  const [pendingCount, setPendingCount] = useState(0);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<'personal' | 'professional' | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  const showIncomingRequests = role && [
    'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high',
    'local_coordinator',
  ].includes(role);

  useEffect(() => {
    if (!user || !showIncomingRequests) return;
    supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', user.id)
      .eq('status', 'submitted')
      .then(({ count }) => setPendingCount(count || 0));
  }, [user, showIncomingRequests]);

  // Fetch user's own requests
  useEffect(() => {
    if (!user) return;
    setLoadingRequests(true);
    supabase
      .from('requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMyRequests(data || []);
        setLoadingRequests(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (!role || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getRoleLabel = () => {
    const base = role ? (t[`role_${role}`] || t.roleTeacher) : t.roleTeacher;
    if (!role || !profile) return base;
    const isRegional = ['regional_supervisor', 'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high'].includes(role);
    const isSubRegional = ['provincial_manager', 'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high', 'local_coordinator', 'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high'].includes(role);
    if (isRegional && profile.academy) return `${base} — ${profile.academy}`;
    if (isSubRegional && profile.academy && profile.directorate) return `${base} — ${profile.academy} / ${profile.directorate}`;
    if (isSubRegional && profile.academy) return `${base} — ${profile.academy}`;
    return base;
  };
  const roleLabel = getRoleLabel();

  const isLocalCoordinator = role === 'local_coordinator';

  const isDeputyLocal = role && ['deputy_local_primary', 'deputy_local_middle', 'deputy_local_high'].includes(role);

  const isPromoterRole = role && [
    'admin', 'regional_supervisor', 'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high',
    'provincial_manager', 'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high',
    'local_coordinator', 'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high',
  ].includes(role);

  const badgeStatus = getBadgeStatus(role, profile?.is_member ?? false, profile?.membership_verified ?? false);

  const showUserManagement = role && [
    'admin', 'regional_supervisor', 'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high',
    'provincial_manager', 'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high',
    'local_coordinator',
  ].includes(role);

  const showSupervisorDashboard = role && [
    'admin', 'regional_supervisor', 'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high',
    'provincial_manager', 'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high',
  ].includes(role);

  // Card color palette - harmonious with primary/accent
  const cardColors = {
    newRequest: 'from-[hsl(207,62%,40%)] to-[hsl(207,62%,55%)]',
    trackFiles: 'from-[hsl(120,61%,34%)] to-[hsl(120,61%,45%)]',
    profile: 'from-[hsl(207,75%,17%)] to-[hsl(207,75%,30%)]',
    incomingRequests: 'from-[hsl(30,90%,50%)] to-[hsl(30,90%,60%)]',
    supervisorDashboard: 'from-[hsl(260,60%,50%)] to-[hsl(260,60%,62%)]',
    userManagement: 'from-[hsl(340,65%,47%)] to-[hsl(340,65%,58%)]',
  };

  const personalCards = [
    { icon: FilePlus, title: t.newRequest, desc: t.newRequestDesc, to: '/new-request', color: cardColors.newRequest },
    { icon: Search, title: t.trackFiles, desc: t.trackFilesDesc, to: '/track', color: cardColors.trackFiles },
    { icon: User, title: t.profile, desc: '', to: '/profile', color: cardColors.profile },
  ];

  const professionalCards = [
    ...(showIncomingRequests ? [{ icon: Inbox, title: t.incomingRequests, desc: t.incomingRequestsDesc, to: '/incoming-requests', color: cardColors.incomingRequests, badge: pendingCount }] : []),
    ...(isDeputyLocal ? [{ icon: UserCheck, title: t.membershipVerification || 'التحقق من الانخراط', desc: t.membershipVerificationDesc || '', to: '/membership-verification', color: 'from-[hsl(160,60%,38%)] to-[hsl(160,60%,50%)]', badge: 0 }] : []),
    ...(showSupervisorDashboard ? [{ icon: BarChart3, title: t.supervisorDashboard, desc: t.supervisorDashboardDesc, to: '/supervisor', color: cardColors.supervisorDashboard }] : []),
    ...(showUserManagement ? [{ icon: Shield, title: t.userManagement, desc: t.userManagementDesc, to: '/admin/users', color: cardColors.userManagement }] : []),
  ];

  // Simple layout for regular users (teacher/union_officer)
  const allCards = [
    ...personalCards,
    ...(showIncomingRequests ? [{ icon: Inbox, title: t.incomingRequests, desc: t.incomingRequestsDesc, to: '/incoming-requests', color: cardColors.incomingRequests, badge: pendingCount }] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleGroup = (group: 'personal' | 'professional') => {
    setExpandedGroup(prev => prev === group ? null : group);
  };

  const renderCard = (action: any, index: number) => (
    <motion.div
      key={action.to}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
    >
      <Link
        to={action.to}
        className="group relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-300 block shadow-lg hover:shadow-xl hover:-translate-y-1"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-10 group-hover:opacity-15 transition-opacity duration-300`} />
        <div className="relative z-10">
          <div className="relative inline-block">
            <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            {(action as any).badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                {(action as any).badge > 99 ? '99+' : (action as any).badge}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">{action.title}</h2>
          {action.desc && <p className="text-xs text-muted-foreground">{action.desc}</p>}
        </div>
      </Link>
    </motion.div>
  );

  const renderGroupCard = (
    group: 'personal' | 'professional',
    icon: typeof UserCircle,
    title: string,
    cards: any[],
    gradientClass: string,
  ) => {
    const Icon = icon;
    const isExpanded = expandedGroup === group;
    const totalBadge = cards.reduce((sum, c) => sum + ((c as any).badge || 0), 0);

    return (
      <motion.div
        layout
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => toggleGroup(group)}
          className={`w-full group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl ${isExpanded ? 'ring-2 ring-primary/30' : ''}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-10 group-hover:opacity-15 transition-opacity`} />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-md`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div className="text-start">
                <h2 className="text-xl font-bold text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground">{cards.length} {lang === 'ar' ? 'عناصر' : 'éléments'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {totalBadge > 0 && (
                <span className="w-6 h-6 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  {totalBadge > 99 ? '99+' : totalBadge}
                </span>
              )}
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronDown className="w-6 h-6 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 px-1">
                {cards.map((card, i) => renderCard(card, i))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Top Bar */}
      <header className="gradient-primary text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
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
                  <p>{t[`badge_${badgeStatus}`]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <button onClick={toggleLang} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Globe className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors relative">
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </button>
            <button onClick={handleSignOut} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Sub-bar: role & scope */}
        <SubBarShimmer roleLabel={roleLabel} dir={dir} />
      </header>

      {/* Welcome */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <motion.h1
          className="text-2xl font-bold text-foreground mb-8"
          initial={{ opacity: 0, x: dir === 'rtl' ? 30 : -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {t.welcome}، {profile?.full_name || user.email}
        </motion.h1>

        {/* Grouped layout for promoter roles */}
        {isPromoterRole ? (
          <div className="space-y-5 mb-10">
            {renderGroupCard('personal', UserCircle, t.personalSection, personalCards, 'from-[hsl(207,62%,40%)] to-[hsl(120,61%,34%)]')}
            {professionalCards.length > 0 && renderGroupCard('professional', Briefcase, t.professionalSection, professionalCards, 'from-[hsl(260,60%,50%)] to-[hsl(340,65%,47%)]')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10" style={{ direction: 'ltr' }}>
            {allCards.map((action, index) => (
              <motion.div
                key={action.to}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15, ease: 'easeOut' }}
              >
                <Link
                  to={action.to}
                  className="group relative overflow-hidden rounded-2xl p-8 text-center transition-all duration-300 block shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-10 group-hover:opacity-15 transition-opacity duration-300`} />
                  <div className="relative z-10">
                    <div className="relative inline-block">
                      <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md`}>
                        <action.icon className="w-7 h-7 text-white" />
                      </div>
                      {(action as any).badge > 0 && (
                        <span className={`absolute -top-1 ${dir === 'rtl' ? '-right-1' : '-left-1'} w-6 h-6 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse`}>
                          {(action as any).badge > 99 ? '99+' : (action as any).badge}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">{action.title}</h2>
                    {action.desc && <p className="text-sm text-muted-foreground">{action.desc}</p>}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* My Requests */}
        <RequestsSection
          t={t}
          lang={lang}
          loadingRequests={loadingRequests}
          myRequests={myRequests}
          dir={dir}
        />
      </main>
    </div>
  );
};

/* ───── Extracted Requests Section with Filters ───── */
interface RequestsSectionProps {
  t: Record<string, string>;
  lang: string;
  loadingRequests: boolean;
  myRequests: any[];
  dir: string;
}

const RequestsSection = ({ t, lang, loadingRequests, myRequests, dir }: RequestsSectionProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const filteredRequests = useMemo(() => {
    let result = myRequests;
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }
    return [...result].sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
  }, [myRequests, statusFilter, sortOrder]);

  const statusFilters = [
    { key: 'all', label: t.filterAll },
    { key: 'submitted', label: t.status_submitted, color: 'bg-amber-500' },
    { key: 'viewed', label: t.status_viewed, color: 'bg-blue-500' },
    { key: 'in_progress', label: t.status_in_progress, color: 'bg-orange-500' },
    { key: 'accepted', label: t.status_accepted, color: 'bg-emerald-500' },
    { key: 'cancelled', label: t.status_cancelled, color: 'bg-destructive' },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-foreground">{t.myRequests}</h2>
        <button
          onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/30 transition-all"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortOrder === 'newest' ? (lang === 'ar' ? 'الأحدث' : 'Plus récent') : (lang === 'ar' ? 'الأقدم' : 'Plus ancien')}
        </button>
      </div>

      {/* Status filter chips */}
      {myRequests.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {statusFilters.map(sf => (
            <button
              key={sf.key}
              onClick={() => setStatusFilter(sf.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-200 ${
                statusFilter === sf.key
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {sf.color && <span className={`w-2 h-2 rounded-full ${sf.color}`} />}
              {sf.label}
            </button>
          ))}
        </div>
      )}

      {loadingRequests ? (
        <div className="card-premium p-8 flex items-center justify-center">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : myRequests.length === 0 ? (
        <div className="card-premium p-8 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">{t.noRequests}</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card-premium p-6 text-center">
          <Filter className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'لا توجد طلبات بهذه الحالة' : 'Aucune demande avec ce statut'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req, i) => {
            const statusConfig: Record<string, { icon: typeof Clock; color: string }> = {
              submitted: { icon: Clock, color: 'text-amber-500' },
              viewed: { icon: Eye, color: 'text-blue-500' },
              in_progress: { icon: Loader2, color: 'text-orange-500' },
              accepted: { icon: CheckCircle2, color: 'text-emerald-500' },
              cancelled: { icon: XCircle, color: 'text-destructive' },
            };
            const sc = statusConfig[req.status] || statusConfig.submitted;
            const StatusIcon = sc.icon;
            const categoryLabel = t[`cat_${req.category}`] || req.category;
            const statusLabel = t[`status_${req.status}`] || req.status;
            const dateStr = format(new Date(req.created_at), 'dd MMM yyyy', { locale: lang === 'ar' ? ar : fr });

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link
                  to={`/track?q=${req.tracking_number}`}
                  className="group block rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/20 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-mono text-sm font-bold text-primary tracking-wide">{req.tracking_number}</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigator.clipboard.writeText(req.tracking_number);
                          }}
                          className="p-0.5 rounded hover:bg-muted transition-colors"
                          title={t.trackingNumberLabel}
                        >
                          <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                        </button>
                        <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                          {categoryLabel}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{req.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t.dateLabel}: {dateStr}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <StatusIcon className={`w-5 h-5 ${sc.color} ${req.status === 'in_progress' ? 'animate-spin' : ''}`} />
                      <span className={`text-[10px] font-semibold ${sc.color}`}>{statusLabel}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default Dashboard;
