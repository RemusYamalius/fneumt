import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, FileText, Video, Image, Download, Eye, Clock, Loader2, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar, fr } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SponsoredPostCard from '@/components/SponsoredPostCard';

interface Post {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  attachments: { id: string; file_path: string; file_name: string; mime_type: string | null }[];
  author_name: string;
  author_avatar_url: string | null;
  like_count: number;
  user_liked: boolean;
  is_read: boolean;
}

const PAGE_SIZE = 20;

const PostFeed = ({ isAuthor = false, mode = 'normal' }: { isAuthor?: boolean; mode?: 'normal' | 'supreme' }) => {
  const { lang, dir } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [likingPost, setLikingPost] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchPosts = useCallback(async (): Promise<{ posts: Post[]; totalCount: number }> => {
    if (!user) return { posts: [], totalCount: 0 };

    const from = 0;
    const to = page * PAGE_SIZE - 1;

    let query = supabase.from('posts').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);

    if (mode === 'supreme') {
      query = query.neq('author_id', user.id);
    }

    const { data: postsData, count: totalCount } = await query;
    if (!postsData) return { posts: [], totalCount: 0 };

    let filteredPosts = postsData;
    if (mode === 'supreme') {
      const { data: supremeRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'national_secretary', 'deputy_national_secretary']);
      const supremeIds = new Set((supremeRoles || []).map(r => r.user_id));
      filteredPosts = postsData.filter(p => supremeIds.has(p.author_id));
    }

    if (filteredPosts.length === 0) return { posts: [], totalCount: 0 };

    const postIds = filteredPosts.map(p => p.id);
    const authorIds = [...new Set(filteredPosts.map(p => p.author_id))];

    // Parallel fetch: attachments, likes, profiles, recipients, publisher_settings
    const [attachRes, likesRes, profilesRes, recipientRes, pubSettingsRes] = await Promise.all([
      supabase.from('post_attachments').select('*').in('post_id', postIds),
      supabase.from('post_likes').select('*').in('post_id', postIds),
      supabase.from('profiles').select('user_id, full_name').in('user_id', authorIds),
      isAuthor ? Promise.resolve({ data: [] }) : supabase.from('post_recipients').select('post_id, is_read').eq('user_id', user.id).in('post_id', postIds),
      supabase.from('publisher_settings').select('user_id, display_name, display_title, avatar_path').in('user_id', authorIds),
    ]);

    const attachMap = new Map<string, any[]>();
    (attachRes.data || []).forEach(a => {
      if (!attachMap.has(a.post_id)) attachMap.set(a.post_id, []);
      attachMap.get(a.post_id)!.push(a);
    });

    const likeCountMap = new Map<string, number>();
    const userLikeMap = new Map<string, boolean>();
    (likesRes.data || []).forEach(l => {
      likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) || 0) + 1);
      if (l.user_id === user.id) userLikeMap.set(l.post_id, true);
    });

    const profileMap = new Map<string, string>();
    (profilesRes.data || []).forEach(p => profileMap.set(p.user_id, p.full_name || ''));

    const readMap = new Map<string, boolean>();
    ((recipientRes as any).data || []).forEach((r: any) => readMap.set(r.post_id, r.is_read));

    const enriched: Post[] = filteredPosts.map(p => ({
      id: p.id,
      author_id: p.author_id,
      content: p.content || '',
      created_at: p.created_at,
      attachments: attachMap.get(p.id) || [],
      author_name: profileMap.get(p.author_id) || 'FNE-UMT',
      like_count: likeCountMap.get(p.id) || 0,
      user_liked: userLikeMap.get(p.id) || false,
      is_read: readMap.get(p.id) ?? true,
    }));

    // Mark unread as read
    if (!isAuthor) {
      const unreadIds = enriched.filter(p => !p.is_read).map(p => p.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('post_recipients')
          .update({ is_read: true, read_at: new Date().toISOString() } as any)
          .eq('user_id', user.id)
          .in('post_id', unreadIds);
      }
    }

    return { posts: enriched, totalCount: totalCount || filteredPosts.length };
  }, [user, isAuthor, mode, page]);

  const { data, isLoading } = useQuery({
    queryKey: ['posts', mode, isAuthor, page, user?.id],
    queryFn: fetchPosts,
    staleTime: 15_000,
    enabled: !!user,
  });

  const posts = data?.posts || [];
  const totalCount = data?.totalCount || 0;
  const hasMore = posts.length < totalCount;

  // Expose refetch for realtime callback
  const refetchPosts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  }, [queryClient]);

  // Make refetchPosts available globally for the realtime hook
  // This is done via a ref on window for simplicity
  if (typeof window !== 'undefined') {
    (window as any).__postFeedRefetch = refetchPosts;
  }

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!user || likingPost) return;
    setLikingPost(postId);

    if (currentlyLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id } as any);
    }

    queryClient.setQueryData(['posts', mode, isAuthor, page, user.id], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        posts: old.posts.map((p: Post) =>
          p.id === postId ? { ...p, user_liked: !currentlyLiked, like_count: p.like_count + (currentlyLiked ? -1 : 1) } : p
        ),
      };
    });
    setLikingPost(null);
  };

  const getAttachmentUrl = (path: string) => {
    const { data } = supabase.storage.from('post-attachments').getPublicUrl(path);
    return data.publicUrl;
  };

  const downloadAttachment = async (path: string, fileName: string) => {
    const { data } = await supabase.storage.from('post-attachments').download(path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(225,70%,45%)]" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(225,70%,45%)]/10 flex items-center justify-center">
          <Eye className="w-7 h-7 text-[hsl(225,70%,45%)]/40" />
        </div>
        <p className="text-muted-foreground">{lang === 'ar' ? 'لا توجد منشورات حالياً' : 'Aucune publication pour le moment'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.08 }}
          className={`rounded-2xl border overflow-hidden shadow-lg transition-all hover:shadow-xl ${
            !post.is_read && !isAuthor ? 'border-[hsl(225,70%,45%)]/40 bg-[hsl(225,70%,97%)]' : 'border-border bg-card'
          }`}
        >
          {/* Post header */}
          <div className="px-5 pt-5 pb-3 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
              style={{ background: 'linear-gradient(135deg, hsl(225,70%,45%), hsl(225,80%,35%))' }}>
              {post.author_name.charAt(0) || 'F'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm">{post.author_name}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {format(new Date(post.created_at), 'dd MMM yyyy - HH:mm', { locale: lang === 'ar' ? ar : fr })}
              </div>
            </div>
            {!post.is_read && !isAuthor && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-[hsl(225,70%,45%)] animate-pulse">
                {lang === 'ar' ? 'جديد' : 'Nouveau'}
              </span>
            )}
          </div>

          {/* Content */}
          {post.content && (
            <div className="px-5 pb-3">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" dir={dir}>{post.content}</p>
            </div>
          )}

          {/* Attachments */}
          {post.attachments.length > 0 && (
            <div className="px-5 pb-3">
              <div className="flex flex-wrap gap-2">
                {post.attachments.map(att => {
                  const isImage = att.mime_type?.startsWith('image/');
                  const isVideo = att.mime_type?.startsWith('video/');
                  const isPdf = att.mime_type === 'application/pdf';

                  return (
                    <button
                      key={att.id}
                      onClick={() => downloadAttachment(att.file_path, att.file_name)}
                      className="group relative rounded-xl overflow-hidden border border-border hover:border-[hsl(225,70%,45%)]/30 transition-all"
                    >
                      {isImage ? (
                        <div className="w-24 h-24 relative">
                          <img
                            src={getAttachmentUrl(att.file_path)}
                            alt={att.file_name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Download className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-24 flex flex-col items-center justify-center gap-1 bg-muted/50">
                          {isPdf ? <FileText className="w-6 h-6 text-red-500" /> : isVideo ? <Video className="w-6 h-6 text-[hsl(225,70%,45%)]" /> : <Image className="w-6 h-6 text-gray-500" />}
                          <span className="text-[9px] text-muted-foreground truncate max-w-[80px] px-1">{att.file_name}</span>
                          <Download className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Like bar */}
          <div className="px-5 py-3 border-t border-border/50 flex items-center gap-4">
            <button
              onClick={() => toggleLike(post.id, post.user_liked)}
              disabled={likingPost === post.id || isAuthor}
              className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
                post.user_liked
                  ? 'text-red-500'
                  : 'text-muted-foreground hover:text-red-500'
              }`}
            >
              <motion.div
                whileTap={{ scale: 1.4 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <Heart className={`w-5 h-5 ${post.user_liked ? 'fill-current' : ''}`} />
              </motion.div>
              {post.like_count > 0 && <span>{post.like_count}</span>}
            </button>
          </div>
        </motion.div>
      ))}

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
            {lang === 'ar' ? 'تحميل المزيد' : 'Charger plus'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PostFeed;
