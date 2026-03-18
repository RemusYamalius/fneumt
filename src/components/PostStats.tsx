import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Eye, Heart, Users, Clock, Trash2, Edit3, X, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar, fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PostStat {
  id: string;
  content: string;
  created_at: string;
  recipient_count: number;
  read_count: number;
  like_count: number;
}

interface PostDetail {
  readers: { name: string; read_at: string | null }[];
  likers: { name: string }[];
  filters: Record<string, string>;
}

const PostStats = () => {
  const { lang, dir } = useI18n();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (!postsData) { setLoading(false); return; }

    const postIds = postsData.map(p => p.id);
    if (postIds.length === 0) { setPosts([]); setLoading(false); return; }

    const [recipientRes, likesRes] = await Promise.all([
      supabase.from('post_recipients').select('post_id, is_read').in('post_id', postIds),
      supabase.from('post_likes').select('post_id').in('post_id', postIds),
    ]);

    const recipientMap = new Map<string, { total: number; read: number }>();
    (recipientRes.data || []).forEach(r => {
      const cur = recipientMap.get(r.post_id) || { total: 0, read: 0 };
      cur.total++;
      if (r.is_read) cur.read++;
      recipientMap.set(r.post_id, cur);
    });

    const likeMap = new Map<string, number>();
    (likesRes.data || []).forEach(l => likeMap.set(l.post_id, (likeMap.get(l.post_id) || 0) + 1));

    setPosts(postsData.map(p => ({
      id: p.id,
      content: p.content || '',
      created_at: p.created_at,
      recipient_count: recipientMap.get(p.id)?.total || 0,
      read_count: recipientMap.get(p.id)?.read || 0,
      like_count: likeMap.get(p.id) || 0,
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const openDetail = async (postId: string) => {
    setSelectedPost(postId);
    setLoadingDetail(true);
    setEditMode(false);

    const post = posts.find(p => p.id === postId);
    if (post) setEditContent(post.content);

    // Fetch readers
    const { data: recipients } = await supabase
      .from('post_recipients')
      .select('user_id, is_read, read_at')
      .eq('post_id', postId);

    // Fetch likers
    const { data: likes } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('post_id', postId);

    const allUserIds = [...new Set([
      ...(recipients || []).map(r => r.user_id),
      ...(likes || []).map(l => l.user_id),
    ])];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', allUserIds);

    const nameMap = new Map<string, string>();
    (profiles || []).forEach(p => nameMap.set(p.user_id, p.full_name || ''));

    // Fetch post filters
    const { data: postData } = await supabase
      .from('posts')
      .select('filters')
      .eq('id', postId)
      .single();

    setDetail({
      readers: (recipients || [])
        .filter(r => r.is_read)
        .map(r => ({ name: nameMap.get(r.user_id) || '', read_at: r.read_at })),
      likers: (likes || []).map(l => ({ name: nameMap.get(l.user_id) || '' })),
      filters: (postData?.filters as Record<string, string>) || {},
    });
    setLoadingDetail(false);
  };

  const handleUpdate = async () => {
    if (!selectedPost) return;
    setSaving(true);
    await supabase.from('posts').update({ content: editContent } as any).eq('id', selectedPost);
    setPosts(prev => prev.map(p => p.id === selectedPost ? { ...p, content: editContent } : p));
    setEditMode(false);
    setSaving(false);
    toast({ title: lang === 'ar' ? 'تم تحديث المنشور' : 'Publication mise à jour' });
  };

  const handleDelete = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    setSelectedPost(null);
    toast({ title: lang === 'ar' ? 'تم حذف المنشور' : 'Publication supprimée' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(225,70%,45%)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: BarChart3, label: lang === 'ar' ? 'المنشورات' : 'Publications', value: posts.length, color: 'hsl(225,70%,45%)' },
          { icon: Users, label: lang === 'ar' ? 'المستلمون' : 'Destinataires', value: posts.reduce((s, p) => s + p.recipient_count, 0), color: 'hsl(195,70%,42%)' },
          { icon: Eye, label: lang === 'ar' ? 'الاطلاعات' : 'Lectures', value: posts.reduce((s, p) => s + p.read_count, 0), color: 'hsl(120,61%,34%)' },
          { icon: Heart, label: lang === 'ar' ? 'الإعجابات' : 'J\'aime', value: posts.reduce((s, p) => s + p.like_count, 0), color: 'hsl(340,65%,47%)' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl p-4 border shadow-md"
            style={{ background: `linear-gradient(135deg, ${kpi.color}10, ${kpi.color}05)`, borderColor: `${kpi.color}20` }}
          >
            <kpi.icon className="w-5 h-5 mb-2" style={{ color: kpi.color }} />
            <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Post list */}
      {posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {lang === 'ar' ? 'لا توجد منشورات بعد' : 'Aucune publication'}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, i) => (
            <motion.button
              key={post.id}
              initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => openDetail(post.id)}
              className="w-full text-start rounded-xl border border-border bg-card p-4 hover:shadow-lg hover:border-[hsl(225,70%,45%)]/20 transition-all"
            >
              <p className="text-sm font-medium text-foreground line-clamp-2 mb-2">{post.content || (lang === 'ar' ? '(منشور بمرفقات)' : '(Publication avec pièces jointes)')}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(post.created_at), 'dd/MM/yyyy', { locale: lang === 'ar' ? ar : fr })}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{post.recipient_count}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.read_count}</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.like_count}</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-lg max-h-[85vh]" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-[hsl(225,70%,45%)]">
              {lang === 'ar' ? 'إحصائيات المنشور' : 'Statistiques de la publication'}
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="py-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[hsl(225,70%,45%)]" /></div>
          ) : detail && selectedPost && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 p-1">
                {/* Post content */}
                {editMode ? (
                  <div className="space-y-2">
                    <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="min-h-[100px]" dir={dir} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpdate} disabled={saving}>
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        {lang === 'ar' ? 'حفظ' : 'Enregistrer'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>{lang === 'ar' ? 'إلغاء' : 'Annuler'}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-sm whitespace-pre-wrap">{posts.find(p => p.id === selectedPost)?.content}</p>
                  </div>
                )}

                {/* Stats */}
                {(() => {
                  const post = posts.find(p => p.id === selectedPost);
                  if (!post) return null;
                  const readRate = post.recipient_count > 0 ? Math.round((post.read_count / post.recipient_count) * 100) : 0;
                  return (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-3 rounded-xl bg-[hsl(225,70%,45%)]/5 border border-[hsl(225,70%,45%)]/10">
                        <p className="text-lg font-bold text-[hsl(225,70%,45%)]">{post.recipient_count}</p>
                        <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'مستلم' : 'Dest.'}</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <p className="text-lg font-bold text-emerald-600">{readRate}%</p>
                        <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'اطلاع' : 'Lus'}</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                        <p className="text-lg font-bold text-red-500">{post.like_count}</p>
                        <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'إعجاب' : 'J\'aime'}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Readers */}
                {detail.readers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {lang === 'ar' ? 'الذين اطلعوا' : 'Ont lu'} ({detail.readers.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {detail.readers.map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/30">
                          <span>{r.name}</span>
                          {r.read_at && <span className="text-muted-foreground">{format(new Date(r.read_at), 'dd/MM HH:mm')}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Likers */}
                {detail.likers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {lang === 'ar' ? 'المعجبون' : 'Ont aimé'} ({detail.likers.length})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {detail.likers.map((l, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">{l.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" onClick={() => setEditMode(true)} className="flex items-center gap-1">
                    <Edit3 className="w-3 h-3" /> {lang === 'ar' ? 'تعديل' : 'Modifier'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(selectedPost!)} className="flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> {lang === 'ar' ? 'حذف' : 'Supprimer'}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostStats;
