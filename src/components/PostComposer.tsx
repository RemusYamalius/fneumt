import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Paperclip, Image, FileText, Video, Link2, X, Users, ChevronDown, ChevronUp, Loader2, Filter } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ACADEMIES } from '@/lib/academies-data';

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

const PostComposer = ({ onPostCreated }: { onPostCreated?: () => void }) => {
  const { t, lang, dir } = useI18n();

  const getMissionLabel = (val: string) => {
    const key = MISSION_VALUE_TO_KEY[val];
    return key ? (t as any)[key] || val : val;
  };
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

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
  const [localOffices, setLocalOffices] = useState<{ id: string; office_name: string | null; academy: string | null; directorate: string | null }[]>([]);

  const directorates = filterAcademy
    ? ACADEMIES.find(a => a.label === filterAcademy)?.directorates || []
    : [];

  // Fetch local offices based on selected academy/directorate
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: getFileType(file),
    }));
    setAttachments(prev => [...prev, ...newAttachments].slice(0, 10));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
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

    // If local office is selected, get member user_ids first
    let officeMemberIds: string[] | null = null;
    if (filters.localOffice) {
      const { data: members } = await supabase
        .from('local_office_members')
        .select('user_id')
        .eq('office_id', filters.localOffice);
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

    // Client-side age filtering
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
    if (!content.trim() && attachments.length === 0) return;
    if (!user) return;

    setPublishing(true);
    try {
      const recipientIds = await fetchRecipientIds();
      if (recipientIds.length === 0) {
        toast({ title: lang === 'ar' ? 'لا يوجد مستلمون' : 'Aucun destinataire', variant: 'destructive' });
        setPublishing(false);
        return;
      }

      // Create post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({ author_id: user.id, content: content.trim(), filters: buildFilters() } as any)
        .select('id')
        .single();

      if (postError || !post) throw postError;

      // Upload attachments
      for (const att of attachments) {
        const ext = att.file.name.split('.').pop();
        const path = `${post.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('post-attachments')
          .upload(path, att.file);

        if (!uploadError) {
          await supabase.from('post_attachments').insert({
            post_id: post.id,
            file_path: path,
            file_name: att.file.name,
            mime_type: att.file.type,
            file_size: att.file.size,
          } as any);
        }
      }

      // Insert recipients in batches
      const batchSize = 500;
      for (let i = 0; i < recipientIds.length; i += batchSize) {
        const batch = recipientIds.slice(i, i + batchSize).map(uid => ({
          post_id: post.id,
          user_id: uid,
        }));
        await supabase.from('post_recipients').insert(batch as any);
      }

      toast({ title: lang === 'ar' ? 'تم نشر المنشور بنجاح' : 'Publication réussie' });
      setContent('');
      setAttachments([]);
      setRecipientCount(null);
      onPostCreated?.();
    } catch (err) {
      console.error(err);
      toast({ title: lang === 'ar' ? 'خطأ في النشر' : 'Erreur de publication', variant: 'destructive' });
    }
    setPublishing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden shadow-2xl border border-[hsl(225,70%,45%)]/20"
      style={{ background: 'linear-gradient(135deg, hsl(225,70%,97%) 0%, hsl(225,50%,93%) 100%)' }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, hsl(225,70%,45%) 0%, hsl(225,80%,35%) 100%)' }}
      >
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Send className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-bold text-white">{lang === 'ar' ? 'إنشاء منشور' : 'Créer une publication'}</h2>
      </div>

      <div className="p-5 space-y-4">
        {/* Content area */}
        <div className="relative">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={lang === 'ar' ? 'اكتب منشورك هنا...' : 'Écrivez votre publication ici...'}
            className="min-h-[140px] text-base border-[hsl(225,70%,45%)]/20 bg-white rounded-2xl resize-none focus:ring-[hsl(225,70%,45%)]/30 focus:border-[hsl(225,70%,45%)]/40"
            dir={dir}
          />
        </div>

        {/* Attachment previews */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-wrap gap-3"
            >
              {attachments.map((att, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative group"
                >
                  {att.type === 'image' ? (
                    <img src={att.url} alt="" className="w-20 h-20 rounded-xl object-cover border-2 border-[hsl(225,70%,45%)]/20 shadow-md" />
                  ) : att.type === 'video' ? (
                    <div className="w-20 h-20 rounded-xl bg-[hsl(225,70%,45%)]/10 border-2 border-[hsl(225,70%,45%)]/20 flex flex-col items-center justify-center shadow-md">
                      <Video className="w-6 h-6 text-[hsl(225,70%,45%)]" />
                      <span className="text-[9px] mt-1 text-muted-foreground truncate max-w-[70px]">{att.file.name}</span>
                    </div>
                  ) : att.type === 'pdf' ? (
                    <div className="w-20 h-20 rounded-xl bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center shadow-md">
                      <FileText className="w-6 h-6 text-red-500" />
                      <span className="text-[9px] mt-1 text-muted-foreground truncate max-w-[70px]">{att.file.name}</span>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gray-50 border-2 border-gray-200 flex flex-col items-center justify-center shadow-md">
                      <Paperclip className="w-6 h-6 text-gray-500" />
                      <span className="text-[9px] mt-1 text-muted-foreground truncate max-w-[70px]">{att.file.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap border-t border-[hsl(225,70%,45%)]/10 pt-4">
          <div className="relative">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="p-2.5 rounded-xl hover:bg-[hsl(225,70%,45%)]/10 transition-colors"
              title="Emoji"
            >
              <Smile className="w-5 h-5 text-[hsl(225,70%,45%)]" />
            </button>
            <AnimatePresence>
              {showEmoji && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-12 start-0 z-50 bg-white rounded-2xl shadow-2xl border p-3 grid grid-cols-6 gap-1 w-[220px]"
                >
                  {EMOJI_LIST.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="text-xl hover:bg-[hsl(225,70%,45%)]/10 rounded-lg p-1 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl hover:bg-[hsl(225,70%,45%)]/10 transition-colors"
            title={lang === 'ar' ? 'إرفاق ملفات' : 'Joindre des fichiers'}
          >
            <Paperclip className="w-5 h-5 text-[hsl(225,70%,45%)]" />
          </button>

          <button
            onClick={() => { fileInputRef.current?.setAttribute('accept', 'image/*'); fileInputRef.current?.click(); }}
            className="p-2.5 rounded-xl hover:bg-[hsl(225,70%,45%)]/10 transition-colors"
            title={lang === 'ar' ? 'صورة' : 'Image'}
          >
            <Image className="w-5 h-5 text-[hsl(225,70%,45%)]" />
          </button>

          <div className="flex-1" />

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showFilters
                ? 'bg-[hsl(225,70%,45%)] text-white shadow-lg'
                : 'bg-[hsl(225,70%,45%)]/10 text-[hsl(225,70%,45%)] hover:bg-[hsl(225,70%,45%)]/20'
            }`}
          >
            <Users className="w-4 h-4" />
            {lang === 'ar' ? 'المستلمون' : 'Destinataires'}
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Recipient filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-2xl border border-[hsl(225,70%,45%)]/15 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-[hsl(225,70%,45%)]" />
                  <span className="text-sm font-semibold text-[hsl(225,70%,45%)]">
                    {lang === 'ar' ? 'فلاتر المستلمين' : 'Filtres des destinataires'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Academy */}
                  <div>
                    <Label className="text-xs mb-1 block">{t.academyLabel}</Label>
                    <Select value={filterAcademy} onValueChange={v => { setFilterAcademy(v === '_all' ? '' : v); setFilterDirectorate(''); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allAcademies} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">{t.allAcademies}</SelectItem>
                        {ACADEMIES.map(a => <SelectItem key={a.label} value={a.label}>{a.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Directorate */}
                  <div>
                    <Label className="text-xs mb-1 block">{t.directorateLabel}</Label>
                    <Select value={filterDirectorate} onValueChange={v => setFilterDirectorate(v === '_all' ? '' : v)} disabled={!filterAcademy}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allDirectorates} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">{t.allDirectorates}</SelectItem>
                        {directorates.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Institution */}
                  <div>
                    <Label className="text-xs mb-1 block">{t.institutionLabel}</Label>
                    <Input
                      value={filterInstitution}
                      onChange={e => setFilterInstitution(e.target.value)}
                      placeholder={t.institutionLabel}
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* Mission */}
                  <div>
                    <Label className="text-xs mb-1 block">{t.missionFilter}</Label>
                    <Select value={filterMission} onValueChange={v => setFilterMission(v === '_all' ? '' : v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allMissions} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">{t.allMissions}</SelectItem>
                        {MISSION_DB_VALUES.map(m => (
                          <SelectItem key={m} value={m}>{getMissionLabel(m)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Gender */}
                  <div>
                    <Label className="text-xs mb-1 block">{t.genderLabel}</Label>
                    <Select value={filterGender} onValueChange={v => setFilterGender(v === '_all' ? '' : v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allGenders} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">{t.allGenders}</SelectItem>
                        <SelectItem value="male">{t.genderMale}</SelectItem>
                        <SelectItem value="female">{t.genderFemale}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Membership */}
                  <div>
                    <Label className="text-xs mb-1 block">{t.membershipFilter}</Label>
                    <Select value={filterMembership} onValueChange={v => setFilterMembership(v === '_all' ? '' : v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t.allStatuses} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">{t.allStatuses}</SelectItem>
                        <SelectItem value="member">{t.memberStatus}</SelectItem>
                        <SelectItem value="non_member">{t.nonMemberStatus}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Name */}
                  <div>
                    <Label className="text-xs mb-1 block">{t.fullNameLabel}</Label>
                    <Input
                      value={filterName}
                      onChange={e => setFilterName(e.target.value)}
                      placeholder={t.fullNameLabel}
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* PPR */}
                  <div>
                    <Label className="text-xs mb-1 block">{t.employeeNumberLabel}</Label>
                    <Input
                      value={filterPPR}
                      onChange={e => setFilterPPR(e.target.value)}
                      placeholder={t.employeeNumberLabel}
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* Age Range */}
                  <div>
                    <Label className="text-xs mb-1 block">{t.ageRange || (lang === 'ar' ? 'الفئة العمرية' : "Tranche d'âge")}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={filterAgeMin}
                        onChange={e => setFilterAgeMin(e.target.value)}
                        placeholder={lang === 'ar' ? 'من' : 'De'}
                        className="h-9 text-xs w-1/2"
                        min="18"
                        max="70"
                      />
                      <Input
                        type="number"
                        value={filterAgeMax}
                        onChange={e => setFilterAgeMax(e.target.value)}
                        placeholder={lang === 'ar' ? 'إلى' : 'À'}
                        className="h-9 text-xs w-1/2"
                        min="18"
                        max="70"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={countRecipients}
                    disabled={loadingCount}
                    className="text-xs"
                  >
                    {loadingCount ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />}
                    {lang === 'ar' ? 'حساب العدد' : 'Compter'}
                  </Button>
                  {recipientCount !== null && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-sm font-bold text-[hsl(225,70%,45%)]"
                    >
                      {recipientCount} {lang === 'ar' ? 'مستلم' : 'destinataire(s)'}
                    </motion.span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Publish button */}
        <motion.div className="flex justify-end">
          <Button
            onClick={handlePublish}
            disabled={publishing || (!content.trim() && attachments.length === 0)}
            className="px-8 py-3 rounded-2xl text-base font-bold shadow-xl"
            style={{ background: 'linear-gradient(135deg, hsl(225,70%,45%) 0%, hsl(225,80%,35%) 100%)' }}
          >
            {publishing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
            )}
            {lang === 'ar' ? 'نشر' : 'Publier'}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PostComposer;
