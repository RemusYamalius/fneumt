import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Send, BarChart3, Newspaper, ArrowRight, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import PostComposer from '@/components/PostComposer';
import PostFeed from '@/components/PostFeed';
import PostStats from '@/components/PostStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CommunicationHub = () => {
  const { t, lang, dir } = useI18n();
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'compose' | 'stats' | 'feed'>('feed');

  const isSupreme = role && ['admin', 'national_secretary', 'deputy_national_secretary'].includes(role);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (isSupreme) setActiveTab('compose');
  }, [isSupreme]);

  if (loading || !user) {
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
              style={{ background: 'linear-gradient(135deg, hsl(225,70%,45%), hsl(225,80%,35%))' }}
            >
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {lang === 'ar' ? 'ركن التواصل' : 'Espace Communication'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar' ? 'النشرة الداخلية للمنصة' : 'Bulletin interne de la plateforme'}
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

        {/* Tabs for supreme accounts */}
        {isSupreme && (
          <div className="flex gap-2 mb-6">
            {[
              { key: 'compose' as const, label: lang === 'ar' ? 'إنشاء منشور' : 'Créer', icon: Send },
              { key: 'stats' as const, label: lang === 'ar' ? 'إحصائيات' : 'Statistiques', icon: BarChart3 },
              { key: 'feed' as const, label: lang === 'ar' ? 'المنشورات' : 'Publications', icon: MessageSquare },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'text-white shadow-lg'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-[hsl(225,70%,45%)]/30'
                }`}
                style={activeTab === tab.key ? { background: 'linear-gradient(135deg, hsl(225,70%,45%), hsl(225,80%,35%))' } : undefined}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isSupreme && activeTab === 'compose' && (
            <PostComposer onPostCreated={() => setActiveTab('stats')} />
          )}
          {isSupreme && activeTab === 'stats' && (
            <PostStats />
          )}
          {activeTab === 'supreme_feed' && isSupreme && (
            <PostFeed mode="supreme" isAuthor={false} />
          )}
          {(activeTab === 'feed' || !isSupreme) && (
            <PostFeed isAuthor={isSupreme || false} />
          )}
        </motion.div>
      </main>
    </AuthenticatedLayout>
  );
};

export default CommunicationHub;
