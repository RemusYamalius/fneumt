import { motion } from 'framer-motion';
import { Heart, Download, FileText, Video, Image, Clock, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar, fr } from 'date-fns/locale';

interface SponsoredPost {
  id: string;
  advertiser_name: string;
  advertiser_avatar_path: string | null;
  content: string | null;
  display_style: string;
  created_at: string;
  attachments: { id: string; file_path: string; file_name: string; mime_type: string | null }[];
}

const SponsoredPostCard = ({ post }: { post: SponsoredPost }) => {
  const { lang, dir } = useI18n();

  const avatarUrl = post.advertiser_avatar_path
    ? supabase.storage.from('sponsor-assets').getPublicUrl(post.advertiser_avatar_path).data.publicUrl
    : null;

  const getAttachmentUrl = (path: string) =>
    supabase.storage.from('sponsor-assets').getPublicUrl(path).data.publicUrl;

  const downloadAttachment = async (path: string, fileName: string) => {
    const { data } = await supabase.storage.from('sponsor-assets').download(path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const styleConfig: Record<string, { wrapper: string; headerBg: string; badge: string; shimmer: boolean }> = {
    elegant: {
      wrapper: 'border-2 border-[hsl(42,80%,60%)]/40 bg-gradient-to-br from-[hsl(42,60%,97%)] to-[hsl(42,50%,93%)] dark:from-[hsl(42,30%,12%)] dark:to-[hsl(42,20%,8%)]',
      headerBg: 'bg-gradient-to-r from-[hsl(42,80%,55%)]/10 to-transparent',
      badge: 'bg-[hsl(42,80%,55%)]/15 text-[hsl(42,80%,40%)] border border-[hsl(42,80%,55%)]/30',
      shimmer: false,
    },
    spotlight: {
      wrapper: 'border-2 border-[hsl(260,60%,55%)]/30 bg-card shadow-[0_0_30px_-8px_hsl(260,60%,55%,0.15)]',
      headerBg: 'bg-gradient-to-r from-[hsl(260,60%,55%)]/5 to-[hsl(225,70%,50%)]/5',
      badge: 'bg-gradient-to-r from-[hsl(260,60%,55%)]/15 to-[hsl(225,70%,50%)]/15 text-[hsl(260,60%,50%)] border border-[hsl(260,60%,55%)]/20',
      shimmer: true,
    },
    immersive: {
      wrapper: 'border-0 bg-gradient-to-br from-[hsl(210,60%,18%)] to-[hsl(180,40%,22%)] text-white',
      headerBg: 'bg-white/5',
      badge: 'bg-white/15 text-white/90 border border-white/20',
      shimmer: false,
    },
  };

  const style = styleConfig[post.display_style] || styleConfig.elegant;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-xl relative ${style.wrapper}`}
    >
      {/* Shimmer effect for spotlight */}
      {style.shimmer && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(260,60%,55%)]/5 to-transparent animate-[shimmer_3s_infinite]"
            style={{ animation: 'shimmer 3s ease-in-out infinite' }}
          />
        </div>
      )}

      {/* Sponsored badge */}
      <div className={`px-4 py-1.5 ${style.headerBg} flex items-center gap-1.5`}>
        <Sparkles className={`w-3 h-3 ${post.display_style === 'immersive' ? 'text-[hsl(42,80%,60%)]' : 'text-[hsl(42,80%,50%)]'}`} />
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
          {lang === 'ar' ? 'معلن' : 'Sponsorisé'}
        </span>
      </div>

      {/* Header */}
      <div className="px-5 pt-3 pb-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0"
          style={{ background: avatarUrl ? undefined : 'linear-gradient(135deg, hsl(42,80%,50%), hsl(42,70%,40%))' }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={post.advertiser_name} className="w-full h-full object-cover" />
          ) : (
            post.advertiser_name.charAt(0)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm ${post.display_style === 'immersive' ? 'text-white' : 'text-foreground'}`}>
            {post.advertiser_name}
          </p>
          <div className={`flex items-center gap-1.5 text-xs ${post.display_style === 'immersive' ? 'text-white/60' : 'text-muted-foreground'}`}>
            <Clock className="w-3 h-3" />
            {format(new Date(post.created_at), 'dd MMM yyyy', { locale: lang === 'ar' ? ar : fr })}
          </div>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-5 pb-3">
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${post.display_style === 'immersive' ? 'text-white/90' : 'text-foreground'}`} dir={dir}>
            {post.content}
          </p>
        </div>
      )}

      {/* Attachments */}
      {post.attachments.length > 0 && (
        <div className="px-5 pb-4">
          <div className="flex flex-wrap gap-2">
            {post.attachments.map(att => {
              const isImage = att.mime_type?.startsWith('image/');
              return (
                <button
                  key={att.id}
                  onClick={() => downloadAttachment(att.file_path, att.file_name)}
                  className="group relative rounded-xl overflow-hidden border border-border/30 hover:border-primary/30 transition-all"
                >
                  {isImage ? (
                    <div className="w-full max-w-sm h-48 relative">
                      <img src={getAttachmentUrl(att.file_path)} alt={att.file_name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Download className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 h-24 flex flex-col items-center justify-center gap-1 bg-muted/50">
                      {att.mime_type === 'application/pdf' ? <FileText className="w-6 h-6 text-red-500" /> :
                       att.mime_type?.startsWith('video/') ? <Video className="w-6 h-6 text-primary" /> :
                       <Image className="w-6 h-6 text-muted-foreground" />}
                      <span className="text-[9px] text-muted-foreground truncate max-w-[80px] px-1">{att.file_name}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SponsoredPostCard;
