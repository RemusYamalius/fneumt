import { motion } from 'framer-motion';
import { Download, FileText, Video, Image, Clock, Sparkles, ExternalLink } from 'lucide-react';
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
  link_url?: string | null;
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

  // Separate media attachments
  const images = post.attachments.filter(a => a.mime_type?.startsWith('image/'));
  const videos = post.attachments.filter(a => a.mime_type?.startsWith('video/'));
  const others = post.attachments.filter(a => !a.mime_type?.startsWith('image/') && !a.mime_type?.startsWith('video/'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-xl relative ${style.wrapper}`}
    >
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

      {/* Inline Images - Facebook style */}
      {images.length > 0 && (
        <div className={`${images.length === 1 ? '' : 'grid gap-0.5'} ${images.length === 2 ? 'grid-cols-2' : images.length >= 3 ? 'grid-cols-2' : ''}`}>
          {images.slice(0, 4).map((att, idx) => (
            <div
              key={att.id}
              className={`relative group cursor-pointer overflow-hidden ${
                images.length === 1 ? 'w-full max-h-[400px]' :
                images.length === 3 && idx === 0 ? 'row-span-2 h-full' :
                'h-48'
              }`}
              onClick={() => downloadAttachment(att.file_path, att.file_name)}
            >
              <img src={getAttachmentUrl(att.file_path)} alt={att.file_name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Download className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
              {idx === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{images.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inline Videos */}
      {videos.map(att => (
        <div key={att.id} className="px-0">
          <video src={getAttachmentUrl(att.file_path)} controls className="w-full max-h-[400px] bg-black" />
        </div>
      ))}

      {/* Other files */}
      {others.length > 0 && (
        <div className="px-5 pb-3 pt-2">
          <div className="flex flex-wrap gap-2">
            {others.map(att => (
              <button
                key={att.id}
                onClick={() => downloadAttachment(att.file_path, att.file_name)}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-border/30 hover:border-primary/30 transition-all bg-muted/30"
              >
                {att.mime_type === 'application/pdf' ? <FileText className="w-5 h-5 text-red-500" /> : <Image className="w-5 h-5 text-muted-foreground" />}
                <span className="text-xs text-muted-foreground max-w-[120px] truncate">{att.file_name}</span>
                <Download className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Link preview */}
      {post.link_url && (
        <a
          href={!/^https?:\/\//i.test(post.link_url) ? `https://${post.link_url}` : post.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`mx-5 mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-md ${
            post.display_style === 'immersive'
              ? 'border-white/20 bg-white/10 hover:bg-white/15'
              : 'border-border bg-muted/30 hover:bg-muted/50'
          }`}
        >
          <ExternalLink className={`w-5 h-5 shrink-0 ${post.display_style === 'immersive' ? 'text-[hsl(42,80%,60%)]' : 'text-[hsl(42,80%,50%)]'}`} />
          <span className={`text-sm truncate ${post.display_style === 'immersive' ? 'text-white/80' : 'text-primary'}`}>
            {post.link_url}
          </span>
        </a>
      )}
    </motion.div>
  );
};

export default SponsoredPostCard;
