import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, ArrowRight, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import PostFeed from '@/components/PostFeed';

const SupremeFeed = () => {
  const { t, lang, dir } = useI18n();
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  const isSupreme = role && ['admin', 'national_secretary', 'deputy_national_secretary'].includes(role);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
    if (!loading && user && !isSupreme) navigate('/dashboard');
  }, [loading, user, isSupreme, navigate]);

  if (loading || !user || !isSupreme) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <AuthenticatedLayout>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, hsl(225,60%,55%), hsl(225,70%,40%))' }}
            >
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {lang === 'ar' ? 'منشورات القيادة' : 'Publications Direction'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar' ? 'منشورات الحسابات السامية' : 'Publications des comptes suprêmes'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, hsl(217,70%,45%), hsl(217,80%,30%))' }}
          >
            <BackIcon className="w-4 h-4" />
            {t.backToDashboard}
          </button>
        </div>

        {/* Feed */}
        <PostFeed mode="supreme" isAuthor={false} />
      </main>
    </AuthenticatedLayout>
  );
};

export default SupremeFeed;
