import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FilePlus, Search, User, LogOut, Bell, Globe, Shield, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import logoFne from '@/assets/logo-fne.png';

const Dashboard = () => {
  const { t, toggleLang, dir, lang } = useI18n();
  const { user, profile, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useRealtimeNotifications(user?.id);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  const isLocalCoordinator = role && [
    'local_coordinator', 'deputy_local_primary', 'deputy_local_middle', 'deputy_local_high',
  ].includes(role);

  useEffect(() => {
    if (!user || !isLocalCoordinator) return;
    supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', user.id)
      .eq('status', 'submitted')
      .then(({ count }) => setPendingCount(count || 0));
  }, [user, isLocalCoordinator]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const roleLabel = role ? (t[`role_${role}`] || t.roleTeacher) : t.roleTeacher;

  const showUserManagement = role && [
    'admin', 'regional_supervisor', 'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high',
    'provincial_manager', 'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high',
    'local_coordinator',
  ].includes(role);

  const actions = [
    { icon: FilePlus, title: t.newRequest, desc: t.newRequestDesc, to: '/new-request', gradient: 'from-primary to-accent' },
    { icon: Search, title: t.trackFiles, desc: t.trackFilesDesc, to: '/track', gradient: 'from-accent to-primary' },
    { icon: User, title: t.profile, desc: '', to: '/profile', gradient: 'from-secondary to-primary' },
    ...(isLocalCoordinator ? [{ icon: Inbox, title: t.incomingRequests, desc: t.incomingRequestsDesc, to: '/incoming-requests', gradient: 'from-accent to-secondary', badge: pendingCount }] : []),
    ...(showUserManagement ? [{ icon: Shield, title: t.userManagement, desc: t.userManagementDesc, to: '/admin/users', gradient: 'from-primary to-secondary' }] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Top Bar */}
      <header className="gradient-primary text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoFne} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
            <div>
              <p className="font-bold text-sm">{t.platformName}</p>
              <p className="text-xs text-white/70">{roleLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleLang} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Globe className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button onClick={handleSignOut} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Welcome */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">
          {t.welcome}، {profile?.full_name || user.email}
        </h1>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10" style={{ direction: 'ltr' }}>
          {actions.map((action, index) => (
            <motion.div
              key={action.to}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15, ease: 'easeOut' }}
            >
            <Link
              to={action.to}
              className="card-premium group relative p-8 text-center transition-all duration-300 block"
            >
              <div className="relative z-10">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-colors duration-300">
                    <action.icon className="w-7 h-7 text-primary" />
                  </div>
                  {(action as any).badge > 0 && (
                    <span className={`absolute top-0 ${dir === 'rtl' ? 'right-0 sm:right-4' : 'left-0 sm:left-4'} w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse`}>
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

        {/* My Requests */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">{t.myRequests}</h2>
          <div className="card-premium p-8 text-center">
            <p className="text-muted-foreground">{t.noRequests}</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
