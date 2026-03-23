import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { BarChart3, Eye, Users, Megaphone, TrendingUp, CheckCircle, PauseCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ar, fr } from 'date-fns/locale';
import { useState } from 'react';

const GOLD = 'hsl(42,80%,50%)';

const SponsoredPostStats = () => {
  const { lang, dir } = useI18n();
  const { user } = useAuth();
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sponsored-stats'],
    queryFn: async () => {
      const { data: posts } = await supabase
        .from('sponsored_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (!posts) return { posts: [], recipients: [], totalViews: 0, totalRecipients: 0 };

      const postIds = posts.map((p: any) => p.id);
      const { data: recipients } = await supabase
        .from('sponsored_post_recipients')
        .select('*')
        .in('post_id', postIds);

      const recipientsList = recipients || [];
      const totalRecipients = recipientsList.length;
      const totalViews = recipientsList.filter((r: any) => r.is_read).length;

      const postStats = posts.map((p: any) => {
        const postRecipients = recipientsList.filter((r: any) => r.post_id === p.id);
        const postViews = postRecipients.filter((r: any) => r.is_read).length;
        return {
          ...p,
          recipientCount: postRecipients.length,
          viewCount: postViews,
          reachRate: postRecipients.length > 0 ? Math.round((postViews / postRecipients.length) * 100) : 0,
        };
      });

      return {
        posts: postStats,
        totalRecipients,
        totalViews,
        totalActive: posts.filter((p: any) => p.is_active).length,
        totalPaused: posts.filter((p: any) => !p.is_active).length,
        overallReach: totalRecipients > 0 ? Math.round((totalViews / totalRecipients) * 100) : 0,
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-[hsl(42,80%,50%)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data || { posts: [], totalRecipients: 0, totalViews: 0, totalActive: 0, totalPaused: 0, overallReach: 0 };

  const kpis = [
    { label: lang === 'ar' ? 'إجمالي الإعلانات' : 'Total annonces', value: stats.posts.length, icon: Megaphone, color: 'from-[hsl(42,80%,50%)] to-[hsl(42,70%,38%)]' },
    { label: lang === 'ar' ? 'إعلانات نشطة' : 'Annonces actives', value: stats.totalActive, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
    { label: lang === 'ar' ? 'إجمالي المستلمين' : 'Total destinataires', value: stats.totalRecipients, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: lang === 'ar' ? 'إجمالي المشاهدات' : 'Total vues', value: stats.totalViews, icon: Eye, color: 'from-purple-500 to-purple-600' },
    { label: lang === 'ar' ? 'نسبة الوصول' : 'Taux de portée', value: `${stats.overallReach}%`, icon: TrendingUp, color: 'from-[hsl(42,80%,55%)] to-[hsl(42,70%,40%)]' },
  ];

  return (
    <div className="space-y-6" dir={dir}>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-3 shadow-lg`}>
              <kpi.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Per-post breakdown */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[hsl(42,80%,50%)]" />
          <h3 className="font-bold text-foreground">
            {lang === 'ar' ? 'تفاصيل كل إعلان' : 'Détails par annonce'}
          </h3>
        </div>

        {stats.posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {lang === 'ar' ? 'لا توجد إعلانات بعد' : 'Aucune annonce pour le moment'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {stats.posts.map((post: any, idx: number) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <button
                  onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-start"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground truncate">{post.advertiser_name}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        post.is_active
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {post.is_active ? (lang === 'ar' ? 'نشط' : 'Actif') : (lang === 'ar' ? 'متوقف' : 'Inactif')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(post.created_at), 'dd MMM yyyy', { locale: lang === 'ar' ? ar : fr })}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <div className="text-center">
                      <p className="font-bold text-foreground">{post.recipientCount}</p>
                      <p className="text-muted-foreground">{lang === 'ar' ? 'مستلم' : 'Dest.'}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-foreground">{post.viewCount}</p>
                      <p className="text-muted-foreground">{lang === 'ar' ? 'مشاهدة' : 'Vues'}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-[hsl(42,80%,50%)]">{post.reachRate}%</p>
                      <p className="text-muted-foreground">{lang === 'ar' ? 'وصول' : 'Portée'}</p>
                    </div>
                  </div>

                  {expandedPost === post.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {expandedPost === post.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-5 pb-4"
                  >
                    {/* Reach bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{lang === 'ar' ? 'نسبة الاطلاع' : 'Taux de lecture'}</span>
                        <span className="font-bold text-[hsl(42,80%,50%)]">{post.reachRate}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[hsl(42,80%,55%)] to-[hsl(42,70%,40%)] transition-all"
                          style={{ width: `${post.reachRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-lg font-bold text-foreground">{post.recipientCount}</p>
                        <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'مستلمون' : 'Destinataires'}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-lg font-bold text-emerald-600">{post.viewCount}</p>
                        <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'اطلعوا' : 'Ont lu'}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3">
                        <p className="text-lg font-bold text-orange-500">{post.recipientCount - post.viewCount}</p>
                        <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'لم يطلعوا' : 'Non lus'}</p>
                      </div>
                    </div>

                    {post.content && (
                      <p className="text-xs text-muted-foreground mt-3 bg-muted/30 rounded-lg p-3 line-clamp-2">{post.content}</p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsoredPostStats;
