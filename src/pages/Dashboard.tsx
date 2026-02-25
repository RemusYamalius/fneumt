import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FilePlus, Search, User, LogOut, Bell, Globe, Shield } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import logoFne from '@/assets/logo-fne.png';

const Dashboard = () => {
  const { t, toggleLang, dir } = useI18n();
  const { user, profile, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const roleLabel = role === 'admin' ? t.roleAdmin : role === 'union_officer' ? t.roleOfficer : t.roleTeacher;

  const actions = [
    { icon: FilePlus, title: t.newRequest, desc: t.newRequestDesc, to: '/new-request', gradient: 'from-primary to-accent' },
    { icon: Search, title: t.trackFiles, desc: t.trackFilesDesc, to: '/track', gradient: 'from-accent to-primary' },
    { icon: User, title: t.profile, desc: '', to: '/profile', gradient: 'from-secondary to-primary' },
    ...(role === 'admin' ? [{ icon: Shield, title: t.userManagement, desc: t.userManagementDesc, to: '/admin/users', gradient: 'from-primary to-secondary' }] : []),
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
          {actions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group relative overflow-hidden rounded-2xl bg-card border border-border p-8 text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-colors duration-300">
                  <action.icon className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">{action.title}</h2>
                {action.desc && <p className="text-sm text-muted-foreground">{action.desc}</p>}
              </div>
            </Link>
          ))}
        </div>

        {/* My Requests */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">{t.myRequests}</h2>
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <p className="text-muted-foreground">{t.noRequests}</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
