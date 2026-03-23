import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Megaphone, Send, BarChart3, ArrowRight, ArrowLeft, Loader2, Trash2, Eye, EyeOff, PieChart } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import SponsoredPostComposer from '@/components/SponsoredPostComposer';
import SponsoredPostCard from '@/components/SponsoredPostCard';
import SponsoredPostStats from '@/components/SponsoredPostStats';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

const SponsoredHub = () => {
  const { lang, dir } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'compose' | 'manage' | 'stats'>('compose');

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['sponsored-posts'],
    queryFn: async () => {
      const { data: postsData } = await supabase
        .from('sponsored_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (!postsData) return [];

      const postIds = postsData.map(p => (p as any).id);
      const { data: attachments } = await supabase
        .from('sponsored_post_attachments')
        .select('*')
        .in('post_id', postIds);

      const attachMap = new Map<string, any[]>();
      (attachments || []).forEach((a: any) => {
        if (!attachMap.has(a.post_id)) attachMap.set(a.post_id, []);
        attachMap.get(a.post_id)!.push(a);
      });

      return postsData.map((p: any) => ({
        ...p,
        attachments: attachMap.get(p.id) || [],
      }));
    },
    enabled: !!user,
  });

  const toggleActive = async (postId: string, isActive: boolean) => {
    await supabase.from('sponsored_posts').update({ is_active: !isActive } as any).eq('id', postId);
    queryClient.invalidateQueries({ queryKey: ['sponsored-posts'] });
    toast({ title: !isActive ? (lang === 'ar' ? 'تم تفعيل الإعلان' : 'Annonce activée') : (lang === 'ar' ? 'تم إيقاف الإعلان' : 'Annonce désactivée') });
  };

  const deletePost = async (postId: string) => {
    await supabase.from('sponsored_post_attachments').delete().eq('post_id', postId);
    await supabase.from('sponsored_posts').delete().eq('id', postId);
    queryClient.invalidateQueries({ queryKey: ['sponsored-posts'] });
    toast({ title: lang === 'ar' ? 'تم حذف الإعلان' : 'Annonce supprimée' });
  };

  return (
    <AuthenticatedLayout>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, hsl(42,80%,50%), hsl(42,70%,38%))' }}>
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {lang === 'ar' ? 'ركن المعلنين' : 'Espace Annonceurs'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar' ? 'إدارة الإعلانات الممولة' : 'Gestion des annonces sponsorisées'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, hsl(42,80%,50%), hsl(42,70%,38%))' }}
          >
            <BackIcon className="w-4 h-4" />
            {lang === 'ar' ? 'العودة' : 'Retour'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'compose' as const, label: lang === 'ar' ? 'إعلان جديد' : 'Nouvelle annonce', icon: Send },
            { key: 'manage' as const, label: lang === 'ar' ? 'إدارة الإعلانات' : 'Gérer les annonces', icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'text-white shadow-lg'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
              style={activeTab === tab.key ? { background: 'linear-gradient(135deg, hsl(42,80%,50%), hsl(42,70%,38%))' } : undefined}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeTab === 'compose' && (
            <SponsoredPostComposer onPostCreated={() => {
              setActiveTab('manage');
              queryClient.invalidateQueries({ queryKey: ['sponsored-posts'] });
            }} />
          )}

          {activeTab === 'manage' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-[hsl(42,80%,50%)]" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16">
                  <Megaphone className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">{lang === 'ar' ? 'لا توجد إعلانات' : 'Aucune annonce'}</p>
                </div>
              ) : (
                posts.map((post: any) => (
                  <div key={post.id} className="space-y-2">
                    <SponsoredPostCard post={post} />
                    <div className="flex items-center gap-2 px-2">
                      <button
                        onClick={() => toggleActive(post.id, post.is_active)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          post.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {post.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {post.is_active ? (lang === 'ar' ? 'نشط' : 'Actif') : (lang === 'ar' ? 'متوقف' : 'Inactif')}
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {lang === 'ar' ? 'حذف' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </main>
    </AuthenticatedLayout>
  );
};

export default SponsoredHub;
