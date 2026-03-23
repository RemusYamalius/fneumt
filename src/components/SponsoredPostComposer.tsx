import { useState, useRef } from 'react';
import { Camera, Send, Loader2, Paperclip, X, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const STYLES = [
  { key: 'elegant', labelAr: 'أنيق', labelFr: 'Élégant', desc: { ar: 'حدود ذهبية، تصميم هادئ وأنيق', fr: 'Bordures dorées, design sobre et élégant' }, gradient: 'from-[hsl(42,80%,55%)] to-[hsl(42,70%,40%)]', preview: 'border-2 border-[hsl(42,80%,60%)]/50 bg-gradient-to-br from-[hsl(42,60%,97%)] to-[hsl(42,50%,93%)]' },
  { key: 'spotlight', labelAr: 'بارز', labelFr: 'Spotlight', desc: { ar: 'إطار متوهج، ظل عميق، تأثير بصري لافت', fr: 'Cadre lumineux, ombre profonde, effet visuel saisissant' }, gradient: 'from-[hsl(260,60%,55%)] to-[hsl(225,70%,50%)]', preview: 'border-2 border-[hsl(260,60%,55%)]/40 shadow-[0_0_20px_-5px_hsl(260,60%,55%,0.3)]' },
  { key: 'immersive', labelAr: 'غامر', labelFr: 'Immersif', desc: { ar: 'خلفية تدرج كامل، تجربة بصرية شاملة', fr: 'Fond dégradé complet, expérience visuelle immersive' }, gradient: 'from-[hsl(210,60%,22%)] to-[hsl(180,40%,28%)]', preview: 'bg-gradient-to-br from-[hsl(210,60%,18%)] to-[hsl(180,40%,22%)] text-white' },
];

const SponsoredPostComposer = ({ onPostCreated }: { onPostCreated?: () => void }) => {
  const { user } = useAuth();
  const { lang, dir } = useI18n();
  const avatarRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);

  const [advertiserName, setAdvertiserName] = useState('');
  const [content, setContent] = useState('');
  const [displayStyle, setDisplayStyle] = useState('elegant');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files].slice(0, 5));
  };

  const removeAttachment = (i: number) => setAttachments(prev => prev.filter((_, idx) => idx !== i));

  const handlePublish = async () => {
    if (!user || !advertiserName.trim() || (!content.trim() && attachments.length === 0)) {
      toast({ title: lang === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Veuillez remplir les champs requis', variant: 'destructive' });
      return;
    }
    setPublishing(true);

    let avatarPath: string | null = null;
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      avatarPath = `avatars/sponsor-${Date.now()}.${ext}`;
      await supabase.storage.from('sponsor-assets').upload(avatarPath, avatarFile);
    }

    const { data: post, error } = await supabase.from('sponsored_posts').insert({
      created_by: user.id,
      advertiser_name: advertiserName.trim(),
      advertiser_avatar_path: avatarPath,
      content: content.trim() || null,
      display_style: displayStyle,
    } as any).select().single();

    if (error || !post) {
      toast({ title: lang === 'ar' ? 'فشل النشر' : 'Échec de la publication', variant: 'destructive' });
      setPublishing(false);
      return;
    }

    // Upload attachments
    for (const file of attachments) {
      const ext = file.name.split('.').pop();
      const path = `posts/${(post as any).id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      await supabase.storage.from('sponsor-assets').upload(path, file);
      await supabase.from('sponsored_post_attachments').insert({
        post_id: (post as any).id,
        file_path: path,
        file_name: file.name,
        mime_type: file.type || null,
        file_size: file.size,
      } as any);
    }

    setAdvertiserName('');
    setContent('');
    setAvatarFile(null);
    setAvatarPreview(null);
    setAttachments([]);
    setPublishing(false);
    toast({ title: lang === 'ar' ? 'تم نشر الإعلان بنجاح' : 'Annonce publiée avec succès' });
    onPostCreated?.();
  };

  return (
    <div className="space-y-6" dir={dir}>
      {/* Advertiser Info */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[hsl(42,80%,50%)]" />
          {lang === 'ar' ? 'معلومات المعلن' : 'Informations de l\'annonceur'}
        </h3>
        <div className="flex items-center gap-5 mb-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-[hsl(42,80%,55%)]/30 shadow-lg bg-muted flex items-center justify-center cursor-pointer"
              onClick={() => avatarRef.current?.click()}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
          </div>
          <div className="flex-1">
            <Label className="text-sm text-muted-foreground mb-1.5 block">
              {lang === 'ar' ? 'اسم المعلن *' : 'Nom de l\'annonceur *'}
            </Label>
            <Input
              value={advertiserName}
              onChange={(e) => setAdvertiserName(e.target.value)}
              placeholder={lang === 'ar' ? 'أدخل اسم المعلن' : 'Entrez le nom de l\'annonceur'}
              className="max-w-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <Label className="text-sm font-bold text-foreground mb-2 block">
          {lang === 'ar' ? 'محتوى الإعلان' : 'Contenu de l\'annonce'}
        </Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={lang === 'ar' ? 'اكتب نص الإعلان هنا...' : 'Écrivez le texte de l\'annonce ici...'}
          className="min-h-[120px] resize-none"
          dir={dir}
        />
        {/* Attachments */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => filesRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          >
            <Paperclip className="w-4 h-4" />
            {lang === 'ar' ? 'إرفاق ملفات' : 'Joindre des fichiers'}
          </button>
          <input ref={filesRef} type="file" multiple accept="image/*,video/*,application/pdf" className="hidden" onChange={handleFilesSelect} />
          {attachments.map((f, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent text-xs text-accent-foreground">
              {f.name.slice(0, 20)}{f.name.length > 20 ? '…' : ''}
              <button onClick={() => removeAttachment(i)}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Display Style */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4">
          {lang === 'ar' ? 'شكل الإعلان' : 'Style d\'affichage'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STYLES.map(s => (
            <button
              key={s.key}
              onClick={() => setDisplayStyle(s.key)}
              className={`relative rounded-xl p-4 text-start transition-all ${s.preview} ${
                displayStyle === s.key ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${s.gradient} mb-2`} />
              <p className={`font-bold text-sm ${s.key === 'immersive' ? 'text-white' : 'text-foreground'}`}>
                {lang === 'ar' ? s.labelAr : s.labelFr}
              </p>
              <p className={`text-[11px] mt-0.5 ${s.key === 'immersive' ? 'text-white/70' : 'text-muted-foreground'}`}>
                {lang === 'ar' ? s.desc.ar : s.desc.fr}
              </p>
              {displayStyle === s.key && (
                <div className="absolute top-2 end-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Publish */}
      <button
        onClick={handlePublish}
        disabled={publishing || !advertiserName.trim()}
        className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, hsl(42,80%,50%), hsl(42,70%,38%))' }}
      >
        {publishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        {lang === 'ar' ? 'نشر الإعلان' : 'Publier l\'annonce'}
      </button>
    </div>
  );
};

export default SponsoredPostComposer;
