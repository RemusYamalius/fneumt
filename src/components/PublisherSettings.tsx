import { useState, useEffect, useRef } from 'react';
import { Camera, Trash2, Save, Loader2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const PublisherSettings = () => {
  const { user, profile } = useAuth();
  const { lang, dir } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [useTitle, setUseTitle] = useState(false);
  const [displayTitle, setDisplayTitle] = useState('');
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('publisher_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setDisplayName((data as any).display_name || profile?.full_name || '');
        setDisplayTitle((data as any).display_title || '');
        setUseTitle(!!(data as any).display_title);
        setAvatarPath((data as any).avatar_path || null);
        if ((data as any).avatar_path) {
          const { data: urlData } = supabase.storage.from('publisher-avatars').getPublicUrl((data as any).avatar_path);
          setAvatarUrl(urlData.publicUrl);
        }
      } else {
        setDisplayName(profile?.full_name || '');
      }
      setLoading(false);
    })();
  }, [user, profile]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: lang === 'ar' ? 'يرجى اختيار صورة' : 'Veuillez sélectionner une image', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    // Delete old if exists
    if (avatarPath) {
      await supabase.storage.from('publisher-avatars').remove([avatarPath]);
    }

    const { error } = await supabase.storage.from('publisher-avatars').upload(path, file, { upsert: true });
    if (error) {
      toast({ title: lang === 'ar' ? 'فشل الرفع' : 'Échec du téléchargement', variant: 'destructive' });
      setUploading(false);
      return;
    }
    setAvatarPath(path);
    const { data: urlData } = supabase.storage.from('publisher-avatars').getPublicUrl(path);
    setAvatarUrl(urlData.publicUrl);
    setUploading(false);
    toast({ title: lang === 'ar' ? 'تم رفع الصورة' : 'Image téléchargée' });
  };

  const handleDeleteAvatar = async () => {
    if (!avatarPath) return;
    await supabase.storage.from('publisher-avatars').remove([avatarPath]);
    setAvatarPath(null);
    setAvatarUrl(null);
    toast({ title: lang === 'ar' ? 'تم حذف الصورة' : 'Image supprimée' });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      display_name: useTitle ? displayTitle : displayName,
      display_title: useTitle ? displayTitle : null,
      avatar_path: avatarPath,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('publisher_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('publisher_settings').update(payload as any).eq('user_id', user.id);
    } else {
      await supabase.from('publisher_settings').insert(payload as any);
    }

    setSaving(false);
    toast({ title: lang === 'ar' ? 'تم حفظ الإعدادات' : 'Paramètres enregistrés' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8" dir={dir}>
      {/* Avatar Section */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4">
          {lang === 'ar' ? 'صورة الناشر' : 'Photo du publieur'}
        </h3>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg bg-muted flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-primary hover:underline"
            >
              {avatarUrl
                ? (lang === 'ar' ? 'تغيير الصورة' : 'Changer la photo')
                : (lang === 'ar' ? 'رفع صورة' : 'Télécharger une photo')}
            </button>
            {avatarUrl && (
              <button
                onClick={handleDeleteAvatar}
                className="text-sm font-medium text-destructive hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'حذف الصورة' : 'Supprimer'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Display Name Section */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4">
          {lang === 'ar' ? 'اسم الناشر' : 'Nom du publieur'}
        </h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-1.5 block">
              {lang === 'ar' ? 'الاسم المعروض' : 'Nom affiché'}
            </Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={useTitle}
              placeholder={profile?.full_name || ''}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Switch checked={useTitle} onCheckedChange={setUseTitle} />
            <Label className="text-sm">
              {lang === 'ar' ? 'استخدام الصفة كاسم الناشر' : 'Utiliser le titre comme nom'}
            </Label>
          </div>
          {useTitle && (
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">
                {lang === 'ar' ? 'الصفة / المسمى الوظيفي' : 'Titre / Fonction'}
              </Label>
              <Input
                value={displayTitle}
                onChange={(e) => setDisplayTitle(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: الكاتب العام الوطني' : 'Ex: Secrétaire Général National'}
                className="max-w-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, hsl(225,70%,45%), hsl(225,80%,35%))' }}
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {lang === 'ar' ? 'حفظ الإعدادات' : 'Enregistrer'}
      </button>
    </div>
  );
};

export default PublisherSettings;
