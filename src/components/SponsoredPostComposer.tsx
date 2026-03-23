import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Send, Loader2, Paperclip, X, Sparkles, Smile, Image, Video, FileText, Users, ChevronDown, ChevronUp, Filter, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ACADEMIES } from '@/lib/academies-data';

const GOLD = 'hsl(42,80%,50%)';
const GOLD_DARK = 'hsl(42,70%,38%)';

const EMOJI_LIST = ['😀','😊','👍','❤️','🎉','🙏','💪','✅','⚠️','📢','📌','🔔','📋','🏫','📚','✍️','🤝','👏','💡','🌟','🔥','💯','📝','📎','🗓️','⏰','🎯','🏆','💼','📊'];

const MISSION_DB_VALUES = [
  'teacher_primary', 'teacher_middle', 'teacher_high',
  'specialist_educational', 'specialist_social', 'specialist_admin_econ',
  'admin_director', 'admin_guard_ext', 'admin_guard_int',
  'admin_nazir', 'admin_work_chief', 'admin_study_dir',
  'admin_cross_sector', 'admin_ministry', 'supplier',
  'editor', 'educational_assistant', 'technician',
  'inspector_primary', 'inspector_middle', 'inspector_high',
  'inspector_guidance', 'inspector_planning', 'inspector_finance',
  'economy_admin', 'doctor',
];

const MISSION_VALUE_TO_KEY: Record<string, string> = {
  teacher_primary: 'missionTeacherPrimary', teacher_middle: 'missionTeacherMiddle', teacher_high: 'missionTeacherHigh',
  specialist_educational: 'missionSpecialistEducational', specialist_social: 'missionSpecialistSocial', specialist_admin_econ: 'missionSpecialistAdminEcon',
  admin_director: 'missionAdminDirector', admin_guard_ext: 'missionAdminGuardExt', admin_guard_int: 'missionAdminGuardInt',
  admin_nazir: 'missionAdminNazir', admin_work_chief: 'missionAdminWorkChief', admin_study_dir: 'missionAdminStudyDir',
  admin_cross_sector: 'missionAdminCrossSector', admin_ministry: 'missionAdminMinistry', supplier: 'missionSupplier',
  editor: 'missionEditor', educational_assistant: 'missionEducationalAssistant', technician: 'missionTechnician',
  inspector_primary: 'missionInspectorPrimary', inspector_middle: 'missionInspectorMiddle', inspector_high: 'missionInspectorHigh',
  inspector_guidance: 'missionInspectorGuidance', inspector_planning: 'missionInspectorPlanning', inspector_finance: 'missionInspectorFinance',
  economy_admin: 'missionEconomyAdmin', doctor: 'missionDoctor',
};

interface AttachmentPreview {
  file: File;
  url: string;
  type: 'image' | 'pdf' | 'video' | 'other';
}

const STYLES = [
  { key: 'elegant', labelAr: 'أنيق', labelFr: 'Élégant', desc: { ar: 'حدود ذهبية، تصميم هادئ وأنيق', fr: 'Bordures dorées, design sobre et élégant' }, gradient: 'from-[hsl(42,80%,55%)] to-[hsl(42,70%,40%)]', preview: 'border-2 border-[hsl(42,80%,60%)]/50 bg-gradient-to-br from-[hsl(42,60%,97%)] to-[hsl(42,50%,93%)]' },
  { key: 'spotlight', labelAr: 'بارز', labelFr: 'Spotlight', desc: { ar: 'إطار متوهج، ظل عميق، تأثير بصري لافت', fr: 'Cadre lumineux, ombre profonde, effet visuel saisissant' }, gradient: 'from-[hsl(260,60%,55%)] to-[hsl(225,70%,50%)]', preview: 'border-2 border-[hsl(260,60%,55%)]/40 shadow-[0_0_20px_-5px_hsl(260,60%,55%,0.3)]' },
  { key: 'immersive', labelAr: 'غامر', labelFr: 'Immersif', desc: { ar: 'خلفية تدرج كامل، تجربة بصرية شاملة', fr: 'Fond dégradé complet, expérience visuelle immersive' }, gradient: 'from-[hsl(210,60%,22%)] to-[hsl(180,40%,28%)]', preview: 'bg-gradient-to-br from-[hsl(210,60%,18%)] to-[hsl(180,40%,22%)] text-white' },
];

const SponsoredPostComposer = ({ onPostCreated }: { onPostCreated?: () => void }) => {
  const { user } = useAuth();
  const { t, lang, dir } = useI18n();
  const avatarRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);

  const getMissionLabel = (val: string) => {
    const key = MISSION_VALUE_TO_KEY[val];
    return key ? (t as any)[key] || val : val;
  };

  const [advertiserName, setAdvertiserName] = useState('');
  const [content, setContent] = useState('');
  const [displayStyle, setDisplayStyle] = useState('elegant');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Filters
  const [filterAcademy, setFilterAcademy] = useState('');
  const [filterDirectorate, setFilterDirectorate] = useState('');
  const [filterInstitution, setFilterInstitution] = useState('');
  const [filterMission, setFilterMission] = useState('');
  const [filterMembership, setFilterMembership] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterPPR, setFilterPPR] = useState('');
  const [filterAgeMin, setFilterAgeMin] = useState('');
  const [filterAgeMax, setFilterAgeMax] = useState('');
  const [filterLocalOffice, setFilterLocalOffice] = useState('');
  const [showToSupreme, setShowToSupreme] = useState(true);
  const [localOffices, setLocalOffices] = useState<{ id: string; office_name: string | null; academy: string | null; directorate: string | null }[]>([]);

  const directorates = filterAcademy
    ? ACADEMIES.find(a => a.label === filterAcademy)?.directorates || []
    : [];

  useEffect(() => {
    const fetchOffices = async () => {
      let query = supabase.from('local_offices').select('id, office_name, academy, directorate');
      if (filterAcademy) query = query.eq('academy', filterAcademy);
      if (filterDirectorate) query = query.eq('directorate', filterDirectorate);
      const { data } = await query;
      setLocalOffices(data || []);
    };
    fetchOffices();
    setFilterLocalOffice('');
  }, [filterAcademy, filterDirectorate]);

  const getFileType = (file: File): AttachmentPreview['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('video/')) return 'video';
    return 'other';
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: getFileType(file),
    }));
    setAttachments(prev => [...prev, ...newAttachments].slice(0, 10));
    if (filesRef.current) filesRef.current.value = '';
  };

  const removeAttachment = (i: number) => {
    setAttachments(prev => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmoji(false);
  };

  const buildFilters = () => {
    const filters: Record<string, string> = {};
    if (filterAcademy) filters.academy = filterAcademy;
    if (filterDirectorate) filters.directorate = filterDirectorate;
    if (filterInstitution) filters.institution = filterInstitution;
    if (filterMission) filters.mission = filterMission;
    if (filterMembership) filters.membership = filterMembership;
    if (filterGender) filters.gender = filterGender;
    if (filterName) filters.name = filterName;
    if (filterPPR) filters.ppr = filterPPR;
    if (filterAgeMin) filters.ageMin = filterAgeMin;
    if (filterAgeMax) filters.ageMax = filterAgeMax;
    if (filterLocalOffice) filters.localOffice = filterLocalOffice;
    return filters;
  };

  const fetchRecipientIds = async () => {
    const filters = buildFilters();
    let officeMemberIds: string[] | null = null;
    if (filters.localOffice) {
      const { data: members } = await supabase.from('local_office_members').select('user_id').eq('office_id', filters.localOffice);
      officeMemberIds = (members || []).map(m => m.user_id);
      if (officeMemberIds.length === 0) return [];
    }

    let query = supabase.from('profiles').select('user_id, date_of_birth');
    if (officeMemberIds) query = query.in('user_id', officeMemberIds);
    if (filters.academy) query = query.eq('academy', filters.academy);
    if (filters.directorate) query = query.eq('directorate', filters.directorate);
    if (filters.institution) query = query.ilike('institution', `%${filters.institution}%`);
    if (filters.mission) query = query.eq('mission', filters.mission);
    if (filters.gender) query = query.eq('gender', filters.gender);
    if (filters.name) query = query.ilike('full_name', `%${filters.name}%`);
    if (filters.ppr) query = query.eq('employee_number', filters.ppr);
    if (filters.membership === 'member') {
      query = query.eq('is_member', true).eq('membership_verified', true);
    } else if (filters.membership === 'non_member') {
      query = query.or('is_member.eq.false,membership_verified.eq.false');
    }

    const { data } = await query;
    let results = (data || []).filter(p => p.user_id !== user?.id);

    if (filters.ageMin || filters.ageMax) {
      const now = new Date();
      results = results.filter(p => {
        if (!p.date_of_birth) return false;
        const birth = new Date(p.date_of_birth);
        const age = now.getFullYear() - birth.getFullYear() - (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
        if (filters.ageMin && age < parseInt(filters.ageMin)) return false;
        if (filters.ageMax && age > parseInt(filters.ageMax)) return false;
        return true;
      });
    }

    return results.map(p => p.user_id);
  };

  const countRecipients = async () => {
    setLoadingCount(true);
    const ids = await fetchRecipientIds();
    setRecipientCount(ids.length);
    setLoadingCount(false);
  };

  const handlePublish = async () => {
    if (!user || !advertiserName.trim() || (!content.trim() && attachments.length === 0)) {
      toast({ title: lang === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Veuillez remplir les champs requis', variant: 'destructive' });
      return;
    }
    setPublishing(true);

    try {
      let avatarPath: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        avatarPath = `avatars/sponsor-${Date.now()}.${ext}`;
        await supabase.storage.from('sponsor-assets').upload(avatarPath, avatarFile);
      }

      const filters = buildFilters();
      const hasFilters = Object.keys(filters).length > 0;

      const { data: post, error } = await supabase.from('sponsored_posts').insert({
        created_by: user.id,
        advertiser_name: advertiserName.trim(),
        advertiser_avatar_path: avatarPath,
        content: content.trim() || null,
        display_style: displayStyle,
        filters: hasFilters ? filters : null,
        link_url: linkUrl.trim() || null,
      } as any).select().single();

      if (error || !post) {
        toast({ title: lang === 'ar' ? 'فشل النشر' : 'Échec de la publication', variant: 'destructive' });
        setPublishing(false);
        return;
      }

      // Upload attachments
      for (const att of attachments) {
        const ext = att.file.name.split('.').pop();
        const path = `posts/${(post as any).id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        await supabase.storage.from('sponsor-assets').upload(path, att.file);
        await supabase.from('sponsored_post_attachments').insert({
          post_id: (post as any).id,
          file_path: path,
          file_name: att.file.name,
          mime_type: att.file.type || null,
          file_size: att.file.size,
        } as any);
      }

      // Insert recipients if filters specified
      if (hasFilters) {
        const recipientIds = await fetchRecipientIds();
        const allRecipientIds = [...recipientIds];

        if (showToSupreme) {
          const { data: supremeRoles } = await supabase.from('user_roles').select('user_id').in('role', ['admin', 'national_secretary', 'deputy_national_secretary']);
          const supremeIds = (supremeRoles || []).map(r => r.user_id).filter(id => id !== user.id && !allRecipientIds.includes(id));
          allRecipientIds.push(...supremeIds);
        }

        const batchSize = 500;
        for (let i = 0; i < allRecipientIds.length; i += batchSize) {
          const batch = allRecipientIds.slice(i, i + batchSize).map(uid => ({
            post_id: (post as any).id,
            user_id: uid,
          }));
          await supabase.from('sponsored_post_recipients').insert(batch as any);
        }
      }

      setAdvertiserName('');
      setContent('');
      setAvatarFile(null);
      setAvatarPreview(null);
      setAttachments([]);
      setRecipientCount(null);
      setLinkUrl('');
      toast({ title: lang === 'ar' ? 'تم نشر الإعلان بنجاح' : 'Annonce publiée avec succès' });
      onPostCreated?.();
    } catch (err) {
      console.error(err);
      toast({ title: lang === 'ar' ? 'خطأ في النشر' : 'Erreur de publication', variant: 'destructive' });
    }
    setPublishing(false);
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

      {/* Content + Emoji + Attachments */}
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

        {/* Attachment previews */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-wrap gap-3 mt-3">
              {attachments.map((att, i) => (
                <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative group">
                  {att.type === 'image' ? (
                    <img src={att.url} alt="" className="w-20 h-20 rounded-xl object-cover border-2 border-[hsl(42,80%,50%)]/20 shadow-md" />
                  ) : att.type === 'video' ? (
                    <div className="w-20 h-20 rounded-xl bg-[hsl(42,80%,50%)]/10 border-2 border-[hsl(42,80%,50%)]/20 flex flex-col items-center justify-center shadow-md">
                      <Video className="w-6 h-6 text-[hsl(42,80%,50%)]" />
                      <span className="text-[9px] mt-1 text-muted-foreground truncate max-w-[70px]">{att.file.name}</span>
                    </div>
                  ) : att.type === 'pdf' ? (
                    <div className="w-20 h-20 rounded-xl bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center shadow-md">
                      <FileText className="w-6 h-6 text-red-500" />
                      <span className="text-[9px] mt-1 text-muted-foreground truncate max-w-[70px]">{att.file.name}</span>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-muted border-2 border-border flex flex-col items-center justify-center shadow-md">
                      <Paperclip className="w-6 h-6 text-muted-foreground" />
                      <span className="text-[9px] mt-1 text-muted-foreground truncate max-w-[70px]">{att.file.name}</span>
                    </div>
                  )}
                  <button onClick={() => removeAttachment(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar: Emoji + Attachments + Link */}
        <div className="flex items-center gap-2 flex-wrap border-t border-[hsl(42,80%,50%)]/10 pt-3 mt-3">
          {/* Emoji */}
          <div className="relative">
            <button onClick={() => setShowEmoji(!showEmoji)} className="p-2.5 rounded-xl hover:bg-[hsl(42,80%,50%)]/10 transition-colors" title="Emoji">
              <Smile className="w-5 h-5 text-[hsl(42,80%,50%)]" />
            </button>
            <AnimatePresence>
              {showEmoji && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-12 start-0 z-50 bg-white rounded-2xl shadow-2xl border p-3 grid grid-cols-6 gap-1 w-[220px]">
                  {EMOJI_LIST.map(emoji => (
                    <button key={emoji} onClick={() => insertEmoji(emoji)} className="text-xl hover:bg-[hsl(42,80%,50%)]/10 rounded-lg p-1 transition-colors">{emoji}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input ref={filesRef} type="file" multiple accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="hidden" onChange={handleFilesSelect} />

          <button onClick={() => filesRef.current?.click()} className="p-2.5 rounded-xl hover:bg-[hsl(42,80%,50%)]/10 transition-colors" title={lang === 'ar' ? 'إرفاق ملفات' : 'Joindre des fichiers'}>
            <Paperclip className="w-5 h-5 text-[hsl(42,80%,50%)]" />
          </button>

          <button onClick={() => { filesRef.current?.setAttribute('accept', 'image/*'); filesRef.current?.click(); }} className="p-2.5 rounded-xl hover:bg-[hsl(42,80%,50%)]/10 transition-colors" title={lang === 'ar' ? 'صورة' : 'Image'}>
            <Image className="w-5 h-5 text-[hsl(42,80%,50%)]" />
          </button>

          <div className="flex-1" />

          {/* Recipients button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showFilters
                ? 'text-white shadow-lg'
                : 'bg-[hsl(42,80%,50%)]/10 text-[hsl(42,80%,40%)] hover:bg-[hsl(42,80%,50%)]/20'
            }`}
            style={showFilters ? { background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})` } : undefined}
          >
            <Users className="w-4 h-4" />
            {lang === 'ar' ? 'المستلمون' : 'Destinataires'}
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Recipient Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="bg-white rounded-2xl border border-[hsl(42,80%,50%)]/15 p-4 space-y-3 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-[hsl(42,80%,50%)]" />
                  <span className="text-sm font-semibold text-[hsl(42,80%,40%)]">
                    {lang === 'ar' ? 'فلاتر المستلمين' : 'Filtres des destinataires'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block font-bold text-[hsl(42,80%,40%)]">{t.academyLabel}</Label>
                    <Select value={filterAcademy} onValueChange={v => { setFilterAcademy(v === '_all' ? '' : v); setFilterDirectorate(''); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allAcademies} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">{t.allAcademies}</SelectItem>
                        {ACADEMIES.map(a => <SelectItem key={a.label} value={a.label}>{a.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block font-bold text-[hsl(42,80%,40%)]">{t.directorateLabel}</Label>
                    <Select value={filterDirectorate} onValueChange={v => setFilterDirectorate(v === '_all' ? '' : v)} disabled={!filterAcademy}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allDirectorates} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">{t.allDirectorates}</SelectItem>
                        {directorates.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block font-bold text-[hsl(42,80%,40%)]">{lang === 'ar' ? 'المكتب المحلي' : 'Bureau local'}</Label>
                    <Select value={filterLocalOffice} onValueChange={v => setFilterLocalOffice(v === '_all' ? '' : v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={lang === 'ar' ? 'كل المكاتب' : 'Tous les bureaux'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">{lang === 'ar' ? 'كل المكاتب' : 'Tous les bureaux'}</SelectItem>
                        {localOffices.map(o => <SelectItem key={o.id} value={o.id}>{o.office_name || o.id}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block font-bold text-[hsl(42,80%,40%)]">{t.institutionLabel}</Label>
                    <Input value={filterInstitution} onChange={e => setFilterInstitution(e.target.value)} placeholder={t.institutionLabel} className="h-9 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block font-bold text-[hsl(42,80%,40%)]">{(t as any).missionFilter || t.missionLabel}</Label>
                    <Select value={filterMission} onValueChange={v => setFilterMission(v === '_all' ? '' : v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={(t as any).allMissions || (lang === 'ar' ? 'كل المهام' : 'Toutes')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">{(t as any).allMissions || (lang === 'ar' ? 'كل المهام' : 'Toutes')}</SelectItem>
                        {MISSION_DB_VALUES.map(m => <SelectItem key={m} value={m}>{getMissionLabel(m)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block font-bold text-[hsl(42,80%,40%)]">{t.genderLabel}</Label>
                    <Select value={filterGender} onValueChange={v => setFilterGender(v === '_all' ? '' : v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={(t as any).allGenders || (lang === 'ar' ? 'الكل' : 'Tous')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">{(t as any).allGenders || (lang === 'ar' ? 'الكل' : 'Tous')}</SelectItem>
                        <SelectItem value="male">{t.genderMale}</SelectItem>
                        <SelectItem value="female">{t.genderFemale}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block font-bold text-[hsl(42,80%,40%)]">{(t as any).membershipFilter || (lang === 'ar' ? 'الانخراط' : 'Adhésion')}</Label>
                    <Select value={filterMembership} onValueChange={v => setFilterMembership(v === '_all' ? '' : v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={(t as any).allStatuses || (lang === 'ar' ? 'الكل' : 'Tous')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">{(t as any).allStatuses || (lang === 'ar' ? 'الكل' : 'Tous')}</SelectItem>
                        <SelectItem value="member">{(t as any).memberStatus || (lang === 'ar' ? 'منخرط' : 'Membre')}</SelectItem>
                        <SelectItem value="non_member">{(t as any).nonMemberStatus || (lang === 'ar' ? 'غير منخرط' : 'Non membre')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block font-bold text-[hsl(42,80%,40%)]">{t.fullNameLabel}</Label>
                    <Input value={filterName} onChange={e => setFilterName(e.target.value)} placeholder={t.fullNameLabel} className="h-9 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block font-bold text-[hsl(42,80%,40%)]">{t.employeeNumberLabel}</Label>
                    <Input value={filterPPR} onChange={e => setFilterPPR(e.target.value)} placeholder={t.employeeNumberLabel} className="h-9 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block font-bold text-[hsl(42,80%,40%)]">{lang === 'ar' ? 'الفئة العمرية' : "Tranche d'âge"}</Label>
                    <div className="flex gap-2">
                      <Input type="number" value={filterAgeMin} onChange={e => setFilterAgeMin(e.target.value)} placeholder={lang === 'ar' ? 'من' : 'De'} className="h-9 text-xs w-1/2" min="18" max="70" />
                      <Input type="number" value={filterAgeMax} onChange={e => setFilterAgeMax(e.target.value)} placeholder={lang === 'ar' ? 'إلى' : 'À'} className="h-9 text-xs w-1/2" min="18" max="70" />
                    </div>
                  </div>
                </div>

                {/* Show to supreme accounts toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-[hsl(42,80%,50%)]/10">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-bold text-[hsl(42,80%,40%)]">
                      {lang === 'ar' ? 'إظهار للحسابات السامية' : 'Visible par la Direction'}
                    </Label>
                    <span className="text-[10px] text-muted-foreground">
                      {lang === 'ar' ? '(الأدمين، الكاتب العام، مساعد الكاتب العام)' : '(Admin, Secrétaire, Adjoint)'}
                    </span>
                  </div>
                  <Switch checked={showToSupreme} onCheckedChange={setShowToSupreme} />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    size="sm"
                    onClick={countRecipients}
                    disabled={loadingCount}
                    className="text-xs text-white border-0 shadow-md"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})` }}
                  >
                    {loadingCount ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
                    {lang === 'ar' ? 'حساب العدد' : 'Compter'}
                  </Button>
                  {recipientCount !== null && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-sm font-bold text-[hsl(42,80%,40%)]">
                      {recipientCount} {lang === 'ar' ? (recipientCount === 1 ? 'مستلم' : 'مستلمين') : (recipientCount === 1 ? 'destinataire' : 'destinataires')}
                    </motion.span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Link URL */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <Label className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[hsl(42,80%,50%)]" />
          {lang === 'ar' ? 'رابط المعلن (اختياري)' : 'Lien de l\'annonceur (optionnel)'}
        </Label>
        <Input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://www.example.com"
          className="max-w-lg"
          dir="ltr"
        />
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
                displayStyle === s.key ? 'ring-2 ring-[hsl(42,80%,50%)] shadow-lg scale-[1.02]' : 'opacity-70 hover:opacity-100'
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
                <div className="absolute top-2 end-2 w-5 h-5 rounded-full bg-[hsl(42,80%,50%)] flex items-center justify-center">
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
        style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})` }}
      >
        {publishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        {lang === 'ar' ? 'نشر الإعلان' : 'Publier l\'annonce'}
      </button>
    </div>
  );
};

export default SponsoredPostComposer;
